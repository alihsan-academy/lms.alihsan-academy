'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  BookOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
  Upload,
  FileText,
  Download,
  Search,
  Loader2,
  Send,
  X,
  Trash2,
  ExternalLink,
  Award,
  RotateCcw,
} from 'lucide-react'
import { toast } from 'sonner'

export interface HomeworkAssignment {
  id: string
  class_id: string
  teacher_id: string
  student_id: string
  group_id: string | null
  class_title: string | null
  title: string
  instructions: string | null
  due_date: string | null
  attachment_url: string | null
  attachment_name: string | null
  status: 'pending' | 'submitted' | 'needs_revision' | 'reviewed'
  student_response: string | null
  submission_file_url: string | null
  submission_file_name: string | null
  submitted_at: string | null
  teacher_feedback: string | null
  grade: string | null
  reviewed_at: string | null
  created_at: string
  student_name?: string
  student_reg_no?: string
  teacher_name?: string
}

interface HomeworkPanelProps {
  mode: 'teacher' | 'student'
}

export default function HomeworkPanel({ mode }: HomeworkPanelProps) {
  const supabase = createClient()
  const [assignments, setAssignments] = useState<HomeworkAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTab, setFilterTab] = useState<'primary' | 'secondary' | 'reviewed' | 'all'>('primary')

  // Student submit modal state
  const [submittingItem, setSubmittingItem] = useState<HomeworkAssignment | null>(null)
  const [studentResponse, setStudentResponse] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Teacher evaluate modal state
  const [evaluatingItem, setEvaluatingItem] = useState<HomeworkAssignment | null>(null)
  const [evalStatus, setEvalStatus] = useState<'reviewed' | 'needs_revision'>('reviewed')
  const [evalGrade, setEvalGrade] = useState('')
  const [evalFeedback, setEvalFeedback] = useState('')
  const [isSavingEval, setIsSavingEval] = useState(false)

  async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession()
    return {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    }
  }

  async function fetchHomework() {
    setLoading(true)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/homework', { headers, cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load homework')
      setAssignments(data.assignments || [])
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Could not load homework assignments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHomework()
  }, [])

  async function handleStudentSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!submittingItem) return
    if (!studentResponse.trim() && !selectedFile && !submittingItem.submission_file_url) {
      toast.error('Please write your answer or upload a file.')
      return
    }

    setIsUploading(true)
    try {
      const headers = await getAuthHeaders()
      let submissionFileUrl = submittingItem.submission_file_url
      let submissionFileName = submittingItem.submission_file_name

      if (selectedFile) {
        const urlRes = await fetch('/api/homework/upload-url', {
          method: 'POST',
          headers,
          body: JSON.stringify({ fileName: selectedFile.name, folder: 'submissions' }),
        })
        const urlData = await urlRes.json()
        if (!urlRes.ok) throw new Error(urlData.error || 'Failed to prepare upload')

        const uploadRes = await fetch(urlData.signedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': selectedFile.type || 'application/octet-stream' },
          body: selectedFile,
        })
        if (!uploadRes.ok) throw new Error('File upload failed')

        submissionFileUrl = urlData.publicUrl
        submissionFileName = selectedFile.name
      }

      const res = await fetch('/api/homework', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          id: submittingItem.id,
          action: 'submit',
          studentResponse: studentResponse.trim(),
          submissionFileUrl,
          submissionFileName,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit homework')

      toast.success('Homework submitted successfully!')
      setSubmittingItem(null)
      setStudentResponse('')
      setSelectedFile(null)
      await fetchHomework()
    } catch (err: any) {
      toast.error(err.message || 'Submission failed')
    } finally {
      setIsUploading(false)
    }
  }

  async function handleTeacherEvaluate(e: React.FormEvent) {
    e.preventDefault()
    if (!evaluatingItem) return
    setIsSavingEval(true)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/homework', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          id: evaluatingItem.id,
          action: 'evaluate',
          status: evalStatus,
          grade: evalGrade.trim(),
          teacherFeedback: evalFeedback.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save evaluation')

      toast.success(evalStatus === 'reviewed' ? 'Homework marked as Reviewed!' : 'Sent back for revision.')
      setEvaluatingItem(null)
      await fetchHomework()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save evaluation')
    } finally {
      setIsSavingEval(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this homework assignment?')) return
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`/api/homework?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete')
      toast.success('Homework deleted')
      setAssignments(prev => prev.filter(a => a.id !== id))
    } catch (err: any) {
      toast.error(err.message || 'Delete failed')
    }
  }

  const primaryCount = mode === 'teacher'
    ? assignments.filter(a => a.status === 'submitted').length
    : assignments.filter(a => a.status === 'pending' || a.status === 'needs_revision').length

  const secondaryCount = mode === 'teacher'
    ? assignments.filter(a => a.status === 'pending' || a.status === 'needs_revision').length
    : assignments.filter(a => a.status === 'submitted').length

  const reviewedCount = assignments.filter(a => a.status === 'reviewed').length

  const filtered = assignments.filter(a => {
    if (filterTab === 'primary') {
      if (mode === 'teacher' && a.status !== 'submitted') return false
      if (mode === 'student' && !['pending', 'needs_revision'].includes(a.status)) return false
    } else if (filterTab === 'secondary') {
      if (mode === 'teacher' && !['pending', 'needs_revision'].includes(a.status)) return false
      if (mode === 'student' && a.status !== 'submitted') return false
    } else if (filterTab === 'reviewed') {
      if (a.status !== 'reviewed') return false
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const hay = `${a.title} ${a.instructions || ''} ${a.student_name || ''} ${a.teacher_name || ''} ${a.class_title || ''}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })

  function renderStatusBadge(status: HomeworkAssignment['status']) {
    switch (status) {
      case 'submitted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <Clock className="h-3 w-3" />
            Submitted
          </span>
        )
      case 'needs_revision':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <RotateCcw className="h-3 w-3" />
            Needs Revision
          </span>
        )
      case 'reviewed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            Reviewed
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <AlertCircle className="h-3 w-3" />
            Pending
          </span>
        )
    }
  }

  return (
    <div className="space-y-5 w-full max-w-full">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border-2 border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-black text-foreground text-xl flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#1A6B4A]" />
            <span>{mode === 'teacher' ? 'Homework Review & Evaluation' : 'My Homework'}</span>
          </h3>
          <p className="text-muted-foreground font-medium text-sm">
            {mode === 'teacher'
              ? 'Review student submissions, provide feedback, and track pending assignments.'
              : 'View assigned homework, upload your work, and read teacher feedback.'}
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={mode === 'teacher' ? 'Search student or task...' : 'Search homework...'}
            className="w-full min-h-[44px] pl-9 pr-3 py-2 rounded-xl border border-border bg-muted/30 text-base sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-xl border border-border shadow-xs">
        <button
          type="button"
          onClick={() => setFilterTab('primary')}
          className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            filterTab === 'primary'
              ? 'bg-[#1A6B4A] text-white shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <span>{mode === 'teacher' ? 'Needs Review' : 'To Do'}</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${filterTab === 'primary' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'}`}>
            {primaryCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('secondary')}
          className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            filterTab === 'secondary'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <span>{mode === 'teacher' ? 'Awaiting Student' : 'Submitted'}</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${filterTab === 'secondary' ? 'bg-white/20 text-white' : 'bg-muted text-foreground'}`}>
            {secondaryCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('reviewed')}
          className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            filterTab === 'reviewed'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <span>Reviewed</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${filterTab === 'reviewed' ? 'bg-white/20 text-white' : 'bg-muted text-foreground'}`}>
            {reviewedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('all')}
          className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            filterTab === 'all'
              ? 'bg-primary text-white shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <span>All ({assignments.length})</span>
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-14 gap-3 bg-white rounded-2xl border border-border">
          <Loader2 className="h-7 w-7 animate-spin text-[#1A6B4A]" />
          <p className="text-sm font-semibold text-muted-foreground">Loading homework...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-border p-12 text-center flex flex-col items-center">
          <BookOpen className="h-10 w-10 text-muted-foreground/60 mb-3" />
          <h4 className="text-lg font-black text-foreground">No Homework Here</h4>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            {mode === 'teacher'
              ? 'Assign homework from the "Class Notes & Homework" modal when completing a class.'
              : 'You have no homework matching this filter right now.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-border p-4 sm:p-5 shadow-xs hover:border-primary/40 transition-colors space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-black text-foreground text-base">{item.title}</h4>
                    {renderStatusBadge(item.status)}
                    {item.grade && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                        <Award className="h-3 w-3" />
                        {item.grade}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
                    {mode === 'teacher' ? (
                      <span className="text-primary font-bold">
                        Student: {item.student_name} {item.student_reg_no ? `(#${item.student_reg_no})` : ''}
                      </span>
                    ) : (
                      <span className="text-primary font-bold">Teacher: {item.teacher_name}</span>
                    )}
                    {item.class_title && (
                      <>
                        <span>•</span>
                        <span>{item.class_title}</span>
                      </>
                    )}
                    {item.due_date && (
                      <>
                        <span>•</span>
                        <span className="text-amber-700 font-bold">
                          Due: {new Date(item.due_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {mode === 'student' && (item.status === 'pending' || item.status === 'needs_revision') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSubmittingItem(item)
                        setStudentResponse(item.student_response || '')
                        setSelectedFile(null)
                      }}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-[#1A6B4A] hover:bg-[#14553b] text-white text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Upload className="h-4 w-4" />
                      <span>{item.status === 'needs_revision' ? 'Resubmit Homework' : 'Submit Homework'}</span>
                    </button>
                  )}

                  {mode === 'teacher' && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEvaluatingItem(item)
                          setEvalStatus(item.status === 'needs_revision' ? 'needs_revision' : 'reviewed')
                          setEvalGrade(item.grade || '')
                          setEvalFeedback(item.teacher_feedback || '')
                        }}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-[#1E293B] hover:bg-[#0F172A] text-white text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer shadow-xs"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                        <span>{item.status === 'reviewed' ? 'Update Evaluation' : 'Evaluate / Review'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        title="Delete Homework"
                        className="min-h-[44px] min-w-[44px] p-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {item.instructions && (
                <p className="text-sm text-foreground/90 bg-muted/40 p-3 rounded-xl border border-border/60 whitespace-pre-wrap">
                  {item.instructions}
                </p>
              )}

              {item.attachment_url && (
                <div>
                  <a
                    href={item.attachment_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Reference File: {item.attachment_name || 'Download Attachment'}</span>
                  </a>
                </div>
              )}

              {(item.student_response || item.submission_file_url) && (
                <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-blue-900">
                    Student Submission {item.submitted_at ? `· ${new Date(item.submitted_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : ''}
                  </p>
                  {item.student_response && (
                    <p className="text-sm text-foreground whitespace-pre-wrap">{item.student_response}</p>
                  )}
                  {item.submission_file_url && (
                    <a
                      href={item.submission_file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>View Submitted File: {item.submission_file_name || 'Attachment'}</span>
                    </a>
                  )}
                </div>
              )}

              {item.teacher_feedback && (
                <div className={`rounded-xl p-3 border space-y-1 ${item.status === 'needs_revision' ? 'bg-rose-50/70 border-rose-200' : 'bg-emerald-50/70 border-emerald-200'}`}>
                  <p className={`text-xs font-extrabold uppercase tracking-wider ${item.status === 'needs_revision' ? 'text-rose-900' : 'text-emerald-900'}`}>
                    Teacher Feedback
                  </p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{item.teacher_feedback}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Student Submit Modal */}
      {submittingItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-lg w-full border border-border shadow-xl relative my-auto">
            <button
              type="button"
              onClick={() => setSubmittingItem(null)}
              className="absolute right-3.5 top-3.5 p-2 hover:bg-muted rounded-lg text-muted-foreground cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="text-lg font-black text-foreground mb-1">Submit Homework</h3>
            <p className="text-xs font-semibold text-muted-foreground mb-4">{submittingItem.title}</p>

            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Your Answer / Notes
                </label>
                <textarea
                  rows={4}
                  value={studentResponse}
                  onChange={(e) => setStudentResponse(e.target.value)}
                  placeholder="Write your homework response or notes for your teacher..."
                  className="w-full rounded-xl border border-border p-3 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Attach File (Photo, PDF, Document, or Audio - optional)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full text-base sm:text-sm file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-muted file:text-foreground hover:file:bg-muted/80 cursor-pointer"
                />
                {selectedFile && (
                  <p className="text-xs text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSubmittingItem(null)}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-border text-sm font-bold text-foreground hover:bg-muted cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-[#1A6B4A] hover:bg-[#14553b] text-white text-sm font-bold flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span>{isUploading ? 'Submitting...' : 'Submit Homework'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teacher Evaluate Modal */}
      {evaluatingItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-lg w-full border border-border shadow-xl relative my-auto max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setEvaluatingItem(null)}
              className="absolute right-3.5 top-3.5 p-2 hover:bg-muted rounded-lg text-muted-foreground cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="text-lg font-black text-foreground mb-1">Evaluate Homework</h3>
            <p className="text-xs font-semibold text-muted-foreground mb-4">
              {evaluatingItem.title} · {evaluatingItem.student_name}
            </p>

            {(evaluatingItem.student_response || evaluatingItem.submission_file_url) ? (
              <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3 mb-4 space-y-2">
                <p className="text-xs font-extrabold uppercase text-blue-900">Student Work</p>
                {evaluatingItem.student_response && (
                  <p className="text-sm text-foreground whitespace-pre-wrap">{evaluatingItem.student_response}</p>
                )}
                {evaluatingItem.submission_file_url && (
                  <a
                    href={evaluatingItem.submission_file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-blue-800 border border-blue-200 text-xs font-bold"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Open {evaluatingItem.submission_file_name || 'Submitted File'}</span>
                  </a>
                )}
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs font-semibold text-amber-900">
                The student has not submitted a response yet. You can still record feedback or mark it reviewed.
              </div>
            )}

            <form onSubmit={handleTeacherEvaluate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Evaluation Outcome</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEvalStatus('reviewed')}
                    className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs sm:text-sm font-bold cursor-pointer ${
                      evalStatus === 'reviewed'
                        ? 'bg-[#1A6B4A] text-white border-[#1A6B4A]'
                        : 'bg-white text-foreground border-border hover:bg-muted'
                    }`}
                  >
                    Approved / Reviewed
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvalStatus('needs_revision')}
                    className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs sm:text-sm font-bold cursor-pointer ${
                      evalStatus === 'needs_revision'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white text-foreground border-border hover:bg-muted'
                    }`}
                  >
                    Needs Revision
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Grade / Rating (optional)</label>
                <select
                  value={evalGrade}
                  onChange={(e) => setEvalGrade(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-border px-3 py-2 text-base sm:text-sm font-semibold bg-white"
                >
                  <option value="">No Grade</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Satisfactory">Satisfactory</option>
                  <option value="Needs Practice">Needs Practice</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Teacher Feedback / Remarks</label>
                <textarea
                  rows={3}
                  value={evalFeedback}
                  onChange={(e) => setEvalFeedback(e.target.value)}
                  placeholder="Write encouraging feedback or corrections for the student..."
                  className="w-full rounded-xl border border-border p-3 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEvaluatingItem(null)}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-border text-sm font-bold text-foreground hover:bg-muted cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEval}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-[#1A6B4A] hover:bg-[#14553b] text-white text-sm font-bold flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSavingEval ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  <span>{isSavingEval ? 'Saving...' : 'Save Evaluation'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
