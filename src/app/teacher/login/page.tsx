'use client'

import SharedLogin from '@/components/SharedLogin'

export default function TeacherLoginPage() {
  return (
    <SharedLogin
      portalType="teacher"
      portalTitle="Tutor Portal"
      portalSubtitle="Educator & Tutor Portal"
      portalTagline="Faculty Workspace & Attendance Tracking"
      headingText="Educator Sign In"
      subheadingText="Manage timetables and mark student attendance."
      emailLabel="Faculty Email Address"
      inputPlaceholder="teacher@alihsanacademy.uk"
      submitButtonText="Sign In as Tutor"
      roleLabel="Tutor"
      themeColor="#1E293B"
      themeHoverColor="#0F172A"
      pillBg="#EEF2F6"
      pillColor="#1E293B"
      pillBorder="rgba(30,41,59,0.25)"
      quoteBorderColor="#60A5FA"
      quoteCitationColor="#93C5FD"
      minaretAccentColor="#60A5FA"
      footerPortalName="Faculty Access"
    />
  )
}
