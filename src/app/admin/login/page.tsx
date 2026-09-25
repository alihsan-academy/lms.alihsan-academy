'use client'

import SharedLogin from '@/components/SharedLogin'

export default function AdminLoginPage() {
  return (
    <SharedLogin
      portalType="admin"
      portalTitle="Administration"
      roleLabel="Admin"
      theme={{
        bgGradient: 'bg-gradient-to-br from-[#18181b] via-[#0f172a] to-[#09090b]',
        accentColor: 'text-amber-600',
        accentBg: 'bg-amber-400',
        buttonBg: 'bg-slate-900',
        buttonHover: 'hover:bg-black',
        ringColor: 'focus:ring-amber-500',
        badgeBg: 'bg-amber-500/15',
        badgeText: 'text-amber-300',
        shadowColor: 'shadow-black/40',
      }}
    />
  )
}
