import { Button, Section, Text } from '@react-email/components'
import { BaseLayout, styles } from './base-layout'

export interface SubscriptionCancelledEmailProps {
  shopName: string
  ownerName: string
  effectiveDate: string
  billingUrl: string
}

export function SubscriptionCancelledEmail({
  shopName = 'Your Shop',
  ownerName = 'there',
  effectiveDate = 'immediately',
  billingUrl = 'https://fixologyai.com/settings/billing',
}: Partial<SubscriptionCancelledEmailProps>) {
  return (
    <BaseLayout preview={`Subscription cancelled for ${shopName}`}>
      <Text style={styles.h1}>Subscription cancelled</Text>

      <Text style={styles.paragraph}>Hey {ownerName},</Text>

      <Text style={styles.paragraph}>
        Your Fixology subscription for <span style={styles.highlight}>{shopName}</span> has been cancelled (
        {effectiveDate}).
      </Text>

      <Section style={styles.warning}>
        <Text style={styles.warningText}>
          Your data is safe. You can reactivate anytime to restore full access.
        </Text>
      </Section>

      <Section style={{ textAlign: 'center', marginTop: '24px' }}>
        <Button href={billingUrl} style={styles.button}>
          Manage Billing →
        </Button>
      </Section>

      <Text style={{ ...styles.paragraph, marginTop: '24px', fontSize: '13px', color: '#9ca3af' }}>
        If this was a mistake, reply to this email and we&apos;ll help you get back up and running.
      </Text>
    </BaseLayout>
  )
}

export default SubscriptionCancelledEmail

