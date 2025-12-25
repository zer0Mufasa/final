// app/page.tsx
// Root homepage - redirects to marketing page
import { redirect } from 'next/navigation'

export default function RootPage() {
  // Redirect to marketing homepage
  redirect('/marketing')
}
