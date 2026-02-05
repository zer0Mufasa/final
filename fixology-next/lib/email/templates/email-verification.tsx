import { Button, Section, Text } from '@react-email/components'
import { BaseLayout, styles } from './base-layout'

export interface EmailVerificationEmailProps {
  ownerName: string
  verifyUrl: string
  expiresIn: string
}

export function EmailVerificationEmail({
  ownerName = 'there',
  verifyUrl = 'https://fixologyai.com/verify-email?token=xxx',
  expiresIn = '24 hours',
}: Partial<EmailVerificationEmailProps>) {
  return (
    <BaseLayout preview="Verify your Fixology email">
      <Text style={styles.h1}>Verify your email</Text>

      <Text style={styles.paragraph}>Hey {ownerName},</Text>

      <Text style={styles.paragraph}>
        Please verify your email address to finish setting up your Fixology account.
      </Text>

      <Section style={{ textAlign: 'center', margin: '28px 0' }}>
        <Button href={verifyUrl} style={styles.button}>
          Verify Email →
        </Button>
      </Section>

      <Section style={styles.warning}>
        <Text style={styles.warningText}>This link expires in {expiresIn}.</Text>
      </Section>

      <Text style={{ ...styles.paragraph, fontSize: '13px', color: '#9ca3af' }}>
        If you didn&apos;t create a Fixology account, you can ignore this email.
      </Text>
    </BaseLayout>
  )
}

export default EmailVerificationEmail

