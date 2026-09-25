'use client'

import SharedLogin from '@/components/SharedLogin'

export default function TeacherLoginPage() {
  return (
    <SharedLogin
      portalType="teacher"
      portalTitle="Tutor Portal"
      roleLabel="Tutor"
      theme={{
        bgGradient: 'bg-gradient-to-br from-[#1e1b4b] via-[#0f172a] to-[#020617]',
        accentColor: 'text-indigo-600',
        accentBg: 'bg-indigo-400',
        buttonBg: 'bg-indigo-700',
        buttonHover: 'hover:bg-indigo-800',
        ringColor: 'focus:ring-indigo-600',
        badgeBg: 'bg-indigo-500/20',
        badgeText: 'text-indigo-300',
        shadowColor: 'shadow-indigo-950/30',
      }}
      quote={{
        arabic: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ',
        text: 'The best among you are those who learn the Quran and teach it.',
        author: 'Prophet Muhammad (ﷺ) — Sahih al-Bukhari',
      }}
    />
  )
}
