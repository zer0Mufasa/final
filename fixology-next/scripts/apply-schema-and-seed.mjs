import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import crypto from 'node:crypto'
import pg from 'pg'

const { Client } = pg

function requireEnv(name) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required env var: ${name}`)
  return v
}

function slugify(s) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Very small SQL splitter that respects:
// - single quotes: '...'
// - double quotes: "..."
// - dollar-quoted blocks: $$...$$ or $tag$...$tag$
// This is enough for Prisma-generated schema scripts.
function splitSqlStatements(sql) {
  const statements = []
  let start = 0
  let i = 0

  let inSingle = false
  let inDouble = false
  let dollarTag = null // string like '$$' or '$tag$'

  const len = sql.length

  while (i < len) {
    const ch = sql[i]

    // Handle line comments
    if (!inSingle && !inDouble && !dollarTag && ch === '-' && sql[i + 1] === '-') {
      // skip to end of line
      i += 2
      while (i < len && sql[i] !== '\n') i++
      continue
    }

    // Handle block comments
    if (!inSingle && !inDouble && !dollarTag && ch === '/' && sql[i + 1] === '*') {
      i += 2
      while (i < len && !(sql[i] === '*' && sql[i + 1] === '/')) i++
      i += 2
      continue
    }

    if (!inDouble && !dollarTag && ch === "'") {
      // toggle single quote (handle escaped '')
      if (inSingle && sql[i + 1] === "'") {
        i += 2
        continue
      }
      inSingle = !inSingle
      i++
      continue
    }

    if (!inSingle && !dollarTag && ch === '"') {
      inDouble = !inDouble
      i++
      continue
    }

    if (!inSingle && !inDouble) {
      // Enter dollar quote
      if (!dollarTag && ch === '$') {
        const next = sql.indexOf('$', i + 1)
        if (next !== -1) {
          const tag = sql.slice(i, next + 1) // includes both $
          // Dollar quote tags are at least "$$" or "$tag$"
          if (tag.length >= 2) {
            dollarTag = tag
            i = next + 1
            continue
          }
        }
      }

      // Exit dollar quote
      if (dollarTag && sql.startsWith(dollarTag, i)) {
        i += dollarTag.length
        dollarTag = null
        continue
      }
    }

    // Split at semicolon only when not in any quoted block
    if (!inSingle && !inDouble && !dollarTag && ch === ';') {
      const raw = sql.slice(start, i).trim()
      if (raw) statements.push(raw)
      start = i + 1
      i++
      continue
    }

    i++
  }

  const tail = sql.slice(start).trim()
  if (tail) statements.push(tail)
  return statements
}

async function main() {
  const databaseUrl = requireEnv('DATABASE_URL')

  const projectRoot = process.cwd()
  const sqlPath = path.join(projectRoot, 'prisma', 'full_schema.sql')

  if (!fs.existsSync(sqlPath)) {
    throw new Error(`Schema SQL not found at ${sqlPath}. Run: npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/full_schema.sql`)
  }

  const sql = fs.readFileSync(sqlPath, 'utf8')
  const statements = [
    // Supabase typically has pgcrypto enabled already, but make it explicit for gen_random_uuid()
    'CREATE EXTENSION IF NOT EXISTS pgcrypto',
    ...splitSqlStatements(sql),
  ]

  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false,
      require: true,
    },
  })

  console.log('[db] connecting…')
  await client.connect()
  console.log('[db] connected')

  const ignoreCodes = new Set([
    '42710', // duplicate_object (e.g., type already exists)
    '42P07', // duplicate_table (also used for indexes/relations)
    '42701', // duplicate_column
    '42P16', // invalid_table_definition (e.g., constraint exists in some cases)
  ])

  console.log(`[db] applying schema… (${statements.length} statements)`)
  try {
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i]
      try {
        // IMPORTANT: Supabase pooler (PgBouncer) can break on extended-query protocol for large DDL.
        // Force simple query mode.
        await client.query({ text: stmt, simple: true })
      } catch (err) {
        const preview = stmt.replace(/\s+/g, ' ').slice(0, 180)
        const code = err?.code
        if (code && ignoreCodes.has(code)) {
          console.log(`[db] skipped (exists) ${i + 1}/${statements.length}: ${preview}`)
        } else {
          console.error(`[db] failed at statement ${i + 1}/${statements.length}: ${preview}`)
          throw err
        }
      }
      if ((i + 1) % 25 === 0) {
        console.log(`[db] applied ${i + 1}/${statements.length}`)
      }
    }
    console.log('[db] schema applied')
  } catch (e) {
    console.error('[db] schema apply failed')
    throw e
  }

  // Minimal seed so getShopContext() succeeds:
  // - A shop exists
  // - A shop_users row exists with the same email as the Supabase Auth user
  // (Supabase Auth handles password; this password_hash is app-local and just required by schema.)
  const seedEmail = process.env.SEED_SHOP_USER_EMAIL || 'zeroalrashid21@gmail.com'
  const seedName = process.env.SEED_SHOP_USER_NAME || 'Zero Alrashid'
  const shopName = process.env.SEED_SHOP_NAME || 'Fixology Demo Shop'
  const shopSlug = slugify(shopName) || `shop-${crypto.randomBytes(4).toString('hex')}`

  console.log('[db] ensuring shop + shop_user exist…')
  const shopIdRes = await client.query(
    `
    INSERT INTO shops (id, name, slug, email, status, plan, created_at, updated_at)
    VALUES (gen_random_uuid()::text, $1, $2, $3, 'ACTIVE', 'PRO', now(), now())
    ON CONFLICT (slug) DO UPDATE SET updated_at = now()
    RETURNING id
    `,
    [shopName, shopSlug, seedEmail]
  )
  const shopId = shopIdRes.rows?.[0]?.id
  if (!shopId) throw new Error('Failed to resolve seeded shop id')

  // Create a shop user row if missing
  await client.query(
    `
    INSERT INTO shop_users (id, shop_id, email, password_hash, name, role, status, created_at, updated_at)
    VALUES (gen_random_uuid()::text, $1, $2, $3, $4, 'OWNER', 'ACTIVE', now(), now())
    ON CONFLICT (shop_id, email) DO UPDATE SET
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      status = EXCLUDED.status,
      updated_at = now()
    `,
    [
      shopId,
      seedEmail,
      `seed:${crypto.randomBytes(16).toString('hex')}`,
      seedName,
    ]
  )

  console.log('[db] seed complete')
  console.log(JSON.stringify({ shopId, shopSlug, seedEmail }, null, 2))

  await client.end()
  console.log('[db] done')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

