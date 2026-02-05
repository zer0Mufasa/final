import { Button, Section, Text } from '@react-email/components'
import { BaseLayout, styles } from './base-layout'

export interface PaymentSuccessEmailProps {
  shopName: string
  ownerName: string
  planName: string
  amount: string
  nextBillingDate: string
  invoiceUrl?: string
  dashboardUrl: string
}

export function PaymentSuccessEmail({
  shopName = 'Your Shop',
  ownerName = 'there',
  planName = 'Starter',
  amount = '$99.00',
  nextBillingDate = 'March 1, 2026',
  invoiceUrl,
  dashboardUrl = 'https://fixologyai.com/dashboard',
}: Partial<PaymentSuccessEmailProps>) {
  return (
    <BaseLayout preview={`Payment received - ${amount} for Fixology ${planName}`}>
      <Text style={styles.h1}>Payment successful</Text>

      <Text style={styles.paragraph}>Hey {ownerName},</Text>

      <Text style={styles.paragraph}>
        Thanks for your payment! Your <span style={styles.highlight}>{planName}</span> subscription for{' '}
        <span style={styles.highlight}>{shopName}</span> is active.
      </Text>

      <Section style={styles.card}>
        <Text style={{ ...styles.paragraph, margin: '0 0 8px' }}>
          <strong style={{ color: '#EDE9FE' }}>Plan:</strong> {planName}
        </Text>
        <Text style={{ ...styles.paragraph, margin: '0 0 8px' }}>
          <strong style={{ color: '#EDE9FE' }}>Amount:</strong> {amount}
        </Text>
        <Text style={{ ...styles.paragraph, margin: '0' }}>
          <strong style={{ color: '#EDE9FE' }}>Next billing:</strong> {nextBillingDate}
        </Text>
      </Section>

      <Section style={{ textAlign: 'center', marginTop: '24px' }}>
        <Button href={dashboardUrl} style={styles.button}>
          Go to Dashboard
        </Button>
        {invoiceUrl ? (
          <>
            <Text style={{ color: '#9ca3af', margin: '12px 0' }}>or</Text>
            <Button href={invoiceUrl} style={styles.buttonSecondary}>
              View Invoice
            </Button>
          </>
        ) : null}
      </Section>

      <Text style={{ ...styles.paragraph, marginTop: '24px', fontSize: '13px', color: '#9ca3af' }}>
        Manage your subscription anytime in Settings → Billing.
      </Text>
    </BaseLayout>
  )
}

export default PaymentSuccessEmail

