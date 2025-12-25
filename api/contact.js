/**
 * Contact Form API Endpoint
 * Sends contact form submissions to repair@fixologyai.com via Resend
 */

const { handleCors, sendSuccess, sendError } = require('./lib/utils');
const { sendContactEmail } = require('./lib/email');

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

    // Send email via Resend
    const emailResult = await sendContactEmail({ name, email, type, message });
    
    if (!emailResult.success) {
      console.error('Failed to send contact email:', emailResult.error);
      // Continue anyway - we still want to return success to user
    }

    return sendSuccess(res, {
      message: 'Contact form submitted successfully',
      email: 'repair@fixologyai.com'
    });

  } catch (err) {
    console.error('Contact form error:', err.message);
    return sendError(res, 'Failed to submit contact form', 500);
  }
};
