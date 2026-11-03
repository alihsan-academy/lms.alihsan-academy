import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY
const resend = resendApiKey ? new Resend(resendApiKey) : null

// Default from email: can be customized via RESEND_FROM_EMAIL env var
// e.g. "Al-Ihsan Academy <admissions@alihsan.academy>" or "Al-Ihsan Academy <onboarding@resend.dev>"
const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || 'Al-Ihsan Academy <onboarding@resend.dev>'

export interface WelcomeCredentialsEmailParams {
  email: string
  name: string
  role: 'student' | 'teacher' | 'admin' | string
  temporaryPassword: string
  registrationNumber?: string | null
  year?: string | null
  term?: string | null
  loginPath?: string
  siteUrl?: string
}

export async function sendWelcomeCredentialsEmail(params: WelcomeCredentialsEmailParams): Promise<{
  success: boolean
  id?: string
  skipped?: boolean
  error?: string
}> {
  const {
    email,
    name,
    role,
    temporaryPassword,
    registrationNumber,
    year,
    term,
    loginPath = role === 'student' ? '/student/login' : role === 'teacher' ? '/teacher/login' : '/portal-superadmin/login',
    siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://learn.alihsanacademy.uk'
  } = params

  if (!resend) {
    console.warn('[Resend] RESEND_API_KEY is not configured. Automated email was skipped.')
    return {
      success: false,
      skipped: true,
      error: 'RESEND_API_KEY is not configured in environment variables.'
    }
  }

  const cleanEmail = email.trim().toLowerCase()
  const cleanSiteUrl = siteUrl.replace(/\/$/, '')
  const fullLoginUrl = `${cleanSiteUrl}${loginPath}`
  const logoUrl = `${cleanSiteUrl}/alihsan-brand-logo.jpg`
  const roleDisplay = role === 'student' ? 'Student' : role === 'teacher' ? 'Educator' : 'Administrator'

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Al-Ihsan Academy of Moral Education</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      color: #0f172a;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      max-width: 580px;
      margin: 0 auto;
      padding: 40px 16px;
    }
    .card {
      background-color: #ffffff;
      border-radius: 14px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
    }
    .header {
      background-color: #000000;
      padding: 36px 32px 28px 32px;
      text-align: center;
      border-bottom: 2px solid #1e293b;
    }
    .logo-img {
      display: block;
      margin: 0 auto;
      max-width: 170px;
      width: 170px;
      height: auto;
    }
    .header-title {
      margin: 14px 0 0 0;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 1.8px;
      text-transform: uppercase;
      color: #cbd5e1;
    }
    .header-sub {
      margin: 4px 0 0 0;
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      color: #94a3b8;
    }
    .content {
      padding: 36px 32px;
    }
    .badge {
      display: inline-block;
      background-color: #f1f5f9;
      color: #047857;
      border: 1px solid #e2e8f0;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      padding: 4px 10px;
      border-radius: 6px;
      margin-bottom: 16px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 8px;
      line-height: 1.3;
    }
    .intro {
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
      margin-top: 0;
      margin-bottom: 26px;
    }
    .creds-container {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px 22px;
      margin-bottom: 28px;
    }
    .creds-header {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #64748b;
      margin-bottom: 14px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
    }
    .cred-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      font-size: 13px;
    }
    .cred-row:not(:last-child) {
      border-bottom: 1px solid #f1f5f9;
    }
    .cred-label {
      color: #64748b;
      font-weight: 500;
    }
    .cred-value {
      color: #0f172a;
      font-weight: 600;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      text-align: right;
    }
    .cred-password {
      color: #047857;
      background-color: #ffffff;
      padding: 3px 8px;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .button-container {
      text-align: center;
      margin: 28px 0 32px 0;
    }
    .button {
      display: inline-block;
      background-color: #047857;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      padding: 13px 34px;
      border-radius: 8px;
      letter-spacing: 0.2px;
    }
    .guide-box {
      border-top: 1px solid #f1f5f9;
      padding-top: 22px;
      margin-bottom: 24px;
    }
    .guide-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #64748b;
      margin-bottom: 10px;
    }
    .guide-list {
      margin: 0;
      padding-left: 18px;
      font-size: 13px;
      color: #475569;
      line-height: 1.6;
    }
    .guide-list li {
      margin-bottom: 4px;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      padding: 24px 20px 0 20px;
      border-top: 1px solid #f1f5f9;
      line-height: 1.6;
    }
    .footer strong {
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <img src="${logoUrl}" alt="Al-Ihsan Academy" class="logo-img" />
        <div class="header-title">Al-Ihsan Academy of Moral Education</div>
        <div class="header-sub">Learning Management System</div>
      </div>

      <div class="content">
        <span class="badge">${roleDisplay} Portal</span>
        <div class="greeting">Assalamu Alaikum wa Rahmatullah, ${name}</div>
        <p class="intro">
          Welcome to Al-Ihsan Academy of Moral Education. Your account has been provisioned on the LMS portal. Use the confidential credentials below to access your classes and academic schedule:
        </p>

        <div class="creds-container">
          <div class="creds-header">Account Login Credentials</div>

          ${registrationNumber ? `
          <div class="cred-row">
            <span class="cred-label">Student ID</span>
            <span class="cred-value">${registrationNumber}</span>
          </div>` : ''}

          <div class="cred-row">
            <span class="cred-label">Login Email</span>
            <span class="cred-value">${cleanEmail}</span>
          </div>

          <div class="cred-row">
            <span class="cred-label">Temporary Password</span>
            <span class="cred-value cred-password">${temporaryPassword}</span>
          </div>

          ${year ? `
          <div class="cred-row">
            <span class="cred-label">Academic Year / Class</span>
            <span class="cred-value">${year}</span>
          </div>` : ''}

          ${term ? `
          <div class="cred-row">
            <span class="cred-label">Term</span>
            <span class="cred-value">${term}</span>
          </div>` : ''}
        </div>

        <div class="button-container">
          <a href="${fullLoginUrl}" class="button" target="_blank">
            Log In to ${roleDisplay} Portal &rarr;
          </a>
        </div>

        <div class="guide-box">
          <div class="guide-title">Next Steps</div>
          <ol class="guide-list">
            <li>Open the login portal at <a href="${fullLoginUrl}" style="color: #047857; text-decoration: none; font-weight: 600;">${fullLoginUrl}</a>.</li>
            <li>Sign in using your registered email and temporary password.</li>
            <li>Upon your first sign-in, navigate to <strong>Profile Settings</strong> to update your password.</li>
          </ol>
        </div>

        <div class="footer">
          <p><strong>Al-Ihsan Academy of Moral Education</strong><br>Building a Generation for Tomorrow</p>
          <p style="margin-top: 8px; font-size: 11px;">This is an automated notification. If you have questions, please reply directly to this email.</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `

  const textContent = `
Assalamu Alaikum wa Rahmatullah, ${name}

Welcome to Al-Ihsan Academy of Moral Education.
Your ${roleDisplay} Portal account has been created on the LMS platform.

YOUR LOGIN CREDENTIALS:
• Portal URL: ${fullLoginUrl}
• Registered Email: ${cleanEmail}
${registrationNumber ? `• Student ID: ${registrationNumber}\n` : ''}• Temporary Password: ${temporaryPassword}
${year ? `• Class / Year: ${year}\n` : ''}${term ? `• Term: ${term}\n` : ''}
NEXT STEPS:
1. Visit ${fullLoginUrl}
2. Log in using your email and temporary password.
3. Update your password upon first login from your profile settings.

Warm regards,
Al-Ihsan Academy of Moral Education
Building a Generation for Tomorrow
  `.trim()

  try {
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: [cleanEmail],
      replyTo: process.env.RESEND_REPLY_TO || undefined,
      subject: `Welcome to Al-Ihsan Academy – Your LMS Login Credentials (${name})`,
      html: htmlContent,
      text: textContent,
    })

    if (error) {
      console.error('[Resend] Error sending welcome email:', error)
      return { success: false, error: error.message }
    }

    console.log('[Resend] Welcome credentials email sent successfully:', data?.id)
    return { success: true, id: data?.id }
  } catch (err: any) {
    console.error('[Resend] Fatal dispatch error:', err)
    return { success: false, error: err?.message || 'Unknown email dispatch error' }
  }
}
