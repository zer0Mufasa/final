// app/(dashboard)/messages/page.tsx
// Messages page

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'
import { Header } from '@/components/dashboard/header'
import { MessageSquare } from 'lucide-react'

export const metadata = {
  title: 'Messages',
}

export default async function MessagesPage() {
  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const shopUser = await prisma.shopUser.findFirst({
    where: {
      email: session?.user?.email!,
      status: 'ACTIVE',
    },
    include: {
      shop: true,
    },
  })

  if (!shopUser) {
    return null
  }

  const messages = await prisma.message.findMany({
    where: { shopId: shopUser.shopId },
    include: {
      customer: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return (
    <>
      <Header
        title="Messages"
        description={`${messages.length} total messages`}
      />

      <div className="p-6">
        <div className="glass-card">
          {messages.length > 0 ? (
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className="p-4 rounded-2xl bg-white/[0.04] border border-white/10"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-white">
                          {message.customer.firstName} {message.customer.lastName}
                        </p>
                        <span className="text-xs text-white/50">
                          {new Date(message.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-white/70 whitespace-pre-wrap">{message.content}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          message.direction === 'OUTBOUND' 
                            ? 'bg-purple-500/20 text-purple-400' 
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {message.direction}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-white/10 text-white/60">
                          {message.channel}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-white/40" />
              </div>
              <p className="text-lg font-semibold text-white mb-2">No messages yet</p>
              <p className="text-sm text-white/60">Messages sent to customers will appear here</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

