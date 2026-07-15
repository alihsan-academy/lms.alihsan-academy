"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, Loader2 } from 'lucide-react'
import { BouncyButton } from '@/components/bouncy-button'

export function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
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
