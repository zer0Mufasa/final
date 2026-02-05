import { Button, Link, Section, Text } from '@react-email/components'
import { BaseLayout, styles } from './base-layout'

export interface WelcomeEmailProps {
  shopName: string
  ownerName: string
  trialDays: number
  loginUrl: string
}

export function WelcomeEmail({
  shopName = 'Your Shop',
  ownerName = 'there',
  trialDays = 14,
  loginUrl = 'https://fixologyai.com/login',
}: Partial<WelcomeEmailProps>) {
  return (
    <BaseLayout preview={`Welcome to Fixology, ${ownerName}! Your ${trialDays}-day trial starts now.`}>
      <Text style={styles.h1}>Welcome to Fixology!</Text>

      <Text style={styles.paragraph}>Hey {ownerName},</Text>

      <Text style={styles.paragraph}>
        Thanks for signing up! <span style={styles.highlight}>{shopName}</span> is all set up and ready to go. Your{' '}
        <span style={styles.highlight}>{trialDays}-day free trial</span> starts today.
      </Text>

      <Section style={styles.card}>
        <Text style={{ ...styles.paragraph, margin: '0 0 12px', fontWeight: '600', color: '#EDE9FE' }}>
          Here&apos;s what you can do right now:
        </Text>
        <Text style={{ ...styles.paragraph, margin: '0 0 8px' }}>Create your first ticket with AI intake</Text>
        <Text style={{ ...styles.paragraph, margin: '0 0 8px' }}>Add your team members</Text>
        <Text style={{ ...styles.paragraph, margin: '0 0 8px' }}>Set up your inventory</Text>
        <Text style={{ ...styles.paragraph, margin: '0' }}>Try the IMEI lookup tool</Text>
      </Section>

      <Section style={{ textAlign: 'center', marginTop: '24px' }}>
        <Button href={loginUrl} style={styles.button}>
          Go to Dashboard →
        </Button>
      </Section>

      <Text style={{ ...styles.paragraph, marginTop: '24px' }}>
        Need help getting started? Check out our{' '}
        <Link href="https://fixologyai.com/support/docs" style={{ color: '#a78bfa' }}>
          quick start guide
        </Link>{' '}
        or reply to this email — we&apos;re here to help.
      </Text>

      <Text style={styles.paragraph}>
        Let&apos;s fix smarter together,
        <br />
        <span style={styles.highlight}>The Fixology Team</span>
      </Text>
    </BaseLayout>
  )
}

export default WelcomeEmail

