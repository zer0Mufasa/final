/**
 * Contact Form API Endpoint
 * Sends contact form submissions to repair@fixologyai.com
 */

const { handleCors, sendSuccess, sendError } = require('../lib/utils');

// Business email configuration
const BUSINESS_EMAIL = process.env.BUSINESS_EMAIL || 'repair@fixologyai.com';
const EMAIL_FROM = process.env.EMAIL_FROM || '"Fixology" <repair@fixologyai.com>';

module.exports = async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return sendError(res, 'Method not allowed', 405);
  }

  try {
    const { name, email, type, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return sendError(res, 'Name, email, and message are required', 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendError(res, 'Invalid email format', 400);
    }

    // Log the contact submission
    console.log('Contact form submission:', {
      name,
      email,
      type: type || 'other',
      timestamp: new Date().toISOString()
    });

    // Try to send email if nodemailer is configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      try {
        const nodemailer = require('nodemailer');
        
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST || 'mail.privateemail.com',
          port: parseInt(process.env.EMAIL_PORT) || 465,
          secure: true,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
          }
        });

        // Send email to business
        await transporter.sendMail({
          from: EMAIL_FROM,
          to: BUSINESS_EMAIL,
          replyTo: email,
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
                <p style="margin: 0; line-height: 1.6; white-space: pre-wrap;">${message}</p>
              </div>
              
              <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.08);">
                <p style="margin: 0; font-size: 12px; color: #52525B;">
                  Reply directly to this email to respond to ${name}
                </p>
              </div>
            </div>
          `
        });

        // Send confirmation to user
        await transporter.sendMail({
          from: EMAIL_FROM,
          to: email,
          subject: 'We received your message - Fixology',
          html: `
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #09090B; color: #FAFAFA; padding: 40px; border-radius: 16px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <img src="https://i.ibb.co/GfPnk0zV/preview.webp" alt="Fixology" style="width: 60px; height: 60px;">
                <h1 style="font-size: 24px; margin: 16px 0 0;">Thanks for reaching out!</h1>
              </div>
              
              <p style="color: #A1A1AA; line-height: 1.6;">Hi ${name},</p>
              <p style="color: #A1A1AA; line-height: 1.6;">We've received your message and will get back to you within 24 hours.</p>
              
              <div style="background: #16161A; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 24px; margin: 24px 0;">
                <h3 style="margin: 0 0 12px; font-size: 14px; color: #71717A;">Your message:</h3>
                <p style="margin: 0; line-height: 1.6; white-space: pre-wrap;">${message}</p>
              </div>
              
              <p style="color: #A1A1AA; line-height: 1.6;">In the meantime, you can also chat with our AI assistant at <a href="https://fixologyai.com/ai.html" style="color: #A78BFA;">fixologyai.com/ai</a> for instant help.</p>
              
              <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.08);">
                <p style="margin: 0; font-size: 12px; color: #52525B;">
                  Fixology - The Intelligence Layer for Device Repair<br>
                  <a href="mailto:repair@fixologyai.com" style="color: #A78BFA;">repair@fixologyai.com</a>
                </p>
              </div>
            </div>
          `
        });

        console.log('Contact emails sent successfully');
      } catch (emailError) {
        console.error('Email sending failed:', emailError.message);
        // Continue anyway - we still want to return success
      }
    }

    return sendSuccess(res, {
      message: 'Contact form submitted successfully',
      email: BUSINESS_EMAIL
    });

  } catch (err) {
    console.error('Contact form error:', err.message);
    return sendError(res, 'Failed to submit contact form', 500);
  }
};

