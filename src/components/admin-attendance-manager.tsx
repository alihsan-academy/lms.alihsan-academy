"use client"

import React, { useState } from 'react'
import { 
  Search, 
  UserCheck, 
  GraduationCap, 
  Calendar, 
  Download, 
  Loader2, 
  Clock, 
  Video, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Users, 
  Sparkles,
  X
} from 'lucide-react'
import { Avatar } from '@/components/avatar'
import { AnimatedCard } from '@/components/animated-card'
import { BouncyButton } from '@/components/bouncy-button'
import { DateRangeFilter } from '@/components/date-range-filter'
import { 
  DateFilterType, 
  getDateRange, 
  calculateStudentAttendanceSummary, 
  formatUKDateTime, 
  isDateWithinRange, 
  parseClassMetadata 
} from '@/lib/attendance-utils'
import { generateStudentAttendancePDF, generateTeacherAttendancePDF, generateIntelligenceFilterPDF } from '@/lib/pdf-generator'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface AdminAttendanceManagerProps {
  students: any[]
  teachers: any[]
  classes: any[]
  attendance: any[]
  allUsers: any[]
}

type SearchMode = 'teacher' | 'student' | 'all' | 'filter'

export function AdminAttendanceManager({
  students,
  teachers,
  classes,
  attendance,
  allUsers,
}: AdminAttendanceManagerProps) {
  const [searchMode, setSearchMode] = useState<SearchMode>('teacher')
  
  // Date filtering state
  const [filterType, setFilterType] = useState<DateFilterType>('all_time')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  // Search queries
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('')
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || '')

  const [studentSearchQuery, setStudentSearchQuery] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')

  // Modal for detailed student view from teacher mode
  const [modalStudentData, setModalStudentData] = useState<any>(null)
  
  // PDF export loading state
  const [isExportingPDF, setIsExportingPDF] = useState(false)

  // Intelligence Filter state
  const [enrolmentFilter, setEnrolmentFilter] = useState<'all' | 'ongoing' | 'break' | 'stopped'>('all')
  const [attendedMin, setAttendedMin] = useState('')
  const [attendedMax, setAttendedMax] = useState('')
  const [studentAbsentMin, setStudentAbsentMin] = useState('')
  const [studentAbsentMax, setStudentAbsentMax] = useState('')
  const [teacherMissedMin, setTeacherMissedMin] = useState('')
  const [teacherMissedMax, setTeacherMissedMax] = useState('')
  const [onBreakMin, setOnBreakMin] = useState('')
  const [onBreakMax, setOnBreakMax] = useState('')
  const [rateMin, setRateMin] = useState('')
  const [rateMax, setRateMax] = useState('')

  const dateRange = getDateRange(filterType, customStart, customEnd)

  // Filter teachers by search query
  const filteredTeachers = teachers.filter((t) => {
    const q = teacherSearchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      (t.name && t.name.toLowerCase().includes(q)) ||
      (t.email && t.email.toLowerCase().includes(q))
    )
  })

  // Selected teacher
  const currentTeacher = teachers.find((t) => t.id === selectedTeacherId) || filteredTeachers[0]

  // Students under the selected teacher
  const studentsUnderTeacher = currentTeacher
    ? students.filter((s) => s.teacher_id === currentTeacher.id)
    : []

  // Compute stats for current teacher
  let teacherTotalScheduled = 0
  let teacherTotalAttended = 0
  let teacherTotalAbsent = 0
  let teacherTeacherUnavailable = 0
  let teacherStudentUnavailable = 0
  let teacherBreak = 0

  const teacherStudentsBreakdown = studentsUnderTeacher.map((s) => {
    const studentClasses = classes.filter((c: any) => c.student_id === s.id)
    const summary = calculateStudentAttendanceSummary(studentClasses, attendance, s, dateRange)

    teacherTotalScheduled += summary.totalScheduled
    teacherTotalAttended += summary.attendedCount
    teacherTotalAbsent += (summary.notAttendedCount - summary.teacherUnavailableCount - summary.studentUnavailableCount - summary.breakCount)
    teacherTeacherUnavailable += summary.teacherUnavailableCount
    teacherStudentUnavailable += summary.studentUnavailableCount
    teacherBreak += summary.breakCount

    let remarks = ''
    if (s.enrolment_status === 'break' && s.break_reason) {
      remarks = `Break: ${s.break_reason}`
    } else if (summary.teacherUnavailableCount > 0) {
      remarks = `${summary.teacherUnavailableCount} Teacher Missed`
    } else if (summary.studentUnavailableCount > 0) {
      remarks = `${summary.studentUnavailableCount} Student Missed`
    }

    return {
      student: s,
      registration_number: s.registration_number || 'N/A',
      name: s.name,
      enrolment_status: s.enrolment_status || 'ongoing',
      scheduled: summary.totalScheduled,
      attended: summary.attendedCount,
      notAttended: summary.notAttendedCount,
      remarks,
      percentage: summary.attendanceRate,
      summary,
    }
  })

  const teacherTotalNotAttended = teacherTotalAbsent + teacherTeacherUnavailable + teacherStudentUnavailable + teacherBreak
  const teacherCompletedOrMissed = teacherTotalAttended + teacherTotalNotAttended
  const teacherOverallPercentage = teacherCompletedOrMissed > 0
    ? Math.round((teacherTotalAttended / teacherCompletedOrMissed) * 100)
    : 0

  // Filter students for student search mode
  const filteredStudents = students.filter((s) => {
    const q = studentSearchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      (s.registration_number && s.registration_number.toLowerCase().includes(q)) ||
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q))
    )
  })

  const currentStudent = selectedStudentId
    ? students.find((s) => s.id === selectedStudentId)
    : filteredStudents[0]

  const currentStudentClasses = currentStudent
    ? classes.filter((c: any) => c.student_id === currentStudent.id)
    : []

  const currentStudentSummary = currentStudent
    ? calculateStudentAttendanceSummary(currentStudentClasses, attendance, currentStudent, dateRange)
    : null

  const currentStudentTeacher = currentStudent
    ? teachers.find((t) => t.id === currentStudent.teacher_id)
    : null

  // Intelligence Filter: compute stats for all students, then apply range filters
  const filteredIntelligenceStudents = searchMode === 'filter' ? students
    .map((s) => {
      const sc = classes.filter((c: any) => c.student_id === s.id)
      const summary = calculateStudentAttendanceSummary(sc, attendance, s, dateRange)
      return { student: s, summary }
    })
    .filter(({ student: s, summary }) => {
      // Enrolment status filter
      if (enrolmentFilter !== 'all' && (s.enrolment_status || 'ongoing') !== enrolmentFilter) return false

      const inRange = (val: number, min: string, max: string) => {
        if (min !== '' && val < Number(min)) return false
        if (max !== '' && val > Number(max)) return false
        return true
      }

      if (!inRange(summary.attendedCount, attendedMin, attendedMax)) return false
      if (!inRange(summary.studentUnavailableCount, studentAbsentMin, studentAbsentMax)) return false
      if (!inRange(summary.teacherUnavailableCount, teacherMissedMin, teacherMissedMax)) return false
      if (!inRange(summary.breakCount, onBreakMin, onBreakMax)) return false
      if (!inRange(summary.attendanceRate, rateMin, rateMax)) return false

      return true
    }) : []

  // Handler: Export teacher summary PDF
  const handleDownloadTeacherPDF = () => {
    if (!currentTeacher) return
    try {
      setIsExportingPDF(true)
      generateTeacherAttendancePDF({
        teacher: {
          name: currentTeacher.name,
          email: currentTeacher.email,
          total_students: studentsUnderTeacher.length,
        },
        periodLabel: dateRange.label,
        summaryStats: {
          totalStudents: studentsUnderTeacher.length,
          totalScheduled: teacherTotalScheduled,
          totalAttended: teacherTotalAttended,
          totalNotAttended: teacherTotalNotAttended,
          totalTeacherUnavailable: teacherTeacherUnavailable,
          totalStudentUnavailable: teacherStudentUnavailable,
          overallPercentage: teacherOverallPercentage,
        },
        studentsData: teacherStudentsBreakdown.map((item) => ({
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
      toast.success(`PDF downloaded for Teacher ${currentTeacher.name}! 📄`)
    } catch (e: any) {
      toast.error('Failed to generate PDF: ' + e.message)
    } finally {
      setIsExportingPDF(false)
    }
  }

  // Handler: Export single student PDF
  const handleDownloadStudentPDF = (studentObj: any, summaryObj: any) => {
    if (!studentObj || !summaryObj) return
    try {
      setIsExportingPDF(true)
      const tName = teachers.find((t) => t.id === studentObj.teacher_id)?.name || 'Assigned Educator'
      generateStudentAttendancePDF({
        student: {
          name: studentObj.name,
          registration_number: studentObj.registration_number,
          class_name: studentObj.class_name,
          enrolment_status: studentObj.enrolment_status,
          teacher_name: tName,
        },
        periodLabel: dateRange.label,
        summary: summaryObj,
      })
      toast.success(`PDF downloaded for ${studentObj.name}! 📄`)
    } catch (e: any) {
      toast.error('Failed to generate PDF: ' + e.message)
    } finally {
      setIsExportingPDF(false)
    }
  }

  // Handler: Export Smart Filter results as PDF
  const handleDownloadFilterPDF = () => {
    if (filteredIntelligenceStudents.length === 0) return
    try {
      setIsExportingPDF(true)

      // Build a human-readable filter summary for the PDF subtitle
      const parts: string[] = []
      if (enrolmentFilter !== 'all') parts.push(`Enrolment: ${enrolmentFilter}`)
      if (attendedMin || attendedMax) parts.push(`Attended: ${attendedMin || '0'}–${attendedMax || '∞'}`)
      if (studentAbsentMin || studentAbsentMax) parts.push(`Stu. Absent: ${studentAbsentMin || '0'}–${studentAbsentMax || '∞'}`)
      if (teacherMissedMin || teacherMissedMax) parts.push(`Tchr. Missed: ${teacherMissedMin || '0'}–${teacherMissedMax || '∞'}`)
      if (onBreakMin || onBreakMax) parts.push(`On Break: ${onBreakMin || '0'}–${onBreakMax || '∞'}`)
      if (rateMin || rateMax) parts.push(`Rate: ${rateMin || '0'}%–${rateMax || '100'}%`)

      generateIntelligenceFilterPDF({
        periodLabel: dateRange.label,
        filterSummary: parts.join('  |  '),
        totalMatched: filteredIntelligenceStudents.length,
        studentsData: filteredIntelligenceStudents.map(({ student: s, summary }) => ({
          name: s.name,
          registration_number: s.registration_number,
          teacher_name: teachers.find((t) => t.id === s.teacher_id)?.name || '—',
          enrolment_status: s.enrolment_status || 'ongoing',
          attended: summary.attendedCount,
          studentAbsent: summary.studentUnavailableCount,
          teacherMissed: summary.teacherUnavailableCount,
          onBreak: summary.breakCount,
          rate: summary.attendanceRate,
        })),
      })
      toast.success(`Smart Filter PDF downloaded (${filteredIntelligenceStudents.length} students)! 📄`)
    } catch (e: any) {
      toast.error('Failed to generate PDF: ' + e.message)
    } finally {
      setIsExportingPDF(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Mode Toggle Navigation */}
      <div className="bg-white p-4 rounded-2xl border-2 border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black text-foreground">Attendance Reports & Intelligence 📑</h3>
          <p className="text-muted-foreground font-medium text-xs mt-0.5">
            Query individual student attendance records by Registration Number or search by Teacher Name for full batch summaries.
          </p>
        </div>

        <div className="flex bg-muted p-1 rounded-lg gap-1 self-start md:self-auto border border-border">
          <button
            onClick={() => setSearchMode('teacher')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              searchMode === 'teacher'
                ? 'bg-[#1A6B4A] text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" /> By Teacher
          </button>

          <button
            onClick={() => setSearchMode('student')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              searchMode === 'student'
                ? 'bg-[#1A6B4A] text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <GraduationCap className="h-3.5 w-3.5" /> By Student
          </button>

          <button
            onClick={() => setSearchMode('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              searchMode === 'all'
                ? 'bg-[#1A6B4A] text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Clock className="h-3.5 w-3.5" /> Academy Log
          </button>

          <button
            onClick={() => setSearchMode('filter')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              searchMode === 'filter'
                ? 'bg-[#D97706] text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" /> Smart Filter
          </button>
        </div>
      </div>

      {/* Date Range Filter Bar */}
      <DateRangeFilter
        currentFilter={filterType}
        customStart={customStart}
        customEnd={customEnd}
        onFilterChange={(f, s, e) => {
          setFilterType(f)
          if (s) setCustomStart(s)
          if (e) setCustomEnd(e)
        }}
        resolvedRange={dateRange}
      />

      {/* MODE 1: SEARCH BY TEACHER NAME */}
      {searchMode === 'teacher' && (
        <div className="space-y-6">
          {/* Teacher search & selection bar */}
          <div className="bg-white p-5 rounded-2xl border-2 border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search teacher by name (e.g. Jamshed)..."
                value={teacherSearchQuery}
                onChange={(e) => setTeacherSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-border font-bold text-xs bg-muted/30 focus:border-primary outline-none"
              />
            </div>

            {/* Teacher selector pills */}
            <div className="flex flex-wrap items-center gap-2 max-w-xl overflow-x-auto">
              {filteredTeachers.slice(0, 6).map((t) => {
                const isSelected = (currentTeacher?.id === t.id)
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTeacherId(t.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-2 border ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-white text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    <Avatar photoUrl={t.profile_photo} name={t.name} size="sm" />
                    <span>{t.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {currentTeacher ? (
            <div className="space-y-6">
              {/* Teacher Summary Header Card */}
              <div className="bg-white p-6 rounded-2xl border-2 border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <Avatar photoUrl={currentTeacher.profile_photo} name={currentTeacher.name} size="lg" />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                      Teacher Overview
                    </span>
                    <h4 className="text-2xl font-black text-foreground mt-1">{currentTeacher.name}</h4>
                    <p className="text-xs font-semibold text-muted-foreground">
                      {currentTeacher.email || 'No email registered'} • Assigned Students: <strong className="text-foreground">{studentsUnderTeacher.length}</strong>
                    </p>
                  </div>
                </div>

                <BouncyButton
                  onClick={handleDownloadTeacherPDF}
                  disabled={isExportingPDF}
                  variant="default"
                  className="bg-primary hover:bg-primary/90 text-white font-black flex items-center gap-2 self-start md:self-auto shadow-md"
                >
                  {isExportingPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Download Teacher Summary PDF
                </BouncyButton>
              </div>

              {/* KPI Cards for this teacher in selected period */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-primary text-white p-5 rounded-2xl text-center shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary-foreground/80 block">Scheduled Classes</span>
                  <span className="text-3xl md:text-5xl font-black">{teacherTotalScheduled}</span>
                  <span className="text-[10px] text-white/70 block mt-1">In selected period</span>
                </div>

                <div className="bg-green-600 text-white p-5 rounded-2xl text-center shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-widest text-green-100 block">Completed / Attended</span>
                  <span className="text-3xl md:text-5xl font-black">{teacherTotalAttended}</span>
                  <span className="text-[10px] text-green-100/80 block mt-1">Classes conducted</span>
                </div>

                <div className="bg-destructive text-white p-5 rounded-2xl text-center shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-widest text-destructive-foreground/80 block">Not Attended / Absent</span>
                  <span className="text-3xl md:text-5xl font-black">{teacherTotalNotAttended}</span>
                  <span className="text-[10px] text-white/70 block mt-1">Missed sessions</span>
                </div>

                <div className="bg-secondary text-secondary-foreground p-5 rounded-2xl text-center shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-widest text-secondary-foreground/70 block">Average Attendance</span>
                  <span className="text-3xl md:text-5xl font-black">{teacherOverallPercentage}%</span>
                  <span className="text-[10px] text-secondary-foreground/70 block mt-1">Batch turn-out</span>
                </div>
              </div>

              {/* Sub-breakdown Ribbon */}
              <div className="bg-white p-4 rounded-2xl border-2 border-border shadow-sm grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                  <span className="text-[11px] font-bold text-red-700 block uppercase">Teacher Unavailable</span>
                  <span className="text-xl font-black text-red-900">{teacherTeacherUnavailable}</span>
                </div>
                <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
                  <span className="text-[11px] font-bold text-orange-700 block uppercase">Student Unavailable</span>
                  <span className="text-xl font-black text-orange-900">{teacherStudentUnavailable}</span>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <span className="text-[11px] font-bold text-amber-700 block uppercase">Student on Break</span>
                  <span className="text-xl font-black text-amber-900">{teacherBreak}</span>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <span className="text-[11px] font-bold text-blue-700 block uppercase">Assigned Students</span>
                  <span className="text-xl font-black text-blue-900">{studentsUnderTeacher.length}</span>
                </div>
              </div>

              {/* Students Breakdown Table */}
              <AnimatedCard delay={0.2} className="p-0 overflow-hidden border-2 border-border">
                <div className="p-5 border-b-2 border-border flex justify-between items-center bg-muted/20">
                  <h4 className="font-black text-foreground text-lg">
                    Students Under {currentTeacher.name} <span className="text-primary font-bold">({studentsUnderTeacher.length})</span>
                  </h4>
                  <span className="text-xs font-semibold text-muted-foreground">{dateRange.label}</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted border-b-2 border-border">
                        <th className="p-4 text-xs font-black text-foreground uppercase tracking-wider">Reg No</th>
                        <th className="p-4 text-xs font-black text-foreground uppercase tracking-wider">Student Name</th>
                        <th className="p-4 text-xs font-black text-foreground uppercase tracking-wider">Status</th>
                        <th className="p-4 text-xs font-black text-foreground uppercase tracking-wider text-center">Scheduled</th>
                        <th className="p-4 text-xs font-black text-foreground uppercase tracking-wider text-center">Attended</th>
                        <th className="p-4 text-xs font-black text-foreground uppercase tracking-wider text-center">Not Attended</th>
                        <th className="p-4 text-xs font-black text-foreground uppercase tracking-wider">Remarks / Issues</th>
                        <th className="p-4 text-xs font-black text-foreground uppercase tracking-wider text-center">Rate</th>
                        <th className="p-4 text-xs font-black text-foreground uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-border">
                      {teacherStudentsBreakdown.length > 0 ? (
                        teacherStudentsBreakdown.map((item) => (
                          <tr key={item.student.id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-4 font-black text-primary text-sm">{item.registration_number}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <Avatar photoUrl={item.student.profile_photo} name={item.name} size="sm" />
                                <span className="font-bold text-foreground text-sm">{item.name}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                item.enrolment_status === 'ongoing' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {item.enrolment_status}
                              </span>
                            </td>
                            <td className="p-4 text-center font-bold text-foreground text-sm">{item.scheduled}</td>
                            <td className="p-4 text-center font-black text-green-700 text-sm">{item.attended}</td>
                            <td className="p-4 text-center font-black text-red-700 text-sm">{item.notAttended}</td>
                            <td className="p-4 text-xs font-medium text-muted-foreground">
                              {item.remarks || '-'}
                            </td>
                            <td className="p-4 text-center font-black text-foreground text-base">{item.percentage}%</td>
                            <td className="p-4 text-right">
                              <BouncyButton
                                size="sm"
                                variant="outline"
                                onClick={() => setModalStudentData(item)}
                                className="text-xs font-bold border-2"
                              >
                                View Logs & PDF
                              </BouncyButton>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-muted-foreground font-bold">
                            No students assigned to this teacher yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </AnimatedCard>
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground font-bold">
              No teachers found.
            </div>
          )}
        </div>
      )}

      {/* MODE 2: SEARCH BY STUDENT REGISTRATION NUMBER */}
      {searchMode === 'student' && (
        <div className="space-y-6">
          {/* Student Search Bar */}
          <div className="bg-white p-5 rounded-2xl border-2 border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Enter Registration No (e.g. 12345) or name..."
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-border font-bold text-xs bg-muted/30 focus:border-primary outline-none"
              />
            </div>

            {/* Quick student selectors */}
            <div className="flex flex-wrap items-center gap-2 max-w-xl overflow-x-auto">
              {filteredStudents.slice(0, 6).map((s) => {
                const isSelected = (currentStudent?.id === s.id)
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStudentId(s.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-2 border ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-white text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    <Avatar photoUrl={s.profile_photo} name={s.name} size="sm" />
                    <span>{s.name} <strong className="text-primary">#{s.registration_number || 'N/A'}</strong></span>
                  </button>
                )
              })}
            </div>
          </div>

          {currentStudent && currentStudentSummary ? (
            <div className="space-y-6">
              {/* Student Header Card */}
              <div className="bg-white p-6 rounded-2xl border-2 border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <Avatar photoUrl={currentStudent.profile_photo} name={currentStudent.name} size="lg" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                        Reg: #{currentStudent.registration_number || 'N/A'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        currentStudent.enrolment_status === 'ongoing' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {currentStudent.enrolment_status || 'ongoing'}
                      </span>
                    </div>

                    <h4 className="text-2xl font-black text-foreground mt-1">{currentStudent.name}</h4>
                    <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                      Teacher: <strong className="text-foreground">{currentStudentTeacher?.name || 'Unassigned'}</strong> • Class: {currentStudent.class_name || 'Standard'}
                    </p>
                  </div>
                </div>

                <BouncyButton
                  onClick={() => handleDownloadStudentPDF(currentStudent, currentStudentSummary)}
                  disabled={isExportingPDF}
                  variant="default"
                  className="bg-primary hover:bg-primary/90 text-white font-black flex items-center gap-2 self-start md:self-auto shadow-md"
                >
                  {isExportingPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Download Student PDF
                </BouncyButton>
              </div>

              {/* Student Break Notification if on break */}
              {currentStudentSummary.isOnBreak && currentStudentSummary.breakDetails && (
                <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-2xl flex items-start gap-3 text-amber-900">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-sm">Approved Break Record</h5>
                    <p className="text-xs text-amber-800 mt-0.5">
                      Leave window: <strong>{currentStudentSummary.breakDetails.from}</strong> to <strong>{currentStudentSummary.breakDetails.to}</strong>.
                      Reason: <em>{currentStudentSummary.breakDetails.reason}</em>
                    </p>
                  </div>
                </div>
              )}

              {/* Student KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-primary text-white p-5 rounded-2xl text-center shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary-foreground/80 block">Scheduled</span>
                  <span className="text-3xl md:text-5xl font-black">{currentStudentSummary.totalScheduled}</span>
                  <span className="text-[10px] text-white/70 block mt-1">In period</span>
                </div>

                <div className="bg-green-600 text-white p-5 rounded-2xl text-center shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-widest text-green-100 block">Attended</span>
                  <span className="text-3xl md:text-5xl font-black">{currentStudentSummary.attendedCount}</span>
                  <span className="text-[10px] text-green-100/80 block mt-1">Completed</span>
                </div>

                <div className="bg-destructive text-white p-5 rounded-2xl text-center shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-widest text-destructive-foreground/80 block">Not Attended</span>
                  <span className="text-3xl md:text-5xl font-black">{currentStudentSummary.notAttendedCount}</span>
                  <span className="text-[10px] text-white/70 block mt-1">Absent / Missed</span>
                </div>

                <div className="bg-secondary text-secondary-foreground p-5 rounded-2xl text-center shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-widest text-secondary-foreground/70 block">Score</span>
                  <span className="text-3xl md:text-5xl font-black">{currentStudentSummary.attendanceRate}%</span>
                  <span className="text-[10px] text-secondary-foreground/70 block mt-1">Attendance Rate</span>
                </div>
              </div>

              {/* Secondary Breakdown */}
              <div className="bg-white p-4 rounded-2xl border-2 border-border shadow-sm grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                  <span className="text-[11px] font-bold text-red-700 block uppercase">Teacher Unavailable</span>
                  <span className="text-xl font-black text-red-900">{currentStudentSummary.teacherUnavailableCount}</span>
                </div>
                <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
                  <span className="text-[11px] font-bold text-orange-700 block uppercase">Student Unavailable</span>
                  <span className="text-xl font-black text-orange-900">{currentStudentSummary.studentUnavailableCount}</span>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <span className="text-[11px] font-bold text-amber-700 block uppercase">On Break</span>
                  <span className="text-xl font-black text-amber-900">{currentStudentSummary.breakCount}</span>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <span className="text-[11px] font-bold text-blue-700 block uppercase">Upcoming Scheduled</span>
                  <span className="text-xl font-black text-blue-900">{currentStudentSummary.scheduledUpcomingCount}</span>
                </div>
              </div>

              {/* Sessions List */}
              <AnimatedCard delay={0.2} className="p-0 overflow-hidden border-2 border-border">
                <div className="p-5 border-b-2 border-border flex justify-between items-center bg-muted/20">
                  <h4 className="font-black text-foreground text-lg">
                    Class Sessions ({currentStudentSummary.filteredClasses.length})
                  </h4>
                  <span className="text-xs font-semibold text-muted-foreground">{dateRange.label}</span>
                </div>

                <div className="divide-y-2 divide-border">
                  {currentStudentSummary.filteredClasses.length > 0 ? (
                    currentStudentSummary.filteredClasses.map((item, idx) => (
                      <div key={item.id || idx} className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
                        <div>
                          <p className="font-black text-foreground text-base">{item.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold mt-1">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{formatUKDateTime(item.scheduled_at)} (UK Time)</span>
                          </div>
                          {item.remarks && (
                            <p className="text-xs bg-muted/60 text-foreground px-2 py-0.5 rounded mt-1.5 inline-block font-medium">
                              <strong>Note:</strong> {item.remarks}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          {item.recording_url && (
                            <a 
                              href={item.recording_url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 border-2 border-purple-200 px-3 py-1.5 rounded-xl hover:bg-purple-100 transition-colors"
                            >
                              <Video className="h-3.5 w-3.5" /> Watch
                            </a>
                          )}

                          <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase border-2 ${
                            item.badgeVariant === 'present'
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : item.badgeVariant === 'teacher_unavailable' || item.badgeVariant === 'student_unavailable' || item.badgeVariant === 'absent'
                              ? 'bg-red-100 text-red-800 border-red-200'
                              : item.badgeVariant === 'break'
                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                              : 'bg-blue-100 text-blue-800 border-blue-200'
                          }`}>
                            {item.statusLabel}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-10 text-center text-muted-foreground font-bold">
                      No classes found for this student in the selected period.
                    </div>
                  )}
                </div>
              </AnimatedCard>
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground font-bold">
              No students found matching your query.
            </div>
          )}
        </div>
      )}

      {/* MODE 3: FULL ACADEMY ATTENDANCE LOG */}
      {searchMode === 'all' && (
        <AnimatedCard delay={0.1} className="p-0 overflow-hidden border-2 border-border">
          <div className="p-5 border-b-2 border-border flex justify-between items-center bg-muted/20">
            <h4 className="font-black text-foreground text-lg">Overall Academy Attendance Stream</h4>
            <span className="text-xs font-semibold text-muted-foreground">{dateRange.label}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted border-b-2 border-border">
                  <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest">Student</th>
                  <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest">Teacher</th>
                  <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest">Class Date</th>
                  <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest">Outcome</th>
                  <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest">Remarks</th>
                  <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest">Recording</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-border">
                {attendance.length > 0 ? (
                  attendance
                    .filter((a: any) => isDateWithinRange(a.classes?.scheduled_at || a.marked_at, dateRange))
                    .map((a: any) => {
                      const studentUser = allUsers.find((u: any) => u.id === a.student_id)
                      const teacherUser = allUsers.find((u: any) => u.id === a.teacher_id)
                      const classObj = classes.find((c: any) => c.id === a.class_id)
                      const studentObj = students.find((s: any) => s.id === a.student_id)
                      const parsed = parseClassMetadata(classObj || { recording_url: a.recording_url }, a, studentObj)

                      return (
                        <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-4 font-bold text-foreground text-sm">
                            {studentUser?.name || 'Unknown Student'}
                          </td>
                          <td className="p-4 font-semibold text-foreground text-sm">
                            {teacherUser?.name || 'Unknown Teacher'}
                          </td>
                          <td className="p-4 text-xs font-bold text-muted-foreground">
                            {a.classes?.scheduled_at ? formatUKDateTime(a.classes.scheduled_at) : formatUKDateTime(a.marked_at)}
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                              parsed.status === 'present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {parsed.statusLabel}
                            </span>
                          </td>
                          <td className="p-4 text-xs text-muted-foreground">
                            {parsed.remarks || '-'}
                          </td>
                          <td className="p-4">
                            {parsed.recording_url ? (
                              <a href={parsed.recording_url} target="_blank" rel="noreferrer"
                                 className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 bg-purple-50 border px-2.5 py-1 rounded-lg">
                                Watch
                              </a>
                            ) : '-'}
                          </td>
                        </tr>
                      )
                    })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground font-bold">
                      No attendance records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </AnimatedCard>
      )}

      {/* MODE 4: Smart Filter — filter students by attendance stats */}
      {searchMode === 'filter' && (
        <AnimatedCard className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-black text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Student Attendance Intelligence Filter
              </h4>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                Filter all students academy-wide by their attendance outcomes within the selected date range.
              </p>
            </div>
            <button
              onClick={() => {
                setEnrolmentFilter('all')
                setAttendedMin(''); setAttendedMax('')
                setStudentAbsentMin(''); setStudentAbsentMax('')
                setTeacherMissedMin(''); setTeacherMissedMax('')
                setOnBreakMin(''); setOnBreakMax('')
                setRateMin(''); setRateMax('')
              }}
              className="text-xs font-bold text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 rounded-lg transition-colors"
            >
              Reset Filters
            </button>
          </div>

          {/* Filter Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {/* Enrolment Status */}
            <div className="bg-muted/40 rounded-2xl p-4 space-y-2 border border-border">
              <label className="text-[11px] font-black uppercase text-muted-foreground tracking-wide">Enrolment Status</label>
              <div className="flex flex-wrap gap-1.5">
                {(['all', 'ongoing', 'break', 'stopped'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setEnrolmentFilter(s)}
                    className={`px-3 py-1 rounded-full text-[11px] font-black capitalize transition-all ${
                      enrolmentFilter === s
                        ? 'bg-amber-500 text-white'
                        : 'bg-white border border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* ✅ Attended (Class Completed) */}
            <div className="bg-green-50 rounded-2xl p-4 space-y-2 border border-green-200">
              <label className="text-[11px] font-black uppercase text-green-700 tracking-wide flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Attended (Class Completed)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number" min="0" placeholder="Min"
                  value={attendedMin}
                  onChange={(e) => setAttendedMin(e.target.value)}
                  className="w-full border border-green-200 rounded-lg px-2 py-1.5 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-green-300"
                />
                <span className="text-xs text-muted-foreground font-bold">—</span>
                <input
                  type="number" min="0" placeholder="Max"
                  value={attendedMax}
                  onChange={(e) => setAttendedMax(e.target.value)}
                  className="w-full border border-green-200 rounded-lg px-2 py-1.5 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-green-300"
                />
              </div>
            </div>

            {/* ⚠️ Student Absent */}
            <div className="bg-orange-50 rounded-2xl p-4 space-y-2 border border-orange-200">
              <label className="text-[11px] font-black uppercase text-orange-700 tracking-wide flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" /> Student Absent (Unavailable)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number" min="0" placeholder="Min"
                  value={studentAbsentMin}
                  onChange={(e) => setStudentAbsentMin(e.target.value)}
                  className="w-full border border-orange-200 rounded-lg px-2 py-1.5 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
                <span className="text-xs text-muted-foreground font-bold">—</span>
                <input
                  type="number" min="0" placeholder="Max"
                  value={studentAbsentMax}
                  onChange={(e) => setStudentAbsentMax(e.target.value)}
                  className="w-full border border-orange-200 rounded-lg px-2 py-1.5 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
            </div>

            {/* ❌ Teacher Missed */}
            <div className="bg-red-50 rounded-2xl p-4 space-y-2 border border-red-200">
              <label className="text-[11px] font-black uppercase text-red-700 tracking-wide flex items-center gap-1">
                <XCircle className="h-3.5 w-3.5" /> Teacher Missed (Unavailable)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number" min="0" placeholder="Min"
                  value={teacherMissedMin}
                  onChange={(e) => setTeacherMissedMin(e.target.value)}
                  className="w-full border border-red-200 rounded-lg px-2 py-1.5 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-red-300"
                />
                <span className="text-xs text-muted-foreground font-bold">—</span>
                <input
                  type="number" min="0" placeholder="Max"
                  value={teacherMissedMax}
                  onChange={(e) => setTeacherMissedMax(e.target.value)}
                  className="w-full border border-red-200 rounded-lg px-2 py-1.5 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-red-300"
                />
              </div>
            </div>

            {/* 🕐 On Break */}
            <div className="bg-yellow-50 rounded-2xl p-4 space-y-2 border border-yellow-200">
              <label className="text-[11px] font-black uppercase text-yellow-700 tracking-wide flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> On Break (Approved Leave)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number" min="0" placeholder="Min"
                  value={onBreakMin}
                  onChange={(e) => setOnBreakMin(e.target.value)}
                  className="w-full border border-yellow-200 rounded-lg px-2 py-1.5 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-yellow-300"
                />
                <span className="text-xs text-muted-foreground font-bold">—</span>
                <input
                  type="number" min="0" placeholder="Max"
                  value={onBreakMax}
                  onChange={(e) => setOnBreakMax(e.target.value)}
                  className="w-full border border-yellow-200 rounded-lg px-2 py-1.5 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-yellow-300"
                />
              </div>
            </div>

            {/* 📊 Attendance Rate % */}
            <div className="bg-blue-50 rounded-2xl p-4 space-y-2 border border-blue-200">
              <label className="text-[11px] font-black uppercase text-blue-700 tracking-wide flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" /> Attendance Rate (%)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number" min="0" max="100" placeholder="Min %"
                  value={rateMin}
                  onChange={(e) => setRateMin(e.target.value)}
                  className="w-full border border-blue-200 rounded-lg px-2 py-1.5 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <span className="text-xs text-muted-foreground font-bold">—</span>
                <input
                  type="number" min="0" max="100" placeholder="Max %"
                  value={rateMax}
                  onChange={(e) => setRateMax(e.target.value)}
                  className="w-full border border-blue-200 rounded-lg px-2 py-1.5 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
            </div>
          </div>

          {/* Results Summary Bar */}
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
            <Users className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="text-sm font-black text-amber-800">
              {filteredIntelligenceStudents.length} student{filteredIntelligenceStudents.length !== 1 ? 's' : ''} matched
            </span>
            <span className="text-xs text-amber-600 font-medium">· {dateRange.label}</span>
            <div className="ml-auto">
              <BouncyButton
                onClick={handleDownloadFilterPDF}
                disabled={isExportingPDF || filteredIntelligenceStudents.length === 0}
                variant="default"
                className="bg-amber-500 hover:bg-amber-600 text-white font-black text-xs px-4 py-2 flex items-center gap-1.5 disabled:opacity-40"
              >
                {isExportingPDF ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                Download PDF
              </BouncyButton>
            </div>
          </div>

          {/* Results Table */}
          {filteredIntelligenceStudents.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border-2 border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/60">
                    <th className="p-3 text-left text-xs font-black text-muted-foreground uppercase">Student</th>
                    <th className="p-3 text-left text-xs font-black text-muted-foreground uppercase">Reg No</th>
                    <th className="p-3 text-center text-xs font-black text-green-700 uppercase">Attended ✅</th>
                    <th className="p-3 text-center text-xs font-black text-orange-700 uppercase">Stu. Absent ⚠️</th>
                    <th className="p-3 text-center text-xs font-black text-red-700 uppercase">Tchr. Missed ❌</th>
                    <th className="p-3 text-center text-xs font-black text-yellow-700 uppercase">On Break 🕐</th>
                    <th className="p-3 text-center text-xs font-black text-blue-700 uppercase">Rate %</th>
                    <th className="p-3 text-center text-xs font-black text-muted-foreground uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredIntelligenceStudents.map(({ student: s, summary }, idx) => (
                    <tr key={s.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-muted/20'}>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Avatar photoUrl={s.profile_photo} name={s.name} size="sm" />
                          <div>
                            <p className="text-xs font-black text-foreground">{s.name}</p>
                            <p className="text-[10px] text-muted-foreground">{teachers.find((t) => t.id === s.teacher_id)?.name || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-xs font-bold text-muted-foreground">{s.registration_number || '—'}</td>
                      <td className="p-3 text-center">
                        <span className="inline-block bg-green-100 text-green-800 font-black text-xs px-2.5 py-0.5 rounded-full">{summary.attendedCount}</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-block bg-orange-100 text-orange-800 font-black text-xs px-2.5 py-0.5 rounded-full">{summary.studentUnavailableCount}</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-block bg-red-100 text-red-800 font-black text-xs px-2.5 py-0.5 rounded-full">{summary.teacherUnavailableCount}</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-block bg-yellow-100 text-yellow-800 font-black text-xs px-2.5 py-0.5 rounded-full">{summary.breakCount}</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-block font-black text-xs px-2.5 py-0.5 rounded-full ${
                          summary.attendanceRate >= 80 ? 'bg-green-100 text-green-800'
                          : summary.attendanceRate >= 50 ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                        }`}>
                          {summary.attendanceRate}%
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full capitalize ${
                          (s.enrolment_status || 'ongoing') === 'ongoing' ? 'bg-emerald-100 text-emerald-800'
                          : (s.enrolment_status || 'ongoing') === 'break' ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                        }`}>
                          {s.enrolment_status || 'ongoing'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Sparkles className="h-10 w-10 mx-auto mb-3 text-amber-300" />
              <p className="font-black text-foreground">No students matched the filters.</p>
              <p className="text-sm font-medium mt-1">Adjust the range inputs or change the date period above.</p>
            </div>
          )}
        </AnimatedCard>
      )}

      {/* Modal: View Single Student Logs & PDF from Teacher Breakdown */}
      <AnimatePresence>
        {modalStudentData && (
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
                  <Avatar photoUrl={modalStudentData.student?.profile_photo} name={modalStudentData.name} size="md" />
                  <div>
                    <h3 className="text-xl font-black text-foreground">{modalStudentData.name}</h3>
                    <p className="text-xs text-muted-foreground font-bold">
                      Reg: #{modalStudentData.registration_number} • Period: {dateRange.label}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setModalStudentData(null)} 
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
                    <span className="text-lg font-black text-foreground">{modalStudentData.summary.totalScheduled}</span>
                  </div>
                  <div className="p-2.5 bg-green-50 rounded-xl border border-green-200">
                    <span className="text-[10px] uppercase font-bold text-green-700 block">Attended</span>
                    <span className="text-lg font-black text-green-800">{modalStudentData.summary.attendedCount}</span>
                  </div>
                  <div className="p-2.5 bg-red-50 rounded-xl border border-red-200">
                    <span className="text-[10px] uppercase font-bold text-red-700 block">Not Attended</span>
                    <span className="text-lg font-black text-red-800">{modalStudentData.summary.notAttendedCount}</span>
                  </div>
                  <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200">
                    <span className="text-[10px] uppercase font-bold text-blue-700 block">Score</span>
                    <span className="text-lg font-black text-blue-800">{modalStudentData.summary.attendanceRate}%</span>
                  </div>
                </div>

                {/* Sessions list */}
                <div className="space-y-2">
                  <h5 className="font-bold text-sm text-foreground">Class Sessions ({modalStudentData.summary.filteredClasses.length})</h5>
                  <div className="divide-y border-2 border-border rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    {modalStudentData.summary.filteredClasses.length > 0 ? (
                      modalStudentData.summary.filteredClasses.map((item: any, idx: number) => (
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

              <div className="pt-4 border-t-2 border-border">
                <BouncyButton
                  onClick={() => handleDownloadStudentPDF(modalStudentData.student, modalStudentData.summary)}
                  disabled={isExportingPDF}
                  variant="default"
                  className="w-full bg-primary hover:bg-primary/90 text-white font-black flex items-center justify-center gap-2"
                >
                  {isExportingPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Download Student Attendance PDF
                </BouncyButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
