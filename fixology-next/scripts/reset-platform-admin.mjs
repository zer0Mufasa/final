import fs from 'node:fs'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

function loadEnvFile(filename) {
  const filePath = path.join(process.cwd(), filename)
  if (!fs.existsSync(filePath)) return

  const text = fs.readFileSync(filePath, 'utf8')
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const idx = line.indexOf('=')
    if (idx <= 0) continue

    const key = line.slice(0, idx).trim()
    let value = line.slice(idx + 1).trim()

    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    // Force-set env so this script always uses local config
    process.env[key] = value
  }
}

// Ensure Prisma connects to the same DB as Next dev server
loadEnvFile('.env.local')
loadEnvFile('.env')

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2] || process.env.ADMIN_SEED_EMAIL || 'mufasa@fixology.io'
  const password = process.argv[3] || process.env.ADMIN_SEED_PASSWORD || 'admin123'
  const name = process.argv[4] || process.env.ADMIN_SEED_NAME || 'Mufasa'

  if (!email || !password) {
    // eslint-disable-next-line no-console
    console.error('Usage: node scripts/reset-platform-admin.mjs <email> <newPassword> [name]')
    process.exit(1)
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const admin = await prisma.platformAdmin.upsert({
    where: { email },
    update: { name, passwordHash, role: 'SUPER_ADMIN' },
    create: {
      email,
      name,
      passwordHash,
      role: 'SUPER_ADMIN',
    },
  })

  // eslint-disable-next-line no-console
  console.log(`Reset platform admin: ${admin.email} (${admin.role})`)
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

