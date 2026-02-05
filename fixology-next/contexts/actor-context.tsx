'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useRole, type UserRole } from '@/contexts/role-context'

export type StaffRole = 'OWNER' | 'TECHNICIAN' | 'FRONT_DESK'

export type StaffStatus = 'ACTIVE' | 'OFF' | 'ON_LEAVE'

export type StaffMember = {
  id: string
  name: string
  role: StaffRole
  pin6: string // UI-only PIN, stored locally
  status: StaffStatus
}

type ActorContextType = {
  actor: StaffMember
  staff: StaffMember[]
  setStaff: (next: StaffMember[]) => void
  verifyPin: (memberId: string, pin6: string) => boolean
  setActiveActor: (memberId: string) => void
}

const ActorContext = createContext<ActorContextType | undefined>(undefined)

const STAFF_KEY = 'fx_staff_v1'
const ACTOR_KEY = 'fx_actor_id_v1'

function safeParse<T>(json: string | null): T | null {
  if (!json) return null
  try {
    return JSON.parse(json) as T
  } catch {
    return null
  }
}

function normalizePin(pin: string) {
  return (pin || '').replace(/\D/g, '').slice(0, 6)
}

function seedStaff(ownerName: string): StaffMember[] {
  return [
    { id: 'owner', name: ownerName || 'Owner', role: 'OWNER', pin6: '123456', status: 'ACTIVE' },
    { id: 'tech_ava', name: 'Ava', role: 'TECHNICIAN', pin6: '246810', status: 'ACTIVE' },
    { id: 'tech_miles', name: 'Miles', role: 'TECHNICIAN', pin6: '135790', status: 'ACTIVE' },
    { id: 'tech_other', name: 'Other Technician', role: 'TECHNICIAN', pin6: '000000', status: 'ACTIVE' },
    { id: 'fd_jules', name: 'Jules', role: 'FRONT_DESK', pin6: '112233', status: 'ACTIVE' },
    { id: 'fd_other', name: 'Other Front Desk', role: 'FRONT_DESK', pin6: '000000', status: 'ACTIVE' },
  ]
}

function mapStaffRoleToUserRole(role: StaffRole): UserRole {
  if (role === 'TECHNICIAN') return 'TECHNICIAN'
  if (role === 'FRONT_DESK') return 'FRONT_DESK'
  return 'OWNER'
}

export function ActorProvider({
  children,
  initialOwnerName,
}: {
  children: ReactNode
  initialOwnerName: string
}) {
  const { setRole } = useRole()
  const [staff, setStaffState] = useState<StaffMember[]>(() => seedStaff(initialOwnerName))
  const [activeId, setActiveId] = useState<string>('owner')

  // Hydrate from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    const storedStaff = safeParse<StaffMember[]>(localStorage.getItem(STAFF_KEY))
    const storedActor = localStorage.getItem(ACTOR_KEY)

    if (storedStaff && Array.isArray(storedStaff) && storedStaff.length > 0) {
      setStaffState(storedStaff)
    } else {
      const seeded = seedStaff(initialOwnerName)
      localStorage.setItem(STAFF_KEY, JSON.stringify(seeded))
      setStaffState(seeded)
    }

    if (storedActor) {
      setActiveId(storedActor)
    }
  }, [initialOwnerName])

  // Persist staff changes
  const setStaff = (next: StaffMember[]) => {
    setStaffState(next)
    try {
      localStorage.setItem(STAFF_KEY, JSON.stringify(next))
    } catch {}
  }

  // Persist active actor + sync RoleContext
  useEffect(() => {
    const nextActor = staff.find((m) => m.id === activeId) || staff[0]
    if (!nextActor) return
    try {
      localStorage.setItem(ACTOR_KEY, nextActor.id)
    } catch {}
    setRole(mapStaffRoleToUserRole(nextActor.role))
    try {
      // Also keep legacy preview role in sync
      localStorage.setItem('fx_preview_role', mapStaffRoleToUserRole(nextActor.role))
    } catch {}
    try {
      // Used by demo-mode API routes to attribute actions to the selected actor.
      // Stored as a normal cookie so it can be read server-side in Next route handlers.
      if (typeof document !== 'undefined') {
        const payload = encodeURIComponent(
          JSON.stringify({ id: nextActor.id, name: nextActor.name, role: nextActor.role })
        )
        document.cookie = `fx_actor=${payload}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, staff])

  const actor = useMemo(() => {
    return staff.find((m) => m.id === activeId) || staff[0] || seedStaff(initialOwnerName)[0]
  }, [activeId, staff, initialOwnerName])

  const verifyPin = (memberId: string, pin6: string) => {
    const m = staff.find((x) => x.id === memberId)
    if (!m) return false
    return normalizePin(pin6) === normalizePin(m.pin6)
  }

  const setActiveActor = (memberId: string) => {
    setActiveId(memberId)
  }

  return (
    <ActorContext.Provider value={{ actor, staff, setStaff, verifyPin, setActiveActor }}>
      {children}
    </ActorContext.Provider>
  )
}

export function useActor() {
  const ctx = useContext(ActorContext)
  if (!ctx) throw new Error('useActor must be used within ActorProvider')
  return ctx
}


