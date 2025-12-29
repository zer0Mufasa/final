'use client'

// components/dashboard/role-preview-toggle.tsx
// UI-only role preview toggle for testing different user perspectives

import { useRole, type UserRole } from '@/contexts/role-context'
import { User, Shield, Wrench, UserCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const roles: { value: UserRole; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'OWNER', label: 'Owner', icon: <Shield className="w-4 h-4" />, desc: 'Full access' },
  { value: 'MANAGER', label: 'Manager', icon: <User className="w-4 h-4" />, desc: 'Operations + reports' },
  { value: 'TECHNICIAN', label: 'Technician', icon: <Wrench className="w-4 h-4" />, desc: 'Repairs only' },
  { value: 'FRONT_DESK', label: 'Front Desk', icon: <UserCircle className="w-4 h-4" />, desc: 'Intake + customers' },
]

export function RolePreviewToggle() {
  const { role, setRole } = useRole()

  return (
    <div className="inline-flex items-center gap-1 rounded-2xl bg-white/[0.04] border border-white/10 p-1">
      {roles.map((r) => (
        <button
          key={r.value}
          onClick={() => setRole(r.value)}
          className={cn(
            'px-3 py-2 rounded-xl text-xs font-medium transition-all inline-flex items-center gap-1.5',
            role === r.value
              ? 'bg-white/10 text-white shadow-sm'
              : 'text-white/50 hover:text-white/80 hover:bg-white/5'
          )}
          title={r.desc}
        >
          {r.icon}
          <span className="hidden sm:inline">{r.label}</span>
        </button>
      ))}
      <div className="h-4 w-px bg-white/10 mx-1" />
      <div className="px-2 text-[10px] text-white/40 font-medium">Preview</div>
    </div>
  )
}

