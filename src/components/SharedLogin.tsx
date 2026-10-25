'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export interface SharedLoginProps {
  portalType: 'student' | 'teacher' | 'admin'
  portalTitle: string
  portalSubtitle: string
  portalTagline: string
  roleLabel: string
  headingText: string
  subheadingText: string
  emailLabel: string
  inputPlaceholder: string
  submitButtonText: string
  themeColor: string
  themeHoverColor: string
  pillBg: string
  pillColor: string
  pillBorder: string
  quoteBorderColor: string
  quoteCitationColor: string
  minaretAccentColor: string
  footerPortalName: string
}

export default function SharedLogin({
  portalType,
  portalTitle,
  portalSubtitle,
  portalTagline,
  headingText,
  subheadingText,
  emailLabel,
  inputPlaceholder,
  submitButtonText,
  themeColor,
  themeHoverColor,
  pillBg,
  pillColor,
  pillBorder,
  quoteBorderColor,
  quoteCitationColor,
  minaretAccentColor,
  footerPortalName,
}: SharedLoginProps) {
  const [currentQuote, setCurrentQuote] = useState<{
    arabic?: string
    text: string
    source?: string
    author?: string
    type?: string
  } | null>(null)

  useEffect(() => {
    fetch(`/api/quotes/daily?portal=${portalType === 'admin' ? 'student' : portalType}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.quote) setCurrentQuote(data.quote)
      })
      .catch((err) => console.error('Failed to load daily quote:', err))
  }, [portalType])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Forgot Password State
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetMessage, setResetMessage] = useState({ type: '', text: '' })
  const [resetLoading, setResetLoading] = useState(false)

  const isNetworkAuthError = (message: string) =>
    message.includes('fetch failed') ||
    message.includes('Failed to fetch') ||
    message.includes('AuthRetryableFetchError') ||
    message.includes('timeout') ||
    message.includes('ENOTFOUND')

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!email || !password) {
      setError('Please fill in both email and password.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      // 1. Sign in
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        })

      if (authError) {
        const msg = authError.message || ''
        console.error('Supabase Auth Error:', authError)
        if (isNetworkAuthError(msg)) {
          setError('Network issue connecting to server. Please check your internet connection.')
        } else {
          setError(msg || 'Invalid email or password. Please try again.')
        }
        setLoading(false)
        return
      }

      // 2. Fetch Profile
      const profileResponse = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: authData.user.id }),
      })

      const profileData = await profileResponse.json()

      if (!profileResponse.ok || !profileData.role) {
        if (profileResponse.status >= 500) {
          setError('Could not reach profile service. Please try again in a moment.')
        } else {
          setError('Profile not found. Please contact administration.')
        }
        setLoading(false)
        return
      }

      const role = profileData.role

      // 3. Strict Portal Access Security
      if (portalType === 'student' && role !== 'student') {
        await supabase.auth.signOut()
        setError('This portal is exclusively for students. Tutors and Admins must use their respective login portals.')
        setLoading(false)
        return
      }

      if (portalType === 'teacher' && role !== 'teacher') {
        await supabase.auth.signOut()
        setError('This portal is exclusively for tutors and faculty. Students must use the Student Portal.')
        setLoading(false)
        return
      }

      if (portalType === 'admin' && role !== 'admin' && role !== 'superadmin') {
        await supabase.auth.signOut()
        setError('Access denied: Unauthorized role for Administration Portal.')
        setLoading(false)
        return
      }

      // 4. Role-Based Redirection
      if (role === 'student') {
        window.location.href = '/student/dashboard'
      } else if (role === 'teacher') {
        window.location.href = '/teacher/dashboard'
      } else if (role === 'admin') {
        window.location.href = '/admin/dashboard'
      } else if (role === 'superadmin') {
        window.location.href = '/superadmin/dashboard'
      } else {
        window.location.href = '/login'
      }
    } catch (err: any) {
      const msg = err?.message || ''
      if (isNetworkAuthError(msg)) {
        setError('Network connectivity issue. Please check your connection and try again.')
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
      setLoading(false)
    }
  }

  const handleResetPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setResetMessage({ type: '', text: '' })
    if (!resetEmail) {
      setResetMessage({ type: 'error', text: 'Please enter your email address' })
      return
    }

    setResetLoading(true)
    try {
      const supabase = createClient()
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: redirectUrl,
      })

      if (error) {
        setResetMessage({ type: 'error', text: error.message })
      } else {
        setResetMessage({ type: 'success', text: 'Password reset link sent to your email! Please check your inbox and spam folder.' })
        setResetEmail('')
      }
    } catch {
      setResetMessage({ type: 'error', text: 'An unexpected error occurred. Please try again.' })
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div
      className="flex flex-col lg:flex-row min-h-screen w-full bg-[#F8F9FA] text-[#112221] overflow-x-hidden font-sans m-0 box-border"
      style={{
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* LOWER HALF ON MOBILE / LEFT SIDE ON DESKTOP: BRANDING & ARABIC QUOTE PANEL */}
      <div
        className="order-2 lg:order-1 w-full lg:w-[45%] lg:min-w-[380px] p-6 sm:p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden text-white box-border shrink-0"
        style={{
          backgroundColor: themeColor,
        }}
      >
        {/* Islamic Geometry Background Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            opacity: 0.08,
            backgroundSize: '80px 80px',
            backgroundImage: `
              radial-gradient(circle at 40px 40px, rgba(255,255,255,0.4) 1px, transparent 1px),
              linear-gradient(45deg, transparent 48%, rgba(255,255,255,0.2) 49%, rgba(255,255,255,0.2) 51%, transparent 52%),
              linear-gradient(-45deg, transparent 48%, rgba(255,255,255,0.2) 49%, rgba(255,255,255,0.2) 51%, transparent 52%)
            `,
          }}
        />

        {/* Top Header & Branding with Official Minaret Vector */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '14px',
              marginBottom: '28px',
            }}
          >
            <svg
              style={{ width: '44px', height: '48px', flexShrink: 0 }}
              viewBox="0 0 100 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M50 5 L65 30 L35 30 Z" fill={minaretAccentColor} />
              <path d="M30 35 C55 33, 70 38, 75 42 L72 50 C55 46, 40 45, 27 48 Z" fill="#FFFFFF" />
              <path d="M24 53 C55 50, 75 55, 80 60 L77 68 C55 64, 38 63, 21 66 Z" fill="#FFFFFF" />
              <path d="M18 71 C55 67, 80 73, 85 78 L81 86 C55 81, 35 80, 15 84 Z" fill="#FFFFFF" />
              <rect x="25" y="90" width="8" height="8" fill={minaretAccentColor} />
            </svg>
            <div>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                }}
              >
                AL IHSAN Academy <span style={{ fontSize: '14px', fontWeight: 500, opacity: 0.85 }}>of Moral Education</span>
              </div>
              <div
                style={{
                  fontSize: '10px',
                  color: 'rgba(255,255,255,0.7)',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginTop: '3px',
                }}
              >
                Building a generation for tomorrow
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.95)',
              marginBottom: '4px',
            }}
          >
            {portalSubtitle}
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
            {portalTagline}
          </div>
        </div>

        {/* Center: Exact Islamic Quote Card */}
        <div
          style={{
            background: 'rgba(255,255,255,0.07)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: '12px',
            padding: '24px 28px',
            borderLeft: `3px solid ${quoteBorderColor}`,
            position: 'relative',
            zIndex: 2,
            margin: '28px 0',
          }}
        >
          {currentQuote?.arabic ? (
            <div
              style={{
                fontSize: '22px',
                direction: 'rtl',
                textAlign: 'right',
                lineHeight: 1.8,
                color: '#FFFFFF',
                marginBottom: '10px',
                fontWeight: 500,
              }}
              dir="rtl"
            >
              {currentQuote.arabic}
            </div>
          ) : (
            <div
              style={{
                fontSize: '22px',
                direction: 'rtl',
                textAlign: 'right',
                lineHeight: 1.8,
                color: '#FFFFFF',
                marginBottom: '10px',
                fontWeight: 500,
              }}
              dir="rtl"
            >
              {portalType === 'teacher'
                ? 'وَقُل رَّبِّ زِدۡنِي عِلۡمٗا'
                : 'اقۡرَأۡ بِاسۡمِ رَبِّكَ الَّذِيۡ خَلَقَ'}
            </div>
          )}

          <div
            style={{
              fontSize: '13.5px',
              color: 'rgba(255,255,255,0.9)',
              fontStyle: 'italic',
              lineHeight: 1.6,
            }}
          >
            "{currentQuote?.text || (portalType === 'teacher' ? 'And say: My Lord, increase me in knowledge.' : 'Read! In the name of your Lord who created.')}"
          </div>

          <div
            style={{
              fontSize: '11px',
              color: quoteCitationColor,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginTop: '8px',
              fontWeight: 700,
            }}
          >
            {currentQuote?.source || currentQuote?.author || (portalType === 'teacher' ? 'Quran 20:114' : 'Quran 96:1')}
          </div>
        </div>

        {/* Footer info & Domain */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            fontSize: '11px',
            opacity: 0.6,
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>alihsanacademy.uk</span>
          <span>{footerPortalName}</span>
        </div>
      </div>

      {/* UPPER HALF ON MOBILE / RIGHT SIDE ON DESKTOP: CREDENTIALS CARD */}
      <div className="order-1 lg:order-2 flex-1 flex items-center justify-center p-3.5 sm:p-8 lg:p-12 bg-[#F8F9FA] box-border w-full">
        <div className="bg-white rounded-2xl border border-[#DDE4E0] p-5 sm:p-8 w-full max-w-[420px] shadow-sm relative z-10 box-border">
          {/* Mobile Top Brand Bar (Visible on mobile screens before credentials) */}
          <div className="flex items-center gap-3 mb-4 lg:hidden pb-3.5 border-b border-[#DDE4E0]">
            <svg
              className="w-8 h-9 shrink-0"
              viewBox="0 0 100 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M50 5 L65 30 L35 30 Z" fill={minaretAccentColor} />
              <path d="M30 35 C55 33, 70 38, 75 42 L72 50 C55 46, 40 45, 27 48 Z" fill={themeColor} />
              <path d="M24 53 C55 50, 75 55, 80 60 L77 68 C55 64, 38 63, 21 66 Z" fill={themeColor} />
              <path d="M18 71 C55 67, 80 73, 85 78 L81 86 C55 81, 35 80, 15 84 Z" fill={themeColor} />
              <rect x="25" y="90" width="8" height="8" fill={minaretAccentColor} />
            </svg>
            <div>
              <div className="text-sm font-bold tracking-tight text-[#112221] leading-tight">
                AL IHSAN Academy
              </div>
              <div className="text-[10px] text-[#5C7066] font-semibold uppercase tracking-wider">
                Moral Education
              </div>
            </div>
          </div>

          {/* Portal Pill Badge */}
          <div
            style={{
              display: 'inline-block',
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '4px',
              backgroundColor: pillBg,
              color: pillColor,
              border: `1px solid ${pillBorder}`,
              marginBottom: '14px',
              textTransform: 'none',
              letterSpacing: 'normal',
            }}
          >
            {portalTitle}
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#112221] m-0 mb-1 leading-snug">
            {headingText}
          </h2>

          <p className="text-xs sm:text-sm text-[#4A6362] mt-1 mb-5 leading-relaxed">
            {subheadingText}
          </p>

          <form onSubmit={handleLogin} noValidate>
            <div className="mt-4">
              <label className="block text-xs sm:text-sm font-semibold text-[#112221] mb-1.5">
                {emailLabel}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={inputPlaceholder}
                disabled={loading}
                className="w-full border border-[#DDE4E0] rounded-lg px-3.5 py-2.5 text-base md:text-sm text-[#112221] outline-none bg-white focus:border-[#1A6B4A] focus:ring-1 focus:ring-[#1A6B4A] transition-all box-border font-sans h-11"
              />
            </div>

            <div className="mt-4">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs sm:text-sm font-semibold text-[#112221]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(!showForgotPassword)}
                  className="bg-transparent border-0 py-2 px-1 text-xs text-[#4A6362] cursor-pointer underline hover:text-[#112221] font-sans min-h-[44px] inline-flex items-center -mr-1"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative w-full">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full border border-[#DDE4E0] rounded-lg pl-3.5 pr-11 py-2.5 text-base md:text-sm text-[#112221] outline-none bg-white focus:border-[#1A6B4A] focus:ring-1 focus:ring-[#1A6B4A] transition-all box-border font-sans h-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-0 top-1/2 -translate-y-1/2 bg-transparent border-0 cursor-pointer text-[#5C7066] hover:text-[#112221] flex items-center justify-center w-11 h-11"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-3.5 p-2.5 sm:p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 min-h-[44px] rounded-lg text-sm font-semibold border-none cursor-pointer mt-5 text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] font-sans shadow-sm"
              style={{
                backgroundColor: themeColor,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Authenticating...' : submitButtonText}
            </button>
          </form>

          {/* Forgot Password Container */}
          {showForgotPassword && (
            <div
              style={{
                marginTop: '18px',
                paddingTop: '16px',
                borderTop: '1px solid #DDE4E0',
              }}
            >
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#112221', marginBottom: '4px' }}>
                Reset Password
              </h3>
              <div style={{ fontSize: '12px', color: '#4A6362', marginBottom: '10px' }}>
                Enter your email address to receive reset instructions.
              </div>
              <form onSubmit={handleResetPassword}>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="name@alihsanacademy.uk"
                  disabled={resetLoading}
                  className="w-full h-11 border border-[#DDE4E0] rounded-lg px-3.5 py-2.5 text-base md:text-sm text-[#112221] outline-none bg-white focus:border-[#1A6B4A] transition-all box-border font-sans mb-2"
                />
                {resetMessage.text && (
                  <div
                    style={{
                      fontSize: '12px',
                      color: resetMessage.type === 'error' ? '#B91C1C' : '#047857',
                      marginBottom: '8px',
                    }}
                  >
                    {resetMessage.text}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full h-11 min-h-[44px] rounded-lg bg-[#112221] hover:bg-[#1A2B23] active:scale-[0.98] text-white text-xs sm:text-sm font-semibold border-none cursor-pointer flex items-center justify-center transition-all shadow-xs"
                >
                  {resetLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </div>
          )}

          {portalType === 'admin' && (
            <div className="mt-5 pt-4 border-t border-[#DDE4E0] text-xs text-[#879E9D] flex flex-wrap items-center justify-center gap-1">
              <span>Need a different portal?</span>
              <Link href="/student/login" className="py-1 px-1.5 font-bold hover:underline" style={{ color: '#0D4A47' }}>
                Student
              </Link>
              <span>•</span>
              <Link href="/teacher/login" className="py-1 px-1.5 font-bold hover:underline" style={{ color: '#5B21B6' }}>
                Tutor
              </Link>
            </div>
          )}
          {portalType === 'student' && (
            <div className="mt-5 pt-4 border-t border-[#DDE4E0] text-xs text-[#879E9D] flex flex-wrap items-center justify-center gap-1">
              <span>Need a different portal?</span>
              <Link href="/teacher/login" className="py-1 px-1.5 font-bold hover:underline" style={{ color: '#5B21B6' }}>
                Tutor
              </Link>
              <span>•</span>
              <Link href="/admin/login" className="py-1 px-1.5 font-bold hover:underline" style={{ color: '#681329' }}>
                Admin
              </Link>
            </div>
          )}
          {portalType === 'teacher' && (
            <div className="mt-5 pt-4 border-t border-[#DDE4E0] text-xs text-[#879E9D] flex flex-wrap items-center justify-center gap-1">
              <span>Need a different portal?</span>
              <Link href="/student/login" className="py-1 px-1.5 font-bold hover:underline" style={{ color: '#0D4A47' }}>
                Student
              </Link>
              <span>•</span>
              <Link href="/admin/login" className="py-1 px-1.5 font-bold hover:underline" style={{ color: '#681329' }}>
                Admin
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
