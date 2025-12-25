'use client'

// app/(auth)/signup/page.tsx
// Signup page for new shops

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/shared/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toaster'
import { Mail, Lock, User, Building, Phone, ArrowRight, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    shopName: '',
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [step, setStep] = useState(1)

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.shopName.trim()) {
      newErrors.shopName = 'Shop name is required'
    }
    
    if (!formData.ownerName.trim()) {
      newErrors.ownerName = 'Your name is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address'
    }
    
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateStep2()) return
    
    setLoading(true)
    
    try {
      // Sign up with Supabase Auth
      const supabase = createClient()
      
      const { error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.ownerName,
            shop_name: formData.shopName,
          },
        },
      })
      
      if (authError) {
        if (authError.message.includes('already registered')) {
          toast.error('This email is already registered. Please login.')
        } else {
          toast.error(authError.message)
        }
        return
      }
      
      // Create shop via API
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName: formData.shopName,
          ownerName: formData.ownerName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        toast.error(result.error || 'Failed to create shop')
        return
      }
      
      toast.success('Account created! Welcome to Fixology!')
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      console.error('Signup error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const features = [
    'AI-powered diagnostics',
    'Smart ticket management',
    'Customer portal',
    'Inventory tracking',
    'Invoice generation',
    'Analytics dashboard',
  ]

  return (
    <div className="min-h-screen flex">
      {/* Left side - Decorative */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-gradient-to-br from-purple-900/50 via-purple-800/30 to-bg-primary">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center p-12">
          <h2 className="text-3xl font-bold text-white mb-6">
            Start your 14-day free trial
          </h2>
          <p className="text-purple-200/80 mb-8 max-w-md">
            Join hundreds of repair shops using Fixology to streamline their operations and grow their business.
          </p>
          
          <ul className="space-y-4">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-3 text-purple-200/90">
                <div className="w-6 h-6 rounded-full bg-purple-500/30 flex items-center justify-center">
                  <Check className="w-4 h-4 text-purple-300" />
                </div>
                {feature}
              </li>
            ))}
          </ul>
          
          <div className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-purple-200/90 italic">
              &quot;Fixology transformed our repair shop. We&apos;ve cut ticket processing time in half and our customers love the real-time updates.&quot;
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700" />
              <div>
                <p className="text-white font-medium">Mike Chen</p>
                <p className="text-purple-300/60 text-sm">TechFix Pro</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:px-24">
        <div className="max-w-md w-full mx-auto">
          <Logo size="lg" className="mb-12" />
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[rgb(var(--text-primary))] mb-2">
              Create your account
            </h1>
            <p className="text-[rgb(var(--text-muted))]">
              {step === 1 ? 'Tell us about your shop' : 'Set up your login credentials'}
            </p>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center gap-2 mb-8">
            <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-[rgb(var(--accent-primary))]' : 'bg-[rgb(var(--bg-tertiary))]'}`} />
            <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-[rgb(var(--accent-primary))]' : 'bg-[rgb(var(--bg-tertiary))]'}`} />
          </div>

          <form onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); handleNextStep(); }}>
            {step === 1 ? (
              <div className="space-y-6 animate-fade-in-up">
                <Input
                  label="Shop Name"
                  placeholder="Your Repair Shop"
                  value={formData.shopName}
                  onChange={(e) => updateField('shopName', e.target.value)}
                  error={errors.shopName}
                  leftIcon={<Building className="w-5 h-5" />}
                />

                <Input
                  label="Your Name"
                  placeholder="John Smith"
                  value={formData.ownerName}
                  onChange={(e) => updateField('ownerName', e.target.value)}
                  error={errors.ownerName}
                  leftIcon={<User className="w-5 h-5" />}
                />

                <Button
                  type="submit"
                  className="w-full"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Continue
                </Button>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in-up">
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  error={errors.email}
                  leftIcon={<Mail className="w-5 h-5" />}
                  autoComplete="email"
                />

                <Input
                  label="Phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  error={errors.phone}
                  leftIcon={<Phone className="w-5 h-5" />}
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  error={errors.password}
                  leftIcon={<Lock className="w-5 h-5" />}
                  autoComplete="new-password"
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  error={errors.confirmPassword}
                  leftIcon={<Lock className="w-5 h-5" />}
                  autoComplete="new-password"
                />

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    loading={loading}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Create Account
                  </Button>
                </div>
              </div>
            )}
          </form>

          <p className="mt-8 text-center text-[rgb(var(--text-muted))]">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-[rgb(var(--accent-light))] hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-[rgb(var(--text-muted))]">
            By signing up, you agree to our{' '}
            <Link href="/terms" className="text-[rgb(var(--accent-light))] hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-[rgb(var(--accent-light))] hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

