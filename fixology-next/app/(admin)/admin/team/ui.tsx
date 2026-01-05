'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/cards'
import { UserCog, Plus, Mail, Shield, Key, Trash2, Edit, Power, PowerOff, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { Button } from '@/components/admin/ui/button'
import { EmptyState } from '@/components/admin/ui/empty-state'
import { Modal } from '@/components/admin/ui/modal'
import { SearchInput } from '@/components/admin/ui/search-input'
import { cn } from '@/lib/utils/cn'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function AdminTeamClient() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [inviteData, setInviteData] = useState({ email: '', name: '', role: 'SUPPORT' })

  const { data: adminsData, mutate, error } = useSWR('/api/admin/team', fetcher)
  const admins = adminsData?.admins || []

  const filteredAdmins = admins.filter((admin: any) =>
    admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleInvite = async () => {
    if (!inviteData.email || !inviteData.name) {
      toast.error('Email and name are required')
      return
    }

    setIsInviting(true)
    try {
      const res = await fetch('/api/admin/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteData),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to invite admin')
      }

      toast.success('Admin invited successfully')
      setShowInviteModal(false)
      setInviteData({ email: '', name: '', role: 'SUPPORT' })
      mutate()
    } catch (err: any) {
      toast.error(err.message || 'Failed to invite admin')
    } finally {
      setIsInviting(false)
    }
  }

  const handleToggleStatus = async (adminId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/team/${adminId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (!res.ok) throw new Error('Failed to update status')
      toast.success(`Admin ${!currentStatus ? 'activated' : 'deactivated'}`)
      mutate()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status')
    }
  }

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      SUPER_ADMIN: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      SUPPORT: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      BILLING: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    }
    return colors[role] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'
  }

  return (
    <div className="p-6 space-y-6 animate-page-in">
      <PageHeader
        title="Team & Permissions"
        description="Manage admin users, roles, and permissions."
        action={
          <Button onClick={() => setShowInviteModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Invite Admin
          </Button>
        }
      />

      <GlassCard>
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search admins by name or email..."
        />
      </GlassCard>

      {error ? (
        <GlassCard>
          <EmptyState
            icon={<UserCog className="w-12 h-12 mx-auto opacity-30" />}
            title="Failed to load admins"
            description="There was an error loading admin users. Please try again."
            action={<Button onClick={() => mutate()} variant="secondary">Retry</Button>}
          />
        </GlassCard>
      ) : filteredAdmins.length === 0 ? (
        <GlassCard>
          <EmptyState
            icon={<UserCog className="w-12 h-12 mx-auto opacity-30" />}
            title={searchTerm ? 'No admins found' : 'No admins'}
            description={searchTerm ? 'Try adjusting your search terms' : 'Invite your first admin user to get started'}
            action={
              !searchTerm && (
                <Button onClick={() => setShowInviteModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
                  Invite Admin
                </Button>
              )
            }
          />
        </GlassCard>
      ) : (
        <div className="grid gap-4">
          {filteredAdmins.map((admin: any) => (
            <GlassCard key={admin.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-white/90">{admin.name}</h3>
                    <span className={cn('text-xs px-2 py-1 rounded-full border', getRoleBadge(admin.role))}>
                      {admin.role.replace('_', ' ')}
                    </span>
                    <span
                      className={cn(
                        'text-xs px-2 py-1 rounded-full',
                        admin.isActive !== false
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                      )}
                    >
                      {admin.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-white/60 mb-2">{admin.email}</p>
                  <p className="text-xs text-white/50">
                    Joined: {format(parseISO(admin.createdAt), 'MMM d, yyyy')}
                    {admin.lastLoginAt && ` • Last login: ${format(parseISO(admin.lastLoginAt), 'MMM d')}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(admin.id, admin.isActive !== false)}
                    tooltip={admin.isActive !== false ? 'Deactivate' : 'Activate'}
                  >
                    {admin.isActive !== false ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      if (!confirm('Reset password for this admin?')) return
                      try {
                        const res = await fetch(`/api/admin/team/${admin.id}/reset-password`, { method: 'POST' })
                        if (!res.ok) throw new Error('Failed to reset password')
                        const data = await res.json()
                        if (data.password) {
                          toast.success(`Password reset! New password: ${data.password}`, { duration: 10000 })
                        } else {
                          toast.success('Password reset email sent')
                        }
                      } catch (err: any) {
                        toast.error(err.message || 'Failed to reset password')
                      }
                    }}
                    tooltip="Reset password"
                  >
                    <Key className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Admin"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Name</label>
            <input
              type="text"
              value={inviteData.name}
              onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
              placeholder="John Doe"
              className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Email</label>
            <input
              type="email"
              value={inviteData.email}
              onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
              placeholder="admin@fixology.io"
              className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Role</label>
            <select
              value={inviteData.role}
              onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-purple-500/30"
            >
              <option value="SUPPORT">Support</option>
              <option value="BILLING">Billing</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>
          <div className="flex gap-2 pt-4">
            <Button onClick={handleInvite} isLoading={isInviting} className="flex-1">
              Send Invite
            </Button>
            <Button variant="secondary" onClick={() => setShowInviteModal(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
