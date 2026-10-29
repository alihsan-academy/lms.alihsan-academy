'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { KeyRound, CheckCircle, AlertCircle, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [isReady, setIsReady] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success' | ''; text: string }>({ type: '', text: '' })
  const [hasValidSession, setHasValidSession] = useState<boolean | null>(null)

  useEffect(() => {
    // Listen for the password recovery auth event or active session
    const checkSession = async () => {
      try {
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search)
          const code = params.get('code')
          const errParam = params.get('error_description') || params.get('error')

          if (errParam) {
            setStatusMessage({
              type: 'error',
              text: decodeURIComponent(errParam).replace(/\+/g, ' ')
            })
            setHasValidSession(false)
            setIsReady(true)
            return
          }

          if (code) {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code)
            if (!error && data?.session) {
              setHasValidSession(true)
              setIsReady(true)
              return
            } else if (error) {
              setStatusMessage({
                type: 'error',
                text: 'This password reset link has expired or is invalid. Please request a new one.'
              })
              setHasValidSession(false)
              setIsReady(true)
              return
            }
          }
        }

        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setHasValidSession(true)
          setIsReady(true)
          return
        }

        const hash = typeof window !== 'undefined' ? window.location.hash : ''
        if (hash && (hash.includes('access_token') || hash.includes('type=recovery'))) {
          setHasValidSession(true)
          setIsReady(true)
          return
        }

        setTimeout(async () => {
          const { data: { session: retrySession } } = await supabase.auth.getSession()
          setHasValidSession(!!retrySession)
          setIsReady(true)
        }, 1000)
      } catch (err: any) {
        setStatusMessage({
          type: 'error',
          text: err?.message || 'Failed to authenticate reset session.'
        })
        setHasValidSession(false)
        setIsReady(true)
      }
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setHasValidSession(true)
        setIsReady(true)
      }
    })

    checkSession()

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [supabase])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatusMessage({ type: '', text: '' })

    if (!password) {
      setStatusMessage({ type: 'error', text: 'Please enter your new password.' })
      return
    }

    if (password.length < 6) {
      setStatusMessage({ type: 'error', text: 'Password must be at least 6 characters long.' })
      return
    }

    if (password !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'Passwords do not match. Please re-enter.' })
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        setStatusMessage({ type: 'error', text: error.message || 'Failed to update password.' })
      } else {
        setStatusMessage({
          type: 'success',
          text: 'Your password has been successfully updated! You can now log in.'
        })
        setPassword('')
        setConfirmPassword('')
        // Sign out to enforce clean login with the new credentials
        await supabase.auth.signOut()
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'An unexpected error occurred.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A2B23] flex flex-col justify-between p-4 sm:p-6 md:p-12 relative overflow-hidden font-sans selection:bg-[#1A6B4A]/15 selection:text-[#1A6B4A]">
      {/* Geometric background overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundSize: '80px 80px',
          backgroundImage: `
            radial-gradient(circle at 40px 40px, #1A6B4A 1.5px, transparent 1.5px),
            linear-gradient(45deg, transparent 48%, #1A6B4A 49%, #1A6B4A 51%, transparent 52%),
            linear-gradient(-45deg, transparent 48%, #1A6B4A 49%, #1A6B4A 51%, transparent 52%)
          `
        }}
      />

      {/* Header */}
      <header className="relative z-10 max-w-xl mx-auto w-full flex items-center justify-between py-3 sm:py-4 border-b border-[#DDE4E0]">
        <Link href="/login" className="flex items-center gap-2.5 sm:gap-3 group">
          <svg
            style={{ width: '32px', height: '38px', flexShrink: 0 }}
            viewBox="0 0 100 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M50 5 L65 30 L35 30 Z" fill="#E8A020" />
            <path d="M30 35 C55 33, 70 38, 75 42 L72 50 C55 46, 40 45, 27 48 Z" fill="#1A6B4A" />
            <path d="M24 53 C55 50, 75 55, 80 60 L77 68 C55 64, 38 63, 21 66 Z" fill="#1A6B4A" />
            <path d="M18 71 C55 67, 80 73, 85 78 L81 86 C55 81, 35 80, 15 84 Z" fill="#1A6B4A" />
            <rect x="25" y="90" width="8" height="8" fill="#E8A020" />
          </svg>
          <div>
            <div className="text-sm sm:text-base font-bold tracking-tight text-[#1A6B4A] leading-tight">
              AL IHSAN Academy
            </div>
            <div className="text-[9px] sm:text-[10px] text-[#5C7066] uppercase tracking-[0.12em] font-bold">
              Moral Education
            </div>
          </div>
        </Link>
        <Link 
          href="/login" 
          className="text-xs font-semibold text-[#5C7066] hover:text-[#1A6B4A] flex items-center gap-1 transition-colors min-h-[44px] py-2 px-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
        </Link>
      </header>

      {/* Main card */}
      <main className="relative z-10 max-w-md mx-auto w-full my-auto py-6 sm:py-10">
        <div className="bg-white rounded-2xl border border-[#DDE4E0] p-5 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#E8F5EE] border border-[#1A6B4A]/20 flex items-center justify-center text-[#1A6B4A] shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-[#1A2B23]">Set New Password</h1>
              <p className="text-xs text-[#5C7066]">Enter and confirm your new secure password.</p>
            </div>
          </div>

          {!isReady ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#1A6B4A] animate-spin" />
              <p className="text-sm font-semibold text-[#5C7066]">Verifying secure reset link...</p>
            </div>
          ) : !hasValidSession && statusMessage.type !== 'success' ? (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Reset Link Invalid or Expired</p>
                  <p className="text-xs text-amber-800 mt-1">
                    {statusMessage.text || 'This password reset link is invalid, has expired, or has already been used. Please request a new reset link.'}
                  </p>
                </div>
              </div>
              <Link
                href="/login"
                className="w-full h-11 min-h-[44px] rounded-lg bg-[#1A6B4A] hover:bg-[#15583D] active:scale-[0.98] text-white text-sm font-semibold flex items-center justify-center transition-all shadow-xs"
              >
                Request a New Reset Link
              </Link>
            </div>
          ) : statusMessage.type === 'success' ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Password Updated Successfully!</p>
                  <p className="text-xs text-emerald-700 mt-1">{statusMessage.text}</p>
                </div>
              </div>
              <Link
                href="/login"
                className="w-full h-11 min-h-[44px] rounded-lg bg-[#1A6B4A] hover:bg-[#15583D] active:scale-[0.98] text-white text-sm font-semibold flex items-center justify-center transition-all shadow-xs"
              >
                Proceed to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              {statusMessage.type === 'error' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{statusMessage.text}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#1A2B23] uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    disabled={isSubmitting}
                    className="w-full h-11 border border-[#DDE4E0] rounded-lg pl-3.5 pr-11 text-base md:text-sm text-[#112221] outline-none focus:border-[#1A6B4A] transition-colors box-border"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="w-11 h-11 flex items-center justify-center absolute right-0 top-1/2 -translate-y-1/2 text-[#5C7066] hover:text-[#1A2B23] transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A2B23] uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    disabled={isSubmitting}
                    className="w-full h-11 border border-[#DDE4E0] rounded-lg pl-3.5 pr-11 text-base md:text-sm text-[#112221] outline-none focus:border-[#1A6B4A] transition-colors box-border"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="w-11 h-11 flex items-center justify-center absolute right-0 top-1/2 -translate-y-1/2 text-[#5C7066] hover:text-[#1A2B23] transition-colors"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 min-h-[44px] rounded-lg bg-[#1A6B4A] hover:bg-[#15583D] active:scale-[0.98] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-60 shadow-xs mt-6"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <span>Update Password</span>
                )}
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-xl mx-auto w-full py-4 border-t border-[#DDE4E0] text-center text-xs text-[#5C7066]">
        © 2026 Al Ihsan Academy of Moral Education. All rights reserved.
      </footer>
    </div>
  )
}
