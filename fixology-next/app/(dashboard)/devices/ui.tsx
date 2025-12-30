'use client'

import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'

const devices = [
  {
    brand: 'Apple',
    model: 'iPhone 15 Pro Max',
    image: '/devices/thumbs/iPhone_15_Pro_Max-130x130.webp',
    commonRepairs: ['Screen', 'Battery', 'Back glass'],
  },
  {
    brand: 'Samsung',
    model: 'Galaxy S24 Ultra',
    image: '/devices/thumbs/Samsung_Galaxy_S24_Ultra-130x130.webp',
    commonRepairs: ['Screen', 'Charge port', 'Camera'],
  },
  {
    brand: 'Nintendo',
    model: 'Switch 2',
    image: '/devices/thumbs/nintendo-switch-2.webp',
    commonRepairs: ['HDMI', 'No power', 'Overheating'],
  },
  {
    brand: 'Sony',
    model: 'PS5',
    image: '/devices/thumbs/ps5.webp',
    commonRepairs: ['HDMI', 'Fan', 'No power'],
  },
  {
    brand: 'Google',
    model: 'Pixel 8 Pro',
    image: '/devices/thumbs/GooglePixel8Pro-130x130.webp',
    commonRepairs: ['Screen', 'Battery', 'Camera'],
  },
  {
    brand: 'Microsoft',
    model: 'Xbox Series X',
    image: '/devices/thumbs/Job_Details_Icon_-_Device_Model_-_Xbox_Series_X.webp',
    commonRepairs: ['No power', 'Overheating', 'Drive'],
  },
]

export function DevicesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Devices"
        description="Library of devices you service. Keep common repairs and risk indicators handy for intake and diagnostics."
        action={<button className="px-4 py-2 rounded-xl bg-purple-500 text-white font-semibold shadow-lg shadow-purple-500/30">Add device</button>}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {devices.map((d) => (
          <GlassCard key={d.model} className="p-4 rounded-2xl border border-white/10 hover:border-purple-400/30 transition">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                <img src={d.image} alt={d.model} className="object-contain w-full h-full" loading="lazy" decoding="async" />
              </div>
              <div>
                <p className="text-sm text-white/60">{d.brand}</p>
                <p className="text-lg font-semibold text-white">{d.model}</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs uppercase text-white/40 tracking-wide mb-2">Common repairs</p>
              <div className="flex flex-wrap gap-2">
                {d.commonRepairs.map((r) => (
                  <span key={r} className="px-2.5 py-1 rounded-full bg-white/5 text-white/70 text-xs border border-white/10">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}

