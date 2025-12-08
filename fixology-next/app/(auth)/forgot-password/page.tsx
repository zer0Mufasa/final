'use client'

// app/(auth)/forgot-password/page.tsx
// Password reset request page

import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/shared/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toaster'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setError('Email is required')
      return
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Invalid email address')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const supabase = createClient()
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      
      if (error) {
        toast.error(error.message)
        return
      }
      
      setSent(true)
      toast.success('Password reset email sent!')
    } catch (error) {
      console.error('Reset error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))] mb-4">
            Check your email
          </h1>
          <p className="text-[rgb(var(--text-muted))] mb-8">
            We&apos;ve sent a password reset link to{' '}
            <span className="text-[rgb(var(--text-primary))]">{email}</span>
          </p>
          <Link href="/login">
            <Button variant="secondary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to login
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <Logo size="lg" className="mb-12 justify-center" />
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[rgb(var(--text-primary))] mb-2">
            Forgot password?
          </h1>
          <p className="text-[rgb(var(--text-muted))]">
            No worries, we&apos;ll send you reset instructions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (error) setError('')
            }}
            error={error}
            leftIcon={<Mail className="w-5 h-5" />}
            autoComplete="email"
            autoFocus
          />

          <Button
            type="submit"
            className="w-full"
            loading={loading}
          >
            Send reset link
          </Button>
        </form>

        <p className="mt-8 text-center">
          <Link
            href="/login"
            className="text-sm text-[rgb(var(--accent-light))] hover:underline inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </p>
      </div>
    </div>
  )
}

