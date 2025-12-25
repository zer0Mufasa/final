/**
 * Email utility using Resend
 * Handles all email sending with proper configuration
 */

const { Resend } = require('resend');

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
const FROM_EMAIL = 'Fixology <repair@fixologyai.com>';
const REPLY_TO_EMAIL = 'repair@fixologyai.com';

/**
 * Send contact form email
 */
async function sendContactEmail({ name, email, type, message }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set, skipping email send');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: REPLY_TO_EMAIL,
      replyTo: email, // Critical: Reply-To set to user's email
      subject: `[Fixology Contact] ${type || 'General'} - ${name}`,
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #09090B; color: #FAFAFA; padding: 40px; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <img src="https://i.ibb.co/GfPnk0zV/preview.webp" alt="Fixology" style="width: 60px; height: 60px;">
            <h1 style="font-size: 24px; margin: 16px 0 0; background: linear-gradient(135deg, #C4B5FD, #8B5CF6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">New Contact Form Submission</h1>
          </div>
          
          <div style="background: #16161A; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.08); color: #71717A; font-size: 14px;">Name</td>
                <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.08); font-weight: 600;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.08); color: #71717A; font-size: 14px;">Email</td>
                <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.08);"><a href="mailto:${email}" style="color: #A78BFA;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.08); color: #71717A; font-size: 14px;">Type</td>
                <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.08);">${type || 'Not specified'}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #71717A; font-size: 14px;">Submitted</td>
                <td style="padding: 12px 0;">${new Date().toLocaleString()}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #16161A; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 24px;">
            <h3 style="margin: 0 0 12px; font-size: 14px; color: #71717A;">Message</h3>
            <p style="margin: 0; line-height: 1.6; white-space: pre-wrap;">${message.replace(/\n/g, '<br>')}</p>
          </div>
          
          <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.08);">
            <p style="margin: 0; font-size: 12px; color: #52525B;">
              Reply directly to this email to respond to ${name}
            </p>
          </div>
        </div>
      `
    });

    console.log('Contact email sent via Resend:', result.data?.id);
    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error('Resend email error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail({ email, token }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set, skipping email send');
    return { success: false, error: 'Email service not configured' };
  }

  const resetLink = `https://fixologyai.com/reset-password.html?token=${token}`;

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      replyTo: REPLY_TO_EMAIL,
      subject: 'Reset your Fixology password',
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #09090B; color: #FAFAFA; padding: 40px; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <img src="https://i.ibb.co/GfPnk0zV/preview.webp" alt="Fixology" style="width: 60px; height: 60px;">
            <h1 style="font-size: 24px; margin: 16px 0 0;">Reset your password</h1>
          </div>
          
          <p style="color: #A1A1AA; line-height: 1.6;">We received a request to reset your password. Click the button below to create a new password:</p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetLink}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #A78BFA, #8B5CF6); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3);">Reset Password</a>
          </div>
          
          <p style="color: #71717A; font-size: 14px; line-height: 1.6;">Or copy and paste this link into your browser:</p>
          <p style="color: #A78BFA; font-size: 14px; word-break: break-all; margin: 8px 0 24px;">${resetLink}</p>
          
          <div style="background: #16161A; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0; font-size: 13px; color: #71717A;">
              <strong style="color: #FAFAFA;">⚠️ Security Notice:</strong><br>
              This link expires in 15 minutes. If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.08);">
            <p style="margin: 0; font-size: 12px; color: #52525B;">
              Fixology - The Intelligence Layer for Device Repair<br>
              <a href="mailto:repair@fixologyai.com" style="color: #A78BFA;">repair@fixologyai.com</a>
            </p>
          </div>
        </div>
      `
    });

    console.log('Password reset email sent via Resend:', result.data?.id);
    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error('Resend email error:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendContactEmail,
  sendPasswordResetEmail
};
