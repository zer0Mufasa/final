// app/page.tsx
// Marketing homepage

import Link from 'next/link'
import { Logo } from '@/components/shared/logo'
import { Button } from '@/components/ui/button'
import { 
  ArrowRight, 
  Ticket, 
  Users, 
  Package, 
  Cpu,
  Smartphone,
  BarChart3,
  Zap,
  Shield,
  Clock,
  Check,
} from 'lucide-react'

export default function HomePage() {
  const features = [
    {
      icon: <Ticket className="w-6 h-6" />,
      title: 'Smart Ticketing',
      description: 'Manage repair tickets with AI-powered status tracking and automated customer updates.',
    },
    {
      icon: <Cpu className="w-6 h-6" />,
      title: 'AI Diagnostics',
      description: 'Get instant device diagnosis suggestions powered by machine learning.',
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: 'IMEI Lookup',
      description: 'Instant carrier and device information lookup for any IMEI.',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Customer Portal',
      description: 'Let customers track repairs and receive updates in real-time.',
    },
    {
      icon: <Package className="w-6 h-6" />,
      title: 'Inventory Management',
      description: 'Track parts, set alerts for low stock, and manage suppliers.',
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Analytics Dashboard',
      description: 'Make data-driven decisions with comprehensive business insights.',
    },
  ]

  const benefits = [
    'Save 5+ hours per week on admin tasks',
    'Reduce no-shows by 40% with automated reminders',
    'Increase revenue with upsell recommendations',
    '24/7 customer self-service portal',
  ]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[rgb(var(--bg-primary))]/80 backdrop-blur-xl border-b border-[rgb(var(--border-subtle))]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/features" className="text-sm text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="text-sm text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors">
              Pricing
            </Link>
            <Link href="/about" className="text-sm text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors">
              About
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/signup">
              <Button rightIcon={<ArrowRight className="w-4 h-4" />}>
                Start Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-8">
            <Zap className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300">AI-Powered Repair Intelligence</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-[rgb(var(--text-primary))] mb-6 leading-tight">
            The future of{' '}
            <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              device repair
            </span>{' '}
            is here
          </h1>

          <p className="text-xl text-[rgb(var(--text-secondary))] mb-10 max-w-2xl mx-auto">
            Fixology is the all-in-one platform that helps repair shops streamline operations, 
            delight customers, and grow their business with AI-powered tools.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                Start 14-Day Free Trial
              </Button>
            </Link>
            <Link href="/demo">
              <Button variant="secondary" size="lg">
                Watch Demo
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-sm text-[rgb(var(--text-muted))]">
            No credit card required · Free forever plan available
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 px-6 border-y border-[rgb(var(--border-subtle))] bg-[rgb(var(--bg-secondary))]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-green-400" />
                </div>
                <span className="text-sm text-[rgb(var(--text-secondary))]">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[rgb(var(--text-primary))] mb-4">
              Everything you need to run your repair shop
            </h2>
            <p className="text-lg text-[rgb(var(--text-secondary))] max-w-2xl mx-auto">
              From intake to pickup, Fixology handles every step of the repair process with intelligent automation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="glass-card group"
              >
                <div className="w-12 h-12 rounded-xl gradient-purple flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-2">
                  {feature.title}
                </h3>
                <p className="text-[rgb(var(--text-secondary))]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 px-6 bg-[rgb(var(--bg-secondary))]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[rgb(var(--text-primary))] mb-4">
              Trusted by repair shops worldwide
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <div className="text-center">
              <p className="text-4xl font-bold text-[rgb(var(--accent-light))]">500+</p>
              <p className="text-[rgb(var(--text-muted))]">Active Shops</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-[rgb(var(--accent-light))]">50K+</p>
              <p className="text-[rgb(var(--text-muted))]">Repairs Processed</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-[rgb(var(--accent-light))]">99.9%</p>
              <p className="text-[rgb(var(--text-muted))]">Uptime</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-[rgb(var(--accent-light))]">4.9/5</p>
              <p className="text-[rgb(var(--text-muted))]">Customer Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-purple-800/30 to-transparent" />
        </div>

        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[rgb(var(--text-primary))] mb-4">
            Ready to transform your repair shop?
          </h2>
          <p className="text-lg text-[rgb(var(--text-secondary))] mb-8">
            Join hundreds of repair shops that have already made the switch to Fixology.
          </p>
          <Link href="/signup">
            <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
              Start Your Free Trial
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-[rgb(var(--border-subtle))]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <Logo size="sm" className="mb-4" />
              <p className="text-sm text-[rgb(var(--text-muted))]">
                AI-powered repair shop management for the modern era.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-[rgb(var(--text-primary))] mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="/features" className="text-sm text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]">Features</Link></li>
                <li><Link href="/pricing" className="text-sm text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]">Pricing</Link></li>
                <li><Link href="/demo" className="text-sm text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-[rgb(var(--text-primary))] mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-sm text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]">About</Link></li>
                <li><Link href="/contact" className="text-sm text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]">Contact</Link></li>
                <li><Link href="/careers" className="text-sm text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-[rgb(var(--text-primary))] mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="mailto:repair@fixologyai.com" className="text-sm text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]">repair@fixologyai.com</a></li>
                <li><Link href="/docs" className="text-sm text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]">Documentation</Link></li>
                <li><Link href="/privacy" className="text-sm text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-[rgb(var(--border-subtle))] flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-[rgb(var(--text-muted))]">
              © 2024 Fixology. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </a>
              <a href="#" className="text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
