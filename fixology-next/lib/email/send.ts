import { Resend } from 'resend'
import React, { type ReactElement } from 'react'

import { WelcomeEmail, type WelcomeEmailProps } from './templates/welcome'
import { EmailVerificationEmail, type EmailVerificationEmailProps } from './templates/email-verification'
import { PasswordResetEmail, type PasswordResetEmailProps } from './templates/password-reset'
import { TrialEndingEmail, type TrialEndingEmailProps } from './templates/trial-ending'
import { TrialEndedEmail, type TrialEndedEmailProps } from './templates/trial-ended'
import { PaymentSuccessEmail, type PaymentSuccessEmailProps } from './templates/payment-success'
import { PaymentFailedEmail, type PaymentFailedEmailProps } from './templates/payment-failed'
import { SubscriptionCancelledEmail, type SubscriptionCancelledEmailProps } from './templates/subscription-cancelled'
import { TicketCreatedEmail, type TicketCreatedEmailProps } from './templates/ticket-created'
import { DeviceReadyEmail, type DeviceReadyEmailProps } from './templates/device-ready'

export type SendEmailParams = {
  to: string | string[]
  subject: string
  text: string
  html?: string
  react?: ReactElement
  from?: string
  replyTo?: string
  tags?: Array<{ name: string; value: string }>
}

export type SendEmailResult = { ok: true; id?: string } | { ok: false; error: string }

export type EmailTemplate =
  | { type: 'welcome'; data: WelcomeEmailProps }
  | { type: 'email-verification'; data: EmailVerificationEmailProps }
  | { type: 'password-reset'; data: PasswordResetEmailProps }
  | { type: 'trial-ending'; data: TrialEndingEmailProps }
  | { type: 'trial-ended'; data: TrialEndedEmailProps }
  | { type: 'payment-success'; data: PaymentSuccessEmailProps }
  | { type: 'payment-failed'; data: PaymentFailedEmailProps }
  | { type: 'subscription-cancelled'; data: SubscriptionCancelledEmailProps }
  | { type: 'ticket-created'; data: TicketCreatedEmailProps }
  | { type: 'device-ready'; data: DeviceReadyEmailProps }

function getDefaultFrom() {
  return process.env.RESEND_FROM_EMAIL || process.env.CONTACT_FROM || 'noreply@fixology.ai'
}

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY)
}

function getEmailComponent(template: EmailTemplate): ReactElement {
  switch (template.type) {
    case 'welcome':
      return React.createElement(WelcomeEmail, template.data)
    case 'email-verification':
      return React.createElement(EmailVerificationEmail, template.data)
    case 'password-reset':
      return React.createElement(PasswordResetEmail, template.data)
    case 'trial-ending':
      return React.createElement(TrialEndingEmail, template.data)
    case 'trial-ended':
      return React.createElement(TrialEndedEmail, template.data)
    case 'payment-success':
      return React.createElement(PaymentSuccessEmail, template.data)
    case 'payment-failed':
      return React.createElement(PaymentFailedEmail, template.data)
    case 'subscription-cancelled':
      return React.createElement(SubscriptionCancelledEmail, template.data)
    case 'ticket-created':
      return React.createElement(TicketCreatedEmail, template.data)
    case 'device-ready':
      return React.createElement(DeviceReadyEmail, template.data)
    default:
      throw new Error(`Unknown email template type: ${(template as any)?.type}`)
  }
}

function getSubject(template: EmailTemplate): string {
  switch (template.type) {
    case 'welcome':
      return `Welcome to Fixology, ${template.data.ownerName}!`
    case 'email-verification':
      return 'Verify your Fixology email'
    case 'password-reset':
      return 'Reset your Fixology password'
    case 'trial-ending':
      return `Your trial ends in ${template.data.daysLeft} days`
    case 'trial-ended':
      return 'Your Fixology trial has ended'
    case 'payment-success':
      return `Payment received - ${template.data.amount}`
    case 'payment-failed':
      return 'Action needed: Payment failed'
    case 'subscription-cancelled':
      return 'Subscription cancelled'
    case 'ticket-created':
      return `We received your ticket (${template.data.ticketNumber})`
    case 'device-ready':
      return `Your ${template.data.deviceType} is ready for pickup`
    default:
      return 'Fixology notification'
  }
}

function getTextFallback(template: EmailTemplate): string {
  // Keep it simple for deliverability; full content is in the HTML/react template.
  switch (template.type) {
    case 'welcome':
      return `Welcome to Fixology, ${template.data.ownerName}! Your trial starts now.`
    case 'email-verification':
      return `Verify your email: ${template.data.verifyUrl}`
    case 'password-reset':
      return `Reset your password: ${template.data.resetUrl}`
    case 'trial-ending':
      return `Your Fixology trial ends in ${template.data.daysLeft} days. Upgrade: ${template.data.billingUrl}`
    case 'trial-ended':
      return `Your Fixology trial has ended. Reactivate: ${template.data.billingUrl}`
    case 'payment-success':
      return `Payment received (${template.data.amount}). Dashboard: ${template.data.dashboardUrl}`
    case 'payment-failed':
      return `Payment failed (${template.data.amount}). Update billing: ${template.data.billingUrl}`
    case 'subscription-cancelled':
      return `Your subscription has been cancelled (${template.data.effectiveDate}). Manage billing: ${template.data.billingUrl}`
    case 'ticket-created':
      return `Ticket ${template.data.ticketNumber} created for ${template.data.deviceBrand} ${template.data.deviceType}.`
    case 'device-ready':
      return `Your ${template.data.deviceType} is ready for pickup at ${template.data.shopName}.`
    default:
      return 'Fixology notification'
  }
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult>
export async function sendEmail(
  to: string | string[],
  template: EmailTemplate,
  options?: Pick<SendEmailParams, 'from' | 'replyTo' | 'tags'>
): Promise<SendEmailResult>
export async function sendEmail(
  arg1: SendEmailParams | string | string[],
  arg2?: EmailTemplate,
  arg3?: Pick<SendEmailParams, 'from' | 'replyTo' | 'tags'>
): Promise<SendEmailResult> {
  const params: SendEmailParams =
    typeof arg1 === 'string' || Array.isArray(arg1)
      ? {
          to: arg1,
          subject: getSubject(arg2 as EmailTemplate),
          text: getTextFallback(arg2 as EmailTemplate),
          react: getEmailComponent(arg2 as EmailTemplate),
          from: arg3?.from,
          replyTo: arg3?.replyTo,
          tags: arg3?.tags,
        }
      : arg1

  const from = params.from || getDefaultFrom()
  const to = params.to
  const subject = params.subject
  const text = params.text

  if (!process.env.RESEND_API_KEY) {
    // Non-fatal in dev: log instead of hard failing.
    console.warn('[email] RESEND_API_KEY missing; skipping send', { to, subject })
    return { ok: false, error: 'Email service not configured (RESEND_API_KEY missing)' }
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const res = await resend.emails.send({
      from,
      to,
      subject,
      text,
      html: params.html,
      react: (params as any).react,
      replyTo: params.replyTo,
      tags: params.tags,
    })

    const id = (res as any)?.data?.id || (res as any)?.id
    return { ok: true, id }
  } catch (err: any) {
    console.error('[email] send failed', err)
    return { ok: false, error: err?.message || 'Failed to send email' }
  }
}

// Convenience wrappers (transactional lifecycle emails)
export const sendWelcomeEmail = (to: string | string[], data: WelcomeEmailProps) =>
  sendEmail(to, { type: 'welcome', data })

export const sendEmailVerificationEmail = (to: string | string[], data: EmailVerificationEmailProps) =>
  sendEmail(to, { type: 'email-verification', data })

export const sendPasswordResetEmail = (to: string | string[], data: PasswordResetEmailProps) =>
  sendEmail(to, { type: 'password-reset', data })

export const sendTrialEndingEmail = (to: string | string[], data: TrialEndingEmailProps) =>
  sendEmail(to, { type: 'trial-ending', data })

export const sendTrialEndedEmail = (to: string | string[], data: TrialEndedEmailProps) =>
  sendEmail(to, { type: 'trial-ended', data })

export const sendPaymentSuccessEmail = (to: string | string[], data: PaymentSuccessEmailProps) =>
  sendEmail(to, { type: 'payment-success', data })

export const sendPaymentFailedEmail = (to: string | string[], data: PaymentFailedEmailProps) =>
  sendEmail(to, { type: 'payment-failed', data })

export const sendSubscriptionCancelledEmail = (to: string | string[], data: SubscriptionCancelledEmailProps) =>
  sendEmail(to, { type: 'subscription-cancelled', data })

export const sendTicketCreatedEmail = (to: string | string[], data: TicketCreatedEmailProps) =>
  sendEmail(to, { type: 'ticket-created', data })

export const sendDeviceReadyEmail = (to: string | string[], data: DeviceReadyEmailProps) =>
  sendEmail(to, { type: 'device-ready', data })

