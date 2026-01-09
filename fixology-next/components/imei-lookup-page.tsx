'use client'

import { useEffect, useState } from 'react'
import {
  Search,
  Smartphone,
  Shield,
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  Info,
  Clock,
  Lock,
  Unlock,
  HelpCircle,
} from 'lucide-react'

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}

interface IMEIResult {
  imei: string
  valid: boolean
  limitedInfo?: boolean
  displayName?: string
  imageUrl?: string
  deviceInfo?: {
    brand: string
    model: string
    modelNumber: string
    type: string
    manufacturer: string
  }
  carrier?: {
    name: string
    country: string
    simLock: 'locked' | 'unlocked' | 'unknown'
  }
  blacklistStatus?: {
    status: 'clean' | 'blacklisted' | 'unknown'
    reason?: string
    reportedDate?: string
  }
  warranty?: {
    status: 'active' | 'expired' | 'unknown'
    expiryDate?: string
    coverage?: string
  }
  iCloud?: {
    status: 'on' | 'off' | 'unknown'
    fmiEnabled?: boolean
  }
  purchaseDate?: string
  repairCoverage?: boolean
}

type Mode = 'basic' | 'deep'

export default function IMEILookupPage() {
  const [imei, setImei] = useState('')
  const [mode, setMode] = useState<Mode>('basic')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<IMEIResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [animationReady, setAnimationReady] = useState(false)
  const [credits, setCredits] = useState<number | null>(null)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)

  const [recentLookups, setRecentLookups] = useState<string[]>([])

  // Load credits
  useEffect(() => {
    const loadCredits = async () => {
      try {
        const res = await fetch('/api/imei/credits')
        if (res.ok) {
          const data = await res.json()
          setCredits(data.credits || 0)
        }
      } catch {
        setCredits(0)
      }
    }
    loadCredits()
  }, [])

  // Avoid hydration mismatch: localStorage should be read only on the client after mount.
  useEffect(() => {
    try {
      const saved = localStorage.getItem('fixology-imei-history')
      setRecentLookups(saved ? JSON.parse(saved) : [])
    } catch {
      setRecentLookups([])
    }
    const t = setTimeout(() => setAnimationReady(true), 100)
    return () => clearTimeout(t)
  }, [])

  const validateIMEI = (value: string): boolean => {
    const clean = value.replace(/[\s-]/g, '')
    // Keep client validation permissive:
    // - 14-digit supported for legacy/demo flows (and some serial-like inputs)
    // - 15-digit supported without strict Luhn enforcement (providers can still validate server-side)
    return /^\d{14,15}$/.test(clean)
  }

  function transformApiResponse(data: any): IMEIResult {
    // API already returns normalized fields (see `app/api/imei/lookup/route.ts`).
    return data as IMEIResult
  }

  const handleLookup = async (overrideMode?: Mode) => {
    const cleanIMEI = imei.replace(/[\s-]/g, '')
    const selectedMode: Mode = overrideMode || mode

    if (!cleanIMEI) {
      setError('Please enter an IMEI number')
      return
    }

    if (!validateIMEI(cleanIMEI)) {
      setError('Invalid IMEI format. IMEI should be 14–15 digits.')
      return
    }

    // Check credits for deep scan
    if (selectedMode === 'deep' && (credits === null || credits < 1)) {
      setError('Insufficient credits. Deep scan requires 1 credit.')
      setShowPurchaseModal(true)
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/imei/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imei: cleanIMEI,
          mode: selectedMode,
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        if (response.status === 402) {
          // Payment required (insufficient credits)
          setShowPurchaseModal(true)
        }
        throw new Error(err.error || 'Lookup failed')
      }

      const data = await response.json()
      if (!data?.valid) throw new Error(data?.error || 'IMEI check failed')
      setResult(transformApiResponse(data))

      // Refresh credits after successful deep scan
      if (selectedMode === 'deep') {
        const creditsRes = await fetch('/api/imei/credits')
        if (creditsRes.ok) {
          const creditsData = await creditsRes.json()
          setCredits(creditsData.credits || 0)
        }
      }

      const newRecent = [cleanIMEI, ...recentLookups.filter((i) => i !== cleanIMEI)].slice(0, 10)
      setRecentLookups(newRecent)
      localStorage.setItem('fixology-imei-history', JSON.stringify(newRecent))
    } catch (err: any) {
      setError(err.message || 'Failed to lookup IMEI')
    } finally {
      setLoading(false)
    }
  }

  const handlePurchaseCredits = async (amount: number) => {
    try {
      const response = await fetch('/api/imei/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', amount }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to purchase credits')
      }

      const data = await response.json()
      setCredits(data.credits || 0)
      setShowPurchaseModal(false)
    } catch (err: any) {
      setError(err.message || 'Failed to purchase credits')
    }
  }

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRecentClick = (recentImei: string) => {
    setImei(recentImei)
    setError(null)
  }

  return (
    <div className="px-4 py-5 sm:p-6 w-full max-w-6xl mx-auto space-y-6 animate-page-in">
      <div className={cn(
        "mb-8 transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-white/95 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Search className="w-5 h-5 text-white" />
              </div>
              IMEI Lookup
            </h1>
            <p className="text-sm text-white/50 mt-2">Check device status, blacklist, carrier lock, and warranty information</p>
          </div>
          
          {/* Credits Display */}
          <div className="flex items-center gap-3 flex-wrap justify-end">
            {credits !== null && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                <span className="text-sm text-white/60">Deep Scan:</span>
                <span className="text-sm font-semibold text-violet-300">
                  {credits} {credits === 1 ? 'credit' : 'credits'} available
                </span>
              </div>
            )}
            <button
              onClick={() => setShowPurchaseModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-violet-500/25 transition-all"
            >
              Buy Credits
            </button>
          </div>
        </div>
      </div>

      <div className={cn(
        "rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6 mb-6 transition-all duration-500 hover:bg-white/[0.04] hover:border-white/[0.1]",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )} style={{ transitionDelay: '100ms' }}>
        <div className="flex gap-4 flex-col lg:flex-row">
          <div className="flex-1 min-w-[280px]">
            <label className="block text-sm font-medium text-white/70 mb-2">IMEI / Serial Number</label>
            <div className="relative">
              <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input
                type="text"
                value={imei}
                onChange={(e) => {
                  setImei(e.target.value)
                  setError(null)
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                placeholder="Enter 14–15 digit IMEI number"
                maxLength={17}
                className="w-full h-12 pl-12 pr-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/30 outline-none focus:border-violet-500/50 focus:bg-white/[0.06] transition-all"
              />
            </div>
            <p className="text-xs text-white/40 mt-2 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Dial *#06# on any phone to find the IMEI
            </p>

            {/* Mode Toggle */}
            <div className="flex items-center gap-4 mt-4 flex-wrap">
              <span className="text-sm text-white/50">Check Mode:</span>
              <div className="flex rounded-xl bg-white/[0.04] border border-white/[0.08] p-1">
                <button
                  type="button"
                  onClick={() => setMode('basic')}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    mode === 'basic'
                      ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                      : 'text-white/50 hover:text-white/70'
                  )}
                >
                  ⚡ Basic
                </button>
                <button
                  type="button"
                  onClick={() => setMode('deep')}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    mode === 'deep'
                      ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                      : 'text-white/50 hover:text-white/70'
                  )}
                >
                  🔬 Deep Scan
                </button>
              </div>
            </div>

            <p className="text-xs text-white/40 mt-2">
              {mode === 'basic'
                ? 'Quick check: Device info, blacklist status, carrier lock (Free)'
                : `Full scan: Includes warranty, iCloud status, purchase date (costs 1 credit${credits !== null ? ` • ${credits} left` : ''})`}
            </p>
          </div>
          <div className="flex items-end justify-between gap-4 flex-1 min-w-[220px] flex-wrap">
            {result?.imageUrl && (
              <div className="w-full sm:w-auto">
                <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-3 flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={result.imageUrl}
                    alt={result.displayName || result.deviceInfo?.model || 'Device'}
                    className="h-16 w-16 object-contain rounded-xl bg-black/30 border border-white/[0.06]"
                  />
                  <div className="text-xs text-white/70">
                    <div className="font-semibold text-white/90">{result.displayName || result.deviceInfo?.model || 'Device'}</div>
                    <div className="text-white/50">{result.deviceInfo?.brand || ''}</div>
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={() => void handleLookup()}
              disabled={loading}
              className={cn(
                'h-12 px-6 rounded-xl font-medium text-sm flex items-center gap-2 transition-all w-full sm:w-auto justify-center',
                loading
                  ? 'bg-white/[0.06] text-white/30 cursor-not-allowed'
                  : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40'
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Lookup
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-rose-400 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {recentLookups.length > 0 && !result && (
          <div className="mt-4">
            <div className="text-xs text-white/40 mb-2">Recent lookups:</div>
            <div className="flex flex-wrap gap-2">
              {recentLookups.slice(0, 5).map((recent) => (
                <button
                  key={recent}
                  onClick={() => handleRecentClick(recent)}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-white/60 hover:bg-white/[0.08] hover:text-white/80 transition-all font-mono"
                >
                  {recent}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {result && (
        <div className="space-y-4">
          {result.limitedInfo && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">💡</span>
                <div>
                  <div className="text-sm font-medium text-amber-300">Limited Results</div>
                  <div className="text-xs text-white/50">Run a Deep Scan for warranty, iCloud, and purchase info</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMode('deep')
                  void handleLookup('deep')
                }}
                className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-sm font-medium hover:bg-amber-500/30 transition-all"
              >
                Run Deep Scan
              </button>
            </div>
          )}

          {/* Quick summary badges */}
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4 flex flex-wrap gap-2">
            <SummaryPill label="Device" value={`${result.deviceInfo?.brand || 'Unknown'} ${result.deviceInfo?.model || ''}`.trim()} />
            <SummaryPill label="Carrier" value={result.carrier?.name || 'Unknown'} />
            <SummaryPill
              label="SIM Lock"
              value={
                result.carrier?.simLock === 'unlocked'
                  ? 'Unlocked'
                  : result.carrier?.simLock === 'locked'
                  ? 'Locked'
                  : 'Unknown'
              }
              tone={
                result.carrier?.simLock === 'unlocked'
                  ? 'good'
                  : result.carrier?.simLock === 'locked'
                  ? 'bad'
                  : 'neutral'
              }
            />
            <SummaryPill
              label="Blacklist"
              value={
                result.blacklistStatus?.status === 'clean'
                  ? 'Clean'
                  : result.blacklistStatus?.status === 'blacklisted'
                  ? 'Blacklisted'
                  : 'Unknown'
              }
              tone={
                result.blacklistStatus?.status === 'clean'
                  ? 'good'
                  : result.blacklistStatus?.status === 'blacklisted'
                  ? 'bad'
                  : 'neutral'
              }
            />
            <SummaryPill
              label="iCloud / FMI"
              value={
                result.iCloud?.status === 'on'
                  ? 'On'
                  : result.iCloud?.status === 'off'
                  ? 'Off'
                  : 'Unknown'
              }
              tone={
                result.iCloud?.status === 'off'
                  ? 'good'
                  : result.iCloud?.status === 'on'
                  ? 'warn'
                  : 'neutral'
              }
            />
            <SummaryPill label="Warranty" value={result.warranty?.status ? result.warranty.status.toUpperCase() : 'Unknown'} />
            <SummaryPill label="Purchase Date" value={result.purchaseDate || 'Unknown'} />
          </div>

          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-semibold text-white/90 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-violet-400" />
                Device Information
              </h2>
              <button
                onClick={() => handleCopy(result.imei)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] text-xs text-white/60 hover:bg-white/[0.08] transition-all"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied!' : 'Copy IMEI'}
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoBlock label="Brand" value={result.deviceInfo?.brand || 'Unknown'} />
              <InfoBlock label="Model" value={result.deviceInfo?.model || 'Unknown'} />
              <InfoBlock label="Model Number" value={result.deviceInfo?.modelNumber || 'N/A'} />
              <InfoBlock label="IMEI" value={result.imei} mono />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatusCard
              title="Blacklist Status"
              icon={
                result.blacklistStatus?.status === 'clean'
                  ? ShieldCheck
                  : result.blacklistStatus?.status === 'blacklisted'
                    ? ShieldX
                    : Shield
              }
              statusText={
                result.blacklistStatus?.status === 'clean'
                  ? 'Clean'
                  : result.blacklistStatus?.status === 'blacklisted'
                    ? 'Blacklisted'
                    : 'Unknown'
              }
              statusColor={
                result.blacklistStatus?.status === 'clean'
                  ? 'emerald'
                  : result.blacklistStatus?.status === 'blacklisted'
                    ? 'rose'
                    : 'amber'
              }
              details={result.blacklistStatus?.reason}
            />

            <StatusCard
              title="Carrier Lock"
              icon={
                result.carrier?.simLock === 'unlocked'
                  ? Unlock
                  : result.carrier?.simLock === 'locked'
                    ? Lock
                    : HelpCircle
              }
              statusText={
                result.carrier?.simLock === 'unlocked'
                  ? 'Unlocked'
                  : result.carrier?.simLock === 'locked'
                    ? 'Locked'
                    : 'Unknown'
              }
              statusColor={
                result.carrier?.simLock === 'unlocked' ? 'emerald' : result.carrier?.simLock === 'locked' ? 'amber' : 'gray'
              }
              details={result.carrier?.name ? `${result.carrier.name} (${result.carrier.country})` : undefined}
            />

            {result.iCloud && (
              <StatusCard
                title="iCloud / FMI"
                icon={result.iCloud.status === 'off' ? CheckCircle : result.iCloud.status === 'on' ? XCircle : HelpCircle}
                statusText={result.iCloud.status === 'off' ? 'Off (Clean)' : result.iCloud.status === 'on' ? 'On (Locked)' : 'Unknown'}
                statusColor={result.iCloud.status === 'off' ? 'emerald' : result.iCloud.status === 'on' ? 'rose' : 'gray'}
                details={result.iCloud.fmiEnabled ? 'Find My iPhone enabled' : undefined}
              />
            )}
          </div>

          {(result.warranty || result.purchaseDate || typeof result.repairCoverage === 'boolean') && (
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6">
              <h2 className="text-lg font-semibold text-white/90 flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-amber-400" />
                Warranty & Coverage
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InfoBlock
                  label="Warranty Status"
                  value={
                    result.warranty?.status === 'active'
                      ? 'Active'
                      : result.warranty?.status === 'expired'
                        ? 'Expired'
                        : 'Unknown'
                  }
                  valueColor={result.warranty?.status === 'active' ? 'emerald' : result.warranty?.status === 'expired' ? 'rose' : 'white'}
                />
                <InfoBlock label="Warranty Expiry" value={result.warranty?.expiryDate || 'N/A'} />
                <InfoBlock label="Purchase Date" value={result.purchaseDate || 'N/A'} />
                <InfoBlock
                  label="Repair Coverage"
                  value={typeof result.repairCoverage === 'boolean' ? (result.repairCoverage ? 'Yes' : 'No') : 'N/A'}
                  valueColor={result.repairCoverage ? 'emerald' : 'white'}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setResult(null)
                setImei('')
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/70 hover:bg-white/[0.08] transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              New Lookup
            </button>

            <div className="text-xs text-white/40">
              {process.env.NEXT_PUBLIC_IMEI_PROVIDER ? `Data provided by ${process.env.NEXT_PUBLIC_IMEI_PROVIDER}` : 'Mock mode if no API key'}
            </div>
          </div>
        </div>
      )}

      {!result && !loading && (
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white/30" />
          </div>
          <h3 className="text-lg font-semibold text-white/70 mb-2">Check Any Device</h3>
          <p className="text-sm text-white/40 max-w-md mx-auto">
            Enter an IMEI number to check blacklist status, carrier lock, iCloud status, warranty, and more.
          </p>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-lg mx-auto">
            <FeatureBadge icon="🔒" label="Blacklist Check" />
            <FeatureBadge icon="📱" label="Carrier Lock" />
            <FeatureBadge icon="☁️" label="iCloud Status" />
            <FeatureBadge icon="🛡️" label="Warranty Info" />
          </div>
        </div>
      )}

      {/* Purchase Credits Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white/[0.08] border border-white/[0.12] p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Purchase Deep Scan Credits</h2>
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="p-2 rounded-lg hover:bg-white/[0.1] transition-colors text-white/60 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-white/60 mb-6">
              Deep scans provide comprehensive device information including warranty status, iCloud lock, and purchase date.
            </p>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => handlePurchaseCredits(5)}
                className="w-full p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-violet-500/30 transition-all text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">5 Credits</div>
                    <div className="text-xs text-white/50">$9.99</div>
                  </div>
                  <div className="text-lg font-bold text-violet-300">$1.99/credit</div>
                </div>
              </button>
              
              <button
                onClick={() => handlePurchaseCredits(10)}
                className="w-full p-4 rounded-xl bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 hover:from-violet-500/30 hover:to-fuchsia-500/30 transition-all text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">10 Credits</div>
                    <div className="text-xs text-white/50">$17.99</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">Best Value</span>
                    <div className="text-lg font-bold text-violet-300">$1.79/credit</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => handlePurchaseCredits(25)}
                className="w-full p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-violet-500/30 transition-all text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">25 Credits</div>
                    <div className="text-xs text-white/50">$39.99</div>
                  </div>
                  <div className="text-lg font-bold text-violet-300">$1.60/credit</div>
                </div>
              </button>
            </div>

            <div className="text-xs text-white/40 text-center">
              Credits never expire. Use them anytime for deep scans.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryPill({
  label,
  value,
  tone = 'neutral',
}: {
  label: string
  value: string
  tone?: 'neutral' | 'good' | 'bad' | 'warn'
}) {
  const toneMap: Record<typeof tone, string> = {
    neutral: 'bg-white/[0.04] text-white/70 border-white/[0.08]',
    good: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30',
    bad: 'bg-rose-500/15 text-rose-200 border-rose-500/30',
    warn: 'bg-amber-500/15 text-amber-200 border-amber-500/30',
  } as any

  return (
    <div className={cn('px-3 py-2 rounded-xl border text-xs flex flex-col gap-1 min-w-[140px]', toneMap[tone])}>
      <span className="text-[10px] uppercase tracking-wide text-white/50">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  )
}

function InfoBlock({
  label,
  value,
  mono,
  valueColor,
}: {
  label: string
  value: string
  mono?: boolean
  valueColor?: 'emerald' | 'rose' | 'amber' | 'white'
}) {
  const colorMap = {
    emerald: 'text-emerald-400',
    rose: 'text-rose-400',
    amber: 'text-amber-400',
    white: 'text-white/90',
  }

  return (
    <div>
      <div className="text-xs text-white/40 mb-1">{label}</div>
      <div className={cn('text-sm font-medium', mono && 'font-mono', valueColor ? colorMap[valueColor] : 'text-white/90')}>
        {value}
      </div>
    </div>
  )
}

function StatusCard({
  title,
  icon: Icon,
  statusText,
  statusColor,
  details,
}: {
  title: string
  icon: any
  statusText: string
  statusColor: 'emerald' | 'rose' | 'amber' | 'gray'
  details?: string
}) {
  const colorMap = {
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-400',
      icon: 'text-emerald-400',
    },
    rose: {
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      text: 'text-rose-400',
      icon: 'text-rose-400',
    },
    amber: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-400',
      icon: 'text-amber-400',
    },
    gray: {
      bg: 'bg-white/[0.04]',
      border: 'border-white/[0.08]',
      text: 'text-white/60',
      icon: 'text-white/40',
    },
  }

  const colors = colorMap[statusColor]

  return (
    <div className={cn('rounded-2xl p-5 border', colors.bg, colors.border)}>
      <div className="flex items-center gap-3 mb-3">
        <Icon className={cn('w-5 h-5', colors.icon)} />
        <span className="text-sm font-medium text-white/70">{title}</span>
      </div>
      <div className={cn('text-xl font-bold', colors.text)}>{statusText}</div>
      {details && <div className="text-xs text-white/40 mt-1">{details}</div>}
    </div>
  )
}

function FeatureBadge({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06]">
      <span className="text-base">{icon}</span>
      <span className="text-xs text-white/60">{label}</span>
    </div>
  )
}

