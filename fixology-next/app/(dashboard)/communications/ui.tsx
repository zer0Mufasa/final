'use client'

// app/(dashboard)/communications/ui.tsx
// Unified inbox for all customer communication

import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { CommunicationClarity } from '@/components/dashboard/ui/communication-clarity'
import { Button } from '@/components/ui/button'
import { MessageSquare, Mail, Phone, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

const mockMessages = [
  {
    id: '1',
    type: 'sms',
    ticketId: 't_1001',
    ticketNumber: 'FIX-1041',
    customer: 'Jordan Lee',
    message: 'Is my phone ready yet?',
    time: '10 minutes ago',
    unread: true,
  },
  {
    id: '2',
    type: 'email',
    ticketId: 't_1002',
    ticketNumber: 'FIX-1042',
    customer: 'Maya Patel',
    message: 'Can you confirm the price?',
    time: '2 hours ago',
    unread: false,
  },
  {
    id: '3',
    type: 'note',
    ticketId: 't_1003',
    ticketNumber: 'FIX-1043',
    customer: 'Chris Nguyen',
    message: 'Customer called — wants update',
    time: '3 hours ago',
    unread: false,
  },
]

export function CommunicationsClient() {
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null)

  return (
    <div>
      <PageHeader
        title="Communications Hub"
        description="One place for all customer communication — SMS, email, and internal notes."
        action={<Button leftIcon={<MessageSquare className="w-4 h-4" />}>New message</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* Inbox */}
        <div className="space-y-4">
          <GlassCard className="p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold text-[var(--text-primary)]">Inbox</div>
              <div className="text-xs text-[var(--text-muted)]">{mockMessages.filter((m) => m.unread).length} unread</div>
            </div>
            <div className="space-y-2">
              {mockMessages.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => setSelectedTicket(msg.ticketId)}
                  className={cn(
                    'w-full text-left rounded-2xl border p-4 transition-colors',
                    selectedTicket === msg.ticketId
                      ? 'bg-white/10 border-purple-400/30'
                      : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.05]',
                    msg.unread && 'border-yellow-400/30 bg-yellow-500/5'
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {msg.type === 'sms' && <Phone className="w-4 h-4 text-blue-300" />}
                    {msg.type === 'email' && <Mail className="w-4 h-4 text-purple-300" />}
                    {msg.type === 'note' && <MessageSquare className="w-4 h-4 text-[var(--text-muted)]" />}
                    <div className="text-xs font-semibold text-[var(--text-primary)]">{msg.ticketNumber}</div>
                    {msg.unread && (
                      <div className="w-2 h-2 rounded-full bg-yellow-400" />
                    )}
                  </div>
                  <div className="text-sm font-semibold text-[var(--text-primary)]/80 mb-1">{msg.customer}</div>
                  <div className="text-xs text-[var(--text-primary)]/60 line-clamp-2">{msg.message}</div>
                  <div className="text-xs text-[var(--text-primary)]/40 mt-2">{msg.time}</div>
                </button>
              ))}
            </div>
          </GlassCard>

          {/* Missed messages warning */}
          {mockMessages.filter((m) => m.unread).length > 0 && (
            <GlassCard className="p-4 rounded-2xl border-yellow-400/30 bg-yellow-500/5">
              <div className="flex items-center gap-2 text-sm text-yellow-300">
                <AlertCircle className="w-4 h-4" />
                <span>{mockMessages.filter((m) => m.unread).length} unread message(s) need response</span>
              </div>
            </GlassCard>
          )}
        </div>

        {/* Conversation */}
        <div>
          {selectedTicket ? (
            <GlassCard className="p-6 rounded-3xl">
              <div className="text-sm font-semibold text-[var(--text-primary)] mb-4">Conversation</div>
              <div className="space-y-4 mb-6">
                {[
                  { who: 'Fixology', msg: 'We received your device and started diagnostics.', time: 'Today, 10:14 AM' },
                  { who: 'Customer', msg: 'Is my phone ready yet?', time: 'Today, 10:22 AM' },
                ].map((m, i) => (
                  <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold text-[var(--text-primary)]/85">{m.who}</div>
                      <div className="text-xs text-[var(--text-primary)]/45">{m.time}</div>
                    </div>
                    <div className="text-sm text-[var(--text-primary)]/75 leading-relaxed">{m.msg}</div>
                  </div>
                ))}
              </div>
              <CommunicationClarity
                score={75}
                customerNotes="Customer wants same-day repair if possible."
                internalNotes="Device has prior water damage — verify before repair."
                tone="reassuring"
              />
            </GlassCard>
          ) : (
            <GlassCard className="p-12 rounded-3xl text-center">
              <MessageSquare className="w-12 h-12 text-[var(--text-primary)]/20 mx-auto mb-4" />
              <div className="text-sm font-semibold text-[var(--text-secondary)] mb-2">Select a conversation</div>
              <div className="text-xs text-[var(--text-muted)]">Choose a message from the inbox to view the full conversation</div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  )
}

