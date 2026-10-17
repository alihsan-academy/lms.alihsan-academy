'use client'

import SharedLogin from '@/components/SharedLogin'

export default function StudentLoginPage() {
  return (
    <SharedLogin
      portalType="student"
      portalTitle="Student Portal"
      portalSubtitle="Student Learning Portal"
      portalTagline="Quran, Islamic Studies & Moral Education"
      headingText="Sign in to your classes"
      subheadingText="Enter your student email and password."
      emailLabel="Student Email Address"
      inputPlaceholder="student@alihsanacademy.uk"
      submitButtonText="Sign In as Student"
      roleLabel="Student"
      themeColor="#0D4A47"
      themeHoverColor="#083836"
      pillBg="#E6F3F2"
      pillColor="#0D4A47"
      pillBorder="rgba(13,74,71,0.25)"
      quoteBorderColor="#D97706"
      quoteCitationColor="#FCD34D"
      minaretAccentColor="#D97706"
      footerPortalName="Student Portal"
    />
  )
}
