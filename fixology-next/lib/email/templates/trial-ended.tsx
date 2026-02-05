import { Button, Section, Text } from '@react-email/components'
import { BaseLayout, styles } from './base-layout'

export interface TrialEndedEmailProps {
  shopName: string
  ownerName: string
  billingUrl: string
}

export function TrialEndedEmail({
  shopName = 'Your Shop',
  ownerName = 'there',
  billingUrl = 'https://fixologyai.com/settings/billing',
}: Partial<TrialEndedEmailProps>) {
  return (
    <BaseLayout preview="Your Fixology trial has ended">
      <Text style={styles.h1}>Your trial has ended</Text>

      <Text style={styles.paragraph}>Hey {ownerName},</Text>

      <Text style={styles.paragraph}>
        Your free trial for <span style={styles.highlight}>{shopName}</span> has expired.
      </Text>

      <Section style={styles.warning}>
        <Text style={styles.warningText}>Your data is safe. Upgrade anytime to restore full access.</Text>
      </Section>

      <Text style={styles.paragraph}>Here&apos;s what you&apos;re missing without an active subscription:</Text>

      <Section style={styles.card}>
        <Text style={{ ...styles.paragraph, margin: '0 0 8px' }}>No new tickets can be created</Text>
        <Text style={{ ...styles.paragraph, margin: '0 0 8px' }}>AI features are disabled</Text>
        <Text style={{ ...styles.paragraph, margin: '0 0 8px' }}>Customer updates paused</Text>
        <Text style={{ ...styles.paragraph, margin: '0' }}>Inventory alerts stopped</Text>
      </Section>

      <Section style={{ textAlign: 'center', marginTop: '24px' }}>
        <Button href={billingUrl} style={styles.button}>
          Reactivate My Account →
        </Button>
      </Section>

      <Text style={{ ...styles.paragraph, marginTop: '24px', fontSize: '13px', color: '#9ca3af' }}>
        If you&apos;re not ready to continue, no worries. Your data will be retained for 30 days. After that, it will be
        permanently deleted per our privacy policy.
      </Text>
    </BaseLayout>
  )
}

export default TrialEndedEmail

