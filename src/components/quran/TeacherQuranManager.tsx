"use client"

import React, { useState, useEffect } from 'react'
import {
  SURAH_LIST,
  RECITERS,
  QuranAssignment,
  getSurahByNumber
} from '@/lib/quran-data'
import {
  BookOpen,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Eye,
  Award,
  Calendar,
  Sparkles,
  Flame,
  AlertCircle,
  X,
  ChevronRight,
  Filter
} from 'lucide-react'
import { toast } from 'sonner'
import { QuranPlayer } from './QuranPlayer'

interface TeacherQuranManagerProps {
  students: any[]
  teacherId: string | null
}

export function TeacherQuranManager({ students, teacherId }: TeacherQuranManagerProps) {
  // Assignments list state
  const [assignments, setAssignments] = useState<QuranAssignment[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [tablePendingMigration, setTablePendingMigration] = useState<boolean>(false)

  // Filters
  const [filterStudentId, setFilterStudentId] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // New Assignment Modal state
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Form State
  const [targetStudentId, setTargetStudentId] = useState<string>('')
  const [assignmentType, setAssignmentType] = useState<'hifz' | 'reading' | 'tajweed'>('hifz')
  const [selectedSurah, setSelectedSurah] = useState<number>(78) // Defaults to An-Naba
  const [fromAyah, setFromAyah] = useState<number>(1)
  const [toAyah, setToAyah] = useState<number>(10)
  const [defaultReciter, setDefaultReciter] = useState<string>('Husary_Muallim_128kbps')
  const [targetRepeats, setTargetRepeats] = useState<number>(3)
  const [teacherNote, setTeacherNote] = useState<string>('')
  const [dueDate, setDueDate] = useState<string>('')

  // Preview Player Modal
  const [previewAssignment, setPreviewAssignment] = useState<QuranAssignment | null>(null)

  // Fetch teacher's assignments
  const fetchAssignments = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/quran/assignments')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch assignments')

      setAssignments(data.assignments || [])
      setTablePendingMigration(!!data.tablePendingMigration)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Could not load Quran assignments')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAssignments()
  }, [])

  // When Surah changes in form, reset fromAyah and toAyah
  const handleSurahSelection = (surahNum: number) => {
    setSelectedSurah(surahNum)
    const surah = getSurahByNumber(surahNum)
    setFromAyah(1)
    setToAyah(Math.min(10, surah?.total_ayahs || 7))
  }

  // Handle Create Assignment
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetStudentId) {
      toast.error('Please select a student')
      return
    }

    const studentObj = students.find((s) => s.user_id === targetStudentId || s.id === targetStudentId)
    const studentName = studentObj?.name || 'Student'
    const className = studentObj?.class_name || studentObj?.year || null

    setIsSubmitting(true)
    try {
      const payload = {
        studentId: targetStudentId,
        studentName,
        className,
        assignmentType,
        surahNumber: selectedSurah,
        fromAyah,
        toAyah,
        defaultReciter,
        targetRepeats,
        teacherNote,
        dueDate: dueDate || null
      }

      const res = await fetch('/api/quran/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to assign portion')

      toast.success(`Portion assigned to ${studentName}!`)
      setShowAssignModal(false)
      // Reset note
      setTeacherNote('')
      // Refresh list
      fetchAssignments()
    } catch (err: any) {
      toast.error(err.message || 'Could not save assignment')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Delete Assignment
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this assigned portion?')) return

    try {
      const res = await fetch(`/api/quran/assignments?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete assignment')

      toast.success('Assignment removed')
      setAssignments((prev) => prev.filter((a) => a.id !== id))
    } catch (err: any) {
      toast.error(err.message || 'Could not delete assignment')
    }
  }

  // Handle Mark as Completed
  const handleMarkStatus = async (id: string, newStatus: 'assigned' | 'practicing' | 'completed') => {
    try {
      const res = await fetch('/api/quran/assignments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update assignment')

      toast.success(newStatus === 'completed' ? 'Marked as Mastered!' : 'Status updated')
      setAssignments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
      )
    } catch (err: any) {
      toast.error(err.message || 'Could not update status')
    }
  }

  // Filtered list
  const filteredAssignments = assignments.filter((a) => {
    if (filterStudentId !== 'all' && a.student_id !== filterStudentId) return false
    if (filterStatus !== 'all' && a.status !== filterStatus) return false
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const matchSurah = a.surah_name_en.toLowerCase().includes(query)
      const matchStudent = (a.student_name || '').toLowerCase().includes(query)
      return matchSurah || matchStudent
    }
    return true
  })

  // Selected Surah metadata in modal
  const curSurahMeta = getSurahByNumber(selectedSurah) || SURAH_LIST[0]

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900/20 via-teal-900/10 to-transparent border border-emerald-500/20 p-5 rounded-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-600 text-white">
              <BookOpen className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              Quran & Hifz Lesson Manager
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Directly assign Quran memorization (Hifz) & recitation portions to your students with custom reciters and repetition goals.
          </p>
        </div>

        <button
          onClick={() => setShowAssignModal(true)}
          className="px-4 py-2.5 min-h-[44px] text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Assign New Portion
        </button>
      </div>

      {/* Migration Notice if table is pending */}
      {tablePendingMigration && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm space-y-1 text-amber-800 dark:text-amber-300">
            <p className="font-semibold">Supabase Migration Notice</p>
            <p>
              Please run the provided <code className="px-1.5 py-0.5 rounded bg-amber-500/20 font-mono text-xs">quran_assignments_migration.sql</code> script in your Supabase Dashboard SQL Editor to enable persistent database storage.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border/80 rounded-2xl p-4 space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Total Assigned</span>
          <p className="text-2xl font-bold text-foreground">{assignments.length}</p>
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Active Practice</span>
          <p className="text-2xl font-bold text-emerald-600">
            {assignments.filter((a) => a.status === 'practicing' || a.status === 'assigned').length}
          </p>
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Mastered / Completed</span>
          <p className="text-2xl font-bold text-blue-600">
            {assignments.filter((a) => a.status === 'completed').length}
          </p>
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Enrolled Students</span>
          <p className="text-2xl font-bold text-foreground">{students.length}</p>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Student Filter */}
          <select
            value={filterStudentId}
            onChange={(e) => setFilterStudentId(e.target.value)}
            className="h-10 px-3 text-xs sm:text-sm font-medium rounded-xl bg-background border border-input focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Students</option>
            {students.map((s) => (
              <option key={s.user_id || s.id} value={s.user_id || s.id}>
                {s.name} {s.class_name ? `(${s.class_name})` : ''}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-10 px-3 text-xs sm:text-sm font-medium rounded-xl bg-background border border-input focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="assigned">Assigned</option>
            <option value="practicing">Practicing</option>
            <option value="completed">Completed / Mastered</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search surah or student..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-3 text-xs sm:text-sm rounded-xl bg-background border border-input focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Assignments List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            Loading assignments...
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="text-center py-12 bg-card border border-dashed border-border rounded-2xl space-y-3">
            <BookOpen className="w-10 h-10 text-muted-foreground/50 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">No Quran portions found</p>
              <p className="text-xs text-muted-foreground">
                Click &ldquo;Assign New Portion&rdquo; above to assign a Surah and Ayah range to a student.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAssignments.map((a) => (
              <div
                key={a.id}
                className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 hover:border-border transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Card Header: Student & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-foreground">
                        {a.student_name || 'Student'}
                      </h4>
                      {a.class_name && (
                        <span className="text-[11px] text-muted-foreground">{a.class_name}</span>
                      )}
                    </div>

                    <span
                      className={`px-2.5 py-0.5 text-xs font-semibold rounded-full uppercase tracking-wider ${
                        a.status === 'completed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                          : a.status === 'practicing'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                      }`}
                    >
                      {a.status === 'completed' ? 'Mastered' : a.status}
                    </span>
                  </div>

                  {/* Portion Info */}
                  <div className="p-3 bg-muted/40 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {a.assignment_type === 'hifz' ? 'Hifz (Memorization)' : 'Recitation (Nazira)'}
                      </span>
                      <span className="text-muted-foreground">{a.target_repeats}x repetition goal</span>
                    </div>
                    <p className="text-sm sm:text-base font-bold text-foreground">
                      Surah {a.surah_name_en} ({a.surah_name_ar})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ayahs <strong>{a.from_ayah}</strong> to <strong>{a.to_ayah}</strong> (
                      {a.to_ayah - a.from_ayah + 1} verses)
                    </p>
                  </div>

                  {/* Notes & Listened stats */}
                  <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-2 pt-1">
                    <span className="flex items-center gap-1 font-medium">
                      <Flame className="w-3.5 h-3.5 text-orange-500" />
                      Listened: <strong className="text-foreground">{a.listened_count} times</strong>
                    </span>
                    {a.due_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Due: {new Date(a.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {a.teacher_note && (
                    <p className="text-xs text-muted-foreground bg-muted/20 p-2.5 rounded-lg italic">
                      &ldquo;{a.teacher_note}&rdquo;
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/60">
                  <button
                    onClick={() => setPreviewAssignment(a)}
                    className="px-3 py-1.5 min-h-[38px] text-xs font-medium rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-all flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview Player
                  </button>

                  <div className="flex items-center gap-1.5">
                    {a.status !== 'completed' ? (
                      <button
                        onClick={() => handleMarkStatus(a.id, 'completed')}
                        className="px-3 py-1.5 min-h-[38px] text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center gap-1"
                        title="Mark as completed/mastered"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Mark Mastered
                      </button>
                    ) : (
                      <button
                        onClick={() => handleMarkStatus(a.id, 'practicing')}
                        className="px-3 py-1.5 min-h-[38px] text-xs font-medium rounded-xl bg-muted text-muted-foreground hover:bg-muted/80 transition-all"
                        title="Reopen for revision"
                      >
                        Reopen
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(a.id)}
                      className="w-9 h-9 min-h-[38px] min-w-[38px] rounded-xl flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all"
                      title="Delete assignment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ASSIGN NEW PORTION MODAL */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  Assign Quran Portion
                </h3>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4 text-xs sm:text-sm">
              {/* Select Student */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Student *</label>
                <select
                  required
                  value={targetStudentId}
                  onChange={(e) => setTargetStudentId(e.target.value)}
                  className="w-full h-11 px-3 text-sm rounded-xl bg-background border border-input focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">Select a student...</option>
                  {students.map((s) => (
                    <option key={s.user_id || s.id} value={s.user_id || s.id}>
                      {s.name} {s.class_name ? `— ${s.class_name}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assignment Type */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAssignmentType('hifz')}
                  className={`p-2.5 rounded-xl text-xs font-semibold border transition-all ${
                    assignmentType === 'hifz'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted'
                  }`}
                >
                  Hifz (Memorization)
                </button>
                <button
                  type="button"
                  onClick={() => setAssignmentType('reading')}
                  className={`p-2.5 rounded-xl text-xs font-semibold border transition-all ${
                    assignmentType === 'reading'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted'
                  }`}
                >
                  Nazira / Recitation
                </button>
              </div>

              {/* Surah Picker */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Surah *</label>
                <select
                  value={selectedSurah}
                  onChange={(e) => handleSurahSelection(Number(e.target.value))}
                  className="w-full h-11 px-3 text-sm rounded-xl bg-background border border-input focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {SURAH_LIST.map((s) => (
                    <option key={s.number} value={s.number}>
                      {s.number}. {s.name_en} ({s.name_ar}) · {s.total_ayahs} Ayahs
                    </option>
                  ))}
                </select>
              </div>

              {/* From Ayah & To Ayah */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">From Ayah</label>
                  <input
                    type="number"
                    min={1}
                    max={curSurahMeta.total_ayahs}
                    value={fromAyah}
                    onChange={(e) => setFromAyah(Math.max(1, Number(e.target.value)))}
                    className="w-full h-11 px-3 text-sm rounded-xl bg-background border border-input focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">To Ayah</label>
                  <input
                    type="number"
                    min={fromAyah}
                    max={curSurahMeta.total_ayahs}
                    value={toAyah}
                    onChange={(e) =>
                      setToAyah(Math.min(curSurahMeta.total_ayahs, Number(e.target.value)))
                    }
                    className="w-full h-11 px-3 text-sm rounded-xl bg-background border border-input focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Reciter & Repetitions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Default Reciter</label>
                  <select
                    value={defaultReciter}
                    onChange={(e) => setDefaultReciter(e.target.value)}
                    className="w-full h-11 px-2.5 text-xs sm:text-sm rounded-xl bg-background border border-input focus:ring-1 focus:ring-emerald-500"
                  >
                    {RECITERS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Repetition Goal</label>
                  <select
                    value={targetRepeats}
                    onChange={(e) => setTargetRepeats(Number(e.target.value))}
                    className="w-full h-11 px-2.5 text-xs sm:text-sm rounded-xl bg-background border border-input focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value={1}>1 time (Standard)</option>
                    <option value={2}>2 times</option>
                    <option value={3}>3 times (Recommended)</option>
                    <option value={5}>5 times (Hifz)</option>
                    <option value={7}>7 times</option>
                    <option value={10}>10 times</option>
                  </select>
                </div>
              </div>

              {/* Due Date */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Target Completion Date (Optional)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full h-11 px-3 text-sm rounded-xl bg-background border border-input focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Teacher Note */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Teacher Note / Tajweed Focus (Optional)</label>
                <textarea
                  rows={2}
                  value={teacherNote}
                  onChange={(e) => setTeacherNote(e.target.value)}
                  placeholder="e.g. Pay attention to Madd and Ikhfaa in verse 3..."
                  className="w-full p-3 text-sm rounded-xl bg-background border border-input focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2.5 min-h-[44px] text-xs font-semibold rounded-xl bg-muted text-muted-foreground hover:bg-muted/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 min-h-[44px] text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Assigning...' : 'Assign Portion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREVIEW PLAYER MODAL */}
      {previewAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-background/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-card border border-border rounded-3xl w-full max-w-4xl p-4 sm:p-6 shadow-2xl space-y-4 my-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  Teacher Preview: {previewAssignment.student_name}&rsquo;s Portion
                </h3>
              </div>
              <button
                onClick={() => setPreviewAssignment(null)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <QuranPlayer
              initialAssignment={previewAssignment}
              userRole="teacher"
            />
          </div>
        </div>
      )}
    </div>
  )
}
