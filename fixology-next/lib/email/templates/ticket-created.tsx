import { Button, Section, Text } from '@react-email/components'
import { BaseLayout, styles } from './base-layout'

export interface TicketCreatedEmailProps {
  customerName: string
  ticketNumber: string
  deviceType: string
  deviceBrand: string
  issueSummary: string
  shopName: string
  dashboardUrl?: string
}

export function TicketCreatedEmail({
  customerName = 'there',
  ticketNumber = 'FIX-0001',
  deviceType = 'Device',
  deviceBrand = 'Brand',
  issueSummary = 'Repair request received',
  shopName = 'Your Repair Shop',
  dashboardUrl,
}: Partial<TicketCreatedEmailProps>) {
  return (
    <BaseLayout preview={`Ticket ${ticketNumber} created for your ${deviceBrand} ${deviceType}`}>
      <Text style={styles.h1}>We received your ticket</Text>

      <Text style={styles.paragraph}>Hey {customerName},</Text>

      <Text style={styles.paragraph}>
        Thanks for choosing <span style={styles.highlight}>{shopName}</span>. We&apos;ve received your repair request.
      </Text>

      <Section style={styles.card}>
        <Text style={{ ...styles.paragraph, margin: '0 0 8px' }}>
          <strong style={{ color: '#EDE9FE' }}>Ticket:</strong> {ticketNumber}
        </Text>
        <Text style={{ ...styles.paragraph, margin: '0 0 8px' }}>
          <strong style={{ color: '#EDE9FE' }}>Device:</strong> {deviceBrand} {deviceType}
        </Text>
        <Text style={{ ...styles.paragraph, margin: '0' }}>
          <strong style={{ color: '#EDE9FE' }}>Issue:</strong> {issueSummary}
        </Text>
      </Section>

      {dashboardUrl ? (
        <Section style={{ textAlign: 'center', marginTop: '24px' }}>
          <Button href={dashboardUrl} style={styles.buttonSecondary}>
            View Status
          </Button>
        </Section>
      ) : null}

      <Text style={{ ...styles.paragraph, marginTop: '24px', fontSize: '13px', color: '#9ca3af' }}>
        We&apos;ll keep you updated as your repair moves forward.
      </Text>
    </BaseLayout>
  )
}

export default TicketCreatedEmail

