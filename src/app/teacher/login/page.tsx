'use client'

import SharedLogin from '@/components/SharedLogin'

export default function TeacherLoginPage() {
  return (
    <SharedLogin
      portalType="teacher"
      portalTitle="Tutor Portal"
      portalSubtitle="Educator & Tutor Portal"
      portalTagline="Faculty Workspace & Attendance Tracking"
      roleLabel="Tutor"
      inputPlaceholder="teacher@alihsanacademy.uk"
      accentColor="#1E293B"
      accentHover="#0F172A"
      accentBorder="rgba(30,41,59,0.25)"
      pillClass="bg-[#EEF2F6] text-[#1E293B] border border-[#1E293B]/25"
      btnClass="bg-[#1E293B] hover:bg-[#0F172A] text-white"
      leftThemeClass="bg-[#1E293B]"
      quoteBorderColor="#60A5FA"
      quoteCitationColor="#93C5FD"
    />
  )
}
