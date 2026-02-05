import { Suspense } from 'react'
import { LoginClient } from './login-client'

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-[var(--text-primary)]/60">
          Loading…
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  )
}

