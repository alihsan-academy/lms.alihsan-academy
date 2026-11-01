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
import { normalizeTerm } from '@/components/academic-distribution-card'

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
    class_name?: string | null
    year?: string | null
    term?: string | null
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
  const [year, setYear] = useState('')
  const [term, setTerm] = useState('')
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
      setYear(student.year || student.class_name || '')
      const initialTerm = student.term ? normalizeTerm(student.term) : ''
      setTerm(initialTerm === 'Unassigned' ? '' : initialTerm)
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
          year: year || null,
          class_name: year || null,
          term: term || null,
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
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-border/80 overflow-hidden my-auto"
        >
          {/* Minimalist Header */}
          <div className="px-5 py-3.5 bg-white border-b border-border/70 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <UserCheck className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-foreground tracking-tight">Update Student Status</h3>
                <p className="text-[11px] text-muted-foreground font-medium">Manage student enrolment & schedule details</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
            {/* Student Info Bar */}
            <div className="bg-muted/30 p-2.5 sm:p-3 rounded-xl border border-border/70 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar photoUrl={student.profile_photo} name={student.name} size="sm" className="w-8 h-8 text-xs border border-border/60" />
                <div className="min-w-0">
                  <h4 className="font-bold text-foreground text-xs sm:text-sm truncate">{student.name}</h4>
                  <p className="text-[11px] text-muted-foreground font-mono truncate">
                    Reg: #{student.registration_number || 'N/A'}
                  </p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 border ${
                student.enrolment_status === 'ongoing' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                student.enrolment_status === 'break' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                student.enrolment_status === 'stopped' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                'bg-slate-50 text-slate-700 border-slate-200'
              }`}>
                Current: {student.enrolment_status || 'ongoing'}
              </span>
            </div>

            {/* Academic Level: Year & Term */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-2.5 rounded-xl bg-muted/20 border border-border/70">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Class / Year</label>
                <Input
                  placeholder="e.g. Year 1, Tahfeez Grade 1"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="bg-white h-8 text-xs font-medium border-border/80 focus:border-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Term</label>
                <select
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  className="w-full rounded-md border border-border/80 bg-white px-2.5 py-1 text-xs font-medium h-8 cursor-pointer text-foreground focus:border-primary outline-none"
                >
                  <option value="">Select Term</option>
                  <option value="Term 01">Term 01</option>
                  <option value="Term 02">Term 02</option>
                </select>
              </div>
            </div>

            {/* Select Status Options */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Select New Enrolment Status
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* Ongoing Option */}
                <button
                  type="button"
                  onClick={() => setSelectedStatus('ongoing')}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer min-h-[66px] ${
                    selectedStatus === 'ongoing'
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-1 ring-emerald-500/30'
                      : 'border-border/80 bg-white hover:bg-muted/30 text-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                      selectedStatus === 'ongoing' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      <CheckCircle2 className="h-3 w-3" />
                    </span>
                    <span className={`w-3 h-3 rounded-full border ${
                      selectedStatus === 'ongoing' ? 'border-emerald-600 bg-emerald-600' : 'border-muted-foreground/30'
                    }`} />
                  </div>
                  <div>
                    <span className="font-bold text-xs block leading-tight">Ongoing</span>
                    <span className="text-[10px] text-muted-foreground font-medium block">Active classes</span>
                  </div>
                </button>

                {/* Break Option */}
                <button
                  type="button"
                  onClick={() => setSelectedStatus('break')}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer min-h-[66px] ${
                    selectedStatus === 'break'
                      ? 'border-amber-600 bg-amber-50/70 text-amber-950 ring-1 ring-amber-500/30'
                      : 'border-border/80 bg-white hover:bg-muted/30 text-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                      selectedStatus === 'break' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-700'
                    }`}>
                      <Clock className="h-3 w-3" />
                    </span>
                    <span className={`w-3 h-3 rounded-full border ${
                      selectedStatus === 'break' ? 'border-amber-600 bg-amber-600' : 'border-muted-foreground/30'
                    }`} />
                  </div>
                  <div>
                    <span className="font-bold text-xs block leading-tight">On Break</span>
                    <span className="text-[10px] text-muted-foreground font-medium block">Temporary leave</span>
                  </div>
                </button>

                {/* Stopped Option */}
                <button
                  type="button"
                  onClick={() => setSelectedStatus('stopped')}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer min-h-[66px] ${
                    selectedStatus === 'stopped'
                      ? 'border-rose-600 bg-rose-50/70 text-rose-950 ring-1 ring-rose-500/30'
                      : 'border-border/80 bg-white hover:bg-muted/30 text-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                      selectedStatus === 'stopped' ? 'bg-rose-600 text-white' : 'bg-rose-100 text-rose-700'
                    }`}>
                      <XCircle className="h-3 w-3" />
                    </span>
                    <span className={`w-3 h-3 rounded-full border ${
                      selectedStatus === 'stopped' ? 'border-rose-600 bg-rose-600' : 'border-muted-foreground/30'
                    }`} />
                  </div>
                  <div>
                    <span className="font-bold text-xs block leading-tight">Stopped</span>
                    <span className="text-[10px] text-muted-foreground font-medium block">Discontinued</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Dynamic Conditional Form Fields */}
            {selectedStatus === 'ongoing' && (
              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3 text-xs text-emerald-900 font-medium flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Setting this student to <strong>Ongoing</strong> clears any previous break or stopped records. The student will appear as active for scheduling and attendance.
                </p>
              </div>
            )}

            {selectedStatus === 'break' && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-50/40 border border-amber-200/80 rounded-xl p-3.5 space-y-3"
              >
                <div className="flex items-center gap-1.5 text-amber-900 font-bold text-[11px] uppercase tracking-wider">
                  <Calendar className="h-3.5 w-3.5 text-amber-700" />
                  <span>Break Schedule Details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-amber-950">Break Start Date *</label>
                    <Input
                      type="date"
                      value={breakFromDate}
                      onChange={(e) => setBreakFromDate(e.target.value)}
                      className="bg-white border-amber-200 font-medium h-9 text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-amber-950">Break End Date *</label>
                    <Input
                      type="date"
                      value={breakToDate}
                      onChange={(e) => setBreakToDate(e.target.value)}
                      className="bg-white border-amber-200 font-medium h-9 text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-amber-950">Reason / Remarks (Optional)</label>
                  <Textarea
                    rows={2}
                    placeholder="e.g. Traveling for Umrah, School exams, Medical reasons..."
                    value={breakReason}
                    onChange={(e) => setBreakReason(e.target.value)}
                    className="bg-white border-amber-200 font-medium resize-none text-xs"
                  />
                </div>
              </motion.div>
            )}

            {selectedStatus === 'stopped' && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-rose-50/40 border border-rose-200/80 rounded-xl p-3.5 space-y-3"
              >
                <div className="flex items-center gap-1.5 text-rose-900 font-bold text-[11px] uppercase tracking-wider">
                  <AlertCircle className="h-3.5 w-3.5 text-rose-700" />
                  <span>Discontinuation Details</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-rose-950">Last Class Date *</label>
                  <Input
                    type="date"
                    value={lastClassDate}
                    onChange={(e) => setLastClassDate(e.target.value)}
                    className="bg-white border-rose-200 font-medium h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-rose-950">Reason for Stopping *</label>
                  <Textarea
                    rows={2}
                    placeholder="e.g. Course completed, Relocated abroad, Scheduling clash..."
                    value={stoppedReason}
                    onChange={(e) => setStoppedReason(e.target.value)}
                    className="bg-white border-rose-200 font-medium resize-none text-xs"
                    required
                  />
                </div>

                {isAdmin ? (
                  <label className="flex items-center gap-2 cursor-pointer pt-1 bg-white p-2 rounded-lg border border-rose-200/80">
                    <input
                      type="checkbox"
                      checked={revokePortalAccess}
                      onChange={(e) => setRevokePortalAccess(e.target.checked)}
                      className="rounded border-rose-300 text-rose-600 focus:ring-rose-500 h-3.5 w-3.5"
                    />
                    <span className="text-xs font-semibold text-rose-950">
                      Revoke student portal login access (Super Admin)
                    </span>
                  </label>
                ) : (
                  <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-2 text-[11px] text-amber-900 leading-snug">
                    <strong>Notice:</strong> Marking a student as stopped does not revoke their portal login access. Portal login revocation is managed exclusively by Academy Administration.
                  </div>
                )}
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-9 px-4 rounded-lg border border-border bg-white hover:bg-muted font-semibold text-xs text-foreground transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
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
