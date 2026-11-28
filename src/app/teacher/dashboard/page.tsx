"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogoutButton } from '@/components/logout-button'
import { AcademyHeader } from '@/components/academy-header'
import { Calendar, Plus, BarChart3, Loader2, Video, CheckCircle, Clock, User, Globe, AlertCircle, ChevronDown, Users, Copy, Sparkles, Pencil, X, Download, FileText, CheckCircle2, XCircle, Search, BookOpen, Eye, ChevronLeft, ChevronRight, Menu, RefreshCw } from 'lucide-react'
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
import { DateFilterType, getDateRange, calculateStudentAttendanceSummary, formatUKDateTime, isDateWithinRange, parseClassMetadata, formatMinutesToHours } from '@/lib/attendance-utils'
import { generateStudentAttendancePDF, generateTeacherAttendancePDF } from '@/lib/pdf-generator'
import { ClassDatePicker, ClassTimePicker } from '@/components/class-date-time-picker'
import { StudentPreviewModal } from '@/components/StudentPreviewModal'
import { StudentSelectDropdown } from '@/components/student-select-dropdown'

import TeacherProfilePage from '@/app/teacher/profile/page'
import SyllabusBank from '@/components/syllabus-bank'
import { TeacherQuranManager } from '@/components/quran/TeacherQuranManager'
import HomeworkPanel from '@/components/homework-panel'

type Tab = 'classes' | 'create' | 'groups' | 'stats' | 'profile' | 'syllabus' | 'quran' | 'homework'

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false)
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
  const [scheduleFilter, setScheduleFilter] = useState<'upcoming' | 'pending' | 'completed' | 'all'>('upcoming')
  const [scheduleDatePreset, setScheduleDatePreset] = useState<'all' | 'today' | '7d' | '30d' | 'custom'>('all')
  const [scheduleDateFilter, setScheduleDateFilter] = useState<string>('')

  // Permanent Student Groups state
  const [groups, setGroups] = useState<any[]>([])
  const [isGroupsLoading, setIsGroupsLoading] = useState(false)
  const [preselectedGroupId, setPreselectedGroupId] = useState<string | null>(null)
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<any | null>(null)

  // Student preview modal state
  const [previewStudent, setPreviewStudent] = useState<any>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const openPreview = (s: any) => {
    setPreviewStudent(s)
    setPreviewOpen(true)
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now())
    }, 10000)
    return () => clearInterval(timer)
  }, [])

  // Modal for class notes, homework & status
  const [pendingCompleteClass, setPendingCompleteClass] = useState<any>(null)
  const [completionStatus, setCompletionStatus] = useState<'present' | 'absent' | 'teacher_unavailable' | 'student_unavailable' | 'break'>('present')
  const [recordingUrl, setRecordingUrl] = useState('')
  const [classRemarks, setClassRemarks] = useState('')
  const [classHomework, setClassHomework] = useState('')
  const [homeworkDueDate, setHomeworkDueDate] = useState('')
  const [homeworkAssignMode, setHomeworkAssignMode] = useState<'all' | 'specific'>('all')
  const [homeworkTargetStudentIds, setHomeworkTargetStudentIds] = useState<string[]>([])
  const [homeworkAttachmentFile, setHomeworkAttachmentFile] = useState<File | null>(null)
  const [classDuration, setClassDuration] = useState<number | ''>('')
  const [isCompleting, setIsCompleting] = useState(false)
  const [syncingRecordingId, setSyncingRecordingId] = useState<string | null>(null)
  
  // Modal for editing student details & enrolment status
  const [statusEditTarget, setStatusEditTarget] = useState<string | null>(null)
  const [statusFormData, setStatusFormData] = useState({
    enrolmentStatus: 'ongoing',
    year: '',
    term: '',
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
        router.push('/teacher/login')
        return
      }
      setTeacherId(user.id)
      setTeacherEmail(user.email || '')
      let displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email
      try {
        const profRes = await fetch('/api/teacher/profile', { cache: 'no-store' })
        if (profRes.ok) {
          const profData = await profRes.json()
          if (profData.name) displayName = profData.name
        }
      } catch (e) {
        console.warn('Could not fetch teacher profile name:', e)
      }
      setTeacherName(displayName)

      const mappedStudents = await fetchStudentsList(user.id)
      if (mappedStudents.length > 0) {
        setSelectedStudentId(mappedStudents[0].id)
      }
      await fetchAllTeacherData()
      await fetchGroups()
      setIsLoading(false)
    }
    init()
  }, [])

  const fetchGroups = async () => {
    try {
      setIsGroupsLoading(true)
      const res = await fetch('/api/teacher/groups')
      if (res.ok) {
        const data = await res.json()
        setGroups(data.groups || [])
      }
    } catch (err) {
      console.error('Failed to load student groups:', err)
    } finally {
      setIsGroupsLoading(false)
    }
  }

  const handleSaveGroup = async (groupData: { id?: string; name: string; studentIds: string[] }) => {
    try {
      const isEdit = !!groupData.id
      const res = await fetch('/api/teacher/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isEdit ? 'update' : 'create',
          group: groupData
        })
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to save group')

      toast.success(isEdit ? 'Group updated successfully!' : 'Permanent group created successfully!')
      setGroups(result.groups || [])
      setIsGroupModalOpen(false)
      setEditingGroup(null)
    } catch (err: any) {
      toast.error(err.message || 'Failed to save group')
    }
  }

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!window.confirm(`Are you sure you want to delete the group "${groupName}"? Students will remain assigned to you, but the group will be removed.`)) {
      return
    }
    try {
      const res = await fetch('/api/teacher/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          groupId
        })
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to delete group')

      toast.success(`Group "${groupName}" deleted.`)
      setGroups(result.groups || [])
      if (preselectedGroupId === groupId) setPreselectedGroupId(null)
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete group')
    }
  }

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

  async function fetchClasses(studentId: string, skipAutoSync = false) {
    if (!studentId) return
    const response = await fetch(`/api/classes/teacher?studentId=${encodeURIComponent(studentId)}`)
    const result = await response.json()
    if (!response.ok) {
      setClasses([])
      return
    }
    const loadedClasses = result.classes || []
    setClasses(loadedClasses)

    // Silent background auto-sync for recent completed classes (last 48h) missing recording_url
    if (!skipAutoSync && loadedClasses.length > 0) {
      const cutoff = Date.now() - 48 * 60 * 60 * 1000
      const pendingIds = loadedClasses
        .filter((c: any) => {
          if (c.status !== 'completed' || !c.meet_link) return false
          if (new Date(c.scheduled_at).getTime() < cutoff) return false
          const parsed = parseClassMetadata(c, null, null)
          return !parsed.recording_url
        })
        .map((c: any) => c.id)

      if (pendingIds.length > 0) {
        fetch('/api/classes/sync-recordings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ classIds: pendingIds }),
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((syncRes) => {
            if (syncRes && syncRes.updatedCount > 0) {
              fetchClasses(studentId, true)
            }
          })
          .catch(() => {})
      }
    }
  }

  async function handleManualSyncRecording(classId: string) {
    setSyncingRecordingId(classId)
    try {
      const res = await fetch('/api/classes/sync-recordings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classIds: [classId] }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to sync recording')
      if (data.updatedCount > 0) {
        toast.success('Recording synced from Google Drive!')
        await fetchClasses(selectedStudentId, true)
      } else {
        toast.info('Recording is not ready yet. Google Drive usually takes 2–5 minutes after class ends.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Could not sync recording')
    } finally {
      setSyncingRecordingId(null)
    }
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
          homework: classHomework.trim() || null,
        })
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to save class notes")

      // Also create structured Homework Assignment(s) for submission & evaluation workflow
      if (classHomework.trim()) {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          const authHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          }

          const meta = parseClassMetadata(pendingCompleteClass, undefined)
          let targets: { classId: string; studentId: string }[] = [
            { classId: pendingCompleteClass.id, studentId: pendingCompleteClass.student_id },
          ]

          if (meta.is_group && meta.group_id) {
            const siblingClasses = allTeacherClasses.filter((cls: any) => {
              const clsMeta = parseClassMetadata(cls, undefined)
              return (
                clsMeta.is_group &&
                clsMeta.group_id === meta.group_id &&
                cls.scheduled_at === pendingCompleteClass.scheduled_at
              )
            })
            const allGroupTargets = siblingClasses.length > 0
              ? siblingClasses.map((cls: any) => ({ classId: cls.id, studentId: cls.student_id }))
              : targets

            if (homeworkAssignMode === 'specific') {
              if (homeworkTargetStudentIds.length === 0) {
                toast.error('Please select at least one student for the group homework, or choose All Students.')
                setIsCompleting(false)
                return
              }
              targets = allGroupTargets.filter((t) => homeworkTargetStudentIds.includes(t.studentId))
              if (targets.length === 0) {
                targets = homeworkTargetStudentIds.map((sid) => ({
                  classId: pendingCompleteClass.id,
                  studentId: sid,
                }))
              }
            } else {
              targets = allGroupTargets
            }
          }

          let attachmentUrl: string | null = null
          let attachmentName: string | null = null
          if (homeworkAttachmentFile) {
            const urlRes = await fetch('/api/homework/upload-url', {
              method: 'POST',
              headers: authHeaders,
              body: JSON.stringify({ fileName: homeworkAttachmentFile.name, folder: 'assignments' }),
            })
            const urlData = await urlRes.json()
            if (urlRes.ok && urlData.signedUrl) {
              const putRes = await fetch(urlData.signedUrl, {
                method: 'PUT',
                headers: { 'Content-Type': homeworkAttachmentFile.type || 'application/octet-stream' },
                body: homeworkAttachmentFile,
              })
              if (putRes.ok) {
                attachmentUrl = urlData.publicUrl
                attachmentName = homeworkAttachmentFile.name
              }
            }
          }

          const hwText = classHomework.trim()
          const hwTitle = hwText.length > 80 ? `${hwText.slice(0, 77)}...` : hwText
          await fetch('/api/homework', {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
              targets,
              groupId: meta.is_group ? meta.group_id : null,
              classTitle: meta.title || 'Moral Class Alihsan Academy',
              title: hwTitle,
              instructions: hwText,
              dueDate: homeworkDueDate || null,
              attachmentUrl,
              attachmentName,
            }),
          })
        } catch (hwErr) {
          console.error('Failed to create structured homework assignment:', hwErr)
        }
      }

      toast.success("Class notes & homework saved successfully.")
      setPendingCompleteClass(null)
      setRecordingUrl('')
      setClassRemarks('')
      setClassHomework('')
      setHomeworkDueDate('')
      setHomeworkAssignMode('all')
      setHomeworkTargetStudentIds([])
      setHomeworkAttachmentFile(null)
      setClassDuration('')
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
          studentId: statusEditTarget,
          ...statusFormData
        })
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to update student details')
      toast.success("Student details & status updated successfully!")
      const targetId = statusEditTarget
      setStatusEditTarget(null)

      setStudents(prev => prev.map(s => (s.id === targetId || s.user_id === targetId) ? {
        ...s,
        ...statusFormData,
        class_name: statusFormData.year,
        year: statusFormData.year,
        term: statusFormData.term,
      } : s))

      setPreviewStudent((prev: any) => {
        if (!prev) return null
        if (prev.id === targetId || prev.user_id === targetId) {
          return {
            ...prev,
            ...statusFormData,
            class_name: statusFormData.year,
            year: statusFormData.year,
            term: statusFormData.term,
          }
        }
        return prev
      })

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
    setStatusEditTarget(student.id || student.user_id)
    setStatusFormData({
      enrolmentStatus: student.enrolment_status || 'ongoing',
      year: student.year || student.class_name || '',
      term: student.term || '',
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
      let totalTeacherMinutes = 0
      let totalUnderThreshold = 0
      studentBreakdownList.forEach((item) => {
        totalTeacherMinutes += item.summary.totalClassMinutes
        totalUnderThreshold += item.summary.underThresholdCount
      })
      const expectedTeacherMins = overallScheduled * 45
      const overallDurationRate = expectedTeacherMins > 0 ? Math.min(100, Math.round((totalTeacherMinutes / expectedTeacherMins) * 100)) : 0

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
          totalHoursFormatted: formatMinutesToHours(totalTeacherMinutes),
          underThresholdCount: totalUnderThreshold,
          overallDurationRate: overallDurationRate,
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
          hoursFormatted: item.summary.totalClassHoursFormatted,
          underThresholdCount: item.summary.underThresholdCount,
          durationRate: item.summary.durationFulfillmentRate,
        })),
      })
      toast.success('Teacher summary report downloaded.')
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
      toast.success(`PDF downloaded for ${studentItem.name}.`)
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
    <div className="min-h-screen md:h-screen md:max-h-screen bg-background flex flex-col pb-24 md:pb-0 font-sans selection:bg-primary/20 md:overflow-hidden">
      <header className="bg-white border-b-2 border-border p-3 md:p-4 flex justify-between items-center shrink-0 z-50 shadow-xs">
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

      {/* Main Container with 15% Collapsible Left Rail (FROZEN IN PLACE) */}
      <div className="flex-1 flex flex-col md:flex-row md:overflow-hidden min-h-0 w-full">
        {/* Desktop 15% Collapsible Left Rail */}
        <aside className={`hidden md:flex flex-col bg-[#0A1F18] text-slate-300 border-r border-emerald-950/60 transition-all duration-200 shrink-0 h-full z-30 select-none ${
          isSidebarCollapsed ? 'w-[64px] min-w-[64px]' : 'w-[15%] min-w-[195px] max-w-[230px]'
        }`}>
          {/* Rail Header with In-Sidebar Collapse Toggle */}
          <div className={`p-2.5 sm:p-3 border-b border-emerald-900/30 flex ${isSidebarCollapsed ? 'flex-col items-center gap-2' : 'items-center justify-between'} shrink-0`}>
            {!isSidebarCollapsed ? (
              <div className="flex flex-col gap-1 overflow-hidden truncate">
                <div className="bg-white rounded-lg p-1.5 flex items-center justify-center shadow-xs border border-white/20 max-w-[150px]">
                  <img
                    src="/alihsan-official-logo.png"
                    alt="Al-Ihsan Academy"
                    className="h-6 w-auto object-contain"
                  />
                </div>
                <p className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-400 pl-1">Educator Portal</p>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center shrink-0 shadow-xs border border-white/20" title="Al-Ihsan Educator">
                <img
                  src="/alihsan-emblem.png"
                  alt="Al-Ihsan Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded-md text-emerald-400/80 hover:text-white hover:bg-emerald-900/40 transition-colors cursor-pointer"
              title={isSidebarCollapsed ? "Expand Sidebar (15%)" : "Collapse Sidebar (64px)"}
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 py-3 px-2 space-y-2 overflow-y-auto custom-scrollbar text-[15px]">
            {!isSidebarCollapsed && (
              <span className="px-2.5 mb-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-300 block">
                Teaching Workspace
              </span>
            )}
            <nav className="space-y-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('classes')}
                title="Schedule"
                className={`w-full text-left px-3 py-2.5 rounded-xl font-bold text-[15px] flex items-center transition-all active:scale-[0.98] cursor-pointer ${
                  isSidebarCollapsed ? 'justify-center' : 'justify-between'
                } ${
                  activeTab === 'classes'
                    ? 'bg-[#1A6B4A] text-white shadow-md font-extrabold ring-1 ring-emerald-400/50'
                    : 'text-slate-100 bg-emerald-950/35 hover:text-white hover:bg-emerald-900/70'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Calendar className="h-5 w-5 shrink-0" />
                  {!isSidebarCollapsed && <span className="truncate">Schedule</span>}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPreselectedGroupId(null)
                  setActiveTab('create')
                }}
                title="New Class"
                className={`w-full text-left px-3 py-2.5 rounded-xl font-bold text-[15px] flex items-center transition-all active:scale-[0.98] cursor-pointer ${
                  isSidebarCollapsed ? 'justify-center' : 'justify-between'
                } ${
                  activeTab === 'create'
                    ? 'bg-[#1A6B4A] text-white shadow-md font-extrabold ring-1 ring-emerald-400/50'
                    : 'text-slate-100 bg-emerald-950/35 hover:text-white hover:bg-emerald-900/70'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Plus className="h-5 w-5 shrink-0" />
                  {!isSidebarCollapsed && <span className="truncate">New Class</span>}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('groups')}
                title="Permanent Student Groups"
                className={`w-full text-left px-3 py-2.5 rounded-xl font-bold text-[15px] flex items-center transition-all active:scale-[0.98] cursor-pointer ${
                  isSidebarCollapsed ? 'justify-center' : 'justify-between'
                } ${
                  activeTab === 'groups'
                    ? 'bg-[#1A6B4A] text-white shadow-md font-extrabold ring-1 ring-emerald-400/50'
                    : 'text-slate-100 bg-emerald-950/35 hover:text-white hover:bg-emerald-900/70'
                }`}
              >
                <div className="flex items-center gap-3 truncate w-full">
                  <Users className="h-5 w-5 shrink-0" />
                  {!isSidebarCollapsed && (
                    <div className="flex items-center justify-between w-full">
                      <span className="truncate">Groups / Batches</span>
                      {groups.length > 0 && (
                        <span className="ml-1.5 px-1.5 py-0.5 bg-emerald-800 text-emerald-100 text-[11px] font-extrabold rounded-full border border-emerald-500/50">
                          {groups.length}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('stats')}
                title="Attendance & Stats"
                className={`w-full text-left px-3 py-2.5 rounded-xl font-bold text-[15px] flex items-center transition-all active:scale-[0.98] cursor-pointer ${
                  isSidebarCollapsed ? 'justify-center' : 'justify-between'
                } ${
                  activeTab === 'stats'
                    ? 'bg-[#1A6B4A] text-white shadow-md font-extrabold ring-1 ring-emerald-400/50'
                    : 'text-slate-100 bg-emerald-950/35 hover:text-white hover:bg-emerald-900/70'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <BarChart3 className="h-5 w-5 shrink-0" />
                  {!isSidebarCollapsed && <span className="truncate">Attendance & Stats</span>}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('syllabus')}
                title="Syllabus Bank"
                className={`w-full text-left px-3 py-2.5 rounded-xl font-bold text-[15px] flex items-center transition-all active:scale-[0.98] cursor-pointer ${
                  isSidebarCollapsed ? 'justify-center' : 'justify-between'
                } ${
                  activeTab === 'syllabus'
                    ? 'bg-[#1A6B4A] text-white shadow-md font-extrabold ring-1 ring-emerald-400/50'
                    : 'text-slate-100 bg-emerald-950/35 hover:text-white hover:bg-emerald-900/70'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <BookOpen className="h-5 w-5 shrink-0" />
                  {!isSidebarCollapsed && <span className="truncate">Syllabus Bank</span>}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('quran')}
                title="Quran & Hifz"
                className={`w-full text-left px-3 py-2.5 rounded-xl font-bold text-[15px] flex items-center transition-all active:scale-[0.98] cursor-pointer ${
                  isSidebarCollapsed ? 'justify-center' : 'justify-between'
                } ${
                  activeTab === 'quran'
                    ? 'bg-[#1A6B4A] text-white shadow-md font-extrabold ring-1 ring-emerald-400/50'
                    : 'text-slate-100 bg-emerald-950/35 hover:text-white hover:bg-emerald-900/70'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <BookOpen className="h-5 w-5 shrink-0 text-emerald-400" />
                  {!isSidebarCollapsed && <span className="truncate">Quran & Hifz</span>}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('homework')}
                title="Homework"
                className={`w-full text-left px-3 py-2.5 rounded-xl font-bold text-[15px] flex items-center transition-all active:scale-[0.98] cursor-pointer ${
                  isSidebarCollapsed ? 'justify-center' : 'justify-between'
                } ${
                  activeTab === 'homework'
                    ? 'bg-[#1A6B4A] text-white shadow-md font-extrabold ring-1 ring-emerald-400/50'
                    : 'text-slate-100 bg-emerald-950/35 hover:text-white hover:bg-emerald-900/70'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <FileText className="h-5 w-5 shrink-0 text-amber-300" />
                  {!isSidebarCollapsed && <span className="truncate">Homework</span>}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                title="Profile"
                className={`w-full text-left px-3 py-2.5 rounded-xl font-bold text-[15px] flex items-center transition-all active:scale-[0.98] cursor-pointer ${
                  isSidebarCollapsed ? 'justify-center' : 'justify-between'
                } ${
                  activeTab === 'profile'
                    ? 'bg-[#1A6B4A] text-white shadow-md font-extrabold ring-1 ring-emerald-400/50'
                    : 'text-slate-100 bg-emerald-950/35 hover:text-white hover:bg-emerald-900/70'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <User className="h-5 w-5 shrink-0" />
                  {!isSidebarCollapsed && <span className="truncate">Profile</span>}
                </div>
              </button>
            </nav>
          </div>

          {/* Compact User Footer */}
          <div className="p-3 border-t border-emerald-900/40 bg-[#061510] shrink-0">
            <div className={`flex items-center gap-2.5 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-600/40">
                {teacherName ? teacherName.slice(0, 2).toUpperCase() : 'ED'}
              </div>
              {!isSidebarCollapsed && (
                <div className="truncate">
                  <p className="text-sm font-bold text-white leading-tight truncate">{teacherName || 'Educator'}</p>
                  <p className="text-[10px] text-emerald-400/80 truncate">Al-Ihsan Educator</p>
                </div>
              )}
            </div>
          </div>
        </aside>

        <main className="flex-1 w-full min-w-0 p-4 md:p-6 lg:p-8 md:overflow-y-auto md:h-full custom-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === 'classes' && (
            <PageTransition key="classes" className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border-2 border-border shadow-sm flex flex-col md:flex-row md:items-center gap-4 justify-between">
                <div>
                  <h3 className="font-black text-foreground text-xl">My Schedule</h3>
                  <p className="text-muted-foreground font-medium text-sm">Select a student to view their upcoming and past classes.</p>
                </div>
                <div className="flex flex-col gap-1.5 w-full md:w-80">
                  <StudentSelectDropdown
                    students={students}
                    selectedStudentId={selectedStudentId}
                    onSelect={(id) => setSelectedStudentId(id)}
                  />
                  {students.length > 0 && selectedStudentId && (() => {
                    const s = students.find(st => st.id === selectedStudentId)
                    return s ? (
                      <div className="flex items-center gap-2 justify-end mt-1">
                        <StatusBadge status={s.enrolment_status || 'ongoing'} />
                        <button
                          type="button"
                          onClick={() => openPreview(s)}
                          className="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                          title="Preview Student Profile"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Preview</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openStatusEdit(s)}
                          className="px-2.5 py-1 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer border border-border"
                          title="Edit Student Details & Status"
                        >
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Edit</span>
                        </button>
                      </div>
                    ) : null
                  })()}
                </div>
              </div>

              <div className="space-y-4">
                {students.length > 0 && classes.length > 0 && (() => {
                  const pastCutoff = currentTime - 60 * 60 * 1000 // 1 hour grace window for ongoing classes
                  const upcomingCount = classes.filter(c => c.status !== 'completed' && new Date(c.scheduled_at).getTime() >= pastCutoff).length
                  const pendingCount = classes.filter(c => c.status !== 'completed' && new Date(c.scheduled_at).getTime() < pastCutoff).length
                  const completedCount = classes.filter(c => c.status === 'completed').length

                  return (
                    <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-xl border border-border shadow-xs">
                      <button
                        type="button"
                        onClick={() => setScheduleFilter('upcoming')}
                        className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all min-h-[44px] flex items-center gap-1.5 cursor-pointer ${
                          scheduleFilter === 'upcoming'
                            ? 'bg-[#1A6B4A] text-white shadow-xs'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <span>Upcoming</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${scheduleFilter === 'upcoming' ? 'bg-white/20 text-white' : 'bg-muted text-foreground'}`}>
                          {upcomingCount}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setScheduleFilter('pending')}
                        className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all min-h-[44px] flex items-center gap-1.5 cursor-pointer ${
                          scheduleFilter === 'pending'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <span>Needs Marking</span>
                        {pendingCount > 0 && (
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${scheduleFilter === 'pending' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'}`}>
                            {pendingCount}
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setScheduleFilter('completed')}
                        className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all min-h-[44px] flex items-center gap-1.5 cursor-pointer ${
                          scheduleFilter === 'completed'
                            ? 'bg-slate-800 text-white shadow-xs'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <span>Completed</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${scheduleFilter === 'completed' ? 'bg-white/20 text-white' : 'bg-muted text-foreground'}`}>
                          {completedCount}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setScheduleFilter('all')}
                        className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all min-h-[44px] flex items-center gap-1.5 cursor-pointer ${
                          scheduleFilter === 'all'
                            ? 'bg-primary text-white shadow-xs'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <span>All ({classes.length})</span>
                      </button>

                      {/* Date Filter Controls */}
                      <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto lg:ml-auto pt-1 lg:pt-0 border-t lg:border-t-0 border-border/60">
                        <select
                          aria-label="Filter schedule by date range"
                          value={scheduleDatePreset}
                          onChange={(e) => {
                            const val = e.target.value as 'all' | 'today' | '7d' | '30d' | 'custom'
                            setScheduleDatePreset(val)
                            if (val !== 'custom') setScheduleDateFilter('')
                          }}
                          className="min-h-[44px] px-3 py-2 rounded-lg border border-border bg-muted/40 text-base sm:text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                        >
                          <option value="all">All Dates</option>
                          <option value="today">Today</option>
                          <option value="7d">Last 7 Days</option>
                          <option value="30d">Last 30 Days</option>
                          {scheduleDateFilter && <option value="custom">Specific Date</option>}
                        </select>

                        <input
                          type="date"
                          aria-label="Filter schedule by specific date"
                          value={scheduleDateFilter}
                          onChange={(e) => {
                            setScheduleDateFilter(e.target.value)
                            setScheduleDatePreset(e.target.value ? 'custom' : 'all')
                          }}
                          className="min-h-[44px] px-3 py-2 rounded-lg border border-border bg-muted/40 text-base sm:text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                        />

                        {(scheduleDatePreset !== 'all' || scheduleDateFilter) && (
                          <button
                            type="button"
                            onClick={() => {
                              setScheduleDatePreset('all')
                              setScheduleDateFilter('')
                            }}
                            title="Clear date filter"
                            className="min-h-[44px] px-3 py-2 rounded-lg border border-border bg-muted/60 hover:bg-muted text-xs font-bold text-foreground flex items-center gap-1 cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>Clear</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })()}

                {students.length === 0 ? (
                  <AnimatedCard delay={0.1} className="text-center p-12 border-dashed shadow-none bg-transparent flex flex-col items-center">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                      <Users className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h4 className="text-xl font-black text-foreground mb-1">No Students Assigned</h4>
                    <p className="text-muted-foreground font-medium">Please contact the administration to assign students to you.</p>
                  </AnimatedCard>
                ) : (() => {
                  const pastCutoff = currentTime - 60 * 60 * 1000
                  const todayUK = new Date(currentTime).toLocaleDateString('en-CA', { timeZone: 'Europe/London' })
                  const filteredClasses = classes
                    .filter(c => {
                      const t = new Date(c.scheduled_at).getTime()
                      if (scheduleFilter === 'upcoming' && !(c.status !== 'completed' && t >= pastCutoff)) return false
                      if (scheduleFilter === 'pending' && !(c.status !== 'completed' && t < pastCutoff)) return false
                      if (scheduleFilter === 'completed' && c.status !== 'completed') return false

                      if (scheduleDatePreset === 'custom' && scheduleDateFilter) {
                        const classUKDate = new Date(c.scheduled_at).toLocaleDateString('en-CA', { timeZone: 'Europe/London' })
                        if (classUKDate !== scheduleDateFilter) return false
                      } else if (scheduleDatePreset === 'today') {
                        const classUKDate = new Date(c.scheduled_at).toLocaleDateString('en-CA', { timeZone: 'Europe/London' })
                        if (classUKDate !== todayUK) return false
                      } else if (scheduleDatePreset === '7d') {
                        if (t < currentTime - 7 * 24 * 60 * 60 * 1000) return false
                      } else if (scheduleDatePreset === '30d') {
                        if (t < currentTime - 30 * 24 * 60 * 60 * 1000) return false
                      }

                      return true
                    })
                    .sort((a, b) => {
                      const ta = new Date(a.scheduled_at).getTime()
                      const tb = new Date(b.scheduled_at).getTime()
                      // Upcoming: soonest first; others: most recent first
                      return scheduleFilter === 'upcoming' ? ta - tb : tb - ta
                    })

                  if (classes.length === 0) {
                    return (
                      <AnimatedCard delay={0.1} className="text-center p-12 border-dashed shadow-none bg-transparent flex flex-col items-center">
                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                          <Calendar className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h4 className="text-xl font-black text-foreground mb-1">Clear Schedule!</h4>
                        <p className="text-muted-foreground font-medium">No classes found for this student. Time to schedule one!</p>
                      </AnimatedCard>
                    )
                  }

                  if (filteredClasses.length === 0) {
                    return (
                      <AnimatedCard delay={0.1} className="text-center p-10 border-dashed shadow-none bg-transparent flex flex-col items-center">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-3">
                          <Calendar className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h4 className="text-lg font-black text-foreground mb-1">
                          {scheduleFilter === 'upcoming' ? 'No Upcoming Classes' : scheduleFilter === 'pending' ? 'No Pending Attendance' : 'No Completed Classes'}
                        </h4>
                        <p className="text-sm text-muted-foreground font-medium">
                          {scheduleFilter === 'upcoming'
                            ? 'All scheduled classes for this student are in the past or completed. Check "Needs Marking" or "Completed".'
                            : scheduleFilter === 'pending'
                            ? 'Great job! All past classes have been marked.'
                            : 'No completed classes recorded yet.'}
                        </p>
                      </AnimatedCard>
                    )
                  }

                  return filteredClasses.map((c, index) => {
                    const parsed = parseClassMetadata(c, allAttendance.find(a => a.class_id === c.id), students.find(s => s.id === c.student_id))
                    const student = students.find(s => s.id === c.student_id)
                    const scheduledMs = new Date(c.scheduled_at).getTime()
                    const isClassTimeReached = scheduledMs <= currentTime
                    const isPastUnmarked = c.status !== 'completed' && scheduledMs < currentTime - 2 * 60 * 60 * 1000
                    return (
                      <AnimatedCard key={c.id} delay={index * 0.03} className="p-0 overflow-hidden hover:border-primary/40 transition-colors rounded-xl border border-border shadow-sm">
                        <div className="p-3.5 md:p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                          <div className="flex items-center gap-3.5">
                            <Avatar photoUrl={student?.profile_photo} name={student?.name} size="md" />
                            <div className="space-y-0.5">
                              <h4 className="font-bold text-foreground text-sm md:text-base leading-tight">{parsed.title || 'Moral Class Alihsan Academy'}</h4>
                              <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                <span className="font-bold text-primary">{student?.name || 'Unknown Student'}</span>
                                <span>•</span>
                                <div className="inline-flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                                  <span>{formatUKTime(c.scheduled_at)} (UK Time)</span>
                                </div>
                              </div>
                              {parsed.remarks && (
                                <p className="text-[11px] bg-muted/60 text-muted-foreground px-2 py-0.5 rounded font-medium inline-block">
                                  <strong className="text-foreground">Remarks:</strong> {parsed.remarks}
                                </p>
                              )}
                              {parsed.homework && (
                                <p className="text-[11px] bg-amber-50 text-amber-900 border border-amber-200/70 px-2 py-0.5 rounded font-medium inline-flex items-center gap-1">
                                  <BookOpen className="h-3 w-3 text-amber-700 shrink-0" />
                                  <span><strong>Homework:</strong> {parsed.homework}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col md:items-end gap-2 w-full md:w-auto self-end md:self-center">
                            <div className="flex flex-wrap items-center gap-2 md:justify-end">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                isPastUnmarked
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : parsed.status === 'present'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : parsed.status === 'teacher_unavailable' || parsed.status === 'student_unavailable' || parsed.status === 'absent'
                                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                                  : parsed.status === 'break'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-blue-50 text-blue-800 border-blue-200'
                              }`}>
                                {isPastUnmarked ? 'Past · Attendance Pending' : parsed.statusLabel}
                              </span>

                              {/* Group Class Badge */}
                              {parsed.is_group && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-800 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
                                  <Users className="h-3 w-3 text-purple-700" />
                                  <span>{parsed.group_name || 'Group Class'}</span>
                                </span>
                              )}

                              {/* Duration Badge for completed classes */}
                              {c.status === 'completed' && parsed.duration_minutes ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                  <Clock className="h-3 w-3 text-emerald-700" />
                                  <span>{parsed.duration_minutes} mins</span>
                                </span>
                              ) : null}

                              {parsed.recording_url ? (
                                <a href={parsed.recording_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-300 px-2.5 py-0.5 rounded-full hover:bg-teal-100 transition-colors shadow-2xs">
                                  <Video className="h-3.5 w-3.5 text-teal-700" />
                                  <span>View Recording</span>
                                </a>
                              ) : (c.status === 'completed' && c.meet_link && (currentTime - new Date(c.scheduled_at).getTime() < 48 * 60 * 60 * 1000) ? (
                                <div className="inline-flex items-center gap-1">
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                                    <Clock className="h-3 w-3 text-amber-700" />
                                    <span>Recording Processing</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleManualSyncRecording(c.id)}
                                    disabled={syncingRecordingId === c.id}
                                    title="Check Google Drive for finalized recording"
                                    className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-border bg-white hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
                                  >
                                    <RefreshCw className={`h-3 w-3 ${syncingRecordingId === c.id ? 'animate-spin text-primary' : ''}`} />
                                  </button>
                                </div>
                              ) : null)}
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto mt-1">
                              {c.meet_link && c.status !== 'completed' && !isPastUnmarked && (
                                <a
                                  href={c.meet_link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs sm:text-sm font-black bg-[#0D4A47] hover:bg-[#083836] text-white transition-all flex items-center justify-center gap-2 shadow-sm min-h-[40px] cursor-pointer"
                                >
                                  <Video className="h-4 w-4 text-emerald-300" />
                                  <span>Join Google Meet</span>
                                </a>
                              )}

                              {isClassTimeReached ? (
                                <button
                                  onClick={() => {
                                    setPendingCompleteClass(c)
                                    setCompletionStatus(c.status === 'completed' && parsed.status !== 'present' && parsed.status !== 'scheduled' ? parsed.status : 'present')
                                    setRecordingUrl(parsed.recording_url || '')
                                    setClassRemarks(parsed.remarks || '')
                                    setClassHomework(parsed.homework || '')
                                    setClassDuration(typeof parsed.duration_minutes === 'number' ? parsed.duration_minutes : '')
                                  }} 
                                  className="w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-bold bg-[#1E293B] hover:bg-[#0F172A] text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm min-h-[40px] cursor-pointer"
                                >
                                  <BookOpen className="h-3.5 w-3.5 text-amber-300" />
                                  {c.status === 'completed' ? 'Class Notes & Homework' : 'Add Notes & Homework'}
                                </button>
                              ) : (
                                <div className="w-full sm:w-auto px-3 py-1.5 rounded-xl text-xs font-semibold bg-muted/70 text-muted-foreground border border-border/70 flex items-center justify-center gap-1.5 min-h-[40px]">
                                  <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                  <span>Notes open after class</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </AnimatedCard>
                    )
                  })
                })()}
              </div>
            </PageTransition>
          )}

          {activeTab === 'create' && (
            <PageTransition key="create">
              <CreateClassForm
                students={students}
                teacherId={teacherId}
                groups={groups}
                preselectedGroupId={preselectedGroupId}
                onOpenGroupManager={() => {
                  setEditingGroup(null)
                  setIsGroupModalOpen(true)
                }}
                onCreated={(studentId) => {
                  setSelectedStudentId(studentId)
                  setPreselectedGroupId(null)
                  setActiveTab('classes')
                  fetchClasses(studentId)
                  fetchAllTeacherData()
                }}
              />
            </PageTransition>
          )}

          {activeTab === 'groups' && (
            <PageTransition key="groups">
              <GroupsManager
                groups={groups}
                students={students}
                isLoading={isGroupsLoading}
                onOpenCreate={() => {
                  setEditingGroup(null)
                  setIsGroupModalOpen(true)
                }}
                onOpenEdit={(group) => {
                  setEditingGroup(group)
                  setIsGroupModalOpen(true)
                }}
                onDeleteGroup={(id, name) => handleDeleteGroup(id, name)}
                onScheduleGroup={(groupId) => {
                  setPreselectedGroupId(groupId)
                  setActiveTab('create')
                }}
              />
            </PageTransition>
          )}

          {activeTab === 'stats' && (
            <PageTransition key="stats" className="space-y-6">
              {/* Header and Download Summary Button */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-black text-foreground text-2xl">Teacher Attendance & Performance</h3>
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
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-semibold">
                                Reg: #{item.registration_number}
                              </span>
                              <span className="text-xs text-muted-foreground font-medium bg-muted/60 px-2 py-0.5 rounded">
                                {item.attended} / {item.scheduled} Completed
                              </span>
                              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded inline-flex items-center gap-1">
                                <Clock className="h-3 w-3 text-emerald-700" />
                                {item.summary.totalClassHoursFormatted}
                              </span>
                              {item.summary.underThresholdCount > 0 ? (
                                <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded inline-flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3 text-amber-600" />
                                  {item.summary.underThresholdCount} short (&lt;20m)
                                </span>
                              ) : item.attended > 0 ? (
                                <span className="text-xs font-medium text-emerald-700 bg-emerald-50/50 border border-emerald-100 px-1.5 py-0.5 rounded">
                                  ✓ All ≥ 20m
                                </span>
                              ) : null}
                              <span className="text-xs font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                                {item.summary.durationFulfillmentRate}% Duration
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
                            type="button"
                            onClick={() => openPreview(item.student)}
                            className="px-2.5 py-1.5 rounded-md text-xs font-semibold border border-primary/20 bg-primary/10 hover:bg-primary/20 text-primary transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                            title="Preview Student Profile"
                          >
                            <Eye className="h-3.5 w-3.5" /> Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => openStatusEdit(item.student)}
                            className="px-2.5 py-1.5 rounded-md text-xs font-semibold border border-border bg-white hover:bg-muted text-foreground transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                            title="Edit Student Details & Status"
                          >
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" /> Edit
                          </button>
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

          {activeTab === 'syllabus' && (
            <PageTransition key="syllabus" className="flex-1 min-h-0 flex flex-col">
              <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-border/60">
                <SyllabusBank mode="teacher" />
              </div>
            </PageTransition>
          )}

          {activeTab === 'quran' && (
            <PageTransition key="quran" className="flex-1 min-h-0 flex flex-col">
              <TeacherQuranManager students={students} teacherId={teacherId} />
            </PageTransition>
          )}

          {activeTab === 'homework' && (
            <PageTransition key="homework">
              <HomeworkPanel mode="teacher" />
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
                className="bg-white rounded-2xl p-5 sm:p-6 max-w-md w-full border border-border shadow-xl relative my-auto max-h-[85vh] overflow-y-auto"
              >
                <button 
                  onClick={() => setPendingCompleteClass(null)} 
                  className="absolute right-3.5 top-3.5 p-1.5 hover:bg-muted rounded-lg text-muted-foreground transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-foreground">Class Notes & Homework</h3>
                    <p className="text-xs text-muted-foreground font-medium">
                      Add lesson notes and assigned tasks for the student.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleCompleteClassSubmit} className="space-y-4">
                  {/* Student Homework / Next Task */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-foreground font-bold text-xs uppercase tracking-wider">
                        Assigned Homework / Next Task
                      </Label>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Visible to Student
                      </span>
                    </div>
                    <textarea 
                      rows={2}
                      placeholder="e.g. Memorise Surah Al-Mulk ayat 1-10; practice Tajweed rules on page 14..."
                      value={classHomework}
                      onChange={(e) => setClassHomework(e.target.value)}
                      className="w-full rounded-xl border-2 border-border p-3 text-base md:text-sm font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-colors resize-none"
                    />

                    {/* Due Date & Optional Attachment */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <div>
                        <Label className="text-[11px] font-bold text-muted-foreground block mb-1">
                          Due Date (Optional)
                        </Label>
                        <input
                          type="date"
                          value={homeworkDueDate}
                          onChange={(e) => setHomeworkDueDate(e.target.value)}
                          className="w-full min-h-[40px] rounded-xl border border-border px-3 py-1.5 text-base sm:text-xs font-semibold bg-muted/30"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] font-bold text-muted-foreground block mb-1">
                          Worksheet / Reference File (Optional)
                        </Label>
                        <input
                          type="file"
                          onChange={(e) => setHomeworkAttachmentFile(e.target.files?.[0] || null)}
                          className="w-full text-xs file:mr-2 file:py-1.5 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-muted file:text-foreground cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Group Class Assignment Target Selector */}
                    {(() => {
                      const meta = parseClassMetadata(pendingCompleteClass, undefined)
                      if (!meta.is_group || !meta.group_id) return null
                      const groupPeers = Array.from(
                        new Map(
                          allTeacherClasses
                            .filter((cls: any) => {
                              const cm = parseClassMetadata(cls, undefined)
                              return cm.is_group && cm.group_id === meta.group_id && cls.scheduled_at === pendingCompleteClass.scheduled_at
                            })
                            .map((cls: any) => [cls.student_id, students.find((s) => s.id === cls.student_id)])
                        ).entries()
                      ).map(([id, s]) => ({ id, name: s?.name || 'Student' }))

                      if (groupPeers.length === 0) return null

                      return (
                        <div className="mt-2 p-3 rounded-xl bg-purple-50/70 border border-purple-200 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-extrabold text-purple-900">Assign Group Homework To:</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setHomeworkAssignMode('all')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                                  homeworkAssignMode === 'all' ? 'bg-purple-700 text-white' : 'bg-white text-purple-900 border border-purple-200'
                                }`}
                              >
                                All Students ({groupPeers.length})
                              </button>
                              <button
                                type="button"
                                onClick={() => setHomeworkAssignMode('specific')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                                  homeworkAssignMode === 'specific' ? 'bg-purple-700 text-white' : 'bg-white text-purple-900 border border-purple-200'
                                }`}
                              >
                                Specific Student(s)
                              </button>
                            </div>
                          </div>

                          {homeworkAssignMode === 'specific' && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {groupPeers.map((peer) => {
                                const checked = homeworkTargetStudentIds.includes(peer.id)
                                return (
                                  <label
                                    key={peer.id}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                                      checked ? 'bg-purple-700 text-white border-purple-700' : 'bg-white text-foreground border-purple-200'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setHomeworkTargetStudentIds((prev) => [...prev, peer.id])
                                        } else {
                                          setHomeworkTargetStudentIds((prev) => prev.filter((id) => id !== peer.id))
                                        }
                                      }}
                                      className="accent-purple-700"
                                    />
                                    <span>{peer.name}</span>
                                  </label>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </div>

                  {/* Teacher Remarks */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-foreground font-bold text-xs uppercase tracking-wider">
                        Teacher Remarks / Lesson Notes
                      </Label>
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                        Private · Educator & Admin Only
                      </span>
                    </div>
                    <textarea 
                      rows={2}
                      placeholder="e.g. Excellent progress today! Pronunciation was clear and tajweed rules were well-applied."
                      value={classRemarks}
                      onChange={(e) => setClassRemarks(e.target.value)}
                      className="w-full rounded-xl border-2 border-border p-3 text-base md:text-sm font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-colors resize-none"
                    />
                  </div>

                  {/* Real Class Duration (Read-Only, Auto-Verified) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-foreground font-bold text-xs uppercase tracking-wider">
                        Real Class Duration (Minutes)
                      </Label>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Auto-Verified • Read-Only
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-3.5 h-11 rounded-xl border-2 border-border/80 bg-muted/40 text-sm font-bold text-foreground select-none">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-emerald-700 shrink-0" />
                        <span>
                          {typeof classDuration === 'number' && classDuration > 0
                            ? `${classDuration} mins`
                            : 'Auto-counted via Google Meet'}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        Threshold: 20m min
                      </span>
                    </div>
                    {typeof classDuration === 'number' && classDuration < 20 && classDuration > 0 && (
                      <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded-lg font-medium flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                        <span>Below 20m threshold: This session will be flagged as a short class in attendance reports.</span>
                      </p>
                    )}
                  </div>

                  {/* Automated Attendance Banner */}
                  <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl flex items-center gap-2.5">
                    <Sparkles className="h-4 w-4 text-emerald-700 shrink-0" />
                    <p className="text-[11px] text-emerald-800 font-medium leading-tight">
                      Attendance & session duration are automatically verified via Google Meet.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
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
                      Save Notes & Homework
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
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                className="bg-white rounded-2xl p-4 sm:p-5 max-w-xl w-full border border-border shadow-xl relative my-auto max-h-[85vh] flex flex-col"
              >
                <div className="flex items-center justify-between pb-3.5 border-b border-border">
                  <div className="flex items-center gap-3">
                    <Avatar photoUrl={viewingStudentDetail.student?.profile_photo} name={viewingStudentDetail.name} size="sm" />
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-foreground">{viewingStudentDetail.name}</h3>
                      <p className="text-xs text-muted-foreground font-medium">
                        Reg: #{viewingStudentDetail.registration_number} • Period: {resolvedDateRange.label}
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setViewingStudentDetail(null)} 
                    className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="overflow-y-auto py-3.5 space-y-3.5 flex-1">
                  {/* KPI Mini-cards */}
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 bg-muted/40 rounded-xl border border-border/80">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Scheduled</span>
                      <span className="text-base font-bold text-foreground">{viewingStudentDetail.summary.totalScheduled}</span>
                    </div>
                    <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 block">Completed</span>
                      <span className="text-base font-bold text-emerald-800">{viewingStudentDetail.summary.totalCompletedClasses}</span>
                    </div>
                    <div className="p-2 bg-rose-50 rounded-xl border border-rose-200">
                      <span className="text-[10px] uppercase font-bold text-rose-700 block">Absent</span>
                      <span className="text-base font-bold text-rose-800">{viewingStudentDetail.summary.notAttendedCount}</span>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-xl border border-blue-200">
                      <span className="text-[10px] uppercase font-bold text-blue-700 block">Rate</span>
                      <span className="text-base font-bold text-blue-800">{viewingStudentDetail.summary.attendanceRate}%</span>
                    </div>
                  </div>

                  {/* Hours & Duration Ribbon */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-emerald-50/70 rounded-xl border border-emerald-100">
                      <span className="text-[9px] uppercase font-bold text-emerald-800 block">Total Hours</span>
                      <span className="text-sm font-black text-emerald-950">{viewingStudentDetail.summary.totalClassHoursFormatted}</span>
                    </div>
                    <div className={`p-2 rounded-xl border ${viewingStudentDetail.summary.underThresholdCount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-muted/40 border-border/70'}`}>
                      <span className="text-[9px] uppercase font-bold text-muted-foreground block">Below 20m</span>
                      <span className={`text-sm font-black ${viewingStudentDetail.summary.underThresholdCount > 0 ? 'text-amber-800' : 'text-foreground'}`}>
                        {viewingStudentDetail.summary.underThresholdCount > 0 ? `⚠️ ${viewingStudentDetail.summary.underThresholdCount}` : '✓ 0'}
                      </span>
                    </div>
                    <div className="p-2 bg-blue-50/70 rounded-xl border border-blue-100">
                      <span className="text-[9px] uppercase font-bold text-blue-800 block">Duration %</span>
                      <span className="text-sm font-black text-blue-950">{viewingStudentDetail.summary.durationFulfillmentRate}%</span>
                    </div>
                  </div>

                  {/* Sessions list */}
                  <div className="space-y-2">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-foreground">Class Sessions ({viewingStudentDetail.summary.filteredClasses.length})</h5>
                    <div className="divide-y border border-border rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                      {viewingStudentDetail.summary.filteredClasses.length > 0 ? (
                        viewingStudentDetail.summary.filteredClasses.map((item: any, idx: number) => (
                          <div key={idx} className="p-2.5 text-xs flex items-center justify-between hover:bg-muted/20">
                            <div>
                              <span className="font-bold text-foreground block">{formatUKDateTime(item.scheduled_at)}</span>
                              {item.remarks && <span className="text-[11px] text-muted-foreground block">{item.remarks}</span>}
                              {item.homework && <span className="text-[10px] text-amber-800 font-semibold block">HW: {item.homework}</span>}
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap justify-end">
                              {item.status === 'present' && item.duration_minutes ? (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.duration_minutes < 20 ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-emerald-50 text-emerald-800 border-emerald-200'}`}>
                                  {item.duration_minutes < 20 ? `⚠️ ${item.duration_minutes}m (<20m)` : `⏱️ ${item.duration_minutes}m`}
                                </span>
                              ) : null}
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                item.status === 'present' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                              }`}>
                                {item.statusLabel}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-xs text-muted-foreground font-medium">No classes in this period.</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleDownloadSingleStudentPDF(viewingStudentDetail)}
                    disabled={isExportingStudentPDF}
                    className="h-9 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {isExportingStudentPDF ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                    <span>Download Attendance PDF</span>
                  </button>
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
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                className="bg-white rounded-2xl p-5 sm:p-6 max-w-md w-full border border-border shadow-xl relative my-auto max-h-[85vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold">Edit Student Details & Status</h3>
                    <p className="text-xs text-muted-foreground">Manage academic year, term, and enrolment status</p>
                  </div>
                  <button onClick={() => setStatusEditTarget(null)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground transition-colors cursor-pointer">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                <form onSubmit={handleUpdateStatus} className="space-y-4 mb-4">
                  {/* Academic Year & Term */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/20 rounded-xl border border-border/70">
                    <div className="space-y-1.5">
                      <Label htmlFor="teacher-student-year" className="text-foreground font-bold text-xs uppercase tracking-wider">Class / Year</Label>
                      <select
                        id="teacher-student-year"
                        value={statusFormData.year}
                        onChange={e => setStatusFormData(prev => ({ ...prev, year: e.target.value }))}
                        className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm font-medium h-10 cursor-pointer text-foreground"
                      >
                        <option value="">Select Year</option>
                        {Array.from({ length: 10 }, (_, i) => `Year ${i + 1}`).map(yr => (
                          <option key={yr} value={yr}>{yr}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="teacher-student-term" className="text-foreground font-bold text-xs uppercase tracking-wider">Term</Label>
                      <select
                        id="teacher-student-term"
                        value={statusFormData.term}
                        onChange={e => setStatusFormData(prev => ({ ...prev, term: e.target.value }))}
                        className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm font-medium h-10 cursor-pointer text-foreground"
                      >
                        <option value="">Select term</option>
                        <option value="Term-01">Term-01</option>
                        <option value="Term-02">Term-02</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground font-bold text-xs uppercase tracking-wider">Enrolment Status</Label>
                    <div className="grid grid-cols-1 gap-2 pt-0.5">
                      {[
                        { id: 'ongoing', label: 'Ongoing', desc: 'Regular active student attendance', icon: CheckCircle2, iconColor: 'text-emerald-600', border: 'border-emerald-200 bg-emerald-50/50 text-emerald-900', activeRing: 'ring-2 ring-emerald-600 border-emerald-600 bg-emerald-50' },
                        { id: 'break', label: 'On a Break', desc: 'Temporary leave with scheduled dates', icon: Clock, iconColor: 'text-amber-600', border: 'border-amber-200 bg-amber-50/50 text-amber-900', activeRing: 'ring-2 ring-amber-600 border-amber-600 bg-amber-50' },
                        { id: 'stopped', label: 'Stopped', desc: 'Completed or discontinued course', icon: XCircle, iconColor: 'text-rose-600', border: 'border-rose-200 bg-rose-50/50 text-rose-900', activeRing: 'ring-2 ring-rose-600 border-rose-600 bg-rose-50' }
                      ].map(opt => {
                        const IconComp = opt.icon
                        const isSelected = statusFormData.enrolmentStatus === opt.id
                        return (
                          <button
                            type="button"
                            key={opt.id}
                            onClick={() => setStatusFormData(prev => ({ ...prev, enrolmentStatus: opt.id }))}
                            className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                              isSelected ? opt.activeRing : `${opt.border} hover:opacity-90`
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <IconComp className={`h-4 w-4 ${opt.iconColor} shrink-0`} />
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
                      <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 leading-relaxed font-medium">
                        <strong className="font-bold">Academy Record:</strong> Marking this student as stopped updates their class enrolment on academy records. Portal login access is preserved and can only be revoked by Academy Administration.
                      </div>
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
                    Save Details & Status
                  </BouncyButton>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      </div>

      {/* Mobile "More" Drawer */}
      <AnimatePresence>
        {isMobileMoreOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMoreOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] md:hidden"
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed bottom-[72px] left-3 right-3 bg-white rounded-2xl border border-border shadow-2xl p-3 space-y-1.5 z-50"
            >
              <div className="flex items-center justify-between px-2 pb-1.5 border-b border-border/70">
                <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">More Features</span>
                <button
                  type="button"
                  onClick={() => setIsMobileMoreOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => { setActiveTab('groups'); setIsMobileMoreOpen(false) }}
                className={`w-full min-h-[48px] px-3 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between cursor-pointer ${
                  activeTab === 'groups' ? 'bg-[#1A6B4A] text-white' : 'text-foreground hover:bg-muted'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 shrink-0" />
                  <span>Groups / Batches</span>
                </div>
                {groups.length > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${activeTab === 'groups' ? 'bg-white/20 text-white' : 'bg-muted text-foreground'}`}>
                    {groups.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('syllabus'); setIsMobileMoreOpen(false) }}
                className={`w-full min-h-[48px] px-3 py-2.5 rounded-xl text-sm font-bold flex items-center gap-3 cursor-pointer ${
                  activeTab === 'syllabus' ? 'bg-[#1A6B4A] text-white' : 'text-foreground hover:bg-muted'
                }`}
              >
                <BookOpen className="h-5 w-5 shrink-0" />
                <span>Syllabus Bank</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('quran'); setIsMobileMoreOpen(false) }}
                className={`w-full min-h-[48px] px-3 py-2.5 rounded-xl text-sm font-bold flex items-center gap-3 cursor-pointer ${
                  activeTab === 'quran' ? 'bg-[#1A6B4A] text-white' : 'text-foreground hover:bg-muted'
                }`}
              >
                <BookOpen className={`h-5 w-5 shrink-0 ${activeTab === 'quran' ? 'text-white' : 'text-emerald-600'}`} />
                <span>Quran &amp; Hifz</span>
              </button>

              <div className="pt-1 border-t border-border/70">
                <button
                  type="button"
                  onClick={() => { setActiveTab('profile'); setIsMobileMoreOpen(false) }}
                  className={`w-full min-h-[48px] px-3 py-2.5 rounded-xl text-sm font-bold flex items-center gap-3 cursor-pointer ${
                    activeTab === 'profile' ? 'bg-[#1A6B4A] text-white' : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <User className="h-5 w-5 shrink-0" />
                  <span>Profile</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation (5 core items) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-border grid grid-cols-5 p-1.5 z-50 md:hidden pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.08)] rounded-t-3xl">
        <NavBtn active={activeTab === 'classes'} onClick={() => { setActiveTab('classes'); setIsMobileMoreOpen(false) }} icon={<Calendar className={activeTab === 'classes' ? 'fill-primary/20' : ''} />} label="Schedule" />
        <NavBtn active={activeTab === 'create'} onClick={() => { setPreselectedGroupId(null); setActiveTab('create'); setIsMobileMoreOpen(false) }} icon={<Plus className={activeTab === 'create' ? 'fill-primary/20' : ''} />} label="Create" />
        <NavBtn active={activeTab === 'homework'} onClick={() => { setActiveTab('homework'); setIsMobileMoreOpen(false) }} icon={<FileText className={activeTab === 'homework' ? 'fill-primary/20 text-amber-600' : ''} />} label="Homework" />
        <NavBtn active={activeTab === 'stats'} onClick={() => { setActiveTab('stats'); setIsMobileMoreOpen(false) }} icon={<BarChart3 className={activeTab === 'stats' ? 'fill-primary/20' : ''} />} label="Stats" />
        <NavBtn active={isMobileMoreOpen || ['groups', 'syllabus', 'quran', 'profile'].includes(activeTab)} onClick={() => setIsMobileMoreOpen((prev) => !prev)} icon={<Menu />} label="More" />
      </nav>

      {/* Student Preview Modal */}
      <StudentPreviewModal
        student={previewStudent}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        onEdit={(s) => openStatusEdit(s)}
      />

      {/* Permanent Student Group Modal */}
      <GroupModal
        isOpen={isGroupModalOpen}
        onClose={() => {
          setIsGroupModalOpen(false)
          setEditingGroup(null)
        }}
        group={editingGroup}
        students={students}
        onSave={handleSaveGroup}
      />
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

function CreateClassForm({ 
  students, 
  teacherId, 
  groups,
  preselectedGroupId,
  onOpenGroupManager,
  onCreated 
}: { 
  students: any[], 
  teacherId: string | null, 
  groups: any[],
  preselectedGroupId?: string | null,
  onOpenGroupManager: () => void,
  onCreated: (studentId: string) => void 
}) {
  const [scheduleMode, setScheduleMode] = useState<'individual' | 'group'>(
    preselectedGroupId ? 'group' : 'individual'
  )
  const [selectedGroupId, setSelectedGroupId] = useState<string>(preselectedGroupId || (groups[0]?.id || ''))
  const [formData, setFormData] = useState({ 
    studentId: '', 
    title: 'Moral Class Alihsan Academy',
    date: '', 
    time: '', 
    repeatWeekly: false 
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (preselectedGroupId) {
      setScheduleMode('group')
      setSelectedGroupId(preselectedGroupId)
    }
  }, [preselectedGroupId])

  useEffect(() => {
    if (students.length > 0 && !formData.studentId) {
      setFormData(prev => ({ ...prev, studentId: students[0].id }))
    }
  }, [students])

  useEffect(() => {
    if (groups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(groups[0].id)
    }
  }, [groups])

  const selectedGroup = groups.find(g => g.id === selectedGroupId)
  const selectedGroupStudents = students.filter(s => selectedGroup?.student_ids?.includes(s.id))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teacherId) return

    if (scheduleMode === 'individual') {
      if (!formData.studentId) {
        toast.error('Please select a student')
        return
      }
    } else {
      if (!selectedGroup) {
        toast.error('Please select a group, or create one first')
        return
      }
      if (!selectedGroup.student_ids || selectedGroup.student_ids.length === 0) {
        toast.error('This group has no students. Please edit the group to add students.')
        return
      }
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

      const sessionTitle = formData.title.trim() || 'Moral Class Alihsan Academy'

      const payload = scheduleMode === 'group' ? {
        studentIds: selectedGroup?.student_ids,
        groupId: selectedGroup?.id,
        groupName: selectedGroup?.name,
        title: sessionTitle,
        date: formData.date,
        time: formData.time,
        repeatWeekly: formData.repeatWeekly
      } : {
        studentId: formData.studentId,
        title: sessionTitle,
        date: formData.date,
        time: formData.time,
        repeatWeekly: formData.repeatWeekly
      }

      const response = await fetch('/api/classes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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

      if (scheduleMode === 'group') {
        toast.success(`Group Class "${sessionTitle}" scheduled for ${selectedGroup?.name} (${selectedGroupStudents.length} students) for ${ukDisplay} UK time.`)
      } else {
        toast.success(`"${sessionTitle}" scheduled for ${ukDisplay} UK time.`)
      }

      setFormData(prev => ({
        ...prev,
        title: 'Moral Class Alihsan Academy',
        date: '',
        time: '',
        repeatWeekly: false
      }))

      const targetId = scheduleMode === 'group' ? (selectedGroup?.student_ids?.[0] || formData.studentId) : formData.studentId
      onCreated(targetId)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatedCard className="max-w-xl mx-auto p-4 sm:p-6 rounded-2xl bg-white border border-border shadow-xs">
      {/* Sleek Compact Header */}
      <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-border/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200">
            <Plus className="h-4.5 w-4.5 text-emerald-700" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-foreground">Schedule Class</h3>
            <p className="text-[11px] text-muted-foreground font-medium">UK Timezone (GMT/BST) • Auto Google Meet</p>
          </div>
        </div>

        {/* Mode Toggle: 1-on-1 vs Group */}
        <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/70 shrink-0">
          <button
            type="button"
            onClick={() => setScheduleMode('individual')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[30px] flex items-center gap-1.5 ${
              scheduleMode === 'individual'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>Individual</span>
          </button>
          <button
            type="button"
            onClick={() => setScheduleMode('group')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[30px] flex items-center gap-1.5 ${
              scheduleMode === 'group'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Group Batch</span>
            {groups.length > 0 && (
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                {groups.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {scheduleMode === 'individual' ? (
          <div className="space-y-1.5">
            <Label className="text-foreground font-bold text-xs">Select Student</Label>
            <StudentSelectDropdown
              students={students}
              selectedStudentId={formData.studentId}
              onSelect={(id) => setFormData(prev => ({ ...prev, studentId: id }))}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-foreground font-bold text-xs">Select Permanent Group</Label>
              <button
                type="button"
                onClick={onOpenGroupManager}
                className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                <span>New Group</span>
              </button>
            </div>

            {groups.length === 0 ? (
              <div className="p-3.5 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 text-center">
                <p className="text-xs font-bold text-emerald-950">No groups created yet</p>
                <p className="text-[11px] text-emerald-800/80 mt-0.5 mb-2.5">
                  Create a permanent student group to schedule a single class for multiple students together.
                </p>
                <button
                  type="button"
                  onClick={onOpenGroupManager}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1A6B4A] text-white text-xs font-bold rounded-lg shadow-xs hover:bg-[#14553A] cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create Permanent Group</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-white text-xs sm:text-sm font-semibold text-foreground focus:border-emerald-700 outline-none"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.student_ids?.length || 0} students)
                    </option>
                  ))}
                </select>

                {selectedGroup && (
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border/80">
                    <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground mb-1.5">
                      <span>Group Members ({selectedGroupStudents.length} Students):</span>
                      <span className="text-emerald-700 font-semibold">1 Google Meet Room</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                      {selectedGroupStudents.map((s) => (
                        <span
                          key={s.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-border text-[11px] font-medium text-foreground"
                        >
                          <Avatar photoUrl={s.profile_photo} name={s.name} size="sm" />
                          <span className="truncate max-w-[120px]">{s.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-foreground font-bold text-xs">Session Title</Label>
            <span className="text-[10px] text-muted-foreground font-medium">Default: Moral Class Alihsan Academy</span>
          </div>
          <div className="relative">
            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Moral Class Alihsan Academy"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="pl-9 h-10 text-xs sm:text-sm rounded-xl border font-medium bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <ClassDatePicker
            value={formData.date}
            onChange={(dateStr) => setFormData(prev => ({ ...prev, date: dateStr }))}
          />
          <div className="space-y-2">
            <ClassTimePicker
              value={formData.time}
              onChange={(timeStr) => setFormData(prev => ({ ...prev, time: timeStr }))}
            />
            <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-xl p-2.5 flex items-start gap-1.5">
              <Globe className="h-3.5 w-3.5 text-emerald-700 shrink-0 mt-0.5" />
              <p className="text-[11px] text-emerald-950 font-medium leading-snug">
                Scheduled in UK Time (GMT/BST). Google Meet will be auto-generated.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 bg-muted/30 p-2.5 rounded-xl border border-border/80">
          <input 
            type="checkbox"
            id="repeat"
            className="w-4 h-4 rounded border-border text-emerald-700 focus:ring-emerald-700 cursor-pointer"
            checked={formData.repeatWeekly}
            onChange={(e) => setFormData(prev => ({ ...prev, repeatWeekly: e.target.checked }))}
          />
          <Label htmlFor="repeat" className="text-foreground font-bold cursor-pointer text-xs">
            Repeat this class every week (for 4 weeks)
          </Label>
        </div>

        <button
          type="submit" 
          disabled={isSubmitting || (scheduleMode === 'group' && (!selectedGroup || selectedGroup.student_ids.length === 0))}
          className="w-full h-10.5 sm:h-11 text-xs sm:text-sm font-bold bg-[#1A6B4A] hover:bg-[#14553A] text-white rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin h-4 w-4" />
              <span>Scheduling Class...</span>
            </>
          ) : (
            <>
              <Calendar className="h-4 w-4" />
              <span>
                {scheduleMode === 'group'
                  ? `Schedule Group Class (${selectedGroupStudents.length} Students)`
                  : 'Schedule Class'}
              </span>
            </>
          )}
        </button>
      </form>
    </AnimatedCard>
  )
}

function GroupsManager({
  groups,
  students,
  isLoading,
  onOpenCreate,
  onOpenEdit,
  onDeleteGroup,
  onScheduleGroup,
}: {
  groups: any[]
  students: any[]
  isLoading: boolean
  onOpenCreate: () => void
  onOpenEdit: (group: any) => void
  onDeleteGroup: (id: string, name: string) => void
  onScheduleGroup: (groupId: string) => void
}) {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200">
              <Users className="h-4.5 w-4.5 text-emerald-700" />
            </div>
            <h3 className="font-black text-foreground text-lg sm:text-xl">Permanent Student Groups</h3>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">
            Create permanent batches of students for 1-click group scheduling with automated Google Meet tracking.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1A6B4A] hover:bg-[#14553A] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer min-h-[40px]"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Group</span>
        </button>
      </div>

      {/* Groups Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-border">
          <Loader2 className="h-7 w-7 animate-spin text-primary mb-2" />
          <p className="text-xs font-bold text-muted-foreground">Loading student groups...</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-white rounded-2xl border border-dashed border-border">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-3 border border-emerald-200/60">
            <Users className="h-7 w-7 text-emerald-700" />
          </div>
          <h4 className="font-bold text-foreground text-base">No Groups Created Yet</h4>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mt-1 mb-4 leading-relaxed">
            Organize your students into permanent batches (e.g., 2 to 5 students). Groups stay saved permanently and let you schedule 1 joint class with a shared Google Meet room in a single click.
          </p>
          <button
            type="button"
            onClick={onOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1A6B4A] hover:bg-[#14553A] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors cursor-pointer min-h-[40px]"
          >
            <Plus className="h-4 w-4" />
            <span>Create Your First Group</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((group) => {
            const groupStudents = students.filter((s) => group.student_ids?.includes(s.id))
            return (
              <div
                key={group.id}
                className="bg-white rounded-2xl border border-border p-4 sm:p-5 shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div>
                      <h4 className="font-bold text-foreground text-base sm:text-lg flex items-center gap-2">
                        <span>{group.name}</span>
                      </h4>
                      <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                        Created {new Date(group.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                      {group.student_ids?.length || 0} Students
                    </span>
                  </div>

                  {/* Student Chips */}
                  <div className="space-y-1.5 pt-2 border-t border-border/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Enrolled Students
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                      {groupStudents.length > 0 ? (
                        groupStudents.map((s) => (
                          <span
                            key={s.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/50 border border-border/80 text-xs font-semibold text-foreground"
                          >
                            <Avatar photoUrl={s.profile_photo} name={s.name} size="sm" />
                            <span className="truncate max-w-[140px]">{s.name}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          No active students currently matched
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => onScheduleGroup(group.id)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#1A6B4A] hover:bg-[#14553A] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer min-h-[38px]"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Schedule Class</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenEdit(group)}
                    className="px-3 py-2 border border-border bg-white hover:bg-muted/60 text-foreground text-xs font-bold rounded-xl transition-colors cursor-pointer min-h-[38px] flex items-center gap-1"
                    title="Edit group name or members"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteGroup(group.id, group.name)}
                    className="p-2 border border-rose-200 bg-rose-50/60 hover:bg-rose-100/80 text-rose-700 text-xs font-bold rounded-xl transition-colors cursor-pointer min-h-[38px] flex items-center justify-center"
                    title="Delete group"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function GroupModal({
  isOpen,
  onClose,
  group,
  students,
  onSave,
}: {
  isOpen: boolean
  onClose: () => void
  group: any | null
  students: any[]
  onSave: (data: { id?: string; name: string; studentIds: string[] }) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (group) {
      setName(group.name || '')
      setSelectedIds(group.student_ids || [])
    } else {
      setName('')
      setSelectedIds([])
    }
    setSearch('')
  }, [group, isOpen])

  if (!isOpen) return null

  const filteredStudents = students.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.registration_number?.toLowerCase().includes(search.toLowerCase())
  )

  const toggleStudent = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedIds.length === filteredStudents.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredStudents.map((s) => s.id))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Please enter a group name')
      return
    }
    if (selectedIds.length === 0) {
      toast.error('Please select at least 1 student for the group')
      return
    }

    setIsSubmitting(true)
    try {
      await onSave({
        id: group?.id,
        name: name.trim(),
        studentIds: selectedIds,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-border/80 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-muted/20">
          <div>
            <h4 className="font-black text-foreground text-base sm:text-lg">
              {group ? 'Edit Student Group' : 'Create Permanent Student Group'}
            </h4>
            <p className="text-[11px] sm:text-xs text-muted-foreground font-medium mt-0.5">
              This group will be saved permanently ready for daily 1-click scheduling.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          <div>
            <Label className="text-foreground font-bold text-xs">Group Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tajweed Batch A, Grade 3 Moral Studies"
              className="mt-1 h-10 text-xs sm:text-sm bg-white"
              required
              autoFocus
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-foreground font-bold text-xs">
                Select Students ({selectedIds.length} of {students.length} selected)
              </Label>
              {filteredStudents.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                >
                  {selectedIds.length === filteredStudents.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>

            {/* Search */}
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search assigned students..."
                className="pl-8 h-8 text-xs bg-white"
              />
            </div>

            {/* Student Checklist */}
            <div className="max-h-56 overflow-y-auto custom-scrollbar border border-border rounded-xl p-1.5 space-y-1 bg-muted/10">
              {filteredStudents.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No matching students found.</p>
              ) : (
                filteredStudents.map((s) => {
                  const isChecked = selectedIds.includes(s.id)
                  return (
                    <label
                      key={s.id}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                        isChecked ? 'bg-emerald-50 border border-emerald-200' : 'hover:bg-muted/40 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleStudent(s.id)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <Avatar photoUrl={s.profile_photo} name={s.name} size="sm" />
                        <div className="truncate">
                          <p className="text-xs font-bold text-foreground truncate">{s.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {s.registration_number ? `#${s.registration_number}` : ''} {s.year ? `• Year ${s.year}` : ''}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={s.enrolment_status || 'ongoing'} />
                    </label>
                  )
                })
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-border bg-white hover:bg-muted/50 text-foreground text-xs font-bold rounded-xl transition-colors cursor-pointer min-h-[38px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#1A6B4A] hover:bg-[#14553A] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer min-h-[38px] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving Group...</span>
                </>
              ) : (
                <span>{group ? 'Save Changes' : 'Create Group'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string, className: string }> = {
    ongoing:  { label: 'Ongoing',   className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    break:    { label: 'On a Break', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    stopped:  { label: 'Stopped',   className: 'bg-rose-50 text-rose-700 border-rose-200' },
  }
  const s = map[status] || map.ongoing
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${s.className}`}>
      {s.label}
    </span>
  )
}
