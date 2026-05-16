'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'

export default function LoginPage() {
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-md"
      >
        <motion.div 
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gray-900 rounded-t-xl p-6 text-center"
        >
          <img 
            src="/alihsan-logo.png"
            alt="Al Ihsan Academy"
            className="h-24 mx-auto object-contain"
          />
        </motion.div>
        <div className="bg-white p-6 pb-2 text-center border-x border-gray-100">
          <h1 className="text-xl font-bold text-gray-800">
            AL IHSAN Academy of Moral Education
          </h1>
          <p className="text-sm text-gray-500 italic mt-1">
            "Building a generation for tomorrow"
          </p>
        </div>
        <div className="bg-white px-6 py-8 rounded-b-xl shadow-lg">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter your email"
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter your password"
            />
          </div>
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto', x: [0, -8, 8, -8, 0] }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm overflow-hidden"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-green-700 text-white py-3 rounded-lg font-semibold hover:bg-green-800 disabled:opacity-50 transition-colors shadow-md"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </motion.button>

          <div className="mt-4 text-center">
            <button
              onClick={() => setShowForgotPassword(!showForgotPassword)}
              className="text-sm text-green-700 hover:text-green-800 hover:underline font-medium"
            >
              Forgot Password?
            </button>
          </div>

          {showForgotPassword && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
              className="mt-6 pt-6 border-t border-gray-100 overflow-hidden"
            >
              <h3 className="text-sm font-bold text-gray-800 mb-2">Reset Password</h3>
              <p className="text-xs text-gray-500 mb-3">Enter your email and we'll send you a link to reset your password.</p>
              
              <div className="mb-3">
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  placeholder="Enter your email"
                />
              </div>
              
              {resetMessage.text && (
                <div className={`mb-3 p-3 rounded-lg text-sm ${resetMessage.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                  {resetMessage.text}
                </div>
              )}
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleResetPassword}
                disabled={resetLoading}
                className="w-full bg-gray-800 text-white py-2 rounded-lg text-sm font-semibold hover:bg-gray-900 disabled:opacity-50 transition-colors"
              >
                {resetLoading ? 'Sending...' : 'Send Reset Link'}
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
