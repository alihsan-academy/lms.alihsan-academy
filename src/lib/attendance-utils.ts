import { format, subDays, startOfMonth, endOfMonth, subMonths, isWithinInterval, parseISO } from 'date-fns'

export type DateFilterType = 'last_7_days' | 'last_30_days' | 'this_month' | 'last_month' | 'all_time' | 'custom'

export interface DateRange {
  start: Date | null
  end: Date | null
  label: string
}

export interface ParsedClassRecord {
  id: string
  student_id: string
  teacher_id: string
  scheduled_at: string
  title: string
  meet_link: string | null
  recording_url: string | null
  raw_status: string // 'scheduled' | 'completed'
  attendance_status: string // 'present' | 'absent' | 'unmarked'
  status: 'present' | 'absent' | 'teacher_unavailable' | 'student_unavailable' | 'break' | 'scheduled'
  statusLabel: string
  remarks: string
  badgeVariant: 'present' | 'absent' | 'teacher_unavailable' | 'student_unavailable' | 'break' | 'scheduled'
  teacher_name?: string
  student_name?: string
  student_reg?: string
}

export interface AttendanceSummary {
  totalScheduled: number
  attendedCount: number
  notAttendedCount: number
  teacherUnavailableCount: number
  studentUnavailableCount: number
  breakCount: number
  scheduledUpcomingCount: number
  attendanceRate: number
  filteredClasses: ParsedClassRecord[]
  isOnBreak: boolean
  breakDetails?: {
    from: string
    to: string
    reason: string
  }
}

export function getDateRange(
  filterType: DateFilterType,
  customStart?: string,
  customEnd?: string
): DateRange {
  const now = new Date()

  switch (filterType) {
    case 'last_7_days': {
      const start = subDays(now, 7)
      start.setHours(0, 0, 0, 0)
      const end = new Date(now)
      end.setHours(23, 59, 59, 999)
      return {
        start,
        end,
        label: `Last 7 Days (${format(start, 'dd MMM')} - ${format(end, 'dd MMM yyyy')})`
      }
    }
    case 'last_30_days': {
      const start = subDays(now, 30)
      start.setHours(0, 0, 0, 0)
      const end = new Date(now)
      end.setHours(23, 59, 59, 999)
      return {
        start,
        end,
        label: `Last 30 Days (${format(start, 'dd MMM')} - ${format(end, 'dd MMM yyyy')})`
      }
    }
    case 'this_month': {
      const start = startOfMonth(now)
      start.setHours(0, 0, 0, 0)
      const end = endOfMonth(now)
      end.setHours(23, 59, 59, 999)
      return {
        start,
        end,
        label: `This Month (${format(start, 'MMMM yyyy')})`
      }
    }
    case 'last_month': {
      const prevMonth = subMonths(now, 1)
      const start = startOfMonth(prevMonth)
      start.setHours(0, 0, 0, 0)
      const end = endOfMonth(prevMonth)
      end.setHours(23, 59, 59, 999)
      return {
        start,
        end,
        label: `Last Month (${format(start, 'MMMM yyyy')})`
      }
    }
    case 'custom': {
      if (customStart && customEnd) {
        const start = new Date(customStart)
        start.setHours(0, 0, 0, 0)
        const end = new Date(customEnd)
        end.setHours(23, 59, 59, 999)
        return {
          start,
          end,
          label: `Custom (${format(start, 'dd MMM yyyy')} - ${format(end, 'dd MMM yyyy')})`
        }
      }
      return {
        start: null,
        end: null,
        label: 'Custom Range'
      }
    }
    case 'all_time':
    default:
      return {
        start: null,
        end: null,
        label: 'All Time'
      }
  }
}

export function parseClassMetadata(
  c: any,
  attendanceRecord: any,
  studentProfile?: any
): ParsedClassRecord {
  let recording_url: string | null = null
  let remarks = ''
  let statusDetail = ''
  let title = c.title || 'Moral Class Alihsan Academy'

  if (c.recording_url) {
    if (typeof c.recording_url === 'string' && c.recording_url.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(c.recording_url)
        recording_url = parsed.recording_url || null
        remarks = parsed.remarks || ''
        statusDetail = parsed.status_detail || parsed.reason || ''
        if (parsed.title) {
          title = parsed.title
        }
      } catch (e) {
        recording_url = c.recording_url
      }
    } else {
      recording_url = c.recording_url
    }
  }

  const attStatus = attendanceRecord?.status || 'unmarked'
  const isClassCompleted = c.status === 'completed'

  let resolvedStatus: ParsedClassRecord['status'] = 'scheduled'
  let statusLabel = 'Scheduled'
  let badgeVariant: ParsedClassRecord['badgeVariant'] = 'scheduled'

  // Check if class scheduled time falls in student approved break period
  let classInStudentBreak = false
  if (studentProfile?.break_from_date && studentProfile?.break_to_date && c.scheduled_at) {
    const classTime = new Date(c.scheduled_at).getTime()
    const bStart = new Date(studentProfile.break_from_date).setHours(0, 0, 0, 0)
    const bEnd = new Date(studentProfile.break_to_date).setHours(23, 59, 59, 999)
    if (classTime >= bStart && classTime <= bEnd) {
      classInStudentBreak = true
    }
  }

  if (isClassCompleted || attStatus !== 'unmarked') {
    if (statusDetail === 'teacher_unavailable') {
      resolvedStatus = 'teacher_unavailable'
      statusLabel = 'Teacher Unavailable'
      badgeVariant = 'teacher_unavailable'
    } else if (statusDetail === 'student_unavailable') {
      resolvedStatus = 'student_unavailable'
      statusLabel = 'Student Unavailable'
      badgeVariant = 'student_unavailable'
    } else if (statusDetail === 'break' || classInStudentBreak) {
      resolvedStatus = 'break'
      statusLabel = 'Break'
      badgeVariant = 'break'
      if (!remarks && studentProfile?.break_reason) {
        remarks = `Break: ${studentProfile.break_reason}`
      }
    } else if (attStatus === 'present' || (!statusDetail && attStatus !== 'absent')) {
      resolvedStatus = 'present'
      statusLabel = 'Attended'
      badgeVariant = 'present'
    } else if (attStatus === 'absent') {
      resolvedStatus = 'absent'
      statusLabel = 'Not Attended'
      badgeVariant = 'absent'
    }
  } else {
    // Class is scheduled
    if (classInStudentBreak) {
      resolvedStatus = 'break'
      statusLabel = 'Scheduled (Break Period)'
      badgeVariant = 'break'
      if (!remarks && studentProfile?.break_reason) {
        remarks = `Break: ${studentProfile.break_reason}`
      }
    } else {
      const isPast = new Date(c.scheduled_at).getTime() < Date.now()
      if (isPast) {
        resolvedStatus = 'absent'
        statusLabel = 'Missed / Unmarked'
        badgeVariant = 'absent'
      } else {
        resolvedStatus = 'scheduled'
        statusLabel = 'Upcoming'
        badgeVariant = 'scheduled'
      }
    }
  }

  return {
    id: c.id,
    student_id: c.student_id,
    teacher_id: c.teacher_id,
    scheduled_at: c.scheduled_at,
    title: title || 'Moral Class Alihsan Academy',
    meet_link: c.meet_link || null,
    recording_url,
    raw_status: c.status,
    attendance_status: attStatus,
    status: resolvedStatus,
    statusLabel,
    remarks,
    badgeVariant,
  }
}

export function isDateWithinRange(dateStr: string, range: DateRange): boolean {
  if (!range.start && !range.end) return true
  const d = new Date(dateStr)
  if (range.start && d < range.start) return false
  if (range.end && d > range.end) return false
  return true
}

export function calculateStudentAttendanceSummary(
  classes: any[],
  attendanceRecords: any[],
  studentProfile?: any,
  dateRange?: DateRange
): AttendanceSummary {
  const activeRange = dateRange || { start: null, end: null, label: 'All Time' }

  // Filter classes within range
  const filteredRawClasses = classes.filter((c: any) =>
    isDateWithinRange(c.scheduled_at, activeRange)
  )

  const parsedList = filteredRawClasses.map((c: any) => {
    const att = attendanceRecords.find((a: any) => a.class_id === c.id)
    return parseClassMetadata(c, att, studentProfile)
  })

  // Sort by date descending
  parsedList.sort(
    (a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
  )

  let attendedCount = 0
  let absentCount = 0
  let teacherUnavailableCount = 0
  let studentUnavailableCount = 0
  let breakCount = 0
  let scheduledUpcomingCount = 0

  parsedList.forEach((item) => {
    switch (item.status) {
      case 'present':
        attendedCount++
        break
      case 'teacher_unavailable':
        teacherUnavailableCount++
        break
      case 'student_unavailable':
        studentUnavailableCount++
        break
      case 'break':
        breakCount++
        break
      case 'absent':
        absentCount++
        break
      case 'scheduled':
        scheduledUpcomingCount++
        break
    }
  })

  const notAttendedCount = absentCount + teacherUnavailableCount + studentUnavailableCount + breakCount
  const totalScheduled = parsedList.length

  // Attendance rate based on scheduled classes that have taken place or were scheduled
  const completedOrMissed = attendedCount + notAttendedCount
  const attendanceRate =
    completedOrMissed > 0
      ? Math.round((attendedCount / completedOrMissed) * 100)
      : totalScheduled > 0 && attendedCount > 0
      ? Math.round((attendedCount / totalScheduled) * 100)
      : 0

  // Check if student is actively on break or was on break in this interval
  let isOnBreak = studentProfile?.enrolment_status === 'break'
  let breakDetails: { from: string; to: string; reason: string } | undefined

  if (studentProfile?.break_from_date && studentProfile?.break_to_date) {
    breakDetails = {
      from: studentProfile.break_from_date,
      to: studentProfile.break_to_date,
      reason: studentProfile.break_reason || 'Personal break',
    }
  }

  return {
    totalScheduled,
    attendedCount,
    notAttendedCount,
    teacherUnavailableCount,
    studentUnavailableCount,
    breakCount,
    scheduledUpcomingCount,
    attendanceRate,
    filteredClasses: parsedList,
    isOnBreak,
    breakDetails,
  }
}

export function formatUKDateTime(dateStr: string): string {
  if (!dateStr) return 'N/A'
  try {
    return new Date(dateStr).toLocaleString('en-GB', {
      timeZone: 'Europe/London',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch (e) {
    return dateStr
  }
}
