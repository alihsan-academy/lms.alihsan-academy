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
    loginPath = role === 'student' ? '/student/login' : role === 'teacher' ? '/teacher/login' : '/admin/login',
    siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://alihsan-lms.vercel.app'
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
  const fullLoginUrl = `${siteUrl.replace(/\/$/, '')}${loginPath}`
  const roleDisplay = role === 'student' ? 'Student' : role === 'teacher' ? 'Educator / Teacher' : 'Administrator'

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Al-Ihsan Academy</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      color: #0f172a;
    }
    .wrapper {
      max-width: 600px;
      margin: 0 auto;
      padding: 32px 16px;
    }
    .card {
      background-color: #ffffff;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #064e3b 0%, #047857 100%);
      padding: 36px 32px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .header p {
      margin: 6px 0 0 0;
      font-size: 13px;
      color: #a7f3d0;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      font-weight: 700;
    }
    .content {
      padding: 32px 28px;
    }
    .greeting {
      font-size: 16px;
      font-weight: 700;
      color: #064e3b;
      margin-bottom: 8px;
    }
    .intro {
      font-size: 14px;
      line-height: 1.6;
      color: #334155;
      margin-top: 0;
      margin-bottom: 24px;
    }
    .creds-box {
      background-color: #f0fdf4;
      border: 2px solid #bbf7d0;
      border-radius: 14px;
      padding: 20px 24px;
      margin-bottom: 24px;
    }
    .creds-title {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #166534;
      margin-bottom: 14px;
      display: flex;
      align-items: center;
    }
    .cred-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px dashed #bbf7d0;
      font-size: 13px;
    }
    .cred-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .cred-label {
      color: #64748b;
      font-weight: 600;
    }
    .cred-value {
      color: #0f172a;
      font-weight: 700;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      text-align: right;
    }
    .cred-password {
      color: #047857;
      background: #ffffff;
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid #86efac;
      font-weight: 800;
    }
    .button-container {
      text-align: center;
      margin: 32px 0 24px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-size: 14px;
      font-weight: 700;
      padding: 14px 36px;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);
    }
    .steps {
      background-color: #f8fafc;
      border-radius: 12px;
      padding: 18px 20px;
      margin-bottom: 24px;
      border: 1px solid #e2e8f0;
    }
    .steps-title {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      color: #475569;
      margin-bottom: 10px;
    }
    .steps ol {
      margin: 0;
      padding-left: 20px;
      font-size: 13px;
      color: #475569;
      line-height: 1.6;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      padding-top: 24px;
      border-top: 1px solid #f1f5f9;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1>AL-IHSAN ACADEMY</h1>
        <p>Moral Education LMS</p>
      </div>

      <div class="content">
        <div class="greeting">Assalamu Alaikum wa Rahmatullah, ${name}</div>
        <p class="intro">
          Welcome to Al-Ihsan Academy! Your official <strong>${roleDisplay} Portal</strong> account has been created. You can access your classes, syllabus, and schedules using the details below:
        </p>

        <div class="creds-box">
          <div class="creds-title">🔐 Your LMS Login Details</div>
          
          ${registrationNumber ? `
          <div class="cred-row">
            <span class="cred-label">Registration / Student ID</span>
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
            <span class="cred-label">Class / Academic Year</span>
            <span class="cred-value">${year}</span>
          </div>` : ''}

          ${term ? `
          <div class="cred-row">
            <span class="cred-label">Academic Term</span>
            <span class="cred-value">${term}</span>
          </div>` : ''}
        </div>

        <div class="button-container">
          <a href="${fullLoginUrl}" class="button" target="_blank">
            Log In to ${roleDisplay} Portal &rarr;
          </a>
        </div>

        <div class="steps">
          <div class="steps-title">📋 Getting Started Instructions</div>
          <ol>
            <li>Click the button above or visit <a href="${fullLoginUrl}" style="color: #059669; font-weight: 600;">${fullLoginUrl}</a>.</li>
            <li>Log in with your Registered Email and Temporary Password.</li>
            <li>Upon your first sign-in, navigate to your <strong>Profile Settings</strong> to set your permanent password.</li>
          </ol>
        </div>

        <div class="footer">
          <p>This is an automated communication from Al-Ihsan Academy.</p>
          <p>If you need assistance, please contact the academy administration.</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `

  const textContent = `
Assalamu Alaikum wa Rahmatullah, ${name}

Welcome to Al-Ihsan Academy! Your ${roleDisplay} Portal account has been created.

Your Login Credentials:
• Platform Login URL: ${fullLoginUrl}
• Registered Email: ${cleanEmail}
${registrationNumber ? `• Student ID / Reg No: ${registrationNumber}\n` : ''}• Temporary Password: ${temporaryPassword}
${year ? `• Class / Year: ${year}\n` : ''}${term ? `• Academic Term: ${term}\n` : ''}
Instructions:
1. Visit ${fullLoginUrl}
2. Log in using your email and temporary password.
3. Update your password upon first login from your profile.

Warm regards,
Al-Ihsan Academy Administration
  `.trim()

  try {
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: [cleanEmail],
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
