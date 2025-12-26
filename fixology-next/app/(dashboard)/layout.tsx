// app/(dashboard)/layout.tsx
// NOTE: We’re switching /dashboard to the legacy static dashboard (public/dashboard/*.html).
// To avoid DB/auth coupling (Prisma/Supabase) we keep this layout minimal.

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

