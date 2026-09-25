'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

interface SharedLoginProps {
  portalType: 'student' | 'teacher' | 'admin'
  portalTitle: string
  roleLabel: string
  theme: {
    bgGradient: string
    accentColor: string
    accentBg: string
    buttonBg: string
    buttonHover: string
    ringColor: string
    badgeBg: string
    badgeText: string
    shadowColor: string
  }
  quote?: {
    arabic?: string
    text: string
    author: string
  }
}

export default function SharedLogin({
  portalType,
  portalTitle,
  roleLabel,
  theme,
  quote
}: SharedLoginProps) {
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

      // 3. Redirect based on role
      const role = profileData.role
      if (role === 'student') {
        window.location.href = '/student/dashboard'
      } else if (role === 'teacher') {
        window.location.href = '/teacher/dashboard'
      } else if (role === 'admin') {
        window.location.href = '/admin/dashboard'
      } else if (role === 'superadmin') {
        window.location.href = '/superadmin/dashboard'
      } else {
        setError('Unknown user role.')
      }

    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      console.error(err)
    } finally {
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
    } catch (err) {
      setResetMessage({ type: 'error', text: 'An unexpected error occurred. Please try again.' })
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0c121e] font-sans antialiased text-gray-900 selection:bg-emerald-500 selection:text-white">
      
      {/* Left side - Minimalist Islamic Motif & Branding (No Photos) */}
      <div className={`relative w-full md:w-1/2 min-h-[420px] md:min-h-screen overflow-hidden ${theme.bgGradient} flex flex-col justify-between p-8 md:p-14 lg:p-16 text-white select-none`}>
        
        {/* Subtle Geometric Islamic Vector Pattern */}
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
            <defs>
              <pattern id={`islamic-art-${portalType}`} width="80" height="80" patternUnits="userSpaceOnUse">
                {/* 8-Pointed Star (Khatim) geometry */}
                <rect x="25" y="25" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="0.8" />
                <rect x="25" y="25" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="0.8" transform="rotate(45 40 40)" />
                <circle cx="40" cy="40" r="28" fill="none" stroke="currentColor" strokeWidth="0.5" />
                <circle cx="40" cy="40" r="14" fill="none" stroke="currentColor" strokeWidth="0.5" />
                <line x1="0" y1="40" x2="80" y2="40" stroke="currentColor" strokeWidth="0.4" />
                <line x1="40" y1="0" x2="40" y2="80" stroke="currentColor" strokeWidth="0.4" />
                <line x1="0" y1="0" x2="80" y2="80" stroke="currentColor" strokeWidth="0.4" />
                <line x1="80" y1="0" x2="0" y2="80" stroke="currentColor" strokeWidth="0.4" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#islamic-art-${portalType})`} />
          </svg>
        </div>

        {/* Ambient Radial Glow */}
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-white/10 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-black/30 blur-[120px] pointer-events-none" />

        {/* Top Header & Branding */}
        <div className="relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3.5 mb-6"
          >
            <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-2xl border border-white/20 shadow-sm flex items-center justify-center">
              <img 
                src="/alihsan-logo.png"
                alt="Al Ihsan Academy"
                className="h-10 w-auto object-contain brightness-0 invert drop-shadow-sm"
              />
            </div>
            <div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase ${theme.badgeBg} ${theme.badgeText} border border-white/15 backdrop-blur-md shadow-sm`}>
                {portalTitle}
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
              AL IHSAN ACADEMY
            </h1>
            <p className="text-white/70 text-sm md:text-base font-light tracking-wide mt-1">
              of Moral Education
            </p>
          </motion.div>
        </div>

        {/* Center Section: Islamic Quote or Academy Mission */}
        <div className="relative z-10 my-8 md:my-auto">
          {quote ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white/[0.08] backdrop-blur-xl rounded-3xl p-7 lg:p-8 border border-white/15 max-w-lg shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-400 rounded-l-3xl" />
              
              {quote.arabic && (
                <p className="text-xl md:text-2xl font-serif text-right text-white/95 mb-4 leading-relaxed tracking-wide" dir="rtl">
                  {quote.arabic}
                </p>
              )}
              
              <p className="text-base md:text-lg text-white/90 italic font-light leading-relaxed">
                "{quote.text}"
              </p>
              
              <div className="flex items-center gap-3 mt-5 pt-4 border-t border-white/10">
                <div className={`h-[2px] w-6 ${theme.accentBg}`} />
                <p className={`text-xs uppercase tracking-widest font-bold ${theme.accentColor}`}>
                  {quote.author}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white/[0.06] backdrop-blur-xl rounded-3xl p-7 lg:p-8 border border-white/15 max-w-lg shadow-xl"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs uppercase tracking-widest text-white/70 font-semibold">Student Learning Space</span>
              </div>
              <p className="text-base md:text-lg text-white/90 font-light leading-relaxed">
                "Building a generation for tomorrow through authentic knowledge, discipline, and moral excellence."
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-white/50 font-medium">
                <span>Interactive Classes</span>
                <span>•</span>
                <span>Quran & Islamic Studies</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer info & Domain */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-white/70">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            <span className="font-mono tracking-wider font-semibold text-white">alihsanacademy.uk</span>
          </div>
          <div className="flex items-center gap-3 text-white/50">
            <span>Encrypted Connection</span>
            <span>•</span>
            <span>2026</span>
          </div>
        </div>
      </div>

      {/* Right side - Clean & High UX Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 lg:p-16 bg-gray-50/70">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white p-8 md:p-10 rounded-[28px] shadow-2xl shadow-gray-200/60 border border-gray-100"
        >
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3.5">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${theme.accentColor} px-3 py-1 rounded-lg bg-gray-50 border border-gray-200/80`}>
                {roleLabel}
              </span>
              <Link 
                href="/" 
                className="text-xs text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1 font-semibold group"
              >
                <span className="transform group-hover:-translate-x-0.5 transition-transform">←</span> Portals
              </Link>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
              Sign In
            </h2>
            <p className="text-sm text-gray-500 mt-1.5 font-normal">
              Enter your login details to continue to your dashboard.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full bg-gray-50/80 border border-gray-200 text-gray-900 rounded-xl px-4 py-3.5 pl-11 focus:outline-none focus:ring-2 ${theme.ringColor} focus:bg-white transition-all shadow-sm text-sm placeholder-gray-400`}
                  placeholder="name@alihsanacademy.uk"
                  disabled={loading}
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                </svg>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(!showForgotPassword)}
                  className={`text-xs ${theme.accentColor} hover:underline font-semibold transition-colors`}
                  tabIndex={0}
                >
                  Forgot password?
                </button>
              </div>
              
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full bg-gray-50/80 border border-gray-200 text-gray-900 rounded-xl px-4 py-3.5 pl-11 pr-11 focus:outline-none focus:ring-2 ${theme.ringColor} focus:bg-white transition-all shadow-sm text-sm placeholder-gray-400`}
                  placeholder="••••••••"
                  disabled={loading}
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                
                {/* Toggle Password Visibility */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto', x: [0, -6, 6, -6, 0] }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-3.5 bg-red-50/90 border border-red-200 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2.5 overflow-hidden"
                >
                  <svg className="w-4 h-4 flex-shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className={`w-full ${theme.buttonBg} ${theme.buttonHover} text-white mt-6 py-4 rounded-xl font-bold transition-all shadow-lg ${theme.shadowColor} disabled:opacity-50 text-sm flex items-center justify-center gap-2 cursor-pointer`}
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
                <span>Sign In to {roleLabel}</span>
              )}
            </motion.button>
          </form>

          {/* Quick Switcher for other Roles */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
              Need a different portal?
            </p>
            <div className="flex items-center justify-center gap-2.5">
              {portalType !== 'student' && (
                <Link 
                  href="/student/login" 
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 border border-gray-200 transition-colors"
                >
                  Student Portal
                </Link>
              )}
              {portalType !== 'teacher' && (
                <Link 
                  href="/teacher/login" 
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 hover:text-indigo-700 hover:bg-indigo-50 border border-gray-200 transition-colors"
                >
                  Tutor Portal
                </Link>
              )}
              {portalType !== 'admin' && (
                <Link 
                  href="/admin/login" 
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 hover:text-slate-900 hover:bg-slate-100 border border-gray-200 transition-colors"
                >
                  Admin Portal
                </Link>
              )}
            </div>
          </div>

          {/* Forgot Password Accordion */}
          <AnimatePresence>
            {showForgotPassword && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6 pt-6 border-t border-gray-100 overflow-hidden"
              >
                <h3 className="text-sm font-bold text-gray-900 mb-1">Reset Password</h3>
                <p className="text-xs text-gray-500 mb-4">Enter your registered email address to receive recovery instructions.</p>
                
                <form onSubmit={handleResetPassword} className="space-y-3">
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className={`w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 ${theme.ringColor} focus:bg-white transition-all text-xs`}
                    placeholder="Enter your email address"
                  />
                  
                  {resetMessage.text && (
                    <div className={`p-2.5 rounded-xl text-xs font-medium ${resetMessage.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                      {resetMessage.text}
                    </div>
                  )}
                  
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={resetLoading}
                    className="w-full bg-gray-900 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-gray-800 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {resetLoading ? 'Sending...' : 'Send Recovery Link'}
                  </motion.button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
