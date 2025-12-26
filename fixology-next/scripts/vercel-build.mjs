import { spawnSync } from 'node:child_process'

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: false, ...opts })
  return res.status ?? 0
}

function tryMigrateDeploy() {
  console.log('\n▲ prisma migrate deploy (best-effort)\n')
  const res = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
    encoding: 'utf8',
    shell: false,
  })

  // Prisma prints errors to stderr; if it fails, we still continue so Vercel can deploy.
  const status = res.status ?? 1
  if (status === 0) {
    process.stdout.write(res.stdout || '')
    process.stderr.write(res.stderr || '')
    return true
  }

  const combined = `${res.stdout || ''}\n${res.stderr || ''}`
  const isReachability = combined.includes('P1001') || combined.includes("Can't reach database server")

  console.warn('\n⚠ prisma migrate deploy failed during build.')
  if (isReachability) {
    console.warn('   Reason: database not reachable from this build environment (P1001).')
    console.warn('   Fix: set DATABASE_URL to the Supabase pooler connection string (port 6543),')
    console.warn('   then trigger a redeploy. Continuing build without migrations for now.\n')
  } else {
    console.warn('   Output:\n')
    console.warn(combined.slice(0, 4000))
    console.warn('\n   Continuing build without migrations for now.\n')
  }

  return false
}

const migrated = tryMigrateDeploy()

console.log(`\n▲ prisma generate${migrated ? '' : ' (still required for build)'}\n`)
if (run('npx', ['prisma', 'generate']) !== 0) process.exit(1)

console.log('\n▲ next build\n')
process.exit(run('npx', ['next', 'build']))


