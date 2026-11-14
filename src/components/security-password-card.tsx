"use client"

import React, { useState, useEffect } from 'react'
import { KeyRound, Mail, CheckCircle2, Loader2, ShieldCheck, Lock, Eye, EyeOff, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface SecurityPasswordCardProps {
  userEmail: string
  userName?: string
  role?: 'student' | 'teacher' | 'admin' | 'superadmin'
  className?: string
  compact?: boolean
}

export function SecurityPasswordCard({
  userEmail,
  userName,
  role = 'student',
  className = '',
  compact = false
}: SecurityPasswordCardProps) {
  // Direct In-App Change Password State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isUpdatingDirect, setIsUpdatingDirect] = useState(false)
  const [activeTab, setActiveTab] = useState<'direct' | 'email'>('direct')

  // Email Reset Link State
  const [isSending, setIsSending] = useState(false)
  const [hasSent, setHasSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  // Direct In-App Password Update (No email required)
  const handleDirectPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentPassword) {
      toast.error('Please enter your current password.')
      return
    }

    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match.')
      return
    }

    setIsUpdatingDirect(true)
    try {
      const supabase = createClient()

      // 1. Verify current credentials
      if (userEmail) {
        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: userEmail.trim().toLowerCase(),
          password: currentPassword,
        })

        if (verifyError) {
          toast.error('Current password is incorrect. Please check your existing password.')
          setIsUpdatingDirect(false)
          return
        }
      }

      // 2. Update to new password directly on the active session
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        toast.error(updateError.message || 'Failed to update password.')
        setIsUpdatingDirect(false)
        return
      }

      toast.success('Your password has been changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      console.error('Password change error:', err)
      toast.error(err.message || 'An unexpected error occurred while updating your password.')
    } finally {
      setIsUpdatingDirect(false)
    }
  }

  // Send Email Reset Link
  const handleSendResetEmail = async () => {
    if (!userEmail) {
      toast.error('No registered email found for this profile.')
      return
    }

    if (cooldown > 0) {
      toast.info(`Please wait ${cooldown}s before requesting another reset email.`)
      return
    }

    setIsSending(true)
    try {
      const supabase = createClient()
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://alihsan-lms.vercel.app'
      const redirectTo = `${origin}/reset-password`

      const { error } = await supabase.auth.resetPasswordForEmail(userEmail.trim().toLowerCase(), {
        redirectTo
      })

      if (error) {
        if (error.message?.toLowerCase().includes('rate limit')) {
          toast.error('Email rate limit reached. Please wait a couple of minutes before requesting again.')
          setCooldown(60)
        } else {
          toast.error(error.message || 'Failed to send password reset email.')
        }
        return
      }

      setHasSent(true)
      setCooldown(60)
      toast.success(`Password reset verification email sent to ${userEmail}!`)
    } catch (err: any) {
      console.error('Password reset email error:', err)
      toast.error(err.message || 'Failed to send password reset email.')
    } finally {
      setIsSending(false)
    }
  }

  const isInternalPlaceholderEmail = Boolean(userEmail && userEmail.includes('@student.alihsanacademy.uk'))

  return (
    <div className={`bg-white rounded-xl sm:rounded-2xl border-2 border-border shadow-xs overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-3.5 sm:p-4.5 border-b border-border/70 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-700/10 text-emerald-800 flex items-center justify-center shrink-0">
            <KeyRound className="h-4 w-4 text-emerald-700" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-foreground">Security & Password</h4>
            <p className="text-[11px] text-muted-foreground font-medium">
              Update your account password directly or via email verification
            </p>
          </div>
        </div>

        {/* Tab switchers: Direct Change vs Email Link */}
        <div className="flex items-center bg-muted/40 p-1 rounded-lg border border-border/70 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('direct')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer min-h-[32px] ${
              activeTab === 'direct'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Direct Change (Instant)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer min-h-[32px] ${
              activeTab === 'email'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Email Link
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-4 sm:p-6">
        {activeTab === 'direct' ? (
          <form onSubmit={handleDirectPasswordChange} className="space-y-4">
            <div className="bg-emerald-50/60 p-3 sm:p-3.5 rounded-xl border border-emerald-200/60 text-emerald-950 text-xs flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Instant Self-Service: </span>
                Enter your current temporary password, set a new password, and save. No email inbox check required.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Current Password */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold text-foreground">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                    disabled={isUpdatingDirect}
                    className="w-full h-11 px-3.5 pr-11 rounded-lg border border-input bg-white text-sm text-foreground focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-0"
                    aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-foreground">
                  New Password <span className="text-muted-foreground font-normal">(Min. 6 chars)</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    disabled={isUpdatingDirect}
                    className="w-full h-11 px-3.5 pr-11 rounded-lg border border-input bg-white text-sm text-foreground focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-0"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-foreground">
                  Confirm New Password
                </label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  disabled={isUpdatingDirect}
                  className="w-full h-11 px-3.5 rounded-lg border border-input bg-white text-sm text-foreground focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 outline-none transition-all"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isUpdatingDirect}
                className="h-11 px-6 rounded-xl bg-emerald-800 hover:bg-emerald-900 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 min-h-[44px]"
              >
                {isUpdatingDirect ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Update Password Now</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3.5">
            <div className="bg-muted/30 p-3 sm:p-3.5 rounded-xl border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Registered Email</span>
                  <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                    <ShieldCheck className="h-2.5 w-2.5" /> Protected
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-mono font-bold text-foreground truncate">
                  {userEmail || 'No email specified'}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {isInternalPlaceholderEmail
                    ? 'This account currently uses an internal ID. Use the Direct Change tab to update your password without email.'
                    : 'A secure password reset link will be sent to this email address to verify your identity.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleSendResetEmail}
                disabled={isSending || cooldown > 0 || isInternalPlaceholderEmail}
                className="h-10 px-4 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shrink-0 min-h-[44px]"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Sending Link...</span>
                  </>
                ) : cooldown > 0 ? (
                  <span>Resend in {cooldown}s</span>
                ) : (
                  <>
                    <Mail className="h-3.5 w-3.5" />
                    <span>Send Reset Email</span>
                  </>
                )}
              </button>
            </div>

            {hasSent && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Reset Verification Link Dispatched!</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed pl-5.5">
                  We have sent a secure password reset link to <strong>{userEmail}</strong>. Please check your inbox (and spam/junk folder), click the link, and choose your new password.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
