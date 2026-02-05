import type { ReactNode } from 'react'
import { Body, Container, Head, Html, Img, Link, Preview, Section, Text, Hr } from '@react-email/components'

interface BaseLayoutProps {
  preview: string
  children: ReactNode
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fixologyai.com'
const emailLogoUrl = process.env.EMAIL_LOGO_URL || ''

export function BaseLayout({ preview, children }: BaseLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            {emailLogoUrl ? (
              <Img src={emailLogoUrl} width="140" height="40" alt="Fixology" style={logo} />
            ) : (
              <Text style={wordmark}>Fixology</Text>
            )}
          </Section>

          <Section style={content}>{children}</Section>

          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>Fixology AI - Repair Intelligence System</Text>
            <Text style={footerLinks}>
              <Link href={`${baseUrl}/terms`} style={link}>
                Terms
              </Link>
              {' • '}
              <Link href={`${baseUrl}/privacy`} style={link}>
                Privacy
              </Link>
              {' • '}
              <Link href={`${baseUrl}/support`} style={link}>
                Support
              </Link>
            </Text>
            <Text style={footerAddress}>© {new Date().getFullYear()} Fixology AI. All rights reserved.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#0f0a1a',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '560px',
}

const header = {
  textAlign: 'center' as const,
  marginBottom: '32px',
}

const logo = {
  margin: '0 auto',
}

const wordmark = {
  margin: '0 auto',
  fontSize: '28px',
  fontWeight: '800',
  letterSpacing: '-0.02em',
  color: '#EDE9FE',
}

const content = {
  backgroundColor: '#1a1025',
  borderRadius: '16px',
  padding: '32px',
  border: '1px solid rgba(167, 139, 250, 0.2)',
}

const hr = {
  borderColor: 'rgba(167, 139, 250, 0.2)',
  margin: '32px 0',
}

const footer = {
  textAlign: 'center' as const,
}

const footerText = {
  color: '#a78bfa',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 8px',
}

const footerLinks = {
  color: '#9ca3af',
  fontSize: '12px',
  margin: '0 0 8px',
}

const footerAddress = {
  color: '#6b7280',
  fontSize: '11px',
  margin: '0',
}

const link = {
  color: '#a78bfa',
  textDecoration: 'none',
}

export const styles = {
  h1: {
    color: '#EDE9FE',
    fontSize: '24px',
    fontWeight: '700',
    margin: '0 0 16px',
    textAlign: 'center' as const,
  },
  h2: {
    color: '#EDE9FE',
    fontSize: '20px',
    fontWeight: '600',
    margin: '0 0 12px',
  },
  paragraph: {
    color: '#d1d5db',
    fontSize: '15px',
    lineHeight: '24px',
    margin: '0 0 16px',
  },
  button: {
    backgroundColor: '#8b5cf6',
    borderRadius: '8px',
    color: '#ffffff',
    display: 'inline-block',
    fontSize: '15px',
    fontWeight: '600',
    padding: '12px 24px',
    textDecoration: 'none',
    textAlign: 'center' as const,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    border: '1px solid rgba(167, 139, 250, 0.4)',
    borderRadius: '8px',
    color: '#a78bfa',
    display: 'inline-block',
    fontSize: '14px',
    fontWeight: '500',
    padding: '10px 20px',
    textDecoration: 'none',
    textAlign: 'center' as const,
  },
  highlight: {
    color: '#a78bfa',
    fontWeight: '600',
  },
  code: {
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    borderRadius: '4px',
    color: '#a78bfa',
    fontFamily: 'monospace',
    fontSize: '14px',
    padding: '2px 6px',
  },
  card: {
    backgroundColor: 'rgba(167, 139, 250, 0.05)',
    border: '1px solid rgba(167, 139, 250, 0.15)',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px',
  },
  warning: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '16px',
  },
  warningText: {
    color: '#fbbf24',
    fontSize: '14px',
    margin: '0',
  },
  success: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid rgba(34, 197, 94, 0.3)',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '16px',
  },
  successText: {
    color: '#4ade80',
    fontSize: '14px',
    margin: '0',
  },
  error: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '16px',
  },
  errorText: {
    color: '#f87171',
    fontSize: '14px',
    margin: '0',
  },
}

