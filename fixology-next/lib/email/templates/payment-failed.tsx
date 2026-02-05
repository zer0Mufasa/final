import { Button, Section, Text } from '@react-email/components'
import { BaseLayout, styles } from './base-layout'

export interface PaymentFailedEmailProps {
  shopName: string
  ownerName: string
  amount: string
  lastFour: string
  retryDate: string
  billingUrl: string
}

export function PaymentFailedEmail({
  shopName = 'Your Shop',
  ownerName = 'there',
  amount = '$99.00',
  lastFour = '4242',
  retryDate = 'in 3 days',
  billingUrl = 'https://fixologyai.com/settings/billing',
}: Partial<PaymentFailedEmailProps>) {
  return (
    <BaseLayout preview={`Action needed: Payment failed for ${shopName}`}>
      <Text style={styles.h1}>Payment failed</Text>

      <Text style={styles.paragraph}>Hey {ownerName},</Text>

      <Text style={styles.paragraph}>
        We couldn&apos;t process your payment of <span style={styles.highlight}>{amount}</span> for{' '}
        <span style={styles.highlight}>{shopName}</span>.
      </Text>

      <Section style={styles.error}>
        <Text style={styles.errorText}>Card ending in {lastFour} was declined</Text>
      </Section>

      <Text style={styles.paragraph}>
        Don&apos;t worry — your account is still active. We&apos;ll automatically retry {retryDate}. To avoid any
        interruption, please update your payment method.
      </Text>

      <Section style={{ textAlign: 'center', marginTop: '24px' }}>
        <Button href={billingUrl} style={styles.button}>
          Update Payment Method →
        </Button>
      </Section>

      <Section style={styles.card}>
        <Text style={{ ...styles.paragraph, margin: '0 0 8px', fontWeight: '600', color: '#EDE9FE' }}>
          Common reasons for failed payments:
        </Text>
        <Text style={{ ...styles.paragraph, margin: '0 0 4px', fontSize: '13px' }}>• Insufficient funds</Text>
        <Text style={{ ...styles.paragraph, margin: '0 0 4px', fontSize: '13px' }}>• Card expired</Text>
        <Text style={{ ...styles.paragraph, margin: '0 0 4px', fontSize: '13px' }}>• Bank security block</Text>
        <Text style={{ ...styles.paragraph, margin: '0', fontSize: '13px' }}>• Incorrect billing address</Text>
      </Section>

      <Text style={{ ...styles.paragraph, marginTop: '16px', fontSize: '13px', color: '#9ca3af' }}>
        If your payment fails multiple times, your account may be paused. Don&apos;t lose access to your data.
      </Text>
    </BaseLayout>
  )
}

export default PaymentFailedEmail

