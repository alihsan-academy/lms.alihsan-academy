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
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined
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
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#F8F9FA',
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        color: '#112221',
        margin: 0,
        boxSizing: 'border-box',
      }}
    >
      {/* LEFT SIDE - EXACT APPROVED DIRECTION B SPEC */}
      <div
        style={{
          width: '45%',
          minWidth: '380px',
          backgroundColor: themeColor,
          padding: '52px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          color: '#FFFFFF',
          boxSizing: 'border-box',
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
                  fontSize: '26px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                }}
              >
                al <span style={{ fontWeight: 800 }}>ihsan</span>{' '}
                <span style={{ fontSize: '16px', fontWeight: 500, opacity: 0.85 }}>academy</span>
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

      {/* RIGHT SIDE - EXACT BOXY DIRECTION B LOGIN CARD */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px',
          backgroundColor: '#F8F9FA',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #DDE4E0',
            padding: '38px',
            width: '100%',
            maxWidth: '420px',
            boxShadow: '0 1px 4px rgba(13, 74, 71, 0.08), 0 0 0 1px rgba(13, 74, 71, 0.05)',
            position: 'relative',
            zIndex: 2,
            boxSizing: 'border-box',
          }}
        >
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

          <h2
            style={{
              fontSize: '24px',
              fontWeight: 700,
              letterSpacing: '-0.01em',
              color: '#112221',
              margin: '0 0 4px 0',
              lineHeight: 1.25,
            }}
          >
            {headingText}
          </h2>

          <p
            style={{
              fontSize: '13px',
              color: '#4A6362',
              marginTop: '4px',
              marginBottom: '20px',
              lineHeight: 1.5,
            }}
          >
            {subheadingText}
          </p>

          <form onSubmit={handleLogin} noValidate>
            <div style={{ marginTop: '18px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#112221',
                  marginBottom: '6px',
                }}
              >
                {emailLabel}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={inputPlaceholder}
                disabled={loading}
                style={{
                  width: '100%',
                  border: '1px solid #DDE4E0',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '14px',
                  color: '#112221',
                  outline: 'none',
                  backgroundColor: '#FFFFFF',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div style={{ marginTop: '18px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '6px',
                }}
              >
                <label
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#112221',
                  }}
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(!showForgotPassword)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontSize: '12px',
                    color: '#4A6362',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontFamily: 'inherit',
                  }}
                >
                  Forgot password?
                </button>
              </div>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  style={{
                    width: '100%',
                    border: '1px solid #DDE4E0',
                    borderRadius: '8px',
                    padding: '10px 42px 10px 14px',
                    fontSize: '14px',
                    color: '#112221',
                    outline: 'none',
                    backgroundColor: '#FFFFFF',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    padding: '4px',
                    cursor: 'pointer',
                    color: '#5C7066',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {showPassword ? (
                    <svg style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div
                style={{
                  marginTop: '14px',
                  padding: '10px 12px',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '6px',
                  color: '#B91C1C',
                  fontSize: '12px',
                  fontWeight: 500,
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: '44px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '24px',
                backgroundColor: themeColor,
                color: '#FFFFFF',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
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
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#112221', marginBottom: '4px' }}>
                Reset Password
              </div>
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
                  style={{
                    width: '100%',
                    border: '1px solid #DDE4E0',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    marginBottom: '8px',
                  }}
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
                  style={{
                    width: '100%',
                    padding: '8px',
                    backgroundColor: '#112221',
                    color: '#FFFFFF',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {resetLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </div>
          )}

          {portalType === 'admin' && (
            <div
              style={{
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: '1px solid #DDE4E0',
                fontSize: '12px',
                color: '#879E9D',
                textAlign: 'center',
              }}
            >
              Need a different portal?{' '}
              <Link href="/student/login" style={{ color: '#0D4A47', fontWeight: 600 }}>
                Student
              </Link>{' '}
              •{' '}
              <Link href="/teacher/login" style={{ color: '#1E293B', fontWeight: 600 }}>
                Tutor
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
