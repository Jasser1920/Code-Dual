import nodemailer from 'nodemailer';

// Create a transporter using Gmail SMTP
// Note: You must provide SMTP_EMAIL and SMTP_PASSWORD in your .env file
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

/**
 * Sends a verification email to a newly registered user.
 */
export const sendVerificationEmail = async (to: string, username: string, token: string) => {
  const verificationLink = `${CLIENT_URL}/verify-email?token=${token}`;
  
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
  
  const dateOpts: Intl.DateTimeFormatOptions = { dateStyle: 'full', timeStyle: 'short' };

  const mailOptions = {
    from: `"Code-Dual" <${process.env.SMTP_EMAIL}>`,
    to,
    subject: 'Welcome to Code-Dual! Please verify your email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0c0c0f; color: #e8e8f0; border: 1px solid #1c1c22;">
        <h2 style="color: #5b4ff0; text-transform: uppercase;">Code-Dual</h2>
        <p>Hello <strong>${username}</strong>,</p>
        <p>Welcome to the arena! Before you can start dueling, please verify your email address (<strong>${to}</strong>).</p>
        
        <div style="background-color: #15151c; padding: 15px; margin: 20px 0; border-left: 4px solid #5b4ff0;">
          <p style="margin: 0 0 5px 0; font-size: 13px;"><strong>Request Time:</strong> ${now.toLocaleString('en-US', dateOpts)}</p>
          <p style="margin: 0; font-size: 13px;"><strong>Expires At:</strong> ${expiresAt.toLocaleString('en-US', dateOpts)}</p>
        </div>

        <div style="margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #5b4ff0; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">
            Verify Email
          </a>
        </div>
        <p style="font-size: 12px; color: #6b6b7e;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="font-size: 12px; color: #6b6b7e; word-break: break-all;">${verificationLink}</p>
        <hr style="border-color: #1c1c22; margin-top: 30px;" />
        <p style="font-size: 10px; color: #6b6b7e;">If you did not create an account, no further action is required.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Sends a password reset email.
 */
export const sendPasswordResetEmail = async (to: string, username: string, token: string) => {
  const resetLink = `${CLIENT_URL}/reset-password?token=${token}`;
  
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour

  const dateOpts: Intl.DateTimeFormatOptions = { dateStyle: 'full', timeStyle: 'short' };

  const mailOptions = {
    from: `"Code-Dual Support" <${process.env.SMTP_EMAIL}>`,
    to,
    subject: 'Code-Dual: Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0c0c0f; color: #e8e8f0; border: 1px solid #1c1c22;">
        <h2 style="color: #5b4ff0; text-transform: uppercase;">Code-Dual</h2>
        <p>Hello <strong>${username}</strong>,</p>
        <p>You requested a password reset for the account associated with <strong>${to}</strong>. Click the button below to choose a new password.</p>
        
        <div style="background-color: #15151c; padding: 15px; margin: 20px 0; border-left: 4px solid #5b4ff0;">
          <p style="margin: 0 0 5px 0; font-size: 13px;"><strong>Request Time:</strong> ${now.toLocaleString('en-US', dateOpts)}</p>
          <p style="margin: 0; font-size: 13px; color: #ff5555;"><strong>Link Expires At:</strong> ${expiresAt.toLocaleString('en-US', dateOpts)}</p>
        </div>

        <div style="margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #5b4ff0; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 12px; color: #6b6b7e;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="font-size: 12px; color: #6b6b7e; word-break: break-all;">${resetLink}</p>
        <hr style="border-color: #1c1c22; margin-top: 30px;" />
        <p style="font-size: 10px; color: #6b6b7e;">If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
