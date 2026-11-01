"use client"

import React, { useState, useEffect } from 'react'
import { KeyRound, Mail, CheckCircle2, Loader2, ShieldCheck, ArrowRight } from 'lucide-react'
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

  return (
    <div className={`bg-white rounded-xl sm:rounded-2xl border-2 border-border shadow-xs overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-3.5 sm:p-4.5 border-b border-border/70 bg-muted/20 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <KeyRound className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-foreground">Security & Password</h4>
            <p className="text-[11px] text-muted-foreground font-medium">Change your password via email verification</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
          Email Verified
        </span>
      </div>

      {/* Body Content */}
      <div className="p-3.5 sm:p-5 space-y-3.5">
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
              A secure password reset link will be sent to this email address to verify your identity.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSendResetEmail}
            disabled={isSending || cooldown > 0}
            className="h-8.5 px-3.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shrink-0"
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
                <span>Change Password</span>
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
    </div>
  )
}
