"use client"

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  CheckCircle,
  TrendingUp,
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  X,
  BookOpen,
  GraduationCap,
  Calendar,
  Lock,
  PauseCircle
} from 'lucide-react'

interface UnifiedAdminAnalyticsWidgetProps {
  teachers: any[]
  students: any[]
  classes: any[]
  attendanceRecords: any[]
  className?: string
}

type SubTab = 'teachers' | 'attendance' | 'performance'

export function UnifiedAdminAnalyticsWidget({
  teachers,
  students,
  classes,
  attendanceRecords,
  className = ''
}: UnifiedAdminAnalyticsWidgetProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('teachers')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 8

  // Modal State for Style B (Quick Roster Modal)
  const [selectedTeacherForRoster, setSelectedTeacherForRoster] = useState<{
    teacher: any
    students: any[]
  } | null>(null)
  const [rosterModalSearch, setRosterModalSearch] = useState('')

  // Reset page whenever tab or search changes
  const handleTabChange = (tab: SubTab) => {
    setActiveSubTab(tab)
    setSearchQuery('')
    setCurrentPage(1)
  }

  const handleSearchChange = (val: string) => {
    setSearchQuery(val)
    setCurrentPage(1)
  }

  // Helper map: students grouped by teacher_id
  const studentsByTeacherMap = useMemo(() => {
    const map = new Map<string, any[]>()
    students.forEach((s) => {
      if (s.teacher_id) {
        const list = map.get(s.teacher_id) || []
        list.push(s)
        map.set(s.teacher_id, list)
      }
    })
    return map
  }, [students])

  // Helper map: classes grouped by teacher_id
  const classesByTeacherMap = useMemo(() => {
    const map = new Map<string, any[]>()
    classes.forEach((c) => {
      if (c.teacher_id) {
        const list = map.get(c.teacher_id) || []
        list.push(c)
        map.set(c.teacher_id, list)
      }
    })
    return map
  }, [classes])

  // Helper map: classes grouped by student_id
  const classesByStudentMap = useMemo(() => {
    const map = new Map<string, any[]>()
    classes.forEach((c) => {
      if (c.student_id) {
        const list = map.get(c.student_id) || []
        list.push(c)
        map.set(c.student_id, list)
      }
    })
    return map
  }, [classes])

  // ==========================================
  // TAB 1 DATA: Students Under Teachers
  // ==========================================
  const teachersWithStudentsData = useMemo(() => {
    return teachers.map((t) => {
      const assigned = studentsByTeacherMap.get(t.id) || []
      const tClasses = classesByTeacherMap.get(t.id) || []
      const completedClasses = tClasses.filter(
        (c) =>
          c.status === 'completed' ||
          attendanceRecords.some((a) => a.class_id === c.id && a.status === 'present')
      ).length

      return {
        teacher: t,
        assignedStudents: assigned,
        classesDone: completedClasses,
        classesTotal: tClasses.length
      }
    })
  }, [teachers, studentsByTeacherMap, classesByTeacherMap, attendanceRecords])

  const filteredTeachersData = useMemo(() => {
    if (!searchQuery.trim()) return teachersWithStudentsData
    const q = searchQuery.toLowerCase()
    return teachersWithStudentsData.filter((item) => {
      const matchTeacher =
        (item.teacher.name || '').toLowerCase().includes(q) ||
        (item.teacher.email || '').toLowerCase().includes(q)
      const matchStudents = item.assignedStudents.some(
        (s: any) =>
          (s.name || '').toLowerCase().includes(q) ||
          (s.registration_number || '').toLowerCase().includes(q) ||
          (s.year || '').toLowerCase().includes(q)
      )
      return matchTeacher || matchStudents
    })
  }, [teachersWithStudentsData, searchQuery])

  // ==========================================
  // TAB 2 DATA: Each Student's Attendance
  // ==========================================
  const studentAttendanceData = useMemo(() => {
    return students.map((s) => {
      const sClasses = classesByStudentMap.get(s.id) || []
      const studentAttendance = attendanceRecords.filter(
        (a) => sClasses.some((c) => c.id === a.class_id) && a.status === 'present'
      )
      const totalScheduled = sClasses.length
      const totalAttended = studentAttendance.length
      const percentage =
        totalScheduled > 0 ? Math.round((totalAttended / totalScheduled) * 100) : 0

      const teacherNames = Array.from(
        new Set(
          sClasses
            .map((c) => teachers.find((t) => t.id === c.teacher_id)?.name)
            .filter(Boolean)
        )
      ).join(', ')

      return {
        student: s,
        teacherNames: teacherNames || 'None Assigned',
        totalScheduled,
        totalAttended,
        percentage
      }
    })
  }, [students, classesByStudentMap, attendanceRecords, teachers])

  const filteredStudentAttendanceData = useMemo(() => {
    if (!searchQuery.trim()) return studentAttendanceData
    const q = searchQuery.toLowerCase()
    return studentAttendanceData.filter((item) => {
      return (
        (item.student.name || '').toLowerCase().includes(q) ||
        (item.student.registration_number || '').toLowerCase().includes(q) ||
        (item.student.year || '').toLowerCase().includes(q) ||
        item.teacherNames.toLowerCase().includes(q)
      )
    })
  }, [studentAttendanceData, searchQuery])

  // ==========================================
  // TAB 3 DATA: Each Teacher's Performance
  // ==========================================
  const teacherPerformanceData = useMemo(() => {
    return teachers.map((t) => {
      const tClasses = classesByTeacherMap.get(t.id) || []
      const completedClasses = tClasses.filter(
        (c) =>
          c.status === 'completed' ||
          attendanceRecords.some((a) => a.class_id === c.id && a.status === 'present')
      ).length
      const rate =
        tClasses.length > 0 ? Math.round((completedClasses / tClasses.length) * 100) : 0

      return {
        teacher: t,
        classesCreated: tClasses.length,
        classesCompleted: completedClasses,
        completionRate: rate
      }
    })
  }, [teachers, classesByTeacherMap, attendanceRecords])

  const filteredTeacherPerformanceData = useMemo(() => {
    if (!searchQuery.trim()) return teacherPerformanceData
    const q = searchQuery.toLowerCase()
    return teacherPerformanceData.filter((item) => {
      return (
        (item.teacher.name || '').toLowerCase().includes(q) ||
        (item.teacher.email || '').toLowerCase().includes(q)
      )
    })
  }, [teacherPerformanceData, searchQuery])

  // Active dataset & pagination calculation
  const totalItems = useMemo(() => {
    if (activeSubTab === 'teachers') return filteredTeachersData.length
    if (activeSubTab === 'attendance') return filteredStudentAttendanceData.length
    return filteredTeacherPerformanceData.length
  }, [activeSubTab, filteredTeachersData, filteredStudentAttendanceData, filteredTeacherPerformanceData])

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)

  const paginatedTeachers = useMemo(
    () => filteredTeachersData.slice(startIndex, endIndex),
    [filteredTeachersData, startIndex, endIndex]
  )

  const paginatedAttendance = useMemo(
    () => filteredStudentAttendanceData.slice(startIndex, endIndex),
    [filteredStudentAttendanceData, startIndex, endIndex]
  )

  const paginatedPerformance = useMemo(
    () => filteredTeacherPerformanceData.slice(startIndex, endIndex),
    [filteredTeacherPerformanceData, startIndex, endIndex]
  )

  // Filtered students for Style B Quick Roster Modal
  const modalFilteredStudents = useMemo(() => {
    if (!selectedTeacherForRoster) return []
    if (!rosterModalSearch.trim()) return selectedTeacherForRoster.students
    const q = rosterModalSearch.toLowerCase()
    return selectedTeacherForRoster.students.filter(
      (s: any) =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.registration_number || '').toLowerCase().includes(q) ||
        (s.year || '').toLowerCase().includes(q) ||
        (s.term || '').toLowerCase().includes(q)
    )
  }, [selectedTeacherForRoster, rosterModalSearch])

  return (
    <div className={`bg-white rounded-2xl border-2 border-border shadow-sm overflow-hidden ${className}`}>
      {/* 1. Header with Tab Switcher */}
      <div className="border-b-2 border-border bg-muted/40 p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-muted p-1 rounded-xl w-full sm:w-auto overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => handleTabChange('teachers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeSubTab === 'teachers'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="h-3.5 w-3.5 text-emerald-700" />
            <span>Students Under Teachers</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
              {teachers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('attendance')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeSubTab === 'attendance'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CheckCircle className="h-3.5 w-3.5 text-blue-600" />
            <span>Student Attendance</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-800 font-bold">
              {students.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('performance')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeSubTab === 'performance'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5 text-purple-600" />
            <span>Teacher Performance</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-purple-100 text-purple-800 font-bold">
              {teachers.length}
            </span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground font-medium">
          <span>Active Period Filter Applied</span>
        </div>
      </div>

      {/* 2. Search Bar & Pagination Controls Strip */}
      <div className="p-3 sm:p-3.5 border-b border-border bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Instant Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={
              activeSubTab === 'teachers'
                ? 'Search teacher or student...'
                : activeSubTab === 'attendance'
                ? 'Search student name, reg no...'
                : 'Search faculty name or email...'
            }
            className="w-full pl-9 pr-7 py-1.5 bg-muted/40 border border-border rounded-xl text-xs sm:text-sm font-semibold text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Compact Pagination Bar */}
        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs font-bold text-muted-foreground">
          <span>
            Showing <strong className="text-foreground">{totalItems === 0 ? 0 : startIndex + 1}–{endIndex}</strong> of{' '}
            <strong className="text-foreground">{totalItems}</strong>
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1 sm:px-2.5 sm:py-1 rounded-lg border border-border bg-white hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-black">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 sm:px-2.5 sm:py-1 rounded-lg border border-border bg-white hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Table Views */}
      <div className="overflow-x-auto">
        {/* ========================================================= */}
        {/* TAB 1: Students Under Each Teacher (Style B Modal Trigger) */}
        {/* ========================================================= */}
        {activeSubTab === 'teachers' && (
          <table className="w-full text-left border-collapse text-xs min-w-[650px]">
            <thead className="bg-muted/70 border-b border-border text-foreground uppercase font-black tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-4 min-w-[200px]">Teacher Info</th>
                <th className="py-2.5 px-4 text-center min-w-[120px]">Total Students</th>
                <th className="py-2.5 px-4 min-w-[240px]">Assigned Students Roster</th>
                <th className="py-2.5 px-4 text-right min-w-[120px]">Classes (Done/Total)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium text-foreground">
              {paginatedTeachers.map(({ teacher, assignedStudents, classesDone, classesTotal }) => {
                const count = assignedStudents.length
                return (
                  <tr key={teacher.id} className="hover:bg-muted/30 transition-colors">
                    {/* Teacher info */}
                    <td className="py-2.5 px-4">
                      <span className="font-bold text-foreground text-xs sm:text-sm block">
                        {teacher.name || 'Unnamed Teacher'}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-normal">
                        {teacher.email}
                      </span>
                    </td>

                    {/* Student count badge */}
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-black ${
                          count > 0
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {count} {count === 1 ? 'Student' : 'Students'}
                      </span>
                    </td>

                    {/* Style B: Quick Roster Modal Button */}
                    <td className="py-2.5 px-4">
                      {count > 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTeacherForRoster({ teacher, students: assignedStudents })
                            setRosterModalSearch('')
                          }}
                          className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-black text-xs transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                        >
                          <Users className="h-3.5 w-3.5 text-emerald-700" />
                          <span>View {count} Students Roster</span>
                          <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ) : (
                        <span className="text-muted-foreground italic text-xs">
                          No students assigned
                        </span>
                      )}
                    </td>

                    {/* Classes Done / Total */}
                    <td className="py-2.5 px-4 text-right font-bold text-foreground">
                      <span className="text-emerald-800">{classesDone}</span>
                      <span className="text-muted-foreground font-normal"> / {classesTotal}</span>
                    </td>
                  </tr>
                )
              })}

              {paginatedTeachers.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground font-bold">
                    No teachers found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* ========================================================= */}
        {/* TAB 2: Each Student's Attendance                          */}
        {/* ========================================================= */}
        {activeSubTab === 'attendance' && (
          <table className="w-full text-left border-collapse text-xs min-w-[650px]">
            <thead className="bg-muted/70 border-b border-border text-foreground uppercase font-black tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-4 min-w-[200px]">Student Info</th>
                <th className="py-2.5 px-4 min-w-[160px]">Assigned Teacher(s)</th>
                <th className="py-2.5 px-3 text-center min-w-[90px]">Scheduled</th>
                <th className="py-2.5 px-3 text-center min-w-[90px]">Attended</th>
                <th className="py-2.5 px-4 min-w-[150px]">Progress Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium text-foreground">
              {paginatedAttendance.map(
                ({ student, teacherNames, totalScheduled, totalAttended, percentage }) => {
                  let barColor = 'bg-rose-500'
                  let textColor = 'text-rose-700'
                  if (percentage >= 76) {
                    barColor = 'bg-emerald-600'
                    textColor = 'text-emerald-700'
                  } else if (percentage >= 50) {
                    barColor = 'bg-amber-500'
                    textColor = 'text-amber-700'
                  }

                  return (
                    <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                      {/* Student info */}
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {student.registration_number && student.registration_number !== 'N/A' && (
                            <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              {student.registration_number}
                            </span>
                          )}
                          <span className="font-bold text-foreground text-xs sm:text-sm">
                            {student.name || 'Unnamed Student'}
                          </span>
                        </div>
                        {(student.year || student.term) && (
                          <span className="text-[11px] text-muted-foreground font-medium block mt-0.5">
                            {student.year ? `${student.year}` : ''}
                            {student.year && student.term ? ' · ' : ''}
                            {student.term ? `${student.term}` : ''}
                          </span>
                        )}
                      </td>

                      {/* Teacher */}
                      <td className="py-2.5 px-4 text-xs font-medium text-foreground">
                        {teacherNames}
                      </td>

                      {/* Scheduled */}
                      <td className="py-2.5 px-3 text-center font-bold text-foreground">
                        {totalScheduled}
                      </td>

                      {/* Attended */}
                      <td className="py-2.5 px-3 text-center font-bold text-foreground">
                        {totalAttended}
                      </td>

                      {/* Progress */}
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden border border-border">
                            <div
                              className={`h-full rounded-full transition-all ${barColor}`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-black w-9 text-right ${textColor}`}>
                            {percentage}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                }
              )}

              {paginatedAttendance.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground font-bold">
                    No student attendance records found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* ========================================================= */}
        {/* TAB 3: Each Teacher's Performance                         */}
        {/* ========================================================= */}
        {activeSubTab === 'performance' && (
          <table className="w-full text-left border-collapse text-xs min-w-[650px]">
            <thead className="bg-muted/70 border-b border-border text-foreground uppercase font-black tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-4 min-w-[200px]">Teacher Info</th>
                <th className="py-2.5 px-4 text-center min-w-[120px]">Classes Created</th>
                <th className="py-2.5 px-4 text-center min-w-[120px]">Classes Completed</th>
                <th className="py-2.5 px-4 min-w-[160px]">Completion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium text-foreground">
              {paginatedPerformance.map(
                ({ teacher, classesCreated, classesCompleted, completionRate }) => {
                  let barColor = 'bg-rose-500'
                  let textColor = 'text-rose-700'
                  if (completionRate >= 76) {
                    barColor = 'bg-emerald-600'
                    textColor = 'text-emerald-700'
                  } else if (completionRate >= 50) {
                    barColor = 'bg-amber-500'
                    textColor = 'text-amber-700'
                  }

                  return (
                    <tr key={teacher.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-4">
                        <span className="font-bold text-foreground text-xs sm:text-sm block">
                          {teacher.name || 'Unnamed Teacher'}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-normal">
                          {teacher.email}
                        </span>
                      </td>

                      <td className="py-2.5 px-4 text-center font-bold text-foreground">
                        {classesCreated}
                      </td>

                      <td className="py-2.5 px-4 text-center font-bold text-foreground">
                        {classesCompleted}
                      </td>

                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden border border-border">
                            <div
                              className={`h-full rounded-full transition-all ${barColor}`}
                              style={{ width: `${Math.min(completionRate, 100)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-black w-9 text-right ${textColor}`}>
                            {completionRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                }
              )}

              {paginatedPerformance.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground font-bold">
                    No teacher performance records found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* 4. Table Bottom Summary Bar */}
      <div className="p-3 bg-muted/20 border-t border-border flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-2">
        <span>
          Page {currentPage} of {totalPages} ({totalItems} records matching current period & filter)
        </span>
        <span className="font-semibold text-foreground">
          8 records per page · Zero lengthy vertical swipe
        </span>
      </div>

      {/* ========================================================= */}
      {/* STYLE B: QUICK ROSTER MODAL DIALOG                        */}
      {/* ========================================================= */}
      <AnimatePresence>
        {selectedTeacherForRoster && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl border-2 border-border shadow-2xl max-w-xl w-full max-h-[85vh] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-border bg-muted/40 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-foreground">
                      {selectedTeacherForRoster.teacher.name}&apos;s Student Roster
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedTeacherForRoster.students.length} assigned students with Reg No, Year & Term
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTeacherForRoster(null)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Search Bar (if > 3 students) */}
              {selectedTeacherForRoster.students.length > 3 && (
                <div className="p-3 border-b border-border bg-white">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      value={rosterModalSearch}
                      onChange={(e) => setRosterModalSearch(e.target.value)}
                      placeholder="Filter this teacher's students by name, reg no, year..."
                      className="w-full pl-9 pr-3 py-1.5 bg-muted/40 border border-border rounded-xl text-xs font-semibold text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              )}

              {/* Modal Roster List */}
              <div className="overflow-y-auto p-3 sm:p-4 divide-y divide-border/80 flex-1">
                {modalFilteredStudents.map((s: any) => {
                  const regNo = s.registration_number && s.registration_number !== 'N/A'
                    ? s.registration_number
                    : 'No Reg No'
                  const year = s.year || s.class_name || 'N/A'
                  const term = s.term || 'N/A'
                  const status = s.enrolment_status || 'ongoing'

                  return (
                    <div
                      key={s.id}
                      className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-muted/30 rounded-xl transition-colors"
                    >
                      {/* Reg No + Name */}
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {regNo}
                          </span>
                          <span className="font-black text-foreground text-sm">
                            {s.name || s.email}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground block">
                          {s.email}
                        </span>
                      </div>

                      {/* Year, Term & Status Badges */}
                      <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-muted text-foreground border border-border">
                          {year}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          {term}
                        </span>
                        {status === 'ongoing' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Ongoing
                          </span>
                        )}
                        {status === 'break' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <PauseCircle className="h-2.5 w-2.5" />
                            Break
                          </span>
                        )}
                        {status === 'stopped' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1">
                            <Lock className="h-2.5 w-2.5" />
                            Stopped
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}

                {modalFilteredStudents.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground font-bold text-xs">
                    No students match the search term.
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-3 bg-muted/40 border-t border-border flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">
                  Showing {modalFilteredStudents.length} of {selectedTeacherForRoster.students.length} students
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedTeacherForRoster(null)}
                  className="px-4 py-1.5 rounded-xl font-bold bg-foreground text-background hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
