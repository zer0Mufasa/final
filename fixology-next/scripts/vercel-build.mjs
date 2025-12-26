import { spawnSync } from 'node:child_process'

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: false, ...opts })
  return res.status ?? 0
}

function tryMigrateDeploy() {
  console.log('\n▲ prisma migrate deploy (best-effort)\n')
  const dbUrl = process.env.DATABASE_URL || ''
  let dbHost = '(missing)'
  try {
    if (dbUrl) dbHost = new URL(dbUrl).host
  } catch {
    dbHost = '(invalid url)'
  }
  console.log(`Using DATABASE_URL host: ${dbHost}\n`)
  const res = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
    encoding: 'utf8',
    shell: false,
    timeout: 15000,
    killSignal: 'SIGKILL',
  })

  // Prisma prints errors to stderr; if it fails, we still continue so Vercel can deploy.
  const timedOut = !!(res.error && res.error.code === 'ETIMEDOUT')
  const status = res.status ?? (timedOut ? 1 : 1)
  if (status === 0) {
    process.stdout.write(res.stdout || '')
    process.stderr.write(res.stderr || '')
    return true
  }

  const combined = `${res.stdout || ''}\n${res.stderr || ''}`
  const isReachability = combined.includes('P1001') || combined.includes("Can't reach database server")
  const isAuth = combined.includes('P1000') || combined.includes('Authentication failed')

  console.warn('\n⚠ prisma migrate deploy failed during build.')
  if (timedOut) {
    console.warn('   Reason: migrate deploy timed out (15s).')
    console.warn('   This usually means the database connection is stalling/blocked from Vercel, or the pooler is hanging.')
    console.warn('   Continuing build without migrations for now.\n')
    return false
  }
  if (isReachability) {
    console.warn('   Reason: database not reachable from this build environment (P1001).')
    console.warn('   Fix: set DATABASE_URL to the Supabase pooler connection string (port 6543),')
    console.warn('   then trigger a redeploy. Continuing build without migrations for now.\n')
  } else if (isAuth) {
    console.warn('   Reason: authentication failed (P1000).')
    console.warn('   Fix: rotate/update the database password in Vercel DATABASE_URL and redeploy.\n')
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


