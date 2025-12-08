// app/layout.tsx
// Root layout for the entire application

import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})

export const metadata: Metadata = {
  title: {
    default: 'Fixology - AI-Powered Repair Intelligence',
    template: '%s | Fixology',
  },
  description:
    'The all-in-one platform for device repair shops. Manage tickets, inventory, customers, and more with AI-powered diagnostics.',
  keywords: [
    'repair shop software',
    'POS system',
    'device repair',
    'IMEI check',
    'repair management',
    'ticketing system',
  ],
  authors: [{ name: 'Fixology' }],
  creator: 'Fixology',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://fixologyai.com',
    siteName: 'Fixology',
    title: 'Fixology - AI-Powered Repair Intelligence',
    description:
      'The all-in-one platform for device repair shops. Manage tickets, inventory, customers, and more.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Fixology',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fixology - AI-Powered Repair Intelligence',
    description:
      'The all-in-one platform for device repair shops. Manage tickets, inventory, customers, and more.',
    images: ['/og-image.png'],
    creator: '@fixologyai',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  )
}

