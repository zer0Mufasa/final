// app/layout.tsx
// Root layout for the entire application

import type { Metadata } from 'next'
import { IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import '@/styles/theme-variables.css'
import { Toaster } from '@/components/ui/toaster'
import { ThemeScript } from '@/contexts/theme-context'

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm-plex-sans',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.fixologyai.com'),
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
    url: 'https://www.fixologyai.com',
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body
        className={`${ibmPlexSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  )
}

