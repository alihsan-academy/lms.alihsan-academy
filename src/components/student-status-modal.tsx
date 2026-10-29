"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Calendar, 
  Loader2, 
  Save, 
  AlertCircle,
  Sparkles,
  UserCheck
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar } from '@/components/avatar'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export type EnrolmentStatus = 'ongoing' | 'break' | 'stopped'

export interface StudentStatusModalProps {
  isOpen: boolean
  onClose: () => void
  student: {
    id: string
    user_id?: string
    name: string
    registration_number?: string
    profile_photo?: string | null
    enrolment_status?: EnrolmentStatus | string
    break_from_date?: string | null
    break_to_date?: string | null
    break_reason?: string | null
    last_class_date?: string | null
    stopped_reason?: string | null
    login_revoked?: boolean
    stopped_by?: string | null
  } | null
  onSuccess?: (updatedData?: any) => void
  isAdmin?: boolean
}

export function StudentStatusModal({
  isOpen,
  onClose,
  student,
  onSuccess,
  isAdmin = true
}: StudentStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<EnrolmentStatus>('ongoing')
  const [breakFromDate, setBreakFromDate] = useState('')
  const [breakToDate, setBreakToDate] = useState('')
  const [breakReason, setBreakReason] = useState('')
  const [lastClassDate, setLastClassDate] = useState('')
  const [stoppedReason, setStoppedReason] = useState('')
  const [revokePortalAccess, setRevokePortalAccess] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form state when student changes
  useEffect(() => {
    if (student) {
      const current = (student.enrolment_status as EnrolmentStatus) || 'ongoing'
      setSelectedStatus(['ongoing', 'break', 'stopped'].includes(current) ? current : 'ongoing')
      setBreakFromDate(student.break_from_date || '')
      setBreakToDate(student.break_to_date || '')
      setBreakReason(student.break_reason || '')
      setLastClassDate(student.last_class_date || '')
      setStoppedReason(student.stopped_reason || '')
    }
  }, [student, isOpen])

  if (!isOpen || !student) return null

  const studentIdentifier = student.user_id || student.id

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (selectedStatus === 'break') {
      if (!breakFromDate) {
        toast.error('Please enter the break start date.')
        return
      }
      if (!breakToDate) {
        toast.error('Please enter the break end date.')
        return
      }
      if (new Date(breakFromDate) > new Date(breakToDate)) {
        toast.error('Break start date cannot be after the end date.')
        return
      }
    } else if (selectedStatus === 'stopped') {
      if (!lastClassDate) {
        toast.error('Please enter the last class date.')
        return
      }
      if (!stoppedReason.trim()) {
        toast.error('Please provide a reason for stopping enrolment.')
        return
      }
    }

    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/student/status', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          studentId: studentIdentifier,
          enrolmentStatus: selectedStatus,
          breakFromDate: selectedStatus === 'break' ? breakFromDate : null,
          breakToDate: selectedStatus === 'break' ? breakToDate : null,
          breakReason: selectedStatus === 'break' ? breakReason.trim() : null,
          lastClassDate: selectedStatus === 'stopped' ? lastClassDate : null,
          stoppedReason: selectedStatus === 'stopped' ? stoppedReason.trim() : null,
          loginRevoked: selectedStatus === 'stopped' ? (isAdmin ? revokePortalAccess : false) : false,
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update student status')
      }

      toast.success(`Enrolment status updated to "${selectedStatus.toUpperCase()}"`)
      if (onSuccess) {
        onSuccess(data.updatedRecord || {
          ...student,
          enrolment_status: selectedStatus,
          break_from_date: selectedStatus === 'break' ? breakFromDate : null,
          break_to_date: selectedStatus === 'break' ? breakToDate : null,
          break_reason: selectedStatus === 'break' ? breakReason : null,
          last_class_date: selectedStatus === 'stopped' ? lastClassDate : null,
          stopped_reason: selectedStatus === 'stopped' ? stoppedReason : null,
        })
      }
      onClose()
    } catch (err: any) {
      console.error('Status update error:', err)
      toast.error(err.message || 'Failed to update status')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border-2 border-border overflow-hidden my-auto"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-5 text-white flex items-center justify-between border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-black text-base sm:text-lg text-white">Update Student Status</h3>
                <p className="text-xs text-slate-300 font-medium">Manage student enrolment & schedules</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
            {/* Student Info Bar */}
            <div className="bg-muted/40 p-3 sm:p-3.5 rounded-xl border border-border flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar photoUrl={student.profile_photo} name={student.name} size="sm" />
                <div className="min-w-0">
                  <h4 className="font-extrabold text-foreground text-sm truncate">{student.name}</h4>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    Reg: #{student.registration_number || 'N/A'}
                  </p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shrink-0 border ${
                student.enrolment_status === 'ongoing' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                student.enrolment_status === 'break' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                student.enrolment_status === 'stopped' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                'bg-slate-50 text-slate-700 border-slate-200'
              }`}>
                Current: {student.enrolment_status || 'ongoing'}
              </span>
            </div>

            {/* Select Status Options */}
            <div className="space-y-2.5">
              <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Select New Enrolment Status
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Ongoing Option */}
                <button
                  type="button"
                  onClick={() => setSelectedStatus('ongoing')}
                  className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer min-h-[72px] ${
                    selectedStatus === 'ongoing'
                      ? 'border-emerald-500 bg-emerald-50/80 shadow-xs ring-2 ring-emerald-500/20'
                      : 'border-border/80 bg-white hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </span>
                    <span className={`w-3.5 h-3.5 rounded-full border-2 ${
                      selectedStatus === 'ongoing' ? 'border-emerald-600 bg-emerald-600' : 'border-muted-foreground/30'
                    }`} />
                  </div>
                  <div>
                    <span className="font-extrabold text-xs sm:text-sm text-foreground block">Ongoing</span>
                    <span className="text-[10px] text-muted-foreground font-medium block">Active classes</span>
                  </div>
                </button>

                {/* Break Option */}
                <button
                  type="button"
                  onClick={() => setSelectedStatus('break')}
                  className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer min-h-[72px] ${
                    selectedStatus === 'break'
                      ? 'border-amber-500 bg-amber-50/80 shadow-xs ring-2 ring-amber-500/20'
                      : 'border-border/80 bg-white hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">
                      <Clock className="h-3.5 w-3.5" />
                    </span>
                    <span className={`w-3.5 h-3.5 rounded-full border-2 ${
                      selectedStatus === 'break' ? 'border-amber-600 bg-amber-600' : 'border-muted-foreground/30'
                    }`} />
                  </div>
                  <div>
                    <span className="font-extrabold text-xs sm:text-sm text-foreground block">On Break</span>
                    <span className="text-[10px] text-muted-foreground font-medium block">Temporary leave</span>
                  </div>
                </button>

                {/* Stopped Option */}
                <button
                  type="button"
                  onClick={() => setSelectedStatus('stopped')}
                  className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer min-h-[72px] ${
                    selectedStatus === 'stopped'
                      ? 'border-rose-500 bg-rose-50/80 shadow-xs ring-2 ring-rose-500/20'
                      : 'border-border/80 bg-white hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-bold">
                      <XCircle className="h-3.5 w-3.5" />
                    </span>
                    <span className={`w-3.5 h-3.5 rounded-full border-2 ${
                      selectedStatus === 'stopped' ? 'border-rose-600 bg-rose-600' : 'border-muted-foreground/30'
                    }`} />
                  </div>
                  <div>
                    <span className="font-extrabold text-xs sm:text-sm text-foreground block">Stopped</span>
                    <span className="text-[10px] text-muted-foreground font-medium block">Discontinued</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Dynamic Conditional Form Fields */}
            {selectedStatus === 'ongoing' && (
              <div className="bg-emerald-50/70 border-2 border-emerald-200/80 rounded-xl p-3.5 text-xs text-emerald-900 font-semibold flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Setting this student to <strong>Ongoing</strong> clears any previous break or stopped reasons. The student will appear as active for scheduling and attendance.
                </p>
              </div>
            )}

            {selectedStatus === 'break' && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-50/60 border-2 border-amber-200/80 rounded-xl p-4 space-y-3.5"
              >
                <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs uppercase tracking-wider">
                  <Calendar className="h-4 w-4 text-amber-700" />
                  <span>Break Schedule Details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-amber-950">Break Start Date *</Label>
                    <Input
                      type="date"
                      value={breakFromDate}
                      onChange={(e) => setBreakFromDate(e.target.value)}
                      className="bg-white border-amber-300 font-medium h-11 text-base sm:text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-amber-950">Break End Date *</Label>
                    <Input
                      type="date"
                      value={breakToDate}
                      onChange={(e) => setBreakToDate(e.target.value)}
                      className="bg-white border-amber-300 font-medium h-11 text-base sm:text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-amber-950">Reason / Remarks (Optional)</Label>
                  <Textarea
                    rows={2}
                    placeholder="e.g. Traveling for Umrah, School exams, Medical reasons..."
                    value={breakReason}
                    onChange={(e) => setBreakReason(e.target.value)}
                    className="bg-white border-amber-300 font-medium resize-none text-base sm:text-sm"
                  />
                </div>
              </motion.div>
            )}

            {selectedStatus === 'stopped' && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-rose-50/60 border-2 border-rose-200/80 rounded-xl p-4 space-y-3.5"
              >
                <div className="flex items-center gap-1.5 text-rose-900 font-bold text-xs uppercase tracking-wider">
                  <AlertCircle className="h-4 w-4 text-rose-700" />
                  <span>Discontinuation Details</span>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-rose-950">Last Class Date *</Label>
                  <Input
                    type="date"
                    value={lastClassDate}
                    onChange={(e) => setLastClassDate(e.target.value)}
                    className="bg-white border-rose-300 font-medium h-11 text-base sm:text-sm"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-rose-950">Reason for Stopping *</Label>
                  <Textarea
                    rows={2}
                    placeholder="e.g. Course completed, Relocated abroad, Scheduling clash..."
                    value={stoppedReason}
                    onChange={(e) => setStoppedReason(e.target.value)}
                    className="bg-white border-rose-300 font-medium resize-none text-base sm:text-sm"
                    required
                  />
                </div>

                {isAdmin ? (
                  <label className="flex items-center gap-2.5 cursor-pointer pt-1 bg-white p-2.5 rounded-lg border border-rose-200">
                    <input
                      type="checkbox"
                      checked={revokePortalAccess}
                      onChange={(e) => setRevokePortalAccess(e.target.checked)}
                      className="rounded border-rose-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
                    />
                    <span className="text-xs font-bold text-rose-950">
                      Revoke student portal login access (Super Admin)
                    </span>
                  </label>
                ) : (
                  <div className="bg-amber-100/70 border border-amber-200 rounded-lg p-2.5 text-[11px] text-amber-900 leading-snug">
                    <strong>Notice:</strong> Marking a student as stopped does not revoke their portal login access. Portal login revocation is managed exclusively by Academy Administration.
                  </div>
                )}
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 h-12 rounded-xl border-2 border-border bg-white hover:bg-muted font-bold text-sm text-foreground transition-colors disabled:opacity-60 cursor-pointer min-h-[48px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative flex-[2] h-12 min-h-[48px] bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:via-teal-700 hover:to-emerald-800 active:scale-[0.99] text-white font-extrabold text-sm sm:text-base rounded-xl shadow-[0_6px_20px_-3px_rgba(16,185,129,0.35)] hover:shadow-[0_10px_25px_-3px_rgba(16,185,129,0.45)] transition-all duration-200 border border-emerald-400/30 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer overflow-hidden"
              >
                <span className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Saving Status...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
