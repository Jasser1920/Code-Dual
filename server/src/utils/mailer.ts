import nodemailer from 'nodemailer'
import { Resend } from 'resend'

// 1. Resend API Setup
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

// 2. Nodemailer (Gmail SMTP) Setup - Free, no recipient limits, works for any email address!
const smtpTransporter =
  process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD
    ? nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_EMAIL,
          pass: process.env.SMTP_PASSWORD,
        },
      })
    : null

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'

/**
 * Universal email dispatcher:
 * - Tries Gmail SMTP (Nodemailer) first if credentials are set.
 * - Falls back to Resend API if configured.
 */
async function sendMailPayload({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  // Option 1: Gmail SMTP via Nodemailer
  if (smtpTransporter) {
    try {
      await smtpTransporter.sendMail({
        from: `"Code-Dual" <${process.env.SMTP_EMAIL}>`,
        to,
        subject,
        html,
      })
      console.log(`✅ [Gmail SMTP] Email delivered to ${to}`)
      return
    } catch (err: any) {
      console.error(`❌ [Gmail SMTP Error]:`, err?.message || err)
    }
  }

  // Option 2: Resend API
  if (resend) {
    try {
      const { error } = await resend.emails.send({
        from: 'Code-Dual <onboarding@resend.dev>',
        to,
        subject,
        html,
      })

      if (error) {
        console.error('❌ [Resend API Error]:', JSON.stringify(error, null, 2))
      } else {
        console.log(`✅ [Resend API] Email delivered to ${to}`)
      }
      return
    } catch (err: any) {
      console.error('❌ [Resend Error]:', err?.message || err)
    }
  }

  console.warn(
    '⚠️ No active mailer configured (SMTP_EMAIL or RESEND_API_KEY). Email was not sent over network.'
  )
}

/**
 * Sends a verification email to a newly registered user.
 */
export const sendVerificationEmail = async (
  to: string,
  username: string,
  token: string
) => {
  const verificationLink = `${CLIENT_URL}/verify-email?token=${token}`
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours

  // Always log verification link for local development & testing
  console.log(`\n==================================================`)
  console.log(`✉️  LOCAL VERIFICATION LINK (@${username} -> ${to}):`)
  console.log(`👉  ${verificationLink}`)
  console.log(`==================================================\n`)

  const dateOpts: Intl.DateTimeFormatOptions = {
    dateStyle: 'full',
    timeStyle: 'short',
  }

  const htmlContent = `
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
  `

  await sendMailPayload({
    to,
    subject: 'Welcome to Code-Dual! Please verify your email',
    html: htmlContent,
  })
}

/**
 * Sends a password reset email.
 */
export const sendPasswordResetEmail = async (
  to: string,
  username: string,
  token: string
) => {
  const resetLink = `${CLIENT_URL}/reset-password?token=${token}`

  // Always log password reset link for local development & testing
  console.log(`\n==================================================`)
  console.log(`🔑  LOCAL PASSWORD RESET LINK (@${username} -> ${to}):`)
  console.log(`👉  ${resetLink}`)
  console.log(`==================================================\n`)

  const now = new Date()
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000) // 1 hour

  const dateOpts: Intl.DateTimeFormatOptions = {
    dateStyle: 'full',
    timeStyle: 'short',
  }

  const htmlContent = `
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
  `

  await sendMailPayload({
    to,
    subject: 'Code-Dual: Password Reset Request',
    html: htmlContent,
  })
}

/**
 * Sends a notification email to accepted tournament participants when brackets generate.
 */
export const sendTournamentStartEmail = async (
  to: string,
  username: string,
  tournamentTitle: string,
  minutesRemaining = 15
) => {
  const arenaLink = `${CLIENT_URL}/tournaments`

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0c0c0f; color: #e8e8f0; border: 1px solid #1c1c22;">
      <h2 style="color: #00ffcc; text-transform: uppercase; margin-bottom: 5px;">Code-Dual Arena</h2>
      <p style="color: #a8a8b3; font-size: 14px; margin-top: 0;">Tournament Bracket Launch Notice</p>
      
      <p>Hello <strong>${username}</strong>,</p>
      <p>Your application for <strong>${tournamentTitle}</strong> has been approved! The elimination brackets have been generated.</p>
      
      <div style="background-color: #15151c; padding: 15px; margin: 20px 0; border-left: 4px solid #00ffcc;">
        <p style="margin: 0; font-size: 16px; color: #00ffcc;"><strong>⚡ TOURNAMENT STARTS IN ${minutesRemaining} MINUTES!</strong></p>
        <p style="margin: 5px 0 0 0; font-size: 13px; color: #a8a8b3;">Please log in now to join your match room. Matches will begin automatically.</p>
      </div>

      <div style="margin: 30px 0;">
        <a href="${arenaLink}" style="background-color: #00ffcc; color: #0c0c0f; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">
          Enter Tournament Arena
        </a>
      </div>
      <hr style="border-color: #1c1c22; margin-top: 30px;" />
      <p style="font-size: 10px; color: #6b6b7e;">You received this email because you are registered for a live tournament on Code-Dual.</p>
    </div>
  `

  await sendMailPayload({
    to,
    subject: `⚡ TOURNAMENT ALERT: ${tournamentTitle} Starts in ${minutesRemaining} Mins!`,
    html: htmlContent,
  })
}
