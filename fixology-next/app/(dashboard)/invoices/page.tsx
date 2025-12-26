// app/(dashboard)/invoices/page.tsx
// Invoices list page (themed to match homepage/login/onboarding)

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'
import { Header } from '@/components/dashboard/header'
import Link from 'next/link'
import { FileText, Plus, DollarSign } from 'lucide-react'

export const metadata = {
  title: 'Invoices',
}

export default async function InvoicesPage() {
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

  const invoices = await prisma.invoice.findMany({
    where: { shopId: shopUser.shopId },
    take: 50,
    orderBy: { createdAt: 'desc' },
    include: {
      customer: true,
    },
  })

  const formatCurrency = (amount: any) => {
    const numAmount = typeof amount === 'number' ? amount : Number(amount)
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numAmount)
  }

  const getStatusBadgeClass = (status: string) => {
    const statusClasses: Record<string, string> = {
      DRAFT: 'bg-gray-500/20 text-gray-400',
      SENT: 'bg-blue-500/20 text-blue-400',
      PAID: 'bg-green-500/20 text-green-400',
      OVERDUE: 'bg-red-500/20 text-red-400',
      CANCELLED: 'bg-red-500/20 text-red-400',
    }
    return statusClasses[status] || 'bg-gray-500/20 text-gray-400'
  }

  const formatStatus = (status: string) => {
    return status.toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())
  }

  return (
    <>
      <Header
        title="Invoices"
        description={`${invoices.length} total invoices`}
        actions={
          <Link
            href="/invoices/new"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#a78bfa] to-[#8b5cf6] text-white font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            New Invoice
          </Link>
        }
      />

      <div className="p-6">
        <div className="glass-card">
          {invoices.length > 0 ? (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <Link
                  key={invoice.id}
                  href={`/invoices/${invoice.id}`}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.06] hover:border-white/15 transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">
                      Invoice #{invoice.invoiceNumber} - {invoice.customer.firstName} {invoice.customer.lastName}
                    </p>
                    <p className="text-sm text-white/60 truncate">
                      {formatCurrency(invoice.total)} • {new Date(invoice.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(invoice.status)}`}>
                    {formatStatus(invoice.status)}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-white/40" />
              </div>
              <p className="text-lg font-semibold text-white mb-2">No invoices yet</p>
              <p className="text-sm text-white/60 mb-6">Create your first invoice to get started.</p>
              <Link
                href="/invoices/new"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#a78bfa] to-[#8b5cf6] text-white font-semibold hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                New Invoice
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

