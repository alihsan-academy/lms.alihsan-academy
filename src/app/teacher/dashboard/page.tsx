"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogoutButton } from '@/components/logout-button'
import { AcademyHeader } from '@/components/academy-header'
import { Calendar, Plus, BarChart3, Loader2, Video, CheckCircle, Clock, User, Globe, AlertCircle, ChevronDown, Users, Copy, Sparkles, Pencil, X, Download, FileText, CheckCircle2, XCircle, Search } from 'lucide-react'
import { format, parseISO, addWeeks, isAfter, startOfToday } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Avatar } from '@/components/avatar'
import { motion, AnimatePresence } from 'framer-motion'
import { Skeleton } from '@/components/skeleton'
import { AnimatedCard } from '@/components/animated-card'
import { BouncyButton } from '@/components/bouncy-button'
import { PageTransition } from '@/components/page-transition'
import { DateRangeFilter } from '@/components/date-range-filter'
import { DateFilterType, getDateRange, calculateStudentAttendanceSummary, formatUKDateTime, isDateWithinRange, parseClassMetadata } from '@/lib/attendance-utils'
import { generateStudentAttendancePDF, generateTeacherAttendancePDF } from '@/lib/pdf-generator'
import { ClassDatePicker, ClassTimePicker } from '@/components/class-date-time-picker'

import TeacherProfilePage from '@/app/teacher/profile/page'

type Tab = 'classes' | 'create' | 'stats' | 'profile'

export default function TeacherDashboard() {
  const formatUKTime = (scheduledAt: string) => {
    return new Date(scheduledAt).toLocaleString('en-GB', {
      timeZone: 'Europe/London',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('classes')
  const [isLoading, setIsLoading] = useState(true)
  const [teacherId, setTeacherId] = useState<string | null>(null)
  const [teacherName, setTeacherName] = useState<string>('')
  const [teacherEmail, setTeacherEmail] = useState<string>('')
  const supabase = createClient()

  // Data state
  const [students, setStudents] = useState<any[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')
  const [classes, setClasses] = useState<any[]>([])
  const [allTeacherClasses, setAllTeacherClasses] = useState<any[]>([])
  const [allAttendance, setAllAttendance] = useState<any[]>([])
  const [currentTime, setCurrentTime] = useState<number>(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now())
    }, 10000)
    return () => clearInterval(timer)
  }, [])

  // Modal for completing/marking class
  const [pendingCompleteClass, setPendingCompleteClass] = useState<any>(null)
  const [completionStatus, setCompletionStatus] = useState<'present' | 'absent' | 'teacher_unavailable' | 'student_unavailable' | 'break'>('present')
  const [recordingUrl, setRecordingUrl] = useState('')
  const [classRemarks, setClassRemarks] = useState('')
  const [isCompleting, setIsCompleting] = useState(false)
  
  // Modal for editing student enrolment status
  const [statusEditTarget, setStatusEditTarget] = useState<string | null>(null)
  const [statusFormData, setStatusFormData] = useState({
    enrolmentStatus: 'ongoing',
    breakFromDate: '',
    breakToDate: '',
    breakReason: '',
    lastClassDate: '',
    stoppedReason: ''
  })
  const [isStatusSubmitting, setIsStatusSubmitting] = useState(false)

  // Filter state for Stats / Attendance Tab
  const [statsFilter, setStatsFilter] = useState<DateFilterType>('all_time')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [viewingStudentDetail, setViewingStudentDetail] = useState<any>(null)
  const [studentSearchQuery, setStudentSearchQuery] = useState('')
  const [isExportingSummary, setIsExportingSummary] = useState(false)
  const [isExportingStudentPDF, setIsExportingStudentPDF] = useState(false)

  const fetchStudentsList = async (tId: string) => {
    const response = await fetch('/api/teacher/students')
    const result = await response.json()
    if (response.ok && result.students) {
      if (result.teacher?.name) setTeacherName(result.teacher.name)
      if (result.teacher?.email) setTeacherEmail(result.teacher.email)
      const mappedStudents = result.students.map((s: any) => ({ ...s, id: s.user_id }))
      setStudents(mappedStudents)
      return mappedStudents
    }
    return []
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsLoading(false)
        router.push('/login')
        return
      }
      setTeacherId(user.id)
      setTeacherEmail(user.email || '')
      setTeacherName(user.user_metadata?.full_name || user.user_metadata?.name || user.email)

      const mappedStudents = await fetchStudentsList(user.id)
      if (mappedStudents.length > 0) {
        setSelectedStudentId(mappedStudents[0].id)
      }
      await fetchAllTeacherData()
      setIsLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (teacherId && selectedStudentId) {
      fetchClasses(selectedStudentId)
    }
  }, [teacherId, selectedStudentId])

  useEffect(() => {
    if (teacherId && activeTab === 'stats') {
      fetchAllTeacherData()
    }
  }, [teacherId, activeTab])

  async function fetchClasses(studentId: string) {
    if (!studentId) return
    const response = await fetch(`/api/classes/teacher?studentId=${encodeURIComponent(studentId)}`)
    const result = await response.json()
    if (!response.ok) {
      setClasses([])
      return
    }
    setClasses(result.classes || [])
  }

  async function fetchAllTeacherData() {
    if (!teacherId) return
    try {
      const response = await fetch('/api/teacher/stats')
      const result = await response.json()
      if (response.ok) {
        setAllTeacherClasses(result.classes || [])
        setAllAttendance(result.attendance || [])
      }
    } catch (e) {
      console.error('Error fetching teacher stats data:', e)
    }
  }

  async function handleCompleteClassSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pendingCompleteClass) return

    if (new Date(pendingCompleteClass.scheduled_at).getTime() > Date.now()) {
      toast.error('Attendance can only be marked after the scheduled class date and time.')
      return
    }

    setIsCompleting(true)
    try {
      const response = await fetch('/api/classes/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: pendingCompleteClass.id,
          studentId: pendingCompleteClass.student_id,
          status: completionStatus,
          recordingUrl: recordingUrl.trim() || null,
          remarks: classRemarks.trim() || null,
        })
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to mark class status")

      toast.success("Class status updated successfully! 🎉")
      setPendingCompleteClass(null)
      setRecordingUrl('')
      setClassRemarks('')
      setCompletionStatus('present')
      
      await fetchClasses(selectedStudentId)
      await fetchAllTeacherData()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsCompleting(false)
    }
  }

  async function handleUpdateStatus(e: React.FormEvent) {
    e.preventDefault()
    if (!statusEditTarget) return
    setIsStatusSubmitting(true)
    try {
      const response = await fetch('/api/student/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: statusEditTarget,
          ...statusFormData
        })
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      toast.success("Student status updated successfully!")
      setStatusEditTarget(null)
      if (teacherId) {
        await fetchStudentsList(teacherId)
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsStatusSubmitting(false)
    }
  }

  const openStatusEdit = (student: any) => {
    setStatusEditTarget(student.id)
    setStatusFormData({
      enrolmentStatus: student.enrolment_status || 'ongoing',
      breakFromDate: student.break_from_date || '',
      breakToDate: student.break_to_date || '',
      breakReason: student.break_reason || '',
      lastClassDate: student.last_class_date || '',
      stoppedReason: student.stopped_reason || ''
    })
  }

  // Calculate filtered stats for Stats tab
  const resolvedDateRange = getDateRange(statsFilter, customStart, customEnd)

  const filteredTeacherClasses = allTeacherClasses.filter((c: any) => 
    isDateWithinRange(c.scheduled_at, resolvedDateRange)
  )

  // Compute breakdown for all students under this teacher
  let overallScheduled = 0
  let overallAttended = 0
  let overallAbsent = 0
  let overallTeacherUnavailable = 0
  let overallStudentUnavailable = 0
  let overallBreak = 0

  const studentBreakdownList = students.map((s) => {
    const studentClasses = allTeacherClasses.filter((c: any) => c.student_id === s.id)
    const studentSummary = calculateStudentAttendanceSummary(
      studentClasses,
      allAttendance,
      s,
      resolvedDateRange
    )

    overallScheduled += studentSummary.totalScheduled
    overallAttended += studentSummary.attendedCount
    overallAbsent += (studentSummary.notAttendedCount - studentSummary.teacherUnavailableCount - studentSummary.studentUnavailableCount - studentSummary.breakCount)
    overallTeacherUnavailable += studentSummary.teacherUnavailableCount
    overallStudentUnavailable += studentSummary.studentUnavailableCount
    overallBreak += studentSummary.breakCount

    let remarks = ''
    if (s.enrolment_status === 'break' && s.break_reason) {
      remarks = `Break: ${s.break_reason}`
    } else if (studentSummary.teacherUnavailableCount > 0) {
      remarks = `${studentSummary.teacherUnavailableCount} Teacher Missed`
    } else if (studentSummary.studentUnavailableCount > 0) {
      remarks = `${studentSummary.studentUnavailableCount} Student Missed`
    }

    return {
      student: s,
      registration_number: s.registration_number || 'N/A',
      name: s.name,
      enrolment_status: s.enrolment_status || 'ongoing',
      scheduled: studentSummary.totalScheduled,
      attended: studentSummary.attendedCount,
      notAttended: studentSummary.notAttendedCount,
      remarks,
      percentage: studentSummary.attendanceRate,
      summary: studentSummary,
    }
  })

  const filteredStudentBreakdownList = studentBreakdownList.filter((item) => {
    const q = studentSearchQuery.toLowerCase().trim()
    if (!q) return true
    const nameMatch = item.name && item.name.toLowerCase().includes(q)
    const regMatch = item.registration_number && String(item.registration_number).toLowerCase().includes(q)
    return Boolean(nameMatch || regMatch)
  })

  const overallNotAttended = overallAbsent + overallTeacherUnavailable + overallStudentUnavailable + overallBreak
  const completedOrMissed = overallAttended + overallNotAttended
  const overallPercentage = completedOrMissed > 0 ? Math.round((overallAttended / completedOrMissed) * 100) : 0

  const handleDownloadTeacherSummaryPDF = () => {
    try {
      setIsExportingSummary(true)
      generateTeacherAttendancePDF({
        teacher: {
          name: teacherName,
          email: teacherEmail,
          total_students: students.length,
        },
        periodLabel: resolvedDateRange.label,
        summaryStats: {
          totalStudents: students.length,
          totalScheduled: overallScheduled,
          totalAttended: overallAttended,
          totalNotAttended: overallNotAttended,
          totalTeacherUnavailable: overallTeacherUnavailable,
          totalStudentUnavailable: overallStudentUnavailable,
          overallPercentage: overallPercentage,
        },
        studentsData: studentBreakdownList.map((item) => ({
          registration_number: item.registration_number,
          name: item.name,
          enrolment_status: item.enrolment_status,
          scheduled: item.scheduled,
          attended: item.attended,
          notAttended: item.notAttended,
          remarks: item.remarks,
          percentage: item.percentage,
        })),
      })
      toast.success('Teacher summary report downloaded! 📄')
    } catch (e: any) {
      toast.error('Failed to generate PDF: ' + e.message)
    } finally {
      setIsExportingSummary(false)
    }
  }

  const handleDownloadSingleStudentPDF = (studentItem: any) => {
    try {
      setIsExportingStudentPDF(true)
      generateStudentAttendancePDF({
        student: {
          name: studentItem.name,
          registration_number: studentItem.registration_number,
          class_name: studentItem.student?.class_name,
          enrolment_status: studentItem.enrolment_status,
          teacher_name: teacherName,
        },
        periodLabel: resolvedDateRange.label,
        summary: studentItem.summary,
      })
      toast.success(`PDF downloaded for ${studentItem.name}! 📄`)
    } catch (e: any) {
      toast.error('Failed to generate PDF: ' + e.message)
    } finally {
      setIsExportingStudentPDF(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-white border-b-2 border-border p-4 flex justify-between items-center shadow-sm">
          <Skeleton className="h-8 w-40 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </header>
        <div className="p-8 max-w-5xl mx-auto w-full space-y-6">
          <Skeleton className="h-12 w-1/3 rounded-full" />
          <div className="grid grid-cols-1 gap-4">
            <Skeleton className="h-32 w-full rounded-3xl" />
            <Skeleton className="h-32 w-full rounded-3xl" />
            <Skeleton className="h-32 w-full rounded-3xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24 md:pb-0 font-sans selection:bg-primary/20">
      <header className="bg-white border-b-2 border-border p-3 md:p-4 flex justify-between items-center sticky top-0 z-50 shadow-sm backdrop-blur-md bg-white/90">
        <div className="flex items-center gap-3">
          <AcademyHeader size="sm" showTagline={false} />
          {teacherName && (
            <div className="hidden sm:flex flex-col border-l-2 border-border pl-4 ml-2">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Educator</span>
              <h2 className="font-extrabold text-foreground leading-tight text-lg">{teacherName}</h2>
            </div>
          )}
        </div>
        <LogoutButton />
      </header>

      {/* Desktop Navigation */}
      <div className="hidden md:block bg-white border-b border-border px-8">
        <nav className="flex space-x-1.5 max-w-5xl mx-auto py-2">
          <button 
            onClick={() => setActiveTab('classes')} 
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 border ${
              activeTab === 'classes' 
                ? 'bg-[#1E293B] text-white border-[#1E293B] shadow-sm' 
                : 'text-muted-foreground hover:text-foreground border-transparent hover:bg-muted'
            }`}
          >
            <Calendar className="h-4 w-4" /> Schedule
          </button>
          <button 
            onClick={() => setActiveTab('create')} 
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 border ${
              activeTab === 'create' 
                ? 'bg-[#1E293B] text-white border-[#1E293B] shadow-sm' 
                : 'text-muted-foreground hover:text-foreground border-transparent hover:bg-muted'
            }`}
          >
            <Plus className="h-4 w-4" /> New Class
          </button>
          <button 
            onClick={() => setActiveTab('stats')} 
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 border ${
              activeTab === 'stats' 
                ? 'bg-[#1E293B] text-white border-[#1E293B] shadow-sm' 
                : 'text-muted-foreground hover:text-foreground border-transparent hover:bg-muted'
            }`}
          >
            <BarChart3 className="h-4 w-4" /> Attendance & Stats
          </button>
          <button 
            onClick={() => setActiveTab('profile')} 
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 border ${
              activeTab === 'profile' 
                ? 'bg-[#1E293B] text-white border-[#1E293B] shadow-sm' 
                : 'text-muted-foreground hover:text-foreground border-transparent hover:bg-muted'
            }`}
          >
            <User className="h-4 w-4" /> Profile
          </button>
        </nav>
      </div>

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8">
        <AnimatePresence mode="wait">
          {activeTab === 'classes' && (
            <PageTransition key="classes" className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border-2 border-border shadow-sm flex flex-col md:flex-row md:items-center gap-4 justify-between">
                <div>
                  <h3 className="font-black text-foreground text-xl">My Schedule</h3>
                  <p className="text-muted-foreground font-medium text-sm">Select a student to view their upcoming and past classes.</p>
                </div>
                <div className="flex flex-col gap-1.5 w-full md:w-72">
                  <div className="relative w-full">
                    <select 
                      className="w-full h-9 px-3 pr-8 border border-border rounded-lg bg-white text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none appearance-none cursor-pointer shadow-sm"
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      disabled={students.length === 0}
                    >
                      {students.length > 0 ? (
                        students.map(s => <option key={s.id} value={s.id}>{s.name} • #{s.registration_number || 'No Reg'}</option>)
                      ) : (
                        <option value="">No students assigned</option>
                      )}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                  {students.length > 0 && selectedStudentId && (() => {
                    const s = students.find(st => st.id === selectedStudentId)
                    return s ? (
                      <div className="flex items-center gap-2 justify-end mt-1">
                        <StatusBadge status={s.enrolment_status || 'ongoing'} />
                        <button onClick={() => openStatusEdit(s)} className="p-1.5 hover:bg-muted rounded-full transition-colors" title="Edit Student Status">
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>
                    ) : null
                  })()}
                </div>
              </div>

              <div className="space-y-4">
                {students.length === 0 ? (
                  <AnimatedCard delay={0.1} className="text-center p-12 border-dashed shadow-none bg-transparent flex flex-col items-center">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                      <Users className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h4 className="text-xl font-black text-foreground mb-1">No Students Assigned</h4>
                    <p className="text-muted-foreground font-medium">Please contact the administration to assign students to you.</p>
                  </AnimatedCard>
                ) : classes.length > 0 ? (
                  classes.map((c, index) => {
                    const parsed = parseClassMetadata(c, allAttendance.find(a => a.class_id === c.id), students.find(s => s.id === c.student_id))
                    const student = students.find(s => s.id === c.student_id)
                    const isClassTimeReached = new Date(c.scheduled_at).getTime() <= currentTime
                    return (
                      <AnimatedCard key={c.id} delay={index * 0.03} className="p-0 overflow-hidden hover:border-primary/40 transition-colors rounded-xl border border-border shadow-sm">
                        <div className="p-3.5 md:p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                          <div className="flex items-center gap-3.5">
                            <Avatar photoUrl={student?.profile_photo} name={student?.name} size="md" />
                            <div className="space-y-0.5">
                              <h4 className="font-bold text-foreground text-sm md:text-base leading-tight">{student?.name || 'Unknown Student'}</h4>
                              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                                <span>{formatUKTime(c.scheduled_at)} (UK Time)</span>
                              </div>
                              {parsed.remarks && (
                                <p className="text-[11px] bg-muted/60 text-muted-foreground px-2 py-0.5 rounded font-medium inline-block">
                                  <strong className="text-foreground">Note:</strong> {parsed.remarks}
                                </p>
                              )}
                              {c.meet_link && (
                                <a href={c.meet_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 bg-[#0D4A47]/10 text-[#0D4A47] hover:bg-[#0D4A47]/20 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors mt-1">
                                  <Video className="h-3.5 w-3.5" />
                                  Join Meeting Link
                                </a>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col md:items-end gap-2 w-full md:w-auto self-end md:self-center">
                            <div className="flex flex-wrap items-center gap-2 md:justify-end">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                parsed.status === 'present'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : parsed.status === 'teacher_unavailable' || parsed.status === 'student_unavailable' || parsed.status === 'absent'
                                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                                  : parsed.status === 'break'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-blue-50 text-blue-800 border-blue-200'
                              }`}>
                                {parsed.statusLabel}
                              </span>

                              {parsed.recording_url && (
                                <a href={parsed.recording_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded hover:bg-teal-100 transition-colors">
                                  🎬 Recording
                                </a>
                              )}
                            </div>

                            {isClassTimeReached ? (
                              <button
                                onClick={() => {
                                  setPendingCompleteClass(c)
                                  setCompletionStatus(c.status === 'completed' && parsed.status !== 'present' && parsed.status !== 'scheduled' ? parsed.status : 'present')
                                  setRecordingUrl(parsed.recording_url || '')
                                  setClassRemarks(parsed.remarks || '')
                                }} 
                                className="w-full sm:w-auto px-3 py-2 rounded-md text-xs font-semibold bg-[#1E293B] hover:bg-[#0F172A] text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm min-h-[38px]"
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                {c.status === 'completed' ? 'Update Status' : 'Mark Attendance'}
                              </button>
                            ) : (
                              <div className="w-full sm:w-auto px-3 py-1.5 rounded-md text-xs font-semibold bg-muted/70 text-muted-foreground border border-border/70 flex items-center justify-center gap-1.5 min-h-[38px]">
                                <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                <span>Attendance opens after class time</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </AnimatedCard>
                    )
                  })
                ) : (
                  <AnimatedCard delay={0.1} className="text-center p-12 border-dashed shadow-none bg-transparent flex flex-col items-center">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                      <Calendar className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h4 className="text-xl font-black text-foreground mb-1">Clear Schedule!</h4>
                    <p className="text-muted-foreground font-medium">No classes found for this student. Time to schedule one!</p>
                  </AnimatedCard>
                )}
              </div>
            </PageTransition>
          )}

          {activeTab === 'create' && (
            <PageTransition key="create">
              <CreateClassForm
                students={students}
                teacherId={teacherId}
                onCreated={(studentId) => {
                  setSelectedStudentId(studentId)
                  setActiveTab('classes')
                  fetchClasses(studentId)
                  fetchAllTeacherData()
                }}
              />
            </PageTransition>
          )}

          {activeTab === 'stats' && (
            <PageTransition key="stats" className="space-y-6">
              {/* Header and Download Summary Button */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-black text-foreground text-2xl">Teacher Attendance & Performance 🌟</h3>
                  <p className="text-sm font-medium text-muted-foreground mt-0.5">
                    Track overall student turnout, individual student logs, and export summary transcripts.
                  </p>
                </div>

                <BouncyButton
                  onClick={handleDownloadTeacherSummaryPDF}
                  disabled={isExportingSummary}
                  variant="default"
                  className="bg-primary hover:bg-primary/90 text-white font-black flex items-center gap-2 self-start md:self-auto shadow-md"
                >
                  {isExportingSummary ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Download Summary PDF
                </BouncyButton>
              </div>

              {/* Date Filter Bar */}
              <DateRangeFilter
                currentFilter={statsFilter}
                customStart={customStart}
                customEnd={customEnd}
                onFilterChange={(f, s, e) => {
                  setStatsFilter(f)
                  if (s) setCustomStart(s)
                  if (e) setCustomEnd(e)
                }}
                resolvedRange={resolvedDateRange}
              />

              {/* Overall KPI Cards for chosen period */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Total Scheduled" value={overallScheduled} index={0} gradient="from-purple-600 to-indigo-700" subtitle="In this period" />
                <StatCard title="Completed / Attended" value={overallAttended} index={1} gradient="from-emerald-600 to-teal-700" subtitle="Classes held" />
                <StatCard title="Not Attended" value={overallNotAttended} index={2} gradient="from-rose-600 to-red-700" subtitle="Absent / Missed" />
                <StatCard title="Turnout Rate" value={`${overallPercentage}%`} index={3} gradient="from-blue-600 to-cyan-700" subtitle="Average score" />
              </div>

              {/* Secondary Metrics Ribbon */}
              <div className="bg-white p-3 md:p-4 rounded-xl border border-border shadow-sm grid grid-cols-2 md:grid-cols-4 gap-2.5 text-center">
                <div className="p-2.5 bg-red-50/70 rounded-lg border border-red-100">
                  <span className="text-[10px] font-semibold text-red-700 block uppercase tracking-wider">Teacher Unavailable</span>
                  <span className="text-lg font-bold text-red-900">{overallTeacherUnavailable}</span>
                </div>
                <div className="p-2.5 bg-orange-50/70 rounded-lg border border-orange-100">
                  <span className="text-[10px] font-semibold text-orange-700 block uppercase tracking-wider">Student Unavailable</span>
                  <span className="text-lg font-bold text-orange-900">{overallStudentUnavailable}</span>
                </div>
                <div className="p-2.5 bg-amber-50/70 rounded-lg border border-amber-100">
                  <span className="text-[10px] font-semibold text-amber-700 block uppercase tracking-wider">On Break</span>
                  <span className="text-lg font-bold text-amber-900">{overallBreak}</span>
                </div>
                <div className="p-2.5 bg-blue-50/70 rounded-lg border border-blue-100">
                  <span className="text-[10px] font-semibold text-blue-700 block uppercase tracking-wider">Assigned Students</span>
                  <span className="text-lg font-bold text-blue-900">{students.length}</span>
                </div>
              </div>

              {/* Student Breakdown Section */}
              <AnimatedCard delay={0.2} className="p-5 md:p-6 rounded-xl border border-border shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-bold text-foreground text-lg">Assigned Students Attendance</h3>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">
                      Breakdown for <strong>{resolvedDateRange.label}</strong>
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full w-max">
                    {students.length} Students Total
                  </span>
                </div>

                {/* Search Input Filter */}
                <div className="mb-4">
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      placeholder="Search students by name or registration number..."
                      className="pl-9 pr-8 h-9 text-xs font-medium bg-white border border-border rounded-lg focus-visible:ring-1 focus-visible:ring-primary"
                    />
                    {studentSearchQuery && (
                      <button
                        onClick={() => setStudentSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted text-muted-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  {studentSearchQuery && (
                    <p className="text-[11px] text-muted-foreground mt-1.5 font-medium">
                      Showing {filteredStudentBreakdownList.length} of {studentBreakdownList.length} students matching "{studentSearchQuery}"
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  {filteredStudentBreakdownList.length > 0 ? (
                    filteredStudentBreakdownList.map((item, i) => (
                      <div key={item.student.id || i} className="bg-muted/30 p-3.5 md:p-4 rounded-xl border border-border hover:border-primary/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar photoUrl={item.student.profile_photo} name={item.name} size="md" />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-foreground text-sm">{item.name}</h4>
                              <StatusBadge status={item.enrolment_status} />
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-semibold">
                                Reg: #{item.registration_number}
                              </span>
                              <span className="text-xs text-muted-foreground font-medium">
                                {item.attended} / {item.scheduled} Classes Attended
                              </span>
                              {item.remarks && (
                                <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-medium">
                                  {item.remarks}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end md:self-center">
                          <div className="text-right">
                            <span className="font-bold text-lg text-foreground">{item.percentage}%</span>
                            <span className="block text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Rate</span>
                          </div>

                          <button
                            onClick={() => setViewingStudentDetail(item)}
                            className="px-3 py-1.5 rounded-md text-xs font-semibold border border-border bg-white hover:bg-muted text-foreground transition-colors flex items-center gap-1.5 shadow-sm"
                          >
                            <FileText className="h-3.5 w-3.5 text-primary" /> View Details & PDF
                          </button>
                        </div>
                      </div>
                    ))
                  ) : studentSearchQuery ? (
                    <div className="text-center py-8 bg-muted/20 rounded-xl border border-dashed border-border">
                      <Search className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-foreground">No students found matching "{studentSearchQuery}"</p>
                      <button
                        onClick={() => setStudentSearchQuery('')}
                        className="text-xs font-semibold text-primary hover:underline mt-1"
                      >
                        Clear search filter
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <BarChart3 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-muted-foreground font-medium text-xs">No students assigned to your profile.</p>
                    </div>
                  )}
                </div>
              </AnimatedCard>
            </PageTransition>
          )}

          {activeTab === 'profile' && (
            <PageTransition key="profile">
              <TeacherProfilePage />
            </PageTransition>
          )}
        </AnimatePresence>

        {/* Modal: Mark Attendance / Complete Class */}
        <AnimatePresence>
          {pendingCompleteClass && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-w-lg w-full border-2 border-border shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto"
              >
                <button 
                  onClick={() => setPendingCompleteClass(null)} 
                  className="absolute right-4 top-4 p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>

                <h3 className="text-xl font-black mb-1">Mark Class Attendance</h3>
                <p className="text-xs text-muted-foreground font-medium mb-5">
                  Record attendance outcome, attach recording links, and provide notes.
                </p>

                <form onSubmit={handleCompleteClassSubmit} className="space-y-4">
                  {/* Status Selection */}
                  <div className="space-y-2">
                    <Label className="text-foreground font-bold">Attendance Outcome *</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setCompletionStatus('present')}
                        className={`p-3 rounded-xl border-2 text-left font-bold text-xs transition-all flex items-center gap-2 ${
                          completionStatus === 'present'
                            ? 'border-green-500 bg-green-50 text-green-800 shadow-sm'
                            : 'border-border bg-white text-muted-foreground hover:bg-muted/30'
                        }`}
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <div>
                          <span>✅ Attended</span>
                          <span className="block text-[10px] font-normal text-green-700">Class completed</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCompletionStatus('student_unavailable')}
                        className={`p-3 rounded-xl border-2 text-left font-bold text-xs transition-all flex items-center gap-2 ${
                          completionStatus === 'student_unavailable'
                            ? 'border-orange-500 bg-orange-50 text-orange-800 shadow-sm'
                            : 'border-border bg-white text-muted-foreground hover:bg-muted/30'
                        }`}
                      >
                        <XCircle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                        <div>
                          <span>⚠️ Student Absent</span>
                          <span className="block text-[10px] font-normal text-orange-700">Student unavailable</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCompletionStatus('teacher_unavailable')}
                        className={`p-3 rounded-xl border-2 text-left font-bold text-xs transition-all flex items-center gap-2 ${
                          completionStatus === 'teacher_unavailable'
                            ? 'border-red-500 bg-red-50 text-red-800 shadow-sm'
                            : 'border-border bg-white text-muted-foreground hover:bg-muted/30'
                        }`}
                      >
                        <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                        <div>
                          <span>🚫 Teacher Missed</span>
                          <span className="block text-[10px] font-normal text-red-700">Teacher unavailable</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCompletionStatus('break')}
                        className={`p-3 rounded-xl border-2 text-left font-bold text-xs transition-all flex items-center gap-2 ${
                          completionStatus === 'break'
                            ? 'border-amber-500 bg-amber-50 text-amber-800 shadow-sm'
                            : 'border-border bg-white text-muted-foreground hover:bg-muted/30'
                        }`}
                      >
                        <Clock className="h-4 w-4 text-amber-600 flex-shrink-0" />
                        <div>
                          <span>⏸️ On Break</span>
                          <span className="block text-[10px] font-normal text-amber-700">Approved leave</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Recording Link */}
                  <div className="space-y-1.5">
                    <Label className="text-foreground font-bold text-xs">Recording Link (optional)</Label>
                    <div className="relative">
                      <Video className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="https://tldv.io/app/meetings/... or Zoom link"
                        value={recordingUrl}
                        onChange={(e) => setRecordingUrl(e.target.value)}
                        className="pl-9 h-11 rounded-xl border-2 font-medium text-base md:text-sm"
                      />
                    </div>
                  </div>

                  {/* Remarks / Reason */}
                  <div className="space-y-1.5">
                    <Label className="text-foreground font-bold text-xs">Remarks / Reason (optional)</Label>
                    <Input 
                      placeholder="e.g. Completed Surah Al-Mulk, internet connectivity issue, etc."
                      value={classRemarks}
                      onChange={(e) => setClassRemarks(e.target.value)}
                      className="h-11 rounded-xl border-2 font-medium text-base md:text-sm"
                    />
                  </div>

                  <div className="flex gap-3 pt-3">
                    <BouncyButton 
                      type="button"
                      variant="ghost" 
                      className="flex-1 border-2 border-border" 
                      onClick={() => setPendingCompleteClass(null)}
                    >
                      Cancel
                    </BouncyButton>
                    <BouncyButton 
                      type="submit" 
                      disabled={isCompleting}
                      variant="default" 
                      className="flex-1 bg-primary hover:bg-primary/90 text-white font-black"
                    >
                      {isCompleting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                      Save Attendance
                    </BouncyButton>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal: View Single Student Logs & PDF */}
        <AnimatePresence>
          {viewingStudentDetail && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-3xl p-6 max-w-2xl w-full border-2 border-border shadow-2xl relative my-8 max-h-[90vh] flex flex-col"
              >
                <div className="flex items-center justify-between pb-4 border-b-2 border-border">
                  <div className="flex items-center gap-3">
                    <Avatar photoUrl={viewingStudentDetail.student?.profile_photo} name={viewingStudentDetail.name} size="md" />
                    <div>
                      <h3 className="text-xl font-black text-foreground">{viewingStudentDetail.name}</h3>
                      <p className="text-xs text-muted-foreground font-bold">
                        Reg: #{viewingStudentDetail.registration_number} • Period: {resolvedDateRange.label}
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setViewingStudentDetail(null)} 
                    className="p-2 hover:bg-muted rounded-full transition-colors"
                  >
                    <X className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>

                <div className="overflow-y-auto py-4 space-y-4 flex-1">
                  {/* KPI Mini-cards */}
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2.5 bg-muted/40 rounded-xl border border-border">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Scheduled</span>
                      <span className="text-lg font-black text-foreground">{viewingStudentDetail.summary.totalScheduled}</span>
                    </div>
                    <div className="p-2.5 bg-green-50 rounded-xl border border-green-200">
                      <span className="text-[10px] uppercase font-bold text-green-700 block">Attended</span>
                      <span className="text-lg font-black text-green-800">{viewingStudentDetail.summary.attendedCount}</span>
                    </div>
                    <div className="p-2.5 bg-red-50 rounded-xl border border-red-200">
                      <span className="text-[10px] uppercase font-bold text-red-700 block">Not Attended</span>
                      <span className="text-lg font-black text-red-800">{viewingStudentDetail.summary.notAttendedCount}</span>
                    </div>
                    <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200">
                      <span className="text-[10px] uppercase font-bold text-blue-700 block">Score</span>
                      <span className="text-lg font-black text-blue-800">{viewingStudentDetail.summary.attendanceRate}%</span>
                    </div>
                  </div>

                  {/* Sessions list */}
                  <div className="space-y-2">
                    <h5 className="font-bold text-sm text-foreground">Class Sessions ({viewingStudentDetail.summary.filteredClasses.length})</h5>
                    <div className="divide-y border-2 border-border rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                      {viewingStudentDetail.summary.filteredClasses.length > 0 ? (
                        viewingStudentDetail.summary.filteredClasses.map((item: any, idx: number) => (
                          <div key={idx} className="p-3 text-xs flex items-center justify-between hover:bg-muted/20">
                            <div>
                              <span className="font-bold text-foreground block">{formatUKDateTime(item.scheduled_at)}</span>
                              {item.remarks && <span className="text-[11px] text-muted-foreground">{item.remarks}</span>}
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                              item.status === 'present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {item.statusLabel}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center text-xs text-muted-foreground font-semibold">No classes in this period.</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t-2 border-border flex gap-3">
                  <BouncyButton
                    onClick={() => handleDownloadSingleStudentPDF(viewingStudentDetail)}
                    disabled={isExportingStudentPDF}
                    variant="default"
                    className="w-full bg-primary hover:bg-primary/90 text-white font-black flex items-center justify-center gap-2"
                  >
                    {isExportingStudentPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Download Student Attendance PDF
                  </BouncyButton>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal: Edit Student Status */}
        <AnimatePresence>
          {statusEditTarget && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3.5 sm:p-4 overflow-y-auto"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-w-md w-full border-2 border-border shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto"
              >
                <button onClick={() => setStatusEditTarget(null)} className="absolute right-4 top-4 p-2 hover:bg-muted rounded-full transition-colors">
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
                <h3 className="text-xl font-black mb-4">Edit Student Status</h3>
                
                <form onSubmit={handleUpdateStatus} className="space-y-4 mb-6">
                  <div className="space-y-2">
                    <Label className="text-foreground font-semibold text-xs">Enrolment Status</Label>
                    <div className="grid grid-cols-1 gap-2 pt-1">
                      {[
                        { id: 'ongoing', label: 'Ongoing', desc: 'Regular active student attendance', icon: '✅', border: 'border-emerald-200 bg-emerald-50/50 text-emerald-900', activeRing: 'ring-2 ring-emerald-600 border-emerald-600 bg-emerald-50' },
                        { id: 'break', label: 'On a Break', desc: 'Temporary leave with scheduled dates', icon: '🕐', border: 'border-amber-200 bg-amber-50/50 text-amber-900', activeRing: 'ring-2 ring-amber-600 border-amber-600 bg-amber-50' },
                        { id: 'stopped', label: 'Stopped', desc: 'Completed or discontinued course', icon: '🛑', border: 'border-red-200 bg-red-50/50 text-red-900', activeRing: 'ring-2 ring-red-600 border-red-600 bg-red-50' }
                      ].map(opt => {
                        const isSelected = statusFormData.enrolmentStatus === opt.id
                        return (
                          <button
                            type="button"
                            key={opt.id}
                            onClick={() => setStatusFormData(prev => ({ ...prev, enrolmentStatus: opt.id }))}
                            className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                              isSelected ? opt.activeRing : `${opt.border} hover:opacity-90`
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-base">{opt.icon}</span>
                              <div>
                                <span className="font-bold text-xs block">{opt.label}</span>
                                <span className="text-[10px] text-muted-foreground font-medium">{opt.desc}</span>
                              </div>
                            </div>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-primary bg-primary text-white' : 'border-muted-foreground/30 bg-white'
                            }`}>
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  
                  {statusFormData.enrolmentStatus === 'break' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-foreground font-bold text-xs">From Date</Label>
                          <Input type="date" required value={statusFormData.breakFromDate} onChange={e => setStatusFormData(prev => ({...prev, breakFromDate: e.target.value}))} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-foreground font-bold text-xs">To Date</Label>
                          <Input type="date" required value={statusFormData.breakToDate} onChange={e => setStatusFormData(prev => ({...prev, breakToDate: e.target.value}))} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground font-bold text-xs">Reason (optional)</Label>
                        <Input value={statusFormData.breakReason} onChange={e => setStatusFormData(prev => ({...prev, breakReason: e.target.value}))} />
                      </div>
                    </>
                  )}
                  
                  {statusFormData.enrolmentStatus === 'stopped' && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-foreground font-bold text-xs">Last Class Date</Label>
                        <Input type="date" required value={statusFormData.lastClassDate} onChange={e => setStatusFormData(prev => ({...prev, lastClassDate: e.target.value}))} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground font-bold text-xs">Reason (optional)</Label>
                        <Input value={statusFormData.stoppedReason} onChange={e => setStatusFormData(prev => ({...prev, stoppedReason: e.target.value}))} />
                      </div>
                    </>
                  )}
                  
                  <BouncyButton type="submit" disabled={isStatusSubmitting} variant="default" className="w-full mt-4 h-12">
                    {isStatusSubmitting ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : null}
                    Save Status
                  </BouncyButton>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-border flex justify-around p-3 z-50 md:hidden pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.08)] rounded-t-3xl">
        <NavBtn active={activeTab === 'classes'} onClick={() => setActiveTab('classes')} icon={<Calendar className={activeTab === 'classes' ? 'fill-primary/20' : ''} />} label="Schedule" />
        <NavBtn active={activeTab === 'create'} onClick={() => setActiveTab('create')} icon={<Plus className={activeTab === 'create' ? 'fill-primary/20' : ''} />} label="Create" />
        <NavBtn active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={<BarChart3 className={activeTab === 'stats' ? 'fill-primary/20' : ''} />} label="Stats" />
        <NavBtn active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User className={activeTab === 'profile' ? 'fill-primary/20' : ''} />} label="Profile" />
      </nav>
    </div>
  )
}

function StatCard({ title, value, index, subtitle }: { title: string, value: any, index: number, gradient?: string, subtitle?: string }) {
  return (
    <AnimatedCard delay={index * 0.05} className="border border-border bg-white p-4 relative overflow-hidden rounded-xl shadow-sm">
      <p className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase mb-1">{title}</p>
      <p className="text-2xl md:text-3xl font-bold text-foreground">{value}</p>
      {subtitle && <span className="text-[11px] text-muted-foreground font-medium mt-0.5 block">{subtitle}</span>}
    </AnimatedCard>
  )
}

function NavBtn({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button 
      onClick={onClick} 
      className={`flex flex-col items-center justify-center min-h-[48px] py-1 px-2 w-full transition-colors ${active ? 'text-primary font-bold' : 'text-muted-foreground'}`}
    >
      <div className={`p-1 rounded-md mb-0.5 ${active ? 'bg-primary/10' : ''}`}>
        {icon}
      </div>
      <span className="text-[10px]">{label}</span>
    </button>
  )
}

function CreateClassForm({ students, teacherId, onCreated }: { students: any[], teacherId: string | null, onCreated: (studentId: string) => void }) {
  const [formData, setFormData] = useState({ studentId: '', meetLink: '', date: '', time: '', repeatWeekly: false })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  useEffect(() => {
    if (students.length > 0) setFormData(prev => ({ ...prev, studentId: students[0].id }))
  }, [students])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teacherId) return
    if (!formData.studentId) {
      toast.error('Please select a student')
      return
    }
    if (!formData.date) {
      toast.error('Please select a class date')
      return
    }
    if (!formData.time) {
      toast.error('Please select a class time')
      return
    }
    
    setIsSubmitting(true)
    try {
      const dateTimeString = `${formData.date}T${formData.time}:00`
      const ukDate = new Date(
        new Date(dateTimeString).toLocaleString('en-US', {
          timeZone: 'Europe/London'
        })
      )
      const utcOffset = new Date(dateTimeString).getTime() - ukDate.getTime()
      const scheduledUTC = new Date(new Date(dateTimeString).getTime() + utcOffset)

      const response = await fetch('/api/classes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: formData.studentId,
          meetLink: formData.meetLink,
          date: formData.date,
          time: formData.time,
          repeatWeekly: formData.repeatWeekly
        })
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to create class")

      const ukDisplay = scheduledUTC.toLocaleString('en-GB', {
        timeZone: 'Europe/London',
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
      toast.success(`Class created for ${ukDisplay} UK time! 🚀`)

      setFormData(prev => ({
        ...prev,
        meetLink: '',
        date: '',
        time: '',
        repeatWeekly: false
      }))
      onCreated(formData.studentId)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatedCard className="max-w-2xl mx-auto p-6 md:p-8 border-t-8 border-t-primary">
      <h3 className="text-2xl font-black text-foreground mb-8 flex items-center gap-3">
        <span className="bg-primary/20 p-2 rounded-xl text-primary"><Plus className="h-6 w-6" /></span>
        Schedule New Class
      </h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label className="text-foreground font-bold">Select Student</Label>
          <div className="relative">
            <div 
              className="w-full p-4 border-2 border-border rounded-xl bg-muted/30 focus:ring-4 focus:ring-primary/20 outline-none cursor-pointer flex items-center justify-between transition-all hover:bg-muted/50"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              {(() => {
                const s = students.find(st => st.id === formData.studentId);
                return (
                  <div className="flex items-center gap-3">
                    <Avatar photoUrl={s?.profile_photo} name={s?.name} size="sm" />
                    <span className="font-bold text-foreground">
                      {students.length === 0 ? 'No assigned students found' : (s?.name || 'Select a student')}
                      {s?.registration_number ? ` • ${s.registration_number}` : ''}
                    </span>
                  </div>
                )
              })()}
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </div>
            
            {isDropdownOpen && (
              <div className="absolute z-50 w-full mt-2 bg-white border-2 border-border rounded-xl shadow-xl max-h-60 overflow-y-auto">
                {students.length > 0 ? (
                  students.map(s => (
                    <div 
                      key={s.id} 
                      className={`p-3 hover:bg-muted/50 cursor-pointer flex items-center gap-3 transition-colors ${formData.studentId === s.id ? 'bg-primary/10' : ''}`}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, studentId: s.id }))
                        setIsDropdownOpen(false)
                      }}
                    >
                      <Avatar photoUrl={s.profile_photo} name={s.name} size="sm" />
                      <span className="font-bold text-foreground">{s.name} <span className="text-muted-foreground">({s.registration_number || 'N/A'})</span></span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground font-bold">
                    No assigned students found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-foreground font-bold">Meeting Link (Zoom / Google Meet)</Label>
          <div className="relative">
            <Video className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
              value={formData.meetLink}
              onChange={(e) => setFormData(prev => ({ ...prev, meetLink: e.target.value }))}
              className="pl-10 h-14 rounded-xl border-2 font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          <ClassDatePicker
            value={formData.date}
            onChange={(dateStr) => setFormData(prev => ({ ...prev, date: dateStr }))}
          />
          <div className="space-y-3">
            <ClassTimePicker
              value={formData.time}
              onChange={(timeStr) => setFormData(prev => ({ ...prev, time: timeStr }))}
            />
            <div className="bg-primary/10 border-2 border-primary/20 rounded-xl p-3">
              <p className="text-xs sm:text-sm text-primary font-bold flex items-center gap-1.5">
                <Globe className="h-4 w-4 shrink-0" /> Schedule in UK Time!
              </p>
              <p className="text-[11px] sm:text-xs text-primary/80 mt-0.5 font-medium leading-relaxed">
                All classes are scheduled in UK timezone (GMT/BST).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-secondary/10 p-4 rounded-xl border-2 border-secondary/20">
          <div className="relative flex items-center justify-center">
            <input 
              type="checkbox"
              id="repeat"
              className="w-6 h-6 rounded-md border-2 border-secondary appearance-none checked:bg-secondary cursor-pointer transition-colors"
              checked={formData.repeatWeekly}
              onChange={(e) => setFormData(prev => ({ ...prev, repeatWeekly: e.target.checked }))}
            />
            {formData.repeatWeekly && <CheckCircle className="absolute h-4 w-4 text-white pointer-events-none" />}
          </div>
          <Label htmlFor="repeat" className="text-secondary-foreground font-bold cursor-pointer text-base">Repeat this class every week (for 4 weeks)</Label>
        </div>

        <BouncyButton 
          type="submit" 
          disabled={isSubmitting} 
          className="w-full h-16 text-xl shadow-[0_6px_0_oklch(0.5_0.19_255)] hover:shadow-[0_2px_0_oklch(0.5_0.19_255)] active:shadow-none bg-primary hover:bg-primary/90 text-white rounded-2xl active:translate-y-1 hover:translate-y-1"
        >
          {isSubmitting ? <Loader2 className="animate-spin mr-2 h-6 w-6" /> : <Calendar className="h-6 w-6 mr-2" />}
          {isSubmitting ? "Creating..." : "Schedule Class"}
        </BouncyButton>
      </form>
    </AnimatedCard>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string, className: string }> = {
    ongoing:  { label: '✅ Ongoing',   className: 'bg-green-50 text-green-700 border-green-200' },
    break:    { label: '🕐 On a Break', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    stopped:  { label: '🛑 Stopped',   className: 'bg-red-50 text-red-700 border-red-200' },
  }
  const s = map[status] || map.ongoing
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${s.className}`}>
      {s.label}
    </span>
  )
}
