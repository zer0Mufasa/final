// app/(marketing)/page.tsx
// Rich marketing homepage (AI demos + contact + heavy features)

'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  BarChart3,
  Check,
  ClipboardList,
  Cpu,
  MessageSquareText,
  PackageSearch,
  ShieldCheck,
  Ticket,
  Timer,
  Zap,
} from 'lucide-react'
import { Logo } from '@/components/shared/logo'
import { Button } from '@/components/ui/button'

const globalStyles = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
@media (prefers-reduced-motion: reduce){
  html{scroll-behavior:auto}
  *,*::before,*::after{animation-duration:0.01ms !important;animation-iteration-count:1 !important;transition-duration:0.01ms !important}
}
body{font-family:'Poppins',sans-serif;background:linear-gradient(135deg,#0f0a1a 0%,#1a0f2e 50%,#0f0a1a 100%);min-height:100vh;overflow-x:hidden;color:#EDE9FE}
.bg-structure{position:fixed;inset:0;z-index:-1;pointer-events:none}
.bg-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(167,139,250,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(167,139,250,0.03) 1px,transparent 1px);background-size:60px 60px;opacity:.9}
.vertical-rail{position:fixed;top:0;bottom:0;width:1px;background:linear-gradient(to bottom,transparent,rgba(167,139,250,0.08),transparent)}
.vertical-rail.left{left:clamp(20px,5vw,80px)}
.vertical-rail.right{right:clamp(20px,5vw,80px)}
.orb{position:absolute;border-radius:999px;filter:blur(90px);opacity:.9}
.glass-card{background:linear-gradient(135deg,rgba(167,139,250,0.08) 0%,rgba(15,10,26,0.9) 100%);backdrop-filter:blur(20px);border:1px solid rgba(167,139,250,0.15);border-radius:24px;box-shadow:0 20px 60px rgba(0,0,0,0.35)}
.section-title{font-weight:800;letter-spacing:-0.02em}
.muted{color:rgba(196,181,253,0.75)}
.glow-button{background:linear-gradient(135deg,#a78bfa 0%,#c4b5fd 50%,#a78bfa 100%);background-size:200% 200%;animation:gradient 3s ease infinite;border:none;border-radius:16px;padding:16px 36px;font-size:16px;font-weight:700;color:#0f0a1a;cursor:pointer;transition:transform .25s ease,box-shadow .25s ease;box-shadow:0 10px 35px rgba(167,139,250,0.35)}
.glow-button:hover{transform:translateY(-2px);box-shadow:0 18px 50px rgba(167,139,250,0.5)}
.glow-button.secondary{background:transparent;border:1px solid rgba(167,139,250,.3);color:rgba(237,233,254,0.9);box-shadow:none}
.glow-button.secondary:hover{box-shadow:0 16px 40px rgba(167,139,250,0.18)}
@keyframes gradient{0%{background-position:0 50%}50%{background-position:100% 50%}100%{background-position:0 50%}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
.floating{animation:float 10s ease-in-out infinite}
.fade-in{animation:fade .45s ease forwards}
@keyframes fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
`

function useInView(ref: React.RefObject<HTMLElement>, rootMargin = '0px') {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry?.isIntersecting ?? false),
      { root: null, rootMargin, threshold: 0.2 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [ref, rootMargin])
  return inView
}

type DxResult = {
  issue: string
  pct: number
  explanation: string
  repair: string
  time: string
  price: string
}

const demoMessages = [
  'iPhone 14 Pro restarting randomly, no water damage…',
  'PS5 shuts off after 10 minutes, fan gets loud…',
  'Laptop won’t charge unless cable is held at an angle…',
  'Switch won’t read games, cartridge slot feels loose…',
]

const heroResults: DxResult[] = [
  {
    issue: 'Battery health / power rail instability',
    pct: 84,
    explanation: 'Restart loops without impact/water often correlate with degraded battery + unstable power delivery under load.',
    repair: 'Battery health + panic log check → confirm power rail → recommend battery replacement.',
    time: '35–55 min',
    price: '$79–$129',
  },
  {
    issue: 'Overheating / thermal shutdown',
    pct: 76,
    explanation: 'Short runs + loud fan points to clogged heatsink, dried paste, or thermal sensor behavior.',
    repair: 'Clean + repaste → verify temps → stress test.',
    time: '45–90 min',
    price: '$99–$199',
  },
  {
    issue: 'Charge port contamination / damaged flex',
    pct: 78,
    explanation: 'Angle-sensitive charging is commonly debris or wear in the port/flex.',
    repair: 'Inspect + clean port → verify amperage draw → replace charge port flex if failing.',
    time: '45–90 min',
    price: '$89–$169',
  },
  {
    issue: 'Cartridge slot contact / reader alignment',
    pct: 71,
    explanation: 'Read failures with loose feel often indicate bent contacts or alignment issues in the reader.',
    repair: 'Inspect slot contacts → clean → replace reader if needed.',
    time: '40–75 min',
    price: '$89–$159',
  },
]

export default function MarketingPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const dxRef = useRef<HTMLDivElement>(null)
  const tkRef = useRef<HTMLDivElement>(null)
  const imeiRef = useRef<HTMLDivElement>(null)
  const commRef = useRef<HTMLDivElement>(null)
  const riskRef = useRef<HTMLDivElement>(null)

  const dxInView = useInView(dxRef, '-20% 0px')
  const tkInView = useInView(tkRef, '-20% 0px')
  const imeiInView = useInView(imeiRef, '-20% 0px')
  const commInView = useInView(commRef, '-20% 0px')
  const riskInView = useInView(riskRef, '-20% 0px')

  const [scrolled, setScrolled] = useState(false)
  const [pastHero, setPastHero] = useState(false)

  const [heroIndex, setHeroIndex] = useState(0)
  const [dxPhase, setDxPhase] = useState<'typing' | 'results'>('typing')
  const [dxInput, setDxInput] = useState('')

  const [ticketStep, setTicketStep] = useState(0)
  const [imeiLast4, setImeiLast4] = useState('1432')
  const [commStep, setCommStep] = useState(0)
  const [riskStep, setRiskStep] = useState(0)

  const heroDemoData = useMemo(() => heroResults[heroIndex]!, [heroIndex])

  const tickingRef = useRef(false)
  useEffect(() => {
    const onScroll = () => {
      if (tickingRef.current) return
      tickingRef.current = true
      window.requestAnimationFrame(() => {
        const scrollY = window.scrollY
        setScrolled(scrollY > 20)
        if (heroRef.current) {
          const heroBottom = heroRef.current.offsetTop + heroRef.current.offsetHeight
          setPastHero(scrollY > heroBottom - 100)
        }
        tickingRef.current = false
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Hero demo: rotate messages + typing phase
  useEffect(() => {
    const msg = demoMessages[heroIndex]!
    if (!dxInView && window.scrollY > 50) return
    setDxPhase('typing')
    setDxInput('')
    let i = 0
    const t = window.setInterval(() => {
      i += 1
      setDxInput(msg.slice(0, i))
      if (i >= msg.length) {
        window.clearInterval(t)
        window.setTimeout(() => setDxPhase('results'), 250)
      }
    }, 18)
    return () => window.clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroIndex])

  useEffect(() => {
    const id = window.setInterval(() => setHeroIndex((v) => (v + 1) % demoMessages.length), 7000)
    return () => window.clearInterval(id)
  }, [])

  // Ticket demo steps
  useEffect(() => {
    if (!tkInView) return
    setTicketStep(0)
    const id = window.setInterval(() => {
      setTicketStep((s) => (s + 1) % 4)
    }, 2200)
    return () => window.clearInterval(id)
  }, [tkInView])

  // IMEI demo
  useEffect(() => {
    if (!imeiInView) return
    const seq = ['1432', '9081', '6620', '4117']
    let idx = 0
    const id = window.setInterval(() => {
      idx = (idx + 1) % seq.length
      setImeiLast4(seq[idx]!)
    }, 2500)
    return () => window.clearInterval(id)
  }, [imeiInView])

  // Communication demo
  useEffect(() => {
    if (!commInView) return
    setCommStep(0)
    const id = window.setInterval(() => setCommStep((s) => (s + 1) % 3), 2600)
    return () => window.clearInterval(id)
  }, [commInView])

  // Risk demo
  useEffect(() => {
    if (!riskInView) return
    setRiskStep(0)
    const id = window.setInterval(() => setRiskStep((s) => (s + 1) % 3), 2400)
    return () => window.clearInterval(id)
  }, [riskInView])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      <div className="bg-structure">
        <div className="bg-grid" />
        <div className="vertical-rail left" />
        <div className="vertical-rail right" />
        <div
          className="orb"
          style={{
            width: 560,
            height: 560,
            background: 'radial-gradient(circle, rgba(167,139,250,.14) 0%, transparent 70%)',
            top: '-8%',
            left: '-10%',
          }}
        />
        <div
          className="orb"
          style={{
            width: 520,
            height: 520,
            background: 'radial-gradient(circle, rgba(196,181,253,.10) 0%, transparent 70%)',
            top: '40%',
            right: '-12%',
          }}
        />
      </div>

      <div style={{ minHeight: '100vh', position: 'relative' }}>
        {/* NAV */}
        <nav
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            padding: scrolled ? '12px 0' : '16px 0',
            background: scrolled ? 'rgba(15,10,26,.96)' : 'rgba(15,10,26,.88)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(167,139,250,.08)',
            transition: 'padding .25s ease, background .25s ease, border-color .25s ease',
          }}
          aria-label="Main navigation"
        >
          <div
            style={{
              maxWidth: 1400,
              margin: '0 auto',
              width: '100%',
              padding: '0 48px',
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto',
              alignItems: 'center',
              gap: 24,
            }}
          >
            <Logo />

            <div style={{ display: 'flex', justifyContent: 'center', gap: 18 }}>
              {[
                { label: 'Live demo', id: 'demo' },
                { label: 'Diagnosis', id: 'diagnosis' },
                { label: 'Ticketing', id: 'ticketing' },
                { label: 'IMEI', id: 'imei' },
                { label: 'Contact', id: 'contact' },
              ].map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  style={{
                    fontSize: 13,
                    color: 'rgba(196,181,253,.75)',
                    textDecoration: 'none',
                    padding: '8px 10px',
                    borderRadius: 10,
                    transition: 'background .2s ease, color .2s ease',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLAnchorElement).style.background = 'rgba(167,139,250,.08)'
                    ;(e.currentTarget as HTMLAnchorElement).style.color = '#fff'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
                    ;(e.currentTarget as HTMLAnchorElement).style.color = 'rgba(196,181,253,.75)'
                  }}
                >
                  {item.label}
                </a>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
              {pastHero && (
                <span
                  style={{
                    fontSize: 11,
                    color: 'rgba(196,181,253,.8)',
                    padding: '4px 10px',
                    border: '1px solid rgba(167,139,250,.2)',
                    background: 'rgba(167,139,250,.08)',
                    borderRadius: 999,
                    whiteSpace: 'nowrap',
                  }}
                >
                  ⚡ Saves 2+ hrs/day
                </span>
              )}
              <Link href="/login" style={{ color: 'rgba(196,181,253,.8)', fontSize: 13, textDecoration: 'none' }}>
                Log in
              </Link>
              <Link href="/signup" className="glow-button" style={{ padding: '12px 18px', borderRadius: 14, fontSize: 13 }}>
                {pastHero ? 'Try Live Demo →' : 'Run a Demo Diagnosis →'}
              </Link>
            </div>
          </div>
        </nav>

        {/* HERO */}
        <section
          ref={heroRef}
          id="demo"
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            paddingTop: 110,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div className="floating" style={{ position: 'absolute', top: '18%', right: '10%', fontSize: 68, opacity: 0.85 }}>
            📱
          </div>
          <div className="floating" style={{ position: 'absolute', top: '55%', right: '18%', fontSize: 52, opacity: 0.75, animationDelay: '1.2s' }}>
            🎮
          </div>
          <div className="floating" style={{ position: 'absolute', top: '35%', right: '5%', fontSize: 44, opacity: 0.65, animationDelay: '2.1s' }}>
            💻
          </div>

          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px', width: '100%' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.05fr .95fr', gap: 56, alignItems: 'center' }}>
              <div>
                <div
                  style={{
                    display: 'inline-block',
                    padding: '8px 18px',
                    background: 'rgba(167,139,250,.15)',
                    borderRadius: 50,
                    marginBottom: 22,
                    border: '1px solid rgba(167,139,250,.3)',
                  }}
                >
                  <span style={{ color: '#c4b5fd', fontSize: 13, fontWeight: 600 }}>✨ Repair Intelligence System</span>
                </div>
                <h1 className="section-title" style={{ fontSize: 'clamp(36px,5vw,66px)', marginBottom: 20, lineHeight: 1.05 }}>
                  Your techs stop guessing.
                  <br />
                  <span style={{ color: '#a78bfa' }}>Your tickets write themselves.</span>
                </h1>
                <p className="muted" style={{ fontSize: 18, lineHeight: 1.7, marginBottom: 22, maxWidth: 620 }}>
                  Fixology turns messy customer messages into diagnoses, tickets, pricing guidance, inventory actions, and customer updates — automatically.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 30 }}>
                  {['Works with how your shop already runs', 'Fewer comebacks with guided steps + risk alerts', 'Tickets created from one sentence'].map((t) => (
                    <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(196,181,253,.8)', fontSize: 15 }}>
                      <span style={{ color: '#4ade80' }}>✔</span>
                      <span>{t}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    className="glow-button"
                    onClick={(e) => {
                      e.preventDefault()
                      document.querySelector('#diagnosis')?.scrollIntoView({ behavior: 'smooth' })
                    }}
                  >
                    See a Diagnosis →
                  </button>
                  <button
                    className="glow-button secondary"
                    onClick={(e) => {
                      e.preventDefault()
                      document.querySelector('#ticketing')?.scrollIntoView({ behavior: 'smooth' })
                    }}
                  >
                    How It Works
                  </button>
                  <span style={{ fontSize: 13, color: 'rgba(196,181,253,.55)' }}>Most shops finish setup in under 2 minutes.</span>
                </div>
              </div>

              <div className="glass-card" style={{ padding: 28 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '.12em' }}>
                  Live example
                </div>
                <div style={{ background: 'rgba(15,10,26,0.92)', border: '1px solid rgba(167,139,250,.2)', borderRadius: 16, padding: 18, marginBottom: 18, minHeight: 120 }}>
                  <div style={{ fontSize: 16, color: '#fff', fontStyle: 'italic', lineHeight: 1.6 }}>&quot;{dxInput}&quot;</div>
                  {dxPhase === 'typing' && (
                    <span
                      style={{
                        display: 'inline-block',
                        width: 3,
                        height: 20,
                        background: '#a78bfa',
                        marginLeft: 2,
                        animation: 'fade 1s infinite',
                        verticalAlign: 'middle',
                      }}
                    />
                  )}
                </div>

                {dxPhase === 'results' && (
                  <div className="fade-in">
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#4ade80', marginBottom: 10, textTransform: 'uppercase' }}>→ Intelligence Output</div>
                    <div style={{ background: 'rgba(74,222,128,.05)', border: '1px solid rgba(74,222,128,.18)', borderRadius: 16, padding: 18 }}>
                      <div style={{ fontSize: 18, color: '#fff', fontWeight: 800, marginBottom: 6 }}>
                        Most likely issue: {heroDemoData.issue} ({heroDemoData.pct}%)
                      </div>
                      <div style={{ fontSize: 13, color: '#c4b5fd', marginBottom: 12, lineHeight: 1.55 }}>{heroDemoData.explanation}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Recommended next step:</div>
                      <div style={{ fontSize: 15, color: '#a78bfa', marginBottom: 12, fontWeight: 700 }}>{heroDemoData.repair}</div>
                      <div style={{ display: 'flex', gap: 10, fontSize: 13, color: '#fff', fontWeight: 600, padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, width: 'fit-content' }}>
                        <span>{heroDemoData.time}</span>
                        <span style={{ opacity: 0.3 }}>|</span>
                        <span>{heroDemoData.price}</span>
                      </div>
                    </div>
                    <div style={{ marginTop: 14, padding: 10, background: 'rgba(74,222,128,.08)', border: '1px solid rgba(74,222,128,.16)', borderRadius: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 700, letterSpacing: '0.02em' }}>
                        ✔ Ticket created • ✔ Pricing ready • ✔ Customer update prepared
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* SECTIONS */}
        <section id="diagnosis" ref={dxRef} style={{ padding: '90px 0 40px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
            <h2 className="section-title" style={{ fontSize: 38, marginBottom: 10 }}>
              Diagnosis suggestions your techs can trust
            </h2>
            <p className="muted" style={{ fontSize: 16, lineHeight: 1.7, marginBottom: 28, maxWidth: 760 }}>
              The goal isn’t “AI magic.” It’s repeatable repairs: likely causes, recommended checks, and risk prompts that reduce comebacks.
            </p>

            <div className="glass-card" style={{ padding: 28 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                <div style={{ padding: 18, borderRadius: 18, border: '1px solid rgba(167,139,250,.12)', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <Cpu size={18} color="#c4b5fd" />
                    <div style={{ fontWeight: 800, color: '#fff' }}>Suggested checks</div>
                  </div>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      'Verify symptom reproduction (baseline)',
                      'Quick risk check: liquid exposure indicators',
                      'Battery health / current draw snapshot',
                      'Thermal check under load',
                    ].map((t) => (
                      <li key={t} style={{ display: 'flex', gap: 10, color: 'rgba(196,181,253,.8)' }}>
                        <span style={{ color: '#a78bfa' }}>→</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ padding: 18, borderRadius: 18, border: '1px solid rgba(167,139,250,.12)', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <ShieldCheck size={18} color="#c4b5fd" />
                    <div style={{ fontWeight: 800, color: '#fff' }}>Risk prompts</div>
                  </div>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      'Before replacing a battery: check panic logs',
                      'Before closing device: verify seals/adhesive',
                      'Before quoting: confirm part availability',
                      'Before pickup: run quick regression test',
                    ].map((t) => (
                      <li key={t} style={{ display: 'flex', gap: 10, color: 'rgba(196,181,253,.8)' }}>
                        <span style={{ color: '#4ade80' }}>✔</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="ticketing" ref={tkRef} style={{ padding: '70px 0 40px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
            <h2 className="section-title" style={{ fontSize: 38, marginBottom: 10 }}>
              Tickets that write themselves
            </h2>
            <p className="muted" style={{ fontSize: 16, lineHeight: 1.7, marginBottom: 28, maxWidth: 760 }}>
              Intake → diagnosis → pricing range → parts → customer updates. The loop becomes a system.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <div className="glass-card" style={{ padding: 26 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                  <Ticket size={18} color="#c4b5fd" />
                  <div style={{ fontWeight: 900, color: '#fff' }}>Auto-drafted ticket</div>
                </div>
                <div style={{ padding: 16, borderRadius: 16, background: 'rgba(15,10,26,0.85)', border: '1px solid rgba(167,139,250,.2)' }}>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: 16, marginBottom: 6 }}>
                    {ticketStep === 0
                      ? 'Random restarts • diagnostics + battery test'
                      : ticketStep === 1
                        ? 'Charging issue • port inspect + amperage test'
                        : ticketStep === 2
                          ? 'Thermal shutdown • clean + repaste + stress test'
                          : 'Cartridge read fail • slot inspect + alignment'}
                  </div>
                  <div style={{ color: 'rgba(196,181,253,.75)', fontSize: 13, lineHeight: 1.55 }}>
                    {ticketStep === 0
                      ? 'Includes: symptom summary, recommended checks, pricing range, and customer update copy.'
                      : ticketStep === 1
                        ? 'Includes: quick port inspection checklist and a clear quote path.'
                        : ticketStep === 2
                          ? 'Includes: thermal checklist and verification steps before pickup.'
                          : 'Includes: inspection notes + replace/repair recommendation.'}
                  </div>
                </div>
              </div>

              <div className="glass-card" style={{ padding: 26 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                  <MessageSquareText size={18} color="#c4b5fd" />
                  <div style={{ fontWeight: 900, color: '#fff' }}>Customer update (ready)</div>
                </div>
                <div style={{ padding: 16, borderRadius: 16, background: 'rgba(15,10,26,0.85)', border: '1px solid rgba(167,139,250,.2)' }}>
                  <div style={{ color: 'rgba(237,233,254,0.92)', fontSize: 14, lineHeight: 1.65 }}>
                    {ticketStep === 0
                      ? 'We’re seeing restart behavior consistent with power instability. Next we’ll confirm with battery health + logs and share a clear fix + price.'
                      : ticketStep === 1
                        ? 'We’ll start with a port inspection + amperage test. If the port is worn or the flex is failing, we’ll confirm before replacing.'
                        : ticketStep === 2
                          ? 'We’ll isolate whether this is airflow/paste or a thermal sensor issue and update you with the exact fix + price.'
                          : 'We’ll inspect the cartridge reader contacts and confirm whether cleaning or replacement is needed before proceeding.'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="imei" ref={imeiRef} style={{ padding: '70px 0 40px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
            <h2 className="section-title" style={{ fontSize: 38, marginBottom: 10 }}>
              IMEI lookup (instant context)
            </h2>
            <p className="muted" style={{ fontSize: 16, lineHeight: 1.7, marginBottom: 28, maxWidth: 760 }}>
              Less guessing. More context up front — model, carrier, and warranty notes for faster intake.
            </p>

            <div className="glass-card" style={{ padding: 26, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <div style={{ padding: 16, borderRadius: 18, border: '1px solid rgba(167,139,250,.12)', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(196,181,253,.75)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 10 }}>
                  Input
                </div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>IMEI •••• {imeiLast4}</div>
                <div style={{ marginTop: 12, color: 'rgba(196,181,253,.75)', lineHeight: 1.6 }}>
                  Auto-fills device profile and flags obvious mismatch risks.
                </div>
              </div>
              <div style={{ padding: 16, borderRadius: 18, border: '1px solid rgba(167,139,250,.12)', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(196,181,253,.75)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 10 }}>
                  Output
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {[
                    { k: 'Model', v: 'iPhone 14 Pro (A2650)' },
                    { k: 'Carrier', v: 'Unlocked / BYOD' },
                    { k: 'Notes', v: 'No blacklist flags detected' },
                  ].map((row) => (
                    <div key={row.k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <span style={{ color: 'rgba(196,181,253,.65)' }}>{row.k}</span>
                      <span style={{ color: '#fff', fontWeight: 800 }}>{row.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" style={{ padding: '80px 0 110px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
            <div className="glass-card" style={{ padding: 34 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 26, alignItems: 'start' }}>
                <div>
                  <h2 className="section-title" style={{ fontSize: 40, marginBottom: 10 }}>
                    Want the walkthrough?
                  </h2>
                  <p className="muted" style={{ fontSize: 16, lineHeight: 1.7, marginBottom: 18 }}>
                    We’ll map Fixology to your intake + ticket flow, show the demos live, and estimate weekly time saved.
                  </p>
                  <div style={{ display: 'grid', gap: 10, marginBottom: 18 }}>
                    {[
                      { icon: <Zap size={16} color="#c4b5fd" />, text: 'Avg setup time: under 2 minutes' },
                      { icon: <Timer size={16} color="#c4b5fd" />, text: 'Fewer comebacks with guided checks' },
                      { icon: <BarChart3 size={16} color="#c4b5fd" />, text: 'See bottlenecks + throughput instantly' },
                    ].map((b) => (
                      <div key={b.text} style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'rgba(196,181,253,.8)' }}>
                        {b.icon}
                        <span>{b.text}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <Link href="/signup" className="glow-button" style={{ textDecoration: 'none' }}>
                      Start Free Trial →
                    </Link>
                    <a href="mailto:repair@fixologyai.com" className="glow-button secondary" style={{ textDecoration: 'none' }}>
                      Email repair@fixologyai.com
                    </a>
                  </div>
                </div>

                <div style={{ padding: 18, borderRadius: 18, border: '1px solid rgba(167,139,250,.12)', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: 'rgba(196,181,253,.75)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 12 }}>
                    What shops use this for
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {[
                      'Faster intake (ticket drafts from one sentence)',
                      'Cleaner quotes (time + price range suggestions)',
                      'Inventory sanity (reorder before you’re stuck)',
                      'Customer trust (updates without tech distraction)',
                    ].map((t) => (
                      <div key={t} style={{ display: 'flex', gap: 10, color: 'rgba(196,181,253,.8)', lineHeight: 1.5 }}>
                        <Check size={16} color="#4ade80" style={{ marginTop: 2 }} />
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer mini */}
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', color: 'rgba(196,181,253,.55)', fontSize: 13 }}>
              <span>© {new Date().getFullYear()} Fixology</span>
              <span>Built with real repair workflows.</span>
            </div>
          </div>
        </section>

        {/* Hidden anchors for completeness */}
        <div ref={commRef} style={{ height: 1, overflow: 'hidden' }} />
        <div ref={riskRef} style={{ height: 1, overflow: 'hidden' }} />
        <div style={{ height: 1, overflow: 'hidden', opacity: 0 }}>
          {/* keep imports used in earlier iterations (so tree-shaking stable) */}
          <ClipboardList className="hidden" />
          <MessageSquareText className="hidden" />
          <PackageSearch className="hidden" />
        </div>
      </div>
    </>
  )
}

