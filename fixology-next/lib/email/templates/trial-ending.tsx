import { Button, Section, Text } from '@react-email/components'
import { BaseLayout, styles } from './base-layout'

export interface TrialEndingEmailProps {
  shopName: string
  ownerName: string
  daysLeft: number
  ticketsCreated: number
  billingUrl: string
}

export function TrialEndingEmail({
  shopName = 'Your Shop',
  ownerName = 'there',
  daysLeft = 3,
  ticketsCreated = 0,
  billingUrl = 'https://fixologyai.com/settings/billing',
}: Partial<TrialEndingEmailProps>) {
  return (
    <BaseLayout preview={`Your Fixology trial ends in ${daysLeft} days`}>
      <Text style={styles.h1}>Your trial ends in {daysLeft} days</Text>

      <Text style={styles.paragraph}>Hey {ownerName},</Text>

      <Text style={styles.paragraph}>
        Your free trial for <span style={styles.highlight}>{shopName}</span> is ending soon. Don&apos;t lose access to
        your repair intelligence system!
      </Text>

      {ticketsCreated > 0 && (
        <Section style={styles.success}>
          <Text style={styles.successText}>You&apos;ve created {ticketsCreated} tickets during your trial</Text>
        </Section>
      )}

      <Section style={styles.card}>
        <Text style={{ ...styles.paragraph, margin: '0 0 12px', fontWeight: '600', color: '#EDE9FE' }}>
          What you&apos;ll keep with a paid plan:
        </Text>
        <Text style={{ ...styles.paragraph, margin: '0 0 8px' }}>All your tickets and customer data</Text>
        <Text style={{ ...styles.paragraph, margin: '0 0 8px' }}>AI-powered diagnostics</Text>
        <Text style={{ ...styles.paragraph, margin: '0 0 8px' }}>IMEI intelligence &amp; risk detection</Text>
        <Text style={{ ...styles.paragraph, margin: '0' }}>Unlimited team members</Text>
      </Section>

      <Section style={{ textAlign: 'center', marginTop: '24px' }}>
        <Button href={billingUrl} style={styles.button}>
          Upgrade Now — Keep Your Data →
        </Button>
      </Section>

      <Text style={{ ...styles.paragraph, marginTop: '24px', fontSize: '13px', color: '#9ca3af' }}>
        Questions? Just reply to this email — we&apos;re happy to help you find the right plan for your shop.
      </Text>
    </BaseLayout>
  )
}

export default TrialEndingEmail

