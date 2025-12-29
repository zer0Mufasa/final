'use client'

// components/dashboard/ui/resume-card.tsx
// "Resume where you left off" cards for interruption recovery

import { GlassCard } from './glass-card'
import { ArrowRight, Clock } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

interface ResumeCardProps {
  title: string
  description: string
  href: string
  timeAgo?: string
  progress?: number
  className?: string
}

export function ResumeCard({ title, description, href, timeAgo, progress, className }: ResumeCardProps) {
  return (
    <Link href={href} className={cn('block', className)}>
      <GlassCard className="p-4 rounded-2xl hover:bg-white/[0.06] transition-colors group cursor-pointer">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-white/50" />
              <div className="text-sm font-semibold text-white/90">Resume</div>
              {timeAgo && <div className="text-xs text-white/40">• {timeAgo}</div>}
            </div>
            <div className="text-sm font-medium text-white/80 mb-1">{title}</div>
            <div className="text-xs text-white/55 leading-relaxed">{description}</div>
            {progress !== undefined && (
              <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
          <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-white/70 group-hover:translate-x-1 transition-all flex-shrink-0" />
        </div>
      </GlassCard>
    </Link>
  )
}

