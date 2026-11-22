"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, Loader2 } from 'lucide-react'
import { BouncyButton } from '@/components/bouncy-button'

export function LogoutButton({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    let target = redirectTo
    if (!target && typeof window !== 'undefined') {
      const path = window.location.pathname
      if (path.startsWith('/teacher')) {
        target = '/teacher/login'
      } else if (path.startsWith('/admin') || path.startsWith('/superadmin') || path.startsWith('/portal-superadmin')) {
        target = '/portal-superadmin/login'
      } else {
        target = '/student/login'
      }
    }
    await supabase.auth.signOut()
    window.location.href = target || '/student/login'
  }

  return (
    <BouncyButton 
      variant="outline" 
      size="sm" 
      onClick={handleLogout} 
      disabled={isLoading}
      className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive"
    >
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
      Sign Out
    </BouncyButton>
  )
}
