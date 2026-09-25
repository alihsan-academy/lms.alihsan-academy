'use client'

import SharedLogin from '@/components/SharedLogin'

export default function StudentLoginPage() {
  return (
    <SharedLogin
      portalType="student"
      portalTitle="Student Portal"
      roleLabel="Student"
      theme={{
        bgGradient: 'bg-gradient-to-br from-[#064e3b] via-[#043e2f] to-[#022c22]',
        accentColor: 'text-emerald-600',
        accentBg: 'bg-emerald-400',
        buttonBg: 'bg-emerald-700',
        buttonHover: 'hover:bg-emerald-800',
        ringColor: 'focus:ring-emerald-600',
        badgeBg: 'bg-emerald-500/20',
        badgeText: 'text-emerald-300',
        shadowColor: 'shadow-emerald-900/25',
      }}
    />
  )
}
