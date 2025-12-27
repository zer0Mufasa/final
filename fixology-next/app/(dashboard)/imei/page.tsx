// app/(dashboard)/imei/page.tsx
// IMEI Lookup page

'use client'

import { useState } from 'react'
import { Header } from '@/components/dashboard/header'
import { Smartphone, Loader2, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export default function IMEIPage() {
  const [imei, setImei] = useState('')
  const [brand, setBrand] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCheck = async () => {
    if (!imei || !/^\d{14,15}$/.test(imei)) {
      setError('Please enter a valid 14-15 digit IMEI')
      return
    }

    setIsChecking(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/risk/imei', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imei,
          brand: brand || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to check IMEI')
      }

      const data = await response.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message || 'Failed to check IMEI')
    } finally {
      setIsChecking(false)
    }
  }

  const getStatusIcon = () => {
    if (!result) return null
    if (result.status === 'clean') return <CheckCircle className="w-6 h-6 text-green-400" />
    if (result.status === 'flagged') return <AlertTriangle className="w-6 h-6 text-red-400" />
    return <XCircle className="w-6 h-6 text-yellow-400" />
  }

  const getStatusColor = () => {
    if (!result) return ''
    if (result.status === 'clean') return 'text-green-400'
    if (result.status === 'flagged') return 'text-red-400'
    return 'text-yellow-400'
  }

  return (
    <>
      <Header
        title="IMEI Lookup"
        description="Check device IMEI for blacklist, carrier lock, and lost mode status"
      />

      <div className="p-6">
        <div className="glass-card max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">IMEI Risk Check</h2>
              <p className="text-sm text-white/60">Verify device status before repair</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">IMEI Number *</label>
              <input
                type="text"
                value={imei}
                onChange={(e) => setImei(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 14-15 digit IMEI"
                maxLength={15}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30 font-mono text-lg tracking-wider"
              />
              <p className="text-xs text-white/50 mt-1">Enter the device IMEI number (found in Settings or on the device)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Device Brand (optional)</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g., Apple, Samsung"
                className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30"
              />
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                {error}
              </div>
            )}

            <button
              onClick={handleCheck}
              disabled={isChecking || !imei || imei.length < 14}
              className={cn(
                'w-full px-6 py-4 rounded-xl font-semibold transition-all',
                'bg-gradient-to-r from-blue-500 to-blue-700 text-white',
                'hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center justify-center gap-2'
              )}
            >
              {isChecking ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Smartphone className="w-5 h-5" />
                  Check IMEI
                </>
              )}
            </button>

            {result && (
              <div className="mt-6 p-6 rounded-xl bg-white/[0.03] border border-white/10 space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  {getStatusIcon()}
                  <div>
                    <h3 className="text-lg font-bold text-white">Status: <span className={getStatusColor()}>{result.status.toUpperCase()}</span></h3>
                    <p className="text-sm text-white/60">Confidence: {result.confidence}%</p>
                  </div>
                </div>

                {result.reasons && result.reasons.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-white/80 mb-2">Details</p>
                    <ul className="space-y-1">
                      {result.reasons.map((reason: string, idx: number) => (
                        <li key={idx} className="text-white/70 text-sm">• {reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                  <div>
                    <p className="text-xs text-white/50 mb-1">Carrier Lock</p>
                    <p className="text-white font-semibold">
                      {result.carrierLock !== undefined ? (result.carrierLock ? 'Yes' : 'No') : 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-white/50 mb-1">Blacklist Status</p>
                    <p className="text-white font-semibold">
                      {result.blacklist !== undefined ? (result.blacklist ? 'Flagged' : 'Clean') : 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-white/50 mb-1">Lost Mode</p>
                    <p className="text-white font-semibold">
                      {result.lostMode !== undefined ? (result.lostMode ? 'Yes' : 'No') : 'Unknown'}
                    </p>
                  </div>
                </div>

                {result.status === 'unknown' && (
                  <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <p className="text-yellow-400 text-sm">
                      <strong>Note:</strong> IMEI check service is not yet configured. This is a placeholder response.
                      To enable full IMEI checking, integrate with a service like CheckMend or IMEIPro.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

