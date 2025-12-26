/* app/(marketing)/page.tsx
   Rich marketing homepage (public route: "/")
*/

'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  Check,
  ClipboardList,
  Clock,
  Cpu,
  Mail,
  MessageSquareText,
  PackageSearch,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
  Wrench,
  Zap,
} from 'lucide-react'
import { Logo } from '@/components/shared/logo'
import { Button } from '@/components/ui/button'

type DemoOutput = {
  issue: string
  confidence: string
  why: string
  next: string
  time: string
  price: string
  ticketTitle: string
  customerUpdate: string
  parts: string[]
}

function scoreIncludes(haystack: string, needle: string) {
  return haystack.includes(needle) ? 1 : 0
}

function pickDemoOutput(input: string): DemoOutput {
  const text = input.toLowerCase()

  const candidates: Array<{ score: number; out: DemoOutput }> = [
    {
      score:
        scoreIncludes(text, 'restart') +
        scoreIncludes(text, 'restarting') +
        scoreIncludes(text, 'random') +
        scoreIncludes(text, 'boot'),
      out: {
        issue: 'Battery health / power rail instability',
        confidence: '84%',
        why: 'Restarts without impact/water often correlate with degraded battery + unstable power delivery under load.',
        next: 'Run battery health + panic log check → confirm power rail → recommend battery replacement.',
        time: '35–55 min',
        price: '$79–$129',
        ticketTitle: 'Random restarts • diagnostics + battery test',
        customerUpdate:
          'We’re seeing restart behavior consistent with power instability. Next we’ll confirm with battery health + logs and share a clear fix + price.',
        parts: ['iPhone battery', 'Adhesive gasket'],
      },
    },
    {
      score:
        scoreIncludes(text, 'no charge') +
        scoreIncludes(text, "won't charge") +
        scoreIncludes(text, 'charging') +
        scoreIncludes(text, 'port'),
      out: {
        issue: 'Charge port contamination / damaged flex',
        confidence: '78%',
        why: 'Intermittent charging + angle sensitivity is commonly debris or wear in the port/flex.',
        next: 'Inspect + clean port → verify amperage draw → if failing, replace charge port flex.',
        time: '45–90 min',
        price: '$89–$169',
        ticketTitle: 'Charging issue • port inspect + amperage test',
        customerUpdate:
          'We’ll start with a port inspection + amperage test. If the port is worn or the flex is failing, we’ll confirm before replacing.',
        parts: ['Charge port flex (model-specific)', 'Seals / adhesive'],
      },
    },
    {
      score:
        scoreIncludes(text, 'water') +
        scoreIncludes(text, 'liquid') +
        scoreIncludes(text, 'wet') +
        scoreIncludes(text, 'spill'),
      out: {
        issue: 'Liquid exposure (corrosion risk)',
        confidence: '91%',
        why: 'Liquid exposure increases corrosion + intermittent failures (power, display, charging, audio).',
        next: 'Open + inspect indicators → ultrasonic/cleaning → board-level triage if corrosion present.',
        time: '60–120 min',
        price: '$99–$249',
        ticketTitle: 'Liquid exposure • internal inspection + cleaning',
        customerUpdate:
          'We’ll inspect liquid indicators and check for corrosion. We’ll update you with findings and options before proceeding.',
        parts: ['Cleaning supplies', 'Seals/adhesive (as needed)'],
      },
    },
    {
      score:
        scoreIncludes(text, 'overheat') +
        scoreIncludes(text, 'hot') +
        scoreIncludes(text, 'thermal') +
        scoreIncludes(text, 'shut'),
      out: {
        issue: 'Thermal shutdown (battery / short / software load)',
        confidence: '73%',
        why: 'Thermal shutdown can come from battery degradation, shorted component, or high background load.',
        next: 'Baseline current draw → isolate peripherals → check battery + thermal sensors.',
        time: '45–75 min',
        price: '$79–$199',
        ticketTitle: 'Overheating • current draw + thermal diagnostics',
        customerUpdate:
          'We’ll run thermal diagnostics and current draw checks to isolate whether this is battery, a short, or a software load issue.',
        parts: ['Battery (if needed)'],
      },
    },
  ]

  const best = candidates.reduce(
    (acc, cur) => (cur.score > acc.score ? cur : acc),
    { score: -1, out: candidates[0]!.out }
  )

  if (!text.trim() || best.score <= 0) {
    return {
      issue: 'Initial triage (symptom capture → targeted tests)',
      confidence: '—',
      why: 'Give us the customer’s symptoms in one sentence and we’ll generate a ticket + recommended tests instantly.',
      next: 'Paste a message like: “iPhone restarts randomly, no water damage”',
      time: 'Under 1 min',
      price: 'Varies',
      ticketTitle: 'New intake • triage + recommended next steps',
      customerUpdate:
        'Thanks! We’re reviewing your device symptoms now. Next we’ll run targeted checks and confirm an exact fix + price.',
      parts: ['—'],
    }
  }

  return best.out
}

export default function MarketingHomePage() {
  const demoRef = useRef<HTMLDivElement | null>(null)
  const featuresRef = useRef<HTMLDivElement | null>(null)
  const pricingRef = useRef<HTMLDivElement | null>(null)
  const contactRef = useRef<HTMLDivElement | null>(null)

  const [message, setMessage] = useState('iPhone 14 Pro restarting randomly, no water damage…')
  const [demoStatus, setDemoStatus] = useState<'idle' | 'analyzing' | 'done'>('idle')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const output = useMemo(() => pickDemoOutput(message), [message])

  const runDemo = () => {
    setDemoStatus('analyzing')
    window.setTimeout(() => setDemoStatus('done'), 900)
  }

  const resetDemo = () => setDemoStatus('idle')

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const features = [
    {
      icon: <Ticket className="w-5 h-5" />,
      title: 'Tickets that write themselves',
      description:
        'Turn messy customer messages into structured tickets, recommended tests, and clear next steps.',
    },
    {
      icon: <Wrench className="w-5 h-5" />,
      title: 'Guided repairs (fewer comebacks)',
      description:
        'Surface the likely cause, risk checks, and repair flow so techs don’t miss the basics.',
    },
    {
      icon: <PackageSearch className="w-5 h-5" />,
      title: 'Parts + inventory awareness',
      description:
        'Know what you have, what you’re missing, and what to reorder before you get stuck mid-ticket.',
    },
    {
      icon: <MessageSquareText className="w-5 h-5" />,
      title: 'Customer updates on autopilot',
      description:
        'Generate professional updates at each status change without pulling techs off the bench.',
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: 'Ops + profit visibility',
      description:
        'See turnaround time, repeat repairs, and bottlenecks so you can fix the system—fast.',
    },
    {
      icon: <ShieldCheck className="w-5 h-5" />,
      title: 'Built for real workflows',
      description:
        'Not a generic CRM. Repair-first flows designed for phone, console, and PC repair shops.',
    },
  ]

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Background */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_20%_10%,rgba(139,92,246,0.18),transparent_60%),radial-gradient(900px_circle_at_80%_40%,rgba(167,139,250,0.14),transparent_55%),radial-gradient(900px_circle_at_50%_100%,rgba(124,58,237,0.10),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(167,139,250,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(167,139,250,0.08)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="absolute -top-24 -left-24 w-[480px] h-[480px] bg-purple-500/20 blur-3xl rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-[520px] h-[520px] bg-purple-600/20 blur-3xl rounded-full" />
      </div>

      {/* Header */}
      <header
        className={[
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled
            ? 'bg-[rgb(var(--bg-primary))]/85 backdrop-blur-xl border-b border-white/5'
            : 'bg-transparent',
        ].join(' ')}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-6">
            <button
              type="button"
              onClick={() => scrollTo(demoRef)}
              className="text-sm text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors"
            >
              Live demo
            </button>
            <button
              type="button"
              onClick={() => scrollTo(featuresRef)}
              className="text-sm text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => scrollTo(pricingRef)}
              className="text-sm text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors"
            >
              Pricing
            </button>
            <button
              type="button"
              onClick={() => scrollTo(contactRef)}
              className="text-sm text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors"
            >
              Contact
            </button>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button rightIcon={<ArrowRight className="w-4 h-4" />}>
                Start free trial
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-28 pb-14 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
                <Sparkles className="w-4 h-4 text-purple-300" />
                <span className="text-sm text-purple-200">
                  Built for repair shops — not generic “software”
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl font-bold text-[rgb(var(--text-primary))] leading-tight">
                Stop guessing.
                <br />
                Start diagnosing.
                <br />
                <span className="bg-gradient-to-r from-purple-300 to-purple-500 bg-clip-text text-transparent">
                  Fixology runs your repair ops.
                </span>
              </h1>

              <p className="mt-5 text-lg text-[rgb(var(--text-secondary))] leading-relaxed">
                Turn intake messages into diagnosis, tickets, pricing guidance, parts checks,
                and customer updates — in minutes, not hours.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    rightIcon={<ArrowRight className="w-5 h-5" />}
                    className="w-full sm:w-auto"
                  >
                    Start free (14 days)
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="secondary"
                  leftIcon={<Zap className="w-5 h-5" />}
                  className="w-full sm:w-auto"
                  onClick={() => scrollTo(demoRef)}
                >
                  Run the live demo
                </Button>
              </div>

              <div className="mt-6 flex flex-wrap gap-3 text-sm text-[rgb(var(--text-muted))]">
                <span className="inline-flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-300" />
                  Avg setup: under 2 minutes
                </span>
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-300" />
                  No credit card required
                </span>
                <span className="inline-flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-300" />
                  Used by phone, console, and PC repair shops
                </span>
              </div>
            </div>

            {/* Demo preview card */}
            <div className="glass-card relative overflow-hidden">
              <div aria-hidden className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-24 -right-24 w-72 h-72 bg-purple-500/20 blur-3xl rounded-full" />
                <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-purple-400/10 blur-3xl rounded-full" />
              </div>

              <div className="relative">
                <div className="flex items-center justify-between gap-4 mb-5">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-purple-300/80 font-semibold">
                      Live example
                    </p>
                    <p className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                      Paste a customer message
                    </p>
                  </div>
                  <span className="badge badge-purple">AI demo</span>
                </div>

                <label className="label" htmlFor="demo-message">
                  Customer message
                </label>
                <textarea
                  id="demo-message"
                  className="w-full min-h-[110px] rounded-xl bg-[rgb(var(--bg-tertiary))] border border-white/10 px-4 py-3 text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))] focus:outline-none focus:border-[rgb(var(--accent-primary))] focus:ring-2 focus:ring-[rgb(var(--accent-primary))]/20"
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value)
                    setDemoStatus('idle')
                  }}
                />

                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                  <Button
                    className="w-full sm:w-auto"
                    leftIcon={<Cpu className="w-4 h-4" />}
                    onClick={runDemo}
                    disabled={!message.trim() || demoStatus === 'analyzing'}
                    loading={demoStatus === 'analyzing'}
                  >
                    {demoStatus === 'idle' ? 'Generate diagnosis' : demoStatus === 'analyzing' ? 'Analyzing…' : 'Re-run'}
                  </Button>
                  <Button
                    className="w-full sm:w-auto"
                    variant="secondary"
                    onClick={resetDemo}
                    disabled={demoStatus === 'idle'}
                  >
                    Reset
                  </Button>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                        Likely issue
                      </p>
                      <span className="text-xs text-[rgb(var(--text-muted))]">
                        Confidence: {demoStatus === 'done' ? output.confidence : '—'}
                      </span>
                    </div>
                    <p className="mt-2 text-[rgb(var(--text-secondary))]">
                      {demoStatus === 'done' ? output.issue : 'Run the demo to see the output.'}
                    </p>
                    {demoStatus === 'done' && (
                      <>
                        <p className="mt-3 text-sm text-[rgb(var(--text-muted))]">
                          {output.why}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="badge badge-green">
                            <Clock className="w-3.5 h-3.5 mr-1" /> {output.time}
                          </span>
                          <span className="badge badge-purple">
                            <Sparkles className="w-3.5 h-3.5 mr-1" /> {output.price}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                      Ticket draft
                    </p>
                    <div className="mt-2 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl gradient-purple flex items-center justify-center shrink-0">
                        <ClipboardList className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[rgb(var(--text-secondary))]">
                          {demoStatus === 'done' ? output.ticketTitle : '—'}
                        </p>
                        <p className="mt-2 text-sm text-[rgb(var(--text-muted))]">
                          {demoStatus === 'done'
                            ? output.next
                            : 'Includes recommended tests, pricing range, and customer update copy.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                      Customer update (ready to send)
                    </p>
                    <p className="mt-2 text-[rgb(var(--text-secondary))]">
                      {demoStatus === 'done' ? output.customerUpdate : '—'}
                    </p>
                  </div>
                </div>

                <p className="mt-5 text-xs text-[rgb(var(--text-muted))]">
                  Demo output is illustrative (not medical/legal advice). Real results come from your shop’s data and workflows.
                </p>
              </div>
            </div>
          </div>

          {/* Outcomes bar */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { k: 'Hours saved', v: '2+ / day', icon: <Clock className="w-5 h-5" /> },
              { k: 'Fewer repeat repairs', v: 'Up to 30%', icon: <ShieldCheck className="w-5 h-5" /> },
              { k: 'Faster intake', v: '60 sec', icon: <Zap className="w-5 h-5" /> },
              { k: 'Clear pricing', v: 'Built-in', icon: <BarChart3 className="w-5 h-5" /> },
            ].map((s) => (
              <div key={s.k} className="glass-card p-5">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center text-purple-200">
                    {s.icon}
                  </div>
                  <span className="text-xl font-bold text-[rgb(var(--text-primary))]">
                    {s.v}
                  </span>
                </div>
                <p className="mt-3 text-sm text-[rgb(var(--text-muted))]">{s.k}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo section anchor */}
      <div ref={demoRef} />

      {/* The Fixology Loop */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <p className="badge badge-purple mb-4">The Fixology Loop</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[rgb(var(--text-primary))]">
              From intake → to invoice, without the chaos
            </h2>
            <p className="mt-4 text-[rgb(var(--text-secondary))]">
              Every repair is the same loop. Fixology automates the boring parts so your team stays focused on high-quality repairs.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {[
              {
                title: 'Intake',
                icon: <MessageSquareText className="w-5 h-5" />,
                text: 'Capture symptoms fast from a message, call, or counter chat.',
              },
              {
                title: 'Diagnosis',
                icon: <Cpu className="w-5 h-5" />,
                text: 'Suggested causes + recommended tests + risk checks.',
              },
              {
                title: 'Ticket',
                icon: <Ticket className="w-5 h-5" />,
                text: 'Structured ticket with title, steps, pricing guidance, and SLA.',
              },
              {
                title: 'Parts',
                icon: <PackageSearch className="w-5 h-5" />,
                text: 'Inventory awareness + reorder prompts before you’re stuck.',
              },
              {
                title: 'Updates',
                icon: <ClipboardList className="w-5 h-5" />,
                text: 'Customer updates generated for each status change.',
              },
            ].map((step) => (
              <div key={step.title} className="glass-card">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl gradient-purple flex items-center justify-center">
                    {step.icon}
                  </div>
                  <span className="text-xs uppercase tracking-wider text-purple-200/80">
                    Step
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[rgb(var(--text-primary))]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">{step.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Link href="/signup">
              <Button rightIcon={<ArrowRight className="w-4 h-4" />}>
                Build your first ticket in Fixology
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-y border-white/5 bg-[rgb(var(--bg-secondary))]">
        <div className="max-w-7xl mx-auto" ref={featuresRef}>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <p className="badge badge-purple mb-4">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[rgb(var(--text-primary))]">
              Everything you need to run repairs like a system
            </h2>
            <p className="mt-4 text-[rgb(var(--text-secondary))]">
              Fixology is designed for B2B repair ops: faster throughput, clearer pricing, fewer comebacks, better customer trust.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="glass-card group">
                <div className="w-12 h-12 rounded-2xl gradient-purple flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                  {f.title}
                </h3>
                <p className="mt-2 text-[rgb(var(--text-secondary))]">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto" ref={pricingRef}>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <p className="badge badge-purple mb-4">Pricing</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[rgb(var(--text-primary))]">
              Simple plans that scale with your shop
            </h2>
            <p className="mt-4 text-[rgb(var(--text-secondary))]">
              Start with one location. Add users and locations as you grow.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[
              {
                name: 'Starter',
                price: '$49',
                note: 'per location / month',
                highlight: false,
                bullets: [
                  'Ticketing + intake',
                  'Guided diagnosis suggestions',
                  'Customer update templates',
                  'Basic inventory tracking',
                ],
              },
              {
                name: 'Pro',
                price: '$99',
                note: 'per location / month',
                highlight: true,
                bullets: [
                  'Everything in Starter',
                  'Advanced repair flows + risk checks',
                  'Inventory alerts + reorder prompts',
                  'Ops analytics + staff performance',
                ],
              },
              {
                name: 'Multi-location',
                price: 'Custom',
                note: 'volume pricing',
                highlight: false,
                bullets: [
                  'Everything in Pro',
                  'Multi-location reporting',
                  'Priority onboarding + support',
                  'Custom workflows & integrations',
                ],
              },
            ].map((p) => (
              <div
                key={p.name}
                className={[
                  'glass-card relative',
                  p.highlight ? 'border-purple-500/30 shadow-[0_0_0_1px_rgba(167,139,250,0.25)]' : '',
                ].join(' ')}
              >
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 badge badge-purple">
                    Most popular
                  </div>
                )}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                      {p.name}
                    </h3>
                    <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">{p.note}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-[rgb(var(--text-primary))]">
                      {p.price}
                    </p>
                  </div>
                </div>
                <div className="divider" />
                <ul className="space-y-3">
                  {p.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-3 text-[rgb(var(--text-secondary))]">
                      <span className="mt-0.5 w-5 h-5 rounded-full bg-green-500/15 border border-green-500/20 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 text-green-400" />
                      </span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Link href="/signup" className="block">
                    <Button className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                      Start with {p.name}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 px-6 border-t border-white/5 bg-[rgb(var(--bg-secondary))]">
        <div className="max-w-7xl mx-auto" ref={contactRef}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="max-w-xl">
              <p className="badge badge-purple mb-4">Contact</p>
              <h2 className="text-3xl md:text-4xl font-bold text-[rgb(var(--text-primary))]">
                Want a walkthrough for your shop?
              </h2>
              <p className="mt-4 text-[rgb(var(--text-secondary))]">
                We’ll show how Fixology fits your intake, ticketing, and tech workflow — and what it would save you every week.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <a href="mailto:repair@fixologyai.com" className="w-full sm:w-auto">
                  <Button
                    variant="secondary"
                    className="w-full sm:w-auto"
                    leftIcon={<Mail className="w-4 h-4" />}
                  >
                    Email us
                  </Button>
                </a>
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button
                    className="w-full sm:w-auto"
                    leftIcon={<PhoneCall className="w-4 h-4" />}
                  >
                    Schedule a call
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-sm text-[rgb(var(--text-muted))]">
                Prefer to just try it? Start a free trial and run your first demo ticket in minutes.
              </p>
            </div>

            <div className="glass-card">
              <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                Quick checklist (what we’ll cover)
              </p>
              <ul className="mt-4 space-y-3 text-[rgb(var(--text-secondary))]">
                {[
                  'Your current intake → how we automate the ticket draft',
                  'How pricing + time ranges get suggested',
                  'Inventory + reorder prompts',
                  'Customer update automation',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-purple-500/15 border border-purple-500/20 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-purple-300" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="divider" />
              <p className="text-sm text-[rgb(var(--text-muted))]">
                No hard pitch. Just a realistic walkthrough for repair shops.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-sm text-[rgb(var(--text-muted))]">
              © {new Date().getFullYear()} Fixology. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]">
              Log in
            </Link>
            <span className="text-[rgb(var(--text-muted))]">·</span>
            <Link href="/signup" className="text-sm text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]">
              Start free trial
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

