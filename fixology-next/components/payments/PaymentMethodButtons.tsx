'use client'

import { cn } from '@/lib/utils/cn'
import { CreditCard, Wallet, Smartphone, Banknote, DollarSign, QrCode } from 'lucide-react'

const methods = [
  { key: 'cash', label: 'Cash', icon: <Wallet className="w-4 h-4" /> },
  { key: 'card', label: 'Card', icon: <CreditCard className="w-4 h-4" /> },
  { key: 'apple', label: 'Apple Pay', icon: <Smartphone className="w-4 h-4" /> },
  { key: 'zelle', label: 'Zelle', icon: <Banknote className="w-4 h-4" /> },
  { key: 'cashapp', label: 'Cash App', icon: <QrCode className="w-4 h-4" /> },
  { key: 'acima', label: 'Acima', icon: <CreditCard className="w-4 h-4" /> },
  { key: 'other', label: 'Other', icon: <DollarSign className="w-4 h-4" /> },
]

export function PaymentMethodButtons({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {methods.map((m) => (
        <button
          key={m.key}
          onClick={() => onChange(m.key)}
          className={cn(
            'rounded-xl px-3 py-2 border text-sm text-white/80 bg-white/[0.03] hover:border-purple-400/40 hover:text-white transition',
            value === m.key ? 'border-purple-400/60 bg-purple-500/10 text-white' : 'border-white/10'
          )}
        >
          <div className="flex items-center justify-center gap-2">
            {m.icon}
            <span>{m.label}</span>
          </div>
        </button>
      ))}
    </div>
  )
}

