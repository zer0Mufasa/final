const base = process.env.FIXO_BASE_URL || 'http://localhost:3000'

function uniq(arr) {
  return [...new Set(arr)]
}

async function main() {
  const dashboardUrl = `${base}/dashboard`
  const htmlRes = await fetch(dashboardUrl)
  const html = await htmlRes.text()

  if (!htmlRes.ok) {
    console.error(`Failed to fetch /dashboard: ${htmlRes.status}`)
    process.exit(1)
  }

  const re = /(?:src|href)="(\/_next\/static\/[^"?]+)"/g
  const urls = uniq([...html.matchAll(re)].map((m) => m[1]))

  console.log(`found ${urls.length} assets referenced by /dashboard`)
  let bad = 0

  for (const u of urls) {
    const full = `${base}${u}`
    try {
      const r = await fetch(full)
      if (!r.ok) {
        bad++
        console.log(`${r.status} ${u}`)
      }
    } catch (e) {
      bad++
      console.log(`ERR ${u} ${String(e?.message || e)}`)
    }
  }

  if (bad === 0) {
    console.log('all assets ok')
  } else {
    console.log(`bad assets: ${bad}`)
    process.exitCode = 2
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

