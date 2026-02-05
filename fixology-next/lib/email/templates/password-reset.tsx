import { Button, Section, Text } from '@react-email/components'
import { BaseLayout, styles } from './base-layout'

export interface PasswordResetEmailProps {
  ownerName: string
  resetUrl: string
  expiresIn: string
}

export function PasswordResetEmail({
  ownerName = 'there',
  resetUrl = 'https://fixologyai.com/reset-password?token=xxx',
  expiresIn = '1 hour',
}: Partial<PasswordResetEmailProps>) {
  return (
    <BaseLayout preview="Reset your Fixology password">
      <Text style={styles.h1}>Reset your password</Text>

      <Text style={styles.paragraph}>Hey {ownerName},</Text>

      <Text style={styles.paragraph}>
        We received a request to reset your password. Click the button below to create a new one.
      </Text>

      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button href={resetUrl} style={styles.button}>
          Reset Password →
        </Button>
      </Section>

      <Section style={styles.warning}>
        <Text style={styles.warningText}>This link expires in {expiresIn}.</Text>
      </Section>

      <Text style={{ ...styles.paragraph, fontSize: '13px', color: '#9ca3af' }}>
        If you didn&apos;t request this, you can safely ignore this email. Your password won&apos;t be changed.
      </Text>

      <Text style={{ ...styles.paragraph, marginTop: '16px', fontSize: '12px', color: '#6b7280' }}>
        For security, this request was received from a web browser. If this wasn&apos;t you, please contact support
        immediately.
      </Text>
    </BaseLayout>
  )
}

export default PasswordResetEmail

