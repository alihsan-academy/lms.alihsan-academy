'use client'

import SharedLogin from '@/components/SharedLogin'

export default function AdminLoginPage() {
  return (
    <SharedLogin
      portalType="admin"
      portalTitle="Super Admin Portal"
      portalSubtitle="Central Administration"
      portalTagline="Academy Operations, Records & Security"
      headingText="Administrator Sign In"
      subheadingText="Manage academy operations, attendance & users."
      emailLabel="Administrator Email"
      inputPlaceholder="admin@alihsanacademy.uk"
      submitButtonText="Sign In to Dashboard"
      roleLabel="Admin"
      themeColor="#6B1E2E"
      themeHoverColor="#551624"
      pillBg="#F9EEF0"
      pillColor="#6B1E2E"
      pillBorder="rgba(107,30,46,0.25)"
      quoteBorderColor="#F59E0B"
      quoteCitationColor="#FCD34D"
      minaretAccentColor="#F59E0B"
      footerPortalName="Secure Administrative Gateway"
    />
  )
}
