'use client'

import SharedLogin from '@/components/SharedLogin'

export default function AdminLoginPage() {
  return (
    <SharedLogin
      portalType="admin"
      portalTitle="Administration"
      portalSubtitle="Central Administration"
      portalTagline="Academy Operations, Records & Security"
      roleLabel="Admin"
      inputPlaceholder="admin@alihsanacademy.uk"
      accentColor="#6B1E2E"
      accentHover="#551624"
      accentBorder="rgba(107,30,46,0.25)"
      pillClass="bg-[#F9EEF0] text-[#6B1E2E] border border-[#6B1E2E]/25"
      btnClass="bg-[#6B1E2E] hover:bg-[#551624] text-white"
      leftThemeClass="bg-[#6B1E2E]"
      quoteBorderColor="#F59E0B"
      quoteCitationColor="#FCD34D"
    />
  )
}
