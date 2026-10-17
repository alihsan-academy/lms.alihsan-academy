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
  inputPlaceholder: string
  accentColor: string
  accentHover: string
  accentBorder: string
  pillClass: string
  btnClass: string
  leftThemeClass: string
  quoteBorderColor: string
  quoteCitationColor: string
}

export default function SharedLogin({
  portalType,
  portalTitle,
  portalSubtitle,
  portalTagline,
  roleLabel,
  inputPlaceholder,
  accentColor,
  accentHover,
  accentBorder,
  pillClass,
  btnClass,
  leftThemeClass,
  quoteBorderColor,
  quoteCitationColor,
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
        if (isNetworkAuthError(msg)) {
          setError('Network issue connecting to server. Please check your internet connection.')
        } else {
          setError('Invalid email or password. Please try again.')
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
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim())

      if (error) {
        setResetMessage({ type: 'error', text: error.message })
      } else {
        setResetMessage({ type: 'success', text: 'Password reset link sent to your email!' })
        setResetEmail('')
      }
    } catch {
      setResetMessage({ type: 'error', text: 'An unexpected error occurred. Please try again.' })
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8F9FA] font-sans antialiased text-[#112221]">
      {/* LEFT SIDE - APPROVED DIRECTION B MINIMALIST ISLAMIC PORTAL */}
      <div
        className={`w-full md:w-[45%] min-h-[460px] md:min-h-screen p-8 sm:p-12 md:p-14 flex flex-col justify-between relative overflow-hidden text-white select-none ${leftThemeClass}`}
      >
        {/* Islamic Geometry Background Overlay */}
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(circle at 40px 40px, rgba(255,255,255,0.4) 1px, transparent 1px),
              linear-gradient(45deg, transparent 48%, rgba(255,255,255,0.2) 49%, rgba(255,255,255,0.2) 51%, transparent 52%),
              linear-gradient(-45deg, transparent 48%, rgba(255,255,255,0.2) 49%, rgba(255,255,255,0.2) 51%, transparent 52%)
            `,
            backgroundSize: '80px 80px',
          }}
        />

        {/* Top Branding with Official Academy Minaret Geometric Logo */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-3.5 mb-7">
            <svg
              className="w-11 h-12 flex-shrink-0"
              viewBox="0 0 100 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M50 5 L65 30 L35 30 Z" fill="#D97706" />
              <path d="M30 35 C55 33, 70 38, 75 42 L72 50 C55 46, 40 45, 27 48 Z" fill="#FFFFFF" />
              <path d="M24 53 C55 50, 75 55, 80 60 L77 68 C55 64, 38 63, 21 66 Z" fill="#FFFFFF" />
              <path d="M18 71 C55 67, 80 73, 85 78 L81 86 C55 81, 35 80, 15 84 Z" fill="#FFFFFF" />
              <rect x="25" y="90" width="8" height="8" fill="#D97706" />
            </svg>
            <div>
              <div className="text-2xl font-bold text-white tracking-tight leading-tight">
                al <span className="font-extrabold">ihsan</span>{' '}
                <span className="text-base font-medium opacity-90">academy</span>
              </div>
              <div className="text-[10px] text-white/70 font-semibold tracking-widest uppercase mt-0.5">
                Building a generation for tomorrow
              </div>
            </div>
          </div>

          <div className="text-[16px] font-semibold text-white/95 mb-1">{portalSubtitle}</div>
          <div className="text-[13px] text-white/70">{portalTagline}</div>
        </div>

        {/* Center: Daily Islamic Quote Reflection Card */}
        <div
          className="my-8 md:my-auto bg-white/[0.07] backdrop-blur-md rounded-xl p-6 sm:p-7 border border-white/[0.14] relative z-10 shadow-lg"
          style={{ borderLeftWidth: '3px', borderLeftColor: quoteBorderColor }}
        >
          {currentQuote?.arabic ? (
            <div className="text-xl sm:text-2xl font-serif text-right text-white leading-relaxed mb-2.5" dir="rtl">
              {currentQuote.arabic}
            </div>
          ) : (
            <div className="text-xl sm:text-2xl font-serif text-right text-white leading-relaxed mb-2.5" dir="rtl">
              {portalType === 'teacher'
                ? 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ'
                : 'وَقُل رَّبِّ زِدۡنِي عِلۡمٗا'}
            </div>
          )}

          <div className="text-[13.5px] text-white/90 italic leading-relaxed">
            "{currentQuote?.text || (portalType === 'teacher' ? 'The best among you are those who learn the Quran and teach it.' : 'And say: My Lord, increase me in knowledge.')}"
          </div>

          <div
            className="text-[11px] font-bold uppercase tracking-wider mt-3"
            style={{ color: quoteCitationColor }}
          >
            {currentQuote?.source || currentQuote?.author || (portalType === 'teacher' ? 'Sahih al-Bukhari 5027' : 'Surah Ta-Ha (20:114)')}
          </div>
        </div>

        {/* Footer info & Domain */}
        <div className="relative z-10 text-[11px] text-white/60 flex items-center justify-between border-t border-white/10 pt-4">
          <span className="font-mono tracking-wider font-medium text-white/80">alihsanacademy.uk</span>
          <span>{portalTitle}</span>
        </div>
      </div>

      {/* RIGHT SIDE - CLEAN PREMIUM EDUCATION WHITE CARD */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 md:p-12 lg:p-16 bg-[#F8F9FA]">
        <div className="w-full max-w-[420px] bg-white rounded-2xl border border-[#DDE4E0] p-8 sm:p-9 shadow-[0_1px_4px_rgba(13,74,71,0.08),0_0_0_1px_rgba(13,74,71,0.05)]">
          {/* Portal Pill Badge */}
          <div className="mb-4">
            <span
              className={`inline-block text-[11px] font-bold px-3 py-1 rounded-md tracking-wide uppercase ${pillClass}`}
            >
              {portalTitle}
            </span>
          </div>

          <h2 className="text-2xl font-bold text-[#112221] tracking-tight">
            {portalType === 'student' && 'Sign in to your classes'}
            {portalType === 'teacher' && 'Educator Sign In'}
            {portalType === 'admin' && 'Administrator Sign In'}
          </h2>
          <p className="text-[13px] text-[#4A6362] mt-1 mb-6">
            {portalType === 'student' && 'Enter your student email and password.'}
            {portalType === 'teacher' && 'Manage timetables and mark student attendance.'}
            {portalType === 'admin' && 'Manage academy operations, attendance & users.'}
          </p>

          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            <div>
              <label className="block text-[13px] font-semibold text-[#112221] mb-1.5">
                {portalType === 'student' && 'Student Email Address'}
                {portalType === 'teacher' && 'Faculty Email Address'}
                {portalType === 'admin' && 'Administrator Email'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={inputPlaceholder}
                className="w-full border border-[#DDE4E0] rounded-lg px-3.5 py-2.5 text-[14px] text-[#112221] bg-white outline-none transition-all focus:border-[#0D4A47] focus:ring-2 focus:ring-[#0D4A47]/15"
                disabled={loading}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[13px] font-semibold text-[#112221]">Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(!showForgotPassword)}
                  className="text-xs text-[#4A6362] hover:text-[#112221] hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-[#DDE4E0] rounded-lg px-3.5 py-2.5 text-[14px] text-[#112221] bg-white outline-none transition-all focus:border-[#0D4A47] focus:ring-2 focus:ring-[#0D4A47]/15"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full h-11 rounded-lg text-[14px] font-semibold cursor-pointer transition-colors mt-6 shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 ${btnClass}`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>
                  {portalType === 'student' && 'Sign In as Student'}
                  {portalType === 'teacher' && 'Sign In as Tutor'}
                  {portalType === 'admin' && 'Sign In to Dashboard'}
                </span>
              )}
            </button>
          </form>

          {/* Forgot Password Accordion */}
          {showForgotPassword && (
            <div className="mt-5 pt-5 border-t border-[#DDE4E0]">
              <h3 className="text-xs font-bold text-[#112221] mb-1">Reset Password</h3>
              <p className="text-[11px] text-[#4A6362] mb-3">
                Enter your registered email address to receive reset instructions.
              </p>
              <form onSubmit={handleResetPassword} className="space-y-2.5">
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="your-email@alihsanacademy.uk"
                  className="w-full border border-[#DDE4E0] rounded-lg px-3 py-2 text-xs text-[#112221] bg-white outline-none"
                  disabled={resetLoading}
                />
                {resetMessage.text && (
                  <div
                    className={`p-2 rounded text-xs ${
                      resetMessage.type === 'error'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {resetMessage.text}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-2 bg-[#112221] text-white rounded-lg text-xs font-semibold hover:bg-black transition-colors"
                >
                  {resetLoading ? 'Sending link...' : 'Send Reset Link'}
                </button>
              </form>
            </div>
          )}

          {/* Quick switcher for portal on Admin */}
          {portalType === 'admin' && (
            <div className="mt-6 pt-5 border-t border-[#DDE4E0] text-center">
              <span className="text-[11px] text-[#879E9D] font-medium mr-2">Need a different portal?</span>
              <div className="inline-flex gap-2 mt-2">
                <Link
                  href="/student/login"
                  className="text-xs text-[#0D4A47] font-semibold hover:underline"
                >
                  Student Portal
                </Link>
                <span className="text-[#879E9D]">•</span>
                <Link
                  href="/teacher/login"
                  className="text-xs text-[#1E293B] font-semibold hover:underline"
                >
                  Tutor Portal
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
