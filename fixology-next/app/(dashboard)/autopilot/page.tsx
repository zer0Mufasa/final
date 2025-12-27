// app/(dashboard)/autopilot/page.tsx
// Autopilot page

import { Header } from '@/components/dashboard/header'
import { Sparkles, CheckCircle } from 'lucide-react'

export const metadata = {
  title: 'Autopilot',
}

export default function AutopilotPage() {
  const features = [
    { name: 'AI Intake', enabled: true, description: 'Automatically extract ticket details from customer descriptions' },
    { name: 'Auto Diagnostics', enabled: true, description: 'AI-powered device analysis and repair recommendations' },
    { name: 'Inventory Deduction', enabled: true, description: 'Automatically deduct parts when tickets are completed' },
    { name: 'Customer Updates', enabled: true, description: 'Send automated messages when ticket status changes' },
    { name: 'Reorder Suggestions', enabled: true, description: 'Smart inventory reorder recommendations based on usage' },
    { name: 'IMEI Risk Checks', enabled: false, description: 'Automatically check IMEI for blacklist/lock status (requires API setup)' },
  ]

  return (
    <>
      <Header
        title="Autopilot"
        description="Automated workflows and AI features"
      />

      <div className="p-6">
        <div className="glass-card max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Autopilot Features</h2>
              <p className="text-sm text-white/60">Automated workflows powered by AI</p>
            </div>
          </div>

          <div className="space-y-3">
            {features.map((feature) => (
              <div
                key={feature.name}
                className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-4"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  feature.enabled 
                    ? 'bg-green-500/20' 
                    : 'bg-gray-500/20'
                }`}>
                  {feature.enabled ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">{feature.name}</h3>
                    {feature.enabled && (
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-500/20 text-green-400">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white/60">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <p className="text-purple-400 text-sm">
              <strong>Note:</strong> Most Autopilot features are now active! The AI Intake widget on the dashboard 
              uses OpenAI to automatically extract ticket information from plain text descriptions.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

