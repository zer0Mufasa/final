'use client'

// contexts/role-context.tsx
// UI-only role management for previewing different user perspectives

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type UserRole = 'OWNER' | 'MANAGER' | 'TECHNICIAN' | 'FRONT_DESK'

interface RoleContextType {
  role: UserRole
  setRole: (role: UserRole) => void
  isOwner: boolean
  isManager: boolean
  isTechnician: boolean
  isFrontDesk: boolean
  canEdit: boolean
  canViewReports: boolean
  canManageInventory: boolean
  canManageSettings: boolean
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

export function RoleProvider({ children, initialRole }: { children: ReactNode; initialRole?: UserRole }) {
  const [role, setRole] = useState<UserRole>(initialRole || 'OWNER')

  useEffect(() => {
    // Persist role selection in localStorage
    localStorage.setItem('fx_preview_role', role)
  }, [role])

  const isOwner = role === 'OWNER'
  const isManager = role === 'MANAGER'
  const isTechnician = role === 'TECHNICIAN'
  const isFrontDesk = role === 'FRONT_DESK'

  const canEdit = isOwner || isManager
  const canViewReports = isOwner || isManager
  const canManageInventory = isOwner || isManager || isTechnician
  const canManageSettings = isOwner

  return (
    <RoleContext.Provider
      value={{
        role,
        setRole,
        isOwner,
        isManager,
        isTechnician,
        isFrontDesk,
        canEdit,
        canViewReports,
        canManageInventory,
        canManageSettings,
      }}
    >
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const context = useContext(RoleContext)
  if (!context) {
    throw new Error('useRole must be used within RoleProvider')
  }
  return context
}

