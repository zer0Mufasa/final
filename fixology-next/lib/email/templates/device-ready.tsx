import { Button, Section, Text } from '@react-email/components'
import { BaseLayout, styles } from './base-layout'

export interface DeviceReadyEmailProps {
  customerName: string
  deviceType: string
  ticketId: string
  shopName: string
  shopPhone: string
  shopAddress: string
  pickupUrl?: string
}

export function DeviceReadyEmail({
  customerName = 'there',
  deviceType = 'Device',
  ticketId = 'FIX-0001',
  shopName = 'Your Repair Shop',
  shopPhone = '',
  shopAddress = '',
  pickupUrl,
}: Partial<DeviceReadyEmailProps>) {
  return (
    <BaseLayout preview={`Your ${deviceType} is ready for pickup`}>
      <Text style={styles.h1}>Your device is ready</Text>

      <Text style={styles.paragraph}>Hey {customerName},</Text>

      <Text style={styles.paragraph}>
        Great news! Your <span style={styles.highlight}>{deviceType}</span> repair is complete and ready for pickup.
      </Text>

      <Section style={styles.success}>
        <Text style={styles.successText}>Repair {ticketId} — Completed</Text>
      </Section>

      <Section style={styles.card}>
        <Text style={{ ...styles.paragraph, margin: '0 0 12px', fontWeight: '600', color: '#EDE9FE' }}>Pickup</Text>
        <Text style={{ ...styles.paragraph, margin: '0 0 4px' }}>{shopName}</Text>
        {shopAddress ? <Text style={{ ...styles.paragraph, margin: '0 0 4px' }}>{shopAddress}</Text> : null}
        {shopPhone ? <Text style={{ ...styles.paragraph, margin: '0' }}>{shopPhone}</Text> : null}
      </Section>

      {pickupUrl ? (
        <Section style={{ textAlign: 'center', marginTop: '24px' }}>
          <Button href={pickupUrl} style={styles.button}>
            View Repair Details
          </Button>
        </Section>
      ) : null}

      <Text style={{ ...styles.paragraph, marginTop: '24px', fontSize: '13px', color: '#9ca3af' }}>
        Please bring a valid ID when picking up your device. Thank you for choosing {shopName}.
      </Text>
    </BaseLayout>
  )
}

export default DeviceReadyEmail

