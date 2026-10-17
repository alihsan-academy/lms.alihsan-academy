'use client'

import SharedLogin from '@/components/SharedLogin'

export default function StudentLoginPage() {
  return (
    <SharedLogin
      portalType="student"
      portalTitle="Student Portal"
      portalSubtitle="Student Learning Portal"
      portalTagline="Quran, Islamic Studies & Moral Education"
      roleLabel="Student"
      inputPlaceholder="student@alihsanacademy.uk"
      accentColor="#0D4A47"
      accentHover="#083836"
      accentBorder="rgba(13,74,71,0.25)"
      pillClass="bg-[#E6F3F2] text-[#0D4A47] border border-[#0D4A47]/25"
      btnClass="bg-[#0D4A47] hover:bg-[#083836] text-white"
      leftThemeClass="bg-[#0D4A47]"
      quoteBorderColor="#D97706"
      quoteCitationColor="#FCD34D"
    />
  )
}
