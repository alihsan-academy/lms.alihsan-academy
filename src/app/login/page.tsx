'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-green-700 text-white text-center py-8 px-6 rounded-t-xl">
          <h1 className="text-3xl font-bold">Al-Ihsan Learnings</h1>
          <p className="mt-2 text-green-100">Islamic Online Academy</p>
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
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-green-700 text-white py-3 rounded-lg font-semibold hover:bg-green-800 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  )
}
