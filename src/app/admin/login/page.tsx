'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdminLoginPage() {
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

  const handleLogin = async () => {
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      // 1. Sign in
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        })

      if (authError) {
        const msg = authError.message || ''
        if (isNetworkAuthError(msg)) {
          setError('Network issue connecting to Supabase. Please check internet and try again.')
        } else {
          setError('Invalid email or password')
        }
        setLoading(false)
        return
      }

      // 2. Fetch Profile via our new secure API (Bypasses RLS Loop)
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
          setError('Profile not found. Please contact admin.')
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
      setError('An unexpected error occurred.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    setResetMessage({ type: '', text: '' })
    if (!resetEmail) {
      setResetMessage({ type: 'error', text: 'Please enter your email address' })
      return
    }
    
    setResetLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail)
      
      if (error) {
        setResetMessage({ type: 'error', text: error.message })
      } else {
        setResetMessage({ type: 'success', text: 'Password reset link sent to your email' })
        setResetEmail('')
      }
    } catch (err) {
      setResetMessage({ type: 'error', text: 'An unexpected error occurred' })
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white font-sans">
      {/* Left side - Image & Branding */}
      <div className="relative w-full md:w-1/2 h-[40vh] md:h-screen overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-10000 hover:scale-105"
          style={{ backgroundImage: "url('/madrasa_background.jpg')" }}
        />
        {/* Elegant Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/60 to-gray-900/30" />
        
        {/* Logo and Text over image */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-black/20 backdrop-blur-md p-10 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center max-w-sm"
          >
            <img 
              src="/alihsan-logo.png"
              alt="Al Ihsan Academy"
              className="h-28 md:h-36 object-contain drop-shadow-2xl mb-6"
            />
            <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-lg leading-tight tracking-tight">
              AL IHSAN ACADEMY <br/>
              <span className="text-xl md:text-2xl font-medium text-green-400 mt-2 block">Admin Portal</span>
            </h1>
            <div className="w-16 h-1 bg-green-500 rounded-full mt-6 mb-6 opacity-80"></div>
            <p className="text-base md:text-lg text-gray-200 italic drop-shadow-md font-light">
              "Building a generation for tomorrow"
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-gray-50/50">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md bg-white p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100"
        >
          <div className="mb-10">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Admin Login
            </h2>
            <p className="text-sm text-gray-500 mt-3 font-medium">
              Please sign in to access your dashboard
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent focus:bg-white transition-all shadow-sm"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent focus:bg-white transition-all shadow-sm"
                placeholder="Enter your password"
              />
            </div>
          </div>
          
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto', x: [0, -8, 8, -8, 0] }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4 }}
                className="mt-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium overflow-hidden flex items-center"
              >
                <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-green-600 text-white mt-8 py-4 rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 transition-all shadow-lg shadow-green-600/30"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </motion.button>

          <div className="mt-8 flex justify-center">
            <button
              onClick={() => setShowForgotPassword(!showForgotPassword)}
              className="text-sm text-green-600 hover:text-green-800 font-semibold transition-colors"
            >
              Forgot your password?
            </button>
          </div>

          <AnimatePresence>
            {showForgotPassword && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6 pt-6 border-t border-gray-100 overflow-hidden"
              >
                <h3 className="text-sm font-bold text-gray-900 mb-2">Reset Password</h3>
                <p className="text-sm text-gray-500 mb-4">Enter your email and we'll send you a link to reset your password.</p>
                
                <div className="mb-4">
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent focus:bg-white transition-all shadow-sm text-sm"
                    placeholder="Enter your email"
                  />
                </div>
                
                {resetMessage.text && (
                  <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${resetMessage.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                    {resetMessage.text}
                  </div>
                )}
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleResetPassword}
                  disabled={resetLoading}
                  className="w-full bg-gray-900 text-white py-3 rounded-xl text-sm font-bold hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-md"
                >
                  {resetLoading ? 'Sending...' : 'Send Reset Link'}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
