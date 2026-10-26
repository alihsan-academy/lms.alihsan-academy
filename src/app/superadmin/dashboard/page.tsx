"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LogoutButton } from '@/components/logout-button'
import { AcademyHeader } from '@/components/academy-header'
import { Users, GraduationCap, BookOpen, BarChart3, Loader2, UserPlus, UserMinus, ShieldAlert, CheckCircle, CheckCircle2, Search, AlertCircle, X, RefreshCw, Trash, Pencil, Save, ChevronDown, UserCheck, Clock, XCircle, Lock } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Avatar } from '@/components/avatar'
import { motion, AnimatePresence } from 'framer-motion'
import { Skeleton } from '@/components/skeleton'
import { AnimatedCard } from '@/components/animated-card'
import { BouncyButton } from '@/components/bouncy-button'
import { PageTransition } from '@/components/page-transition'
import { AdminAttendanceManager } from '@/components/admin-attendance-manager'

type Tab = 'statistics' | 'students' | 'teachers' | 'attendance' | 'manage'

export default function SuperAdminDashboard() {
  const formatUKTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-GB', {
      timeZone: 'Europe/London',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const [activeTab, setActiveTab] = useState<Tab>('statistics')
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  // Data state
  const [students, setStudents] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [statsLoading, setStatsLoading] = useState(true)
  
  // UI state
  const [searchQuery, setSearchQuery] = useState('')
  const [studentStatusFilter, setStudentStatusFilter] = useState('all')
  const [removeAccessSearchQuery, setRemoveAccessSearchQuery] = useState('')
  const [removeAccessRoleFilter, setRemoveAccessRoleFilter] = useState('all')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'student', name: '', className: '', teacherId: '', registrationNumber: '' })
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null)
  const [reassigningStudentId, setReassigningStudentId] = useState<string | null>(null)
  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const [selectedProfile, setSelectedProfile] = useState<any>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isEditingTeacher, setIsEditingTeacher] = useState(false)
  const [isSavingTeacher, setIsSavingTeacher] = useState(false)

  // Simple inline status management state for Student Profile
  const [inlineStatus, setInlineStatus] = useState<'ongoing' | 'break' | 'stopped'>('ongoing')
  const [inlineBreakFrom, setInlineBreakFrom] = useState('')
  const [inlineBreakTo, setInlineBreakTo] = useState('')
  const [inlineBreakReason, setInlineBreakReason] = useState('')
  const [inlineStoppedDate, setInlineStoppedDate] = useState('')
  const [inlineStoppedReason, setInlineStoppedReason] = useState('')
  const [isSavingStatus, setIsSavingStatus] = useState(false)

  // Sync status form fields whenever selectedProfile changes
  useEffect(() => {
    if (selectedProfile && selectedProfile.role === 'student') {
      const current = (selectedProfile.enrolment_status as any) || 'ongoing'
      setInlineStatus(['ongoing', 'break', 'stopped'].includes(current) ? current : 'ongoing')
      setInlineBreakFrom(selectedProfile.break_from_date || '')
      setInlineBreakTo(selectedProfile.break_to_date || '')
      setInlineBreakReason(selectedProfile.break_reason || '')
      setInlineStoppedDate(selectedProfile.last_class_date || '')
      setInlineStoppedReason(selectedProfile.stopped_reason || '')
    }
  }, [selectedProfile])

  async function handleSaveInlineStatus() {
    if (!selectedProfile) return
    const studentIdentifier = selectedProfile.user_id || selectedProfile.id

    if (inlineStatus === 'break') {
      if (!inlineBreakFrom) {
        toast.error('Please enter the break start date.')
        return
      }
      if (!inlineBreakTo) {
        toast.error('Please enter the break end date.')
        return
      }
      if (new Date(inlineBreakFrom) > new Date(inlineBreakTo)) {
        toast.error('Break start date cannot be after the end date.')
        return
      }
    } else if (inlineStatus === 'stopped') {
      if (!inlineStoppedDate) {
        toast.error('Please enter the last class date.')
        return
      }
      if (!inlineStoppedReason.trim()) {
        toast.error('Please provide a reason for stopping / quitting.')
        return
      }
    }

    setIsSavingStatus(true)
    try {
      const response = await fetch('/api/student/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: studentIdentifier,
          enrolmentStatus: inlineStatus,
          breakFromDate: inlineStatus === 'break' ? inlineBreakFrom : null,
          breakToDate: inlineStatus === 'break' ? inlineBreakTo : null,
          breakReason: inlineStatus === 'break' ? inlineBreakReason.trim() : null,
          lastClassDate: inlineStatus === 'stopped' ? inlineStoppedDate : null,
          stoppedReason: inlineStatus === 'stopped' ? inlineStoppedReason.trim() : null,
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update student status')
      }

      const updatedRecord = {
        ...selectedProfile,
        enrolment_status: inlineStatus,
        break_from_date: inlineStatus === 'break' ? inlineBreakFrom : null,
        break_to_date: inlineStatus === 'break' ? inlineBreakTo : null,
        break_reason: inlineStatus === 'break' ? inlineBreakReason : null,
        last_class_date: inlineStatus === 'stopped' ? inlineStoppedDate : null,
        stopped_reason: inlineStatus === 'stopped' ? inlineStoppedReason : null,
      }

      const targetStudentId = selectedProfile.id || selectedProfile.user_id
      setSelectedProfile(updatedRecord)
      setStudents(prev => prev.map(s => {
        const matches = s.id === targetStudentId || (s.user_id && s.user_id === targetStudentId)
        if (!matches) return s
        return {
          ...s,
          enrolment_status: inlineStatus,
          break_from_date: inlineStatus === 'break' ? inlineBreakFrom : null,
          break_to_date: inlineStatus === 'break' ? inlineBreakTo : null,
          break_reason: inlineStatus === 'break' ? inlineBreakReason : null,
          last_class_date: inlineStatus === 'stopped' ? inlineStoppedDate : null,
          stopped_reason: inlineStatus === 'stopped' ? inlineStoppedReason : null,
        }
      }))

      if (inlineStatus === 'stopped') {
        toast.success('Status set to STOPPED. Student portal access has been revoked.')
      } else {
        toast.success(`Status updated to ${inlineStatus.toUpperCase()}.`)
      }
      await fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status')
    } finally {
      setIsSavingStatus(false)
    }
  }
  const [editTeacherForm, setEditTeacherForm] = useState({
    name: '',
    date_of_joining: '',
    mobile_number: '',
    current_country: '',
    current_state: '',
    educational_qualifications: '',
  })

  const startEditTeacher = () => {
    if (!selectedProfile) return
    const rawDoj = selectedProfile.date_of_joining || selectedProfile.joined_date || selectedProfile.doj || ''
    const cleanDoj = rawDoj.includes('T') ? rawDoj.split('T')[0] : rawDoj
    setEditTeacherForm({
      name: selectedProfile.name || '',
      date_of_joining: cleanDoj,
      mobile_number: selectedProfile.mobile_number || selectedProfile.mobile || '',
      current_country: selectedProfile.current_country || selectedProfile.country || '',
      current_state: selectedProfile.current_state || selectedProfile.state || '',
      educational_qualifications: selectedProfile.educational_qualifications || selectedProfile.qualification || '',
    })
    setIsEditingTeacher(true)
  }

  async function handleSaveTeacherProfile(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!selectedProfile) return
    if (!editTeacherForm.name.trim()) {
      toast.error('Teacher full name cannot be empty')
      return
    }

    setIsSavingTeacher(true)
    try {
      const targetTeacherId = selectedProfile.user_id || selectedProfile.id
      const response = await fetch('/api/admin/teacher-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: targetTeacherId,
          name: editTeacherForm.name.trim(),
          dateOfJoining: editTeacherForm.date_of_joining || null,
          mobileNumber: editTeacherForm.mobile_number || null,
          country: editTeacherForm.current_country || null,
          state: editTeacherForm.current_state || null,
          educationalQualifications: editTeacherForm.educational_qualifications || null
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update teacher profile')
      }

      const updatedProfile = {
        ...selectedProfile,
        name: editTeacherForm.name.trim(),
        date_of_joining: editTeacherForm.date_of_joining || null,
        mobile_number: editTeacherForm.mobile_number || null,
        current_country: editTeacherForm.current_country || null,
        current_state: editTeacherForm.current_state || null,
        educational_qualifications: editTeacherForm.educational_qualifications || null
      }
      setSelectedProfile(updatedProfile)

      // Update local teachers array
      setTeachers(prev => prev.map(t => (t.id === selectedProfile.id || t.user_id === targetTeacherId) ? { ...t, ...updatedProfile } : t))
      // Update local allUsers array
      setAllUsers(prev => prev.map(u => (u.id === selectedProfile.id || u.id === targetTeacherId) ? { ...u, name: editTeacherForm.name.trim() } : u))

      toast.success('Teacher profile updated successfully.')
      setIsEditingTeacher(false)
      fetchData()
    } catch (err: any) {
      console.error('Error saving teacher profile:', err)
      toast.error(err.message || 'Failed to save teacher details')
    } finally {
      setIsSavingTeacher(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    setSearchQuery('')
  }, [activeTab])

  async function fetchData() {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/data', { cache: 'no-store' })
      const data = await response.json()
      
      if (!response.ok) throw new Error(data.error || "Failed to fetch data")

      const mappedStudents = data.students?.map((s: any) => {
        const sp = s.student_profiles?.[0] || {}
        return {
          ...s,
          user_id: s.id,
          name: sp.name || s.email,
          class_name: sp.class_name || 'N/A',
          teacher_id: sp.teacher_id || null,
          registration_number: sp.registration_number || 'N/A',
          profile_photo: sp.profile_photo || null,
          created_at: sp.joined_date || s.created_at,
          enrolment_status: sp.enrolment_status || 'ongoing',
          break_from_date: sp.break_from_date || '',
          break_to_date: sp.break_to_date || '',
          break_reason: sp.break_reason || '',
          last_class_date: sp.last_class_date || '',
          stopped_reason: sp.stopped_reason || ''
        }
      }) || []

      const mappedTeachers = data.teachers?.map((t: any) => {
        const tp = t.teacher_profiles?.[0] || {}
        return {
          ...tp,
          ...t,
          id: t.id,
          user_id: t.id,
          teacher_profile_id: tp.id,
          name: tp.name || tp.full_name || t.email,
          profile_photo: tp.profile_photo || tp.photo_url || null,
          mobile_number: tp.mobile_number || tp.mobile || '',
          date_of_joining: tp.date_of_joining || tp.joined_date || tp.doj || '',
          educational_qualifications: tp.educational_qualifications || tp.qualification || '',
          current_country: tp.current_country || tp.country || '',
          current_state: tp.current_state || tp.state || '',
          bank_name: tp.bank_name || '',
          bank_account_number: tp.bank_account_number || tp.bank_account || '',
        }
      }) || []

      const mappedAllUsers = data.allUsers?.map((u: any) => {
        let name = u.email;
        if (u.role === 'student' && u.student_profiles?.[0]?.name) {
          name = u.student_profiles[0].name;
        } else if (u.role === 'teacher' && u.teacher_profiles?.[0]?.name) {
          name = u.teacher_profiles[0].name;
        }
        return { ...u, name }
      }) || []

      setAllUsers(mappedAllUsers)
      setStudents(mappedStudents)
      setTeachers(mappedTeachers)
      setAttendanceRecords(data.attendance || [])
      setClasses(data.classes || [])
      setStatsLoading(false)

    } catch (error) {
      console.error("Error fetching superadmin data:", error)
      toast.error("Failed to load dashboard data.")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newUser, fullName: newUser.name })
      })
      
      const result = await response.json()
      
      if (!response.ok) throw new Error(result.error || "Failed to create user")
      
      toast.success("User created successfully.")
      setNewUser({ email: '', password: '', role: 'student', name: '', className: '', teacherId: '', registrationNumber: '' })
      fetchData()
    } catch (error: any) {
      toast.error(error.message)
      if (error.message.includes("Service Role")) {
        toast.error("Missing SUPABASE_SERVICE_ROLE_KEY in .env.local", { duration: 5000 })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const [removingUserId, setRemovingUserId] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState<string | null>(null)

  const confirmRemove = async (userId: string) => {
    setRemovingUserId(userId)
    setShowConfirm(null)
    
    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to remove user')

      setAllUsers(prev => prev.filter(u => u.id !== userId))
      setStudents(prev => prev.filter(s => s.id !== userId))
      setTeachers(prev => prev.filter(t => t.id !== userId))
      
      toast.success('User removed successfully.')
      fetchData()
    } catch (error: any) {
      toast.error('Failed to remove: ' + error.message)
    } finally {
      setRemovingUserId(null)
    }
  }

  async function handleReassignTeacher(studentId: string, teacherId: string) {
    setReassigningStudentId(studentId)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: studentId, teacherId: teacherId || null })
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to reassign teacher")
      
      toast.success("Student reassigned successfully.")
      setEditingStudentId(null)
      setSelectedTeacherId('')
      fetchData()
      return true
    } catch (error: any) {
      toast.error(error.message)
      return false
    } finally {
      setReassigningStudentId(null)
    }
  }

  async function handleUpdateStatus(studentId: string, status: string, payload?: any) {
    try {
      const response = await fetch('/api/student/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, status, payload })
      })
      if (!response.ok) throw new Error('Failed to update status')
      toast.success('Status updated successfully')
      fetchData()
      setIsProfileModalOpen(false)
    } catch(err: any) {
      toast.error(err.message)
    }
  }

  const safeLower = (value: unknown) => String(value ?? '').toLowerCase()

  const filteredStudents = students.filter(s => {
    const matchesSearch = safeLower(s.name).includes(safeLower(searchQuery)) || 
      safeLower(s.email).includes(safeLower(searchQuery)) ||
      safeLower(s.registration_number).includes(safeLower(searchQuery));
    const matchesStatus = studentStatusFilter === 'all' || s.enrolment_status === studentStatusFilter;
    return matchesSearch && matchesStatus;
  })

  const filteredTeachers = teachers.filter(t => 
    safeLower(t.name).includes(safeLower(searchQuery)) || 
    safeLower(t.email).includes(safeLower(searchQuery))
  )

  if (isLoading && allUsers.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-white border-b-2 border-border p-4 flex justify-between items-center shadow-sm">
          <Skeleton className="h-8 w-48 rounded-full" />
          <div className="flex gap-4">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-12 rounded-full" />
          </div>
        </header>
        <div className="p-8 max-w-6xl mx-auto w-full space-y-8">
          <Skeleton className="h-8 w-40 rounded-full" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-96 w-full rounded-3xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24 md:pb-0 font-sans selection:bg-primary/20">
      <header className="bg-white border-b-2 border-border p-3 md:p-4 flex justify-between items-center sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/90">
        <div className="flex items-center gap-3">
          <AcademyHeader size="sm" showTagline={true} />
          <div className="hidden sm:flex items-center gap-2 border-l-2 border-border pl-4 ml-2">
             <ShieldAlert className="h-5 w-5 text-destructive" />
             <span className="font-extrabold text-foreground text-xl">Super Admin</span>
          </div>
          <span className="sm:hidden text-[10px] font-black text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
            SuperAdmin
          </span>
        </div>
        <div className="flex items-center gap-3">
          <BouncyButton 
            variant="outline"
            size="sm"
            onClick={fetchData} 
            disabled={isLoading}
            className="gap-2 hidden sm:flex border-2"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </BouncyButton>
          <LogoutButton />
        </div>
      </header>

      {/* Navigation: Responsive - Scrollable on Mobile, Centered on Desktop */}
      <div className="bg-white border-b border-border px-3 md:px-8 overflow-x-auto scrollbar-none">
        <nav className="flex space-x-1.5 max-w-6xl mx-auto py-2 shrink-0 min-w-max md:min-w-0">
          <NavTab active={activeTab === 'statistics'} onClick={() => setActiveTab('statistics')} icon={<BarChart3 />} label="Statistics" />
          <NavTab active={activeTab === 'students'} onClick={() => setActiveTab('students')} icon={<GraduationCap />} label="Students" />
          <NavTab active={activeTab === 'teachers'} onClick={() => setActiveTab('teachers')} icon={<BookOpen />} label="Teachers" />
          <NavTab active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} icon={<CheckCircle />} label="Attendance" />
          <NavTab active={activeTab === 'manage'} onClick={() => setActiveTab('manage')} icon={<Users />} label="Manage Users" />
        </nav>
      </div>

      <main className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-8">
        <AnimatePresence mode="wait">
          {activeTab === 'statistics' && (
            <PageTransition key="statistics" className="space-y-8">
              <section>
                <h3 className="text-2xl font-black text-foreground mb-4">Academy Overview</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-4">
                  <DashboardStatCard title="Total Students" value={statsLoading ? null : students.length} index={0} gradient="from-blue-400 to-blue-600" />
                  <DashboardStatCard title="Total Teachers" value={statsLoading ? null : teachers.length} index={1} gradient="from-primary to-emerald-600" />
                  <DashboardStatCard title="Total Classes" value={statsLoading ? null : classes.length} index={2} gradient="from-purple-400 to-indigo-600" />
                  <DashboardStatCard title="Completed" value={statsLoading ? null : classes.filter(c => c.status === 'completed').length} index={3} gradient="from-secondary to-orange-500" />
                  <DashboardStatCard title="Attendance" value={statsLoading ? null : attendanceRecords.length} index={4} gradient="from-pink-400 to-rose-600" />
                </div>
              </section>

              <section>
                <h3 className="text-2xl font-black text-foreground mb-4">Students Under Each Teacher</h3>
                <AnimatedCard delay={0.2} className="p-0 overflow-hidden border-2 border-border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[650px]">
                      <thead>
                        <tr className="bg-muted border-b-2 border-border">
                          <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest">Teacher Info</th>
                          <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest">Total Students</th>
                          <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest">Assigned Students</th>
                          <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest">Classes (Done/Total)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-border">
                        {teachers.map((t, index) => {
                          const assignedStudentsList = students.filter(s => s.teacher_id === t.id);
                          const assignedStudentsNames = assignedStudentsList.map(s => s.name);
                          const teacherClasses = classes.filter(c => c.teacher_id === t.id);
                          const completedClasses = teacherClasses.filter(c => c.status === 'completed').length;
                          return (
                            <motion.tr 
                              key={t.id} 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="hover:bg-muted/30 transition-colors"
                            >
                              <td className="p-4">
                                <p className="font-bold text-foreground text-lg">{t.name}</p>
                                <p className="text-sm font-medium text-muted-foreground">{t.email}</p>
                              </td>
                              <td className="p-4 font-black text-primary text-xl">{assignedStudentsList.length}</td>
                              <td className="p-4 text-sm font-medium text-foreground max-w-xs truncate" title={assignedStudentsNames.join(', ')}>
                                {assignedStudentsNames.length > 0 ? assignedStudentsNames.join(', ') : 'None'}
                              </td>
                              <td className="p-4 text-sm font-bold text-foreground">
                                {completedClasses} / {teacherClasses.length}
                              </td>
                            </motion.tr>
                          )
                        })}
                        {teachers.length === 0 && (
                          <tr><td colSpan={4} className="p-8 text-center text-muted-foreground font-bold">No data available yet</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </AnimatedCard>
              </section>

              <section>
                <h3 className="text-2xl font-black text-foreground mb-4">Each Student's Attendance</h3>
                <AnimatedCard delay={0.3} className="p-0 overflow-hidden border-2 border-border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[650px]">
                      <thead>
                        <tr className="bg-muted border-b-2 border-border">
                          <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest">Student Info</th>
                          <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest">Teacher(s)</th>
                          <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest">Scheduled</th>
                          <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest">Attended</th>
                          <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest">Progress</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-border">
                        {students.map(s => {
                          const studentClasses = classes.filter(c => c.student_id === s.id);
                          const studentAttendance = attendanceRecords.filter(a => a.student_id === s.id);
                          const totalScheduled = studentClasses.length;
                          const totalAttended = studentAttendance.length;
                          const percentage = totalScheduled > 0 ? Math.round((totalAttended / totalScheduled) * 100) : 0;
                          const teacherNames = Array.from(new Set(studentClasses.map(c => teachers.find(t => t.id === c.teacher_id)?.name))).filter(Boolean).join(', ');
                          
                          let color = 'bg-destructive';
                          if (percentage >= 76) color = 'bg-primary';
                          else if (percentage >= 51) color = 'bg-secondary';

                          return (
                            <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                              <td className="p-4">
                                <p className="font-bold text-foreground text-lg">{s.name}</p>
                              </td>
                              <td className="p-4 text-sm font-medium text-foreground">{teacherNames || 'None'}</td>
                              <td className="p-4 font-black text-foreground">{totalScheduled}</td>
                              <td className="p-4 font-black text-foreground">{totalAttended}</td>
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden border-2 border-border p-[1px]">
                                    <div className={`h-full rounded-full ${color}`} style={{ width: `${percentage}%` }} />
                                  </div>
                                  <span className="text-xs font-black text-foreground w-8">{percentage}%</span>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                        {students.length === 0 && (
                          <tr><td colSpan={5} className="p-8 text-center text-muted-foreground font-bold">No data available yet</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </AnimatedCard>
              </section>

              <section>
                <h3 className="text-2xl font-black text-foreground mb-4">Each Teacher's Performance</h3>
                <AnimatedCard delay={0.4} className="p-0 overflow-hidden border-2 border-border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[650px]">
                      <thead>
                        <tr className="bg-muted border-b-2 border-border">
                          <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest">Teacher Info</th>
                          <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest">Classes Created</th>
                          <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest">Classes Completed</th>
                          <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest">Completion Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-border">
                        {teachers.map(t => {
                          const teacherClasses = classes.filter(c => c.teacher_id === t.id);
                          const completedClasses = teacherClasses.filter(c => c.status === 'completed').length;
                          const completionRate = teacherClasses.length > 0 ? Math.round((completedClasses / teacherClasses.length) * 100) : 0;
                          
                          let color = 'bg-destructive';
                          if (completionRate >= 76) color = 'bg-primary';
                          else if (completionRate >= 51) color = 'bg-secondary';

                          return (
                            <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                              <td className="p-4">
                                <p className="font-bold text-foreground text-lg">{t.name}</p>
                                <p className="text-sm font-medium text-muted-foreground">{t.email}</p>
                              </td>
                              <td className="p-4 font-black text-foreground">{teacherClasses.length}</td>
                              <td className="p-4 font-black text-foreground">{completedClasses}</td>
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden border-2 border-border p-[1px]">
                                    <div className={`h-full rounded-full ${color}`} style={{ width: `${completionRate}%` }} />
                                  </div>
                                  <span className="text-xs font-black text-foreground w-8">{completionRate}%</span>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                        {teachers.length === 0 && (
                          <tr><td colSpan={4} className="p-8 text-center text-muted-foreground font-bold">No data available yet</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </AnimatedCard>
              </section>
            </PageTransition>
          )}
          
          {activeTab === 'students' && (
            <PageTransition key="students" className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border-2 border-border">
                <h3 className="text-2xl font-black text-foreground">All Students <span className="text-primary">({students.length})</span></h3>
                <div className="flex flex-col sm:flex-row w-full md:w-auto items-stretch sm:items-center gap-3">
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      placeholder="Search students..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 border-2 bg-muted/30 font-medium h-12"
                    />
                  </div>
                  <div className="relative min-w-[140px]">
                    <select
                      className="w-full p-3 pr-8 border-2 border-border rounded-xl bg-white font-bold text-foreground focus:ring-4 focus:ring-primary/20 outline-none h-12 appearance-none cursor-pointer text-sm"
                      value={studentStatusFilter}
                      onChange={(e) => setStudentStatusFilter(e.target.value)}
                    >
                      <option value="all">All Status</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="break">Break</option>
                      <option value="stopped">Stopped</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>

              <AnimatedCard delay={0.1} className="p-0 overflow-hidden border-2 border-border">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1050px]">
                    <thead>
                      <tr className="bg-muted border-b-2 border-border">
                        <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest whitespace-nowrap min-w-[100px]">Reg No</th>
                        <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest whitespace-nowrap min-w-[200px]">Student Name</th>
                        <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest whitespace-nowrap min-w-[130px]">Status</th>
                        <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest whitespace-nowrap min-w-[180px]">Class</th>
                        <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest whitespace-nowrap min-w-[320px]">Assigned Teacher</th>
                        <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest whitespace-nowrap min-w-[130px]">Joined Date</th>
                        <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest text-right whitespace-nowrap min-w-[130px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-border">
                      {filteredStudents.length > 0 ? filteredStudents.map((s) => (
                        <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-4 font-black text-primary whitespace-nowrap">{s.registration_number}</td>
                          <td className="p-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <Avatar photoUrl={s.profile_photo} name={s.name} size="sm" />
                              <div>
                                <p className="font-bold text-foreground text-sm leading-tight">{s.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <StatusBadge status={s.enrolment_status} />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedProfile(s)
                                  setIsProfileModalOpen(true)
                                }}
                                className="p-1 rounded-lg hover:bg-emerald-50 text-muted-foreground hover:text-emerald-700 transition-colors cursor-pointer"
                                title="Edit enrolment status"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="p-4 whitespace-nowrap font-bold text-foreground">
                            <span className="inline-flex items-center bg-primary/10 text-primary border-2 border-primary/20 px-3 py-1 rounded-xl text-xs uppercase font-black tracking-wide whitespace-nowrap">
                              {s.class_name}
                            </span>
                          </td>
                          <td className="p-4 text-sm font-medium text-foreground whitespace-nowrap">
                            {editingStudentId === s.id ? (
                              <div className="flex items-center gap-2 max-w-[340px]">
                                <div className="relative flex-1 min-w-[180px]">
                                  <select
                                    className="w-full bg-white border-2 border-primary/50 focus:border-primary rounded-xl outline-none text-xs sm:text-sm font-semibold py-1.5 pl-3 pr-8 h-10 shadow-sm appearance-none cursor-pointer"
                                    value={selectedTeacherId}
                                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                                  >
                                    <option value="" className="text-muted-foreground italic">Unassigned</option>
                                    {teachers.map(t => (
                                      <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                  </select>
                                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleReassignTeacher(s.id, selectedTeacherId)}
                                  disabled={reassigningStudentId === s.id}
                                  className="h-10 px-3 text-xs bg-primary hover:bg-primary/90 active:scale-95 text-white rounded-xl font-bold flex items-center justify-center gap-1 shadow-sm transition-all disabled:opacity-50 shrink-0"
                                >
                                  {reassigningStudentId === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingStudentId(null)
                                    setSelectedTeacherId('')
                                  }}
                                  className="h-10 px-2.5 text-xs border-2 border-border hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl font-semibold transition-all shrink-0"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-foreground text-sm min-w-[130px] truncate">
                                  {teachers.find(t => t.id === s.teacher_id)?.name || 'Unassigned'}
                                </span>
                                <button
                                  type="button"
                                  className="px-2.5 py-1 text-xs font-bold rounded-lg border-2 border-border hover:border-primary/40 hover:bg-primary/10 hover:text-primary transition-all flex items-center gap-1 text-muted-foreground shrink-0 shadow-2xs"
                                  onClick={() => {
                                    setEditingStudentId(s.id)
                                    setSelectedTeacherId(s.teacher_id || '')
                                  }}
                                >
                                  <Pencil className="h-3 w-3" />
                                  Change
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-xs text-muted-foreground font-bold whitespace-nowrap">
                            {format(new Date(s.created_at), "MMM d, yyyy")}
                          </td>
                          <td className="p-4 text-right whitespace-nowrap">
                            <BouncyButton 
                              size="sm" 
                              variant="ghost"
                              onClick={() => {
                                setSelectedProfile(s)
                                setIsProfileModalOpen(true)
                              }}
                            >
                              View Profile
                            </BouncyButton>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan={7} className="p-8 text-center text-muted-foreground font-bold">No students found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </AnimatedCard>
            </PageTransition>
          )}

          {activeTab === 'teachers' && (
            <PageTransition key="teachers" className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border-2 border-border">
                <h3 className="text-2xl font-black text-foreground">All Teachers <span className="text-primary">({teachers.length})</span></h3>
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    placeholder="Search teachers..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-2 bg-muted/30 font-medium h-12"
                  />
                </div>
              </div>

              <AnimatedCard delay={0.1} className="p-0 overflow-hidden border-2 border-border">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[750px]">
                    <thead>
                      <tr className="bg-muted border-b-2 border-border">
                        <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest whitespace-nowrap min-w-[220px]">Teacher Name</th>
                        <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest whitespace-nowrap min-w-[140px]">Students Count</th>
                        <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest whitespace-nowrap min-w-[140px]">Joined Date</th>
                        <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest text-right whitespace-nowrap min-w-[120px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-border">
                      {filteredTeachers.length > 0 ? filteredTeachers.map((t) => {
                        const studentCount = students.filter(s => s.teacher_id === t.id).length;
                        return (
                        <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <Avatar photoUrl={t.profile_photo} name={t.name} size="sm" />
                              <div>
                                <p className="font-bold text-foreground text-sm sm:text-base leading-tight">{t.name}</p>
                                <p className="text-xs font-medium text-muted-foreground">{t.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-foreground font-black text-lg whitespace-nowrap">{studentCount}</td>
                          <td className="p-4 text-xs text-muted-foreground font-bold whitespace-nowrap">
                            {format(new Date(t.created_at), "MMM d, yyyy")}
                          </td>
                          <td className="p-4 text-right whitespace-nowrap">
                            <BouncyButton 
                              size="sm" 
                              variant="ghost"
                              onClick={() => {
                                setSelectedProfile(t)
                                setIsProfileModalOpen(true)
                              }}
                            >
                              Profile
                            </BouncyButton>
                          </td>
                        </tr>
                      )}) : (
                        <tr><td colSpan={4} className="p-8 text-center text-muted-foreground font-bold">No teachers found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </AnimatedCard>
            </PageTransition>
          )}

          {activeTab === 'attendance' && (
            <PageTransition key="attendance">
              <AdminAttendanceManager
                students={students}
                teachers={teachers}
                classes={classes}
                attendance={attendanceRecords}
                allUsers={allUsers}
              />
            </PageTransition>
          )}

          {activeTab === 'manage' && (
            <PageTransition key="manage" className="space-y-8">
              
              <AnimatedCard delay={0.1} className="p-6 md:p-8 border-t-8 border-t-primary">
                <h3 className="text-2xl font-black text-foreground mb-6 flex items-center gap-3">
                  <span className="bg-primary/20 p-2 rounded-xl text-primary"><UserPlus className="h-6 w-6" /></span>
                  Create New Profile
                </h3>
                
                <div className="bg-secondary/10 border-2 border-secondary/20 text-secondary-foreground p-4 rounded-xl mb-8 font-semibold flex items-start gap-3">
                  <AlertCircle className="h-6 w-6 flex-shrink-0" />
                  <p>
                    <strong>Note:</strong> Creating users directly from this dashboard requires the <code>SUPABASE_SERVICE_ROLE_KEY</code> to be configured in your environment variables.
                  </p>
                </div>

                <form onSubmit={handleCreateUser} className="space-y-6 max-w-2xl">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-bold text-foreground text-lg">Account Role</Label>
                      <select 
                        id="create-user-role"
                        className="w-full p-4 border-2 border-border rounded-xl bg-muted/30 focus:ring-4 focus:ring-primary/20 outline-none font-bold text-foreground transition-all"
                        value={newUser.role}
                        onChange={e => setNewUser({...newUser, role: e.target.value})}
                      >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="font-bold text-foreground">Full Name</Label>
                        <Input 
                          placeholder="John Doe" 
                          value={newUser.name}
                          onChange={e => setNewUser({...newUser, name: e.target.value})}
                          required
                          className="border-2 font-medium h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold text-foreground">Email Address</Label>
                        <Input 
                          type="email"
                          placeholder="john@example.com" 
                          value={newUser.email}
                          onChange={e => setNewUser({...newUser, email: e.target.value})}
                          required
                          className="border-2 font-medium h-12"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="font-bold text-foreground">Temporary Password</Label>
                        <Input 
                          type="password"
                          placeholder="Minimum 6 characters" 
                          value={newUser.password}
                          onChange={e => setNewUser({...newUser, password: e.target.value})}
                          required
                          minLength={6}
                          className="border-2 font-medium h-12"
                        />
                      </div>
                    </div>

                    {newUser.role === 'student' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/30 p-6 rounded-2xl border-2 border-border/50">
                        <div className="space-y-2">
                          <Label className="font-bold text-foreground">Registration Number <span className="text-destructive">*</span></Label>
                          <Input 
                            placeholder="e.g. 26009" 
                            value={newUser.registrationNumber || ''}
                            onChange={e => setNewUser({...newUser, registrationNumber: e.target.value})}
                            required
                            className="border-2 font-medium h-12"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bold text-foreground">Assign to Teacher <span className="text-destructive">*</span></Label>
                          <select 
                            className="w-full p-3 border-2 border-border rounded-xl bg-white focus:ring-4 focus:ring-primary/20 outline-none font-medium h-12"
                            value={newUser.teacherId}
                            onChange={e => setNewUser({...newUser, teacherId: e.target.value})}
                            required
                          >
                            <option value="">Select a teacher...</option>
                            {teachers.map(t => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label className="font-bold text-foreground">Class Name (Optional)</Label>
                          <Input 
                            placeholder="e.g. Batch A - Quran" 
                            value={newUser.className}
                            onChange={e => setNewUser({...newUser, className: e.target.value})}
                            className="border-2 font-medium h-12"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <BouncyButton 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="w-full h-16 text-xl shadow-[0_6px_0_oklch(0.5_0.19_255)] hover:shadow-[0_2px_0_oklch(0.5_0.19_255)] active:shadow-none bg-primary hover:bg-primary/90 text-white rounded-2xl"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin mr-2 h-6 w-6" /> : null}
                    {isSubmitting ? "Creating Profile..." : "Create User Profile"}
                  </BouncyButton>
                </form>
              </AnimatedCard>

              <AnimatedCard delay={0.2} className="p-6 md:p-8 border-t-8 border-t-destructive bg-destructive/5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h3 className="text-2xl font-black text-destructive flex items-center gap-3 m-0">
                      <UserMinus className="h-6 w-6" /> Danger Zone: Remove Access
                    </h3>
                    <p className="text-sm text-muted-foreground font-semibold mt-1">
                      Showing {allUsers.length} total users in academy. Revoking access removes their profile permanently.
                    </p>
                  </div>
                  <div className="flex w-full sm:w-auto items-center gap-3">
                    <div className="relative w-full sm:w-72">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input 
                        placeholder="Search users..." 
                        value={removeAccessSearchQuery}
                        onChange={(e) => setRemoveAccessSearchQuery(e.target.value)}
                        className="pl-10 border-2 bg-white font-medium focus-visible:ring-destructive"
                      />
                    </div>
                    <select
                      className="p-3 border-2 border-border rounded-xl bg-white font-bold text-foreground focus:ring-4 focus:ring-destructive/20 outline-none h-11"
                      value={removeAccessRoleFilter}
                      onChange={(e) => setRemoveAccessRoleFilter(e.target.value)}
                    >
                      <option value="all">All Roles</option>
                      <option value="teacher">Teacher</option>
                      <option value="student">Student</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                
                {(() => {
                  const filteredRemoveUsers = allUsers
                    .filter(u => removeAccessRoleFilter === 'all' ? true : u.role === removeAccessRoleFilter)
                    .filter(u => safeLower(u.name).includes(safeLower(removeAccessSearchQuery)) || safeLower(u.email).includes(safeLower(removeAccessSearchQuery)))
                  
                  return (
                    <div className="overflow-x-auto border-2 border-border rounded-2xl bg-white">
                      <table className="w-full text-left border-collapse min-w-[650px]">
                        <thead>
                          <tr className="bg-muted border-b-2 border-border">
                            <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest">User</th>
                            <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest">Role</th>
                            <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-border">
                          {filteredRemoveUsers.length > 0 ? filteredRemoveUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-destructive/5 transition-colors">
                              <td className="p-4">
                                <p className="font-bold text-foreground text-lg">{u.name}</p>
                                <p className="text-sm font-medium text-muted-foreground">{u.email}</p>
                              </td>
                              <td className="p-4">
                                <span className="bg-muted text-foreground border-2 border-border px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider">
                                  {u.role}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                {showConfirm === u.id ? (
                                  <div className="flex items-center justify-end gap-2">
                                    <span className="text-sm text-destructive font-black">Sure?</span>
                                    <BouncyButton
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => confirmRemove(u.id)}
                                    >
                                      Yes, Remove
                                    </BouncyButton>
                                    <BouncyButton
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setShowConfirm(null)}
                                    >
                                      Cancel
                                    </BouncyButton>
                                  </div>
                                ) : removingUserId === u.id ? (
                                  <div className="flex items-center justify-end gap-2 text-muted-foreground">
                                    <Loader2 className="animate-spin h-4 w-4" />
                                    <span className="text-xs font-bold">Removing...</span>
                                  </div>
                                ) : (
                                  <BouncyButton
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => setShowConfirm(u.id)}
                                  >
                                    <Trash className="h-4 w-4 mr-2" /> Remove
                                  </BouncyButton>
                                )}
                              </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan={3} className="p-8 text-center text-muted-foreground font-bold">
                                No users found matching your search.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )
                })()}
              </AnimatedCard>

            </PageTransition>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-border flex justify-around p-3 z-50 md:hidden pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.08)] rounded-t-3xl overflow-x-auto">
        <NavBtn active={activeTab === 'statistics'} onClick={() => setActiveTab('statistics')} icon={<BarChart3 className={activeTab === 'statistics' ? 'fill-primary/20' : ''} />} label="Stats" />
        <NavBtn active={activeTab === 'students'} onClick={() => setActiveTab('students')} icon={<GraduationCap className={activeTab === 'students' ? 'fill-primary/20' : ''} />} label="Students" />
        <NavBtn active={activeTab === 'teachers'} onClick={() => setActiveTab('teachers')} icon={<BookOpen className={activeTab === 'teachers' ? 'fill-primary/20' : ''} />} label="Teachers" />
        <NavBtn active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} icon={<CheckCircle className={activeTab === 'attendance' ? 'fill-primary/20' : ''} />} label="Attendance" />
        <NavBtn active={activeTab === 'manage'} onClick={() => setActiveTab('manage')} icon={<Users className={activeTab === 'manage' ? 'fill-primary/20' : ''} />} label="Manage" />
      </nav>

      {/* Profile Modal */}
      <AnimatePresence>
        {isProfileModalOpen && selectedProfile && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col border border-border"
            >
            <div className="p-4 sm:p-5 border-b border-border flex justify-between items-center bg-muted/30">
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                {selectedProfile.role === 'student' ? 'Student Profile' : (isEditingTeacher ? 'Edit Teacher Profile' : 'Teacher Profile')}
              </h3>
              <div className="flex items-center gap-2">
                {selectedProfile.role === 'teacher' && !isEditingTeacher && (
                  <button 
                    type="button"
                    onClick={startEditTeacher}
                    className="flex items-center gap-1.5 font-bold text-xs h-8 px-3 rounded-lg border border-border bg-white hover:bg-muted text-foreground transition-colors cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5 text-primary" />
                    <span>Edit</span>
                  </button>
                )}
                {selectedProfile.role === 'teacher' && isEditingTeacher && (
                  <button 
                    type="button"
                    onClick={() => setIsEditingTeacher(false)}
                    className="font-bold text-xs h-8 px-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button 
                  type="button"
                  onClick={() => { setIsProfileModalOpen(false); setIsEditingTeacher(false); }}
                  className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* Header Profile Identity */}
              <div className="flex items-center gap-3.5 p-3 bg-muted/20 rounded-xl border border-border/60">
                <Avatar photoUrl={selectedProfile.profile_photo} name={selectedProfile.name} size="md" className="border-2 border-primary/20 shadow-xs shrink-0" />
                <div className="min-w-0 flex-1">
                  <h4 className="text-base font-bold text-foreground truncate">{selectedProfile.name}</h4>
                  <p className="text-xs text-muted-foreground truncate">{selectedProfile.email}</p>
                  {selectedProfile.role === 'student' && (
                    <span className="inline-block mt-1 text-[10px] font-semibold text-primary font-mono bg-primary/10 px-2 py-0.5 rounded-md">
                      Reg: {selectedProfile.registration_number}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {selectedProfile.role === 'student' ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-muted/15 rounded-xl border border-border/50">
                      <ProfileItem label="Assigned Teacher" value={teachers.find(t => t.id === selectedProfile.teacher_id)?.name || 'Unassigned'} />
                      <ProfileItem label="Class Name" value={selectedProfile.class_name} />
                      <ProfileItem label="Date of Birth" value={selectedProfile.dob ? format(parseISO(selectedProfile.dob), 'MMM d, yyyy') : 'N/A'} />
                      <ProfileItem label="Guardian Name" value={selectedProfile.guardian_name} />
                      <ProfileItem label="Guardian Mobile" value={selectedProfile.guardian_mobile} />
                      <ProfileItem label="Address" value={selectedProfile.address} />
                      <ProfileItem label="Academy Joined Date" value={selectedProfile.academy_joined_date ? format(parseISO(selectedProfile.academy_joined_date), 'MMM d, yyyy') : (selectedProfile.created_at ? format(new Date(selectedProfile.created_at), 'MMM d, yyyy') : 'N/A')} />
                    </div>
                    
                    {/* Status Management */}
                    <div className="pt-2 border-t border-border space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-bold text-foreground text-sm">Enrolment Status</h5>
                          <p className="text-[11px] text-muted-foreground">Select a status below to update immediately</p>
                        </div>
                        <StatusBadge status={selectedProfile.enrolment_status || 'ongoing'} />
                      </div>

                      <div className="bg-muted/30 p-3 rounded-xl border border-border/70 space-y-2.5">
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setInlineStatus('ongoing')}
                            className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border min-h-[38px] ${
                              inlineStatus === 'ongoing'
                                ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                                : 'bg-white text-muted-foreground border-border hover:bg-muted/60'
                            }`}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Ongoing</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setInlineStatus('break')}
                            className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border min-h-[38px] ${
                              inlineStatus === 'break'
                                ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                                : 'bg-white text-muted-foreground border-border hover:bg-muted/60'
                            }`}
                          >
                            <Clock className="h-3.5 w-3.5" />
                            <span>On Break</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setInlineStatus('stopped')}
                            className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border min-h-[38px] ${
                              inlineStatus === 'stopped'
                                ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                                : 'bg-white text-muted-foreground border-border hover:bg-muted/60'
                            }`}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Stopped</span>
                          </button>
                        </div>

                        {inlineStatus === 'ongoing' && (
                          <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-900 font-medium flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                            <span>Student is active and attending regular classes.</span>
                          </div>
                        )}

                        {inlineStatus === 'break' && (
                          <div className="bg-white p-3 rounded-lg border border-amber-200 space-y-2.5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <div className="space-y-1">
                                <Label className="text-[11px] font-bold text-amber-950">Break Start Date *</Label>
                                <Input
                                  type="date"
                                  value={inlineBreakFrom}
                                  onChange={(e) => setInlineBreakFrom(e.target.value)}
                                  className="h-9 text-xs bg-amber-50/20 border-amber-300"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[11px] font-bold text-amber-950">Break End Date *</Label>
                                <Input
                                  type="date"
                                  value={inlineBreakTo}
                                  onChange={(e) => setInlineBreakTo(e.target.value)}
                                  className="h-9 text-xs bg-amber-50/20 border-amber-300"
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[11px] font-bold text-amber-950">Reason (Optional)</Label>
                              <Input
                                placeholder="e.g. Travel, exams, medical..."
                                value={inlineBreakReason}
                                onChange={(e) => setInlineBreakReason(e.target.value)}
                                className="h-9 text-xs bg-amber-50/20 border-amber-300"
                              />
                            </div>
                          </div>
                        )}

                        {inlineStatus === 'stopped' && (
                          <div className="bg-white p-3 rounded-lg border border-rose-200 space-y-2.5">
                            <div className="space-y-1">
                              <Label className="text-[11px] font-bold text-rose-950">Last Class Date *</Label>
                              <Input
                                type="date"
                                value={inlineStoppedDate}
                                onChange={(e) => setInlineStoppedDate(e.target.value)}
                                className="h-9 text-xs bg-rose-50/20 border-rose-300"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[11px] font-bold text-rose-950">Reason for Stopping / Quitting *</Label>
                              <Input
                                placeholder="e.g. Course completed, relocated..."
                                value={inlineStoppedReason}
                                onChange={(e) => setInlineStoppedReason(e.target.value)}
                                className="h-9 text-xs bg-rose-50/20 border-rose-300"
                              />
                            </div>
                            <p className="text-[11px] font-medium text-rose-700 bg-rose-50 p-2 rounded-md border border-rose-200">
                              Note: Marking as stopped immediately revokes student portal login access.
                            </p>
                          </div>
                        )}

                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={handleSaveInlineStatus}
                            disabled={isSavingStatus}
                            className="h-9 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-60"
                          >
                            {isSavingStatus ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                                <span>Saving...</span>
                              </>
                            ) : (
                              <>
                                <Save className="h-3.5 w-3.5" />
                                <span>Save Status</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Attendance Stats */}
                    <div className="pt-2 border-t border-border">
                      <h5 className="font-bold text-foreground text-sm mb-2.5">Attendance Stats</h5>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {(() => {
                          const studentClasses = classes.filter(c => c.student_id === selectedProfile.id);
                          const studentAttendance = attendanceRecords.filter(a => a.student_id === selectedProfile.id);
                          const totalClasses = studentClasses.length;
                          const present = studentAttendance.length;
                          const absent = totalClasses - present;
                          const percentage = totalClasses > 0 ? Math.round((present / totalClasses) * 100) : 0;
                          
                          return (
                            <>
                              <ModalStatCard label="Classes" value={totalClasses} />
                              <ModalStatCard label="Present" value={present} color="text-primary" />
                              <ModalStatCard label="Absent" value={absent} color="text-destructive" />
                              <ModalStatCard label="Rate" value={`${percentage}%`} color={percentage >= 75 ? 'text-primary' : 'text-secondary'} />
                            </>
                          )
                        })()}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {isEditingTeacher ? (
                      <div className="space-y-4">
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs font-medium text-amber-900 flex items-start gap-2">
                          <Lock className="h-3.5 w-3.5 shrink-0 text-amber-800 mt-0.5" />
                          <span>
                            <strong>Admin Note:</strong> Profile photos are personal to each educator and can only be updated by the teacher directly. All other profile details can be edited below.
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/20 p-3.5 rounded-xl border border-border/60">
                          <div className="space-y-1">
                            <Label className="font-bold text-foreground text-xs uppercase tracking-wider">
                              Teacher Full Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              value={editTeacherForm.name}
                              onChange={(e) => setEditTeacherForm(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="e.g. Sheikh Ahmed"
                              className="font-medium bg-white h-9 text-xs sm:text-sm"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="font-bold text-foreground text-xs uppercase tracking-wider">
                              Date of Joining
                            </Label>
                            <Input
                              type="date"
                              value={editTeacherForm.date_of_joining}
                              onChange={(e) => setEditTeacherForm(prev => ({ ...prev, date_of_joining: e.target.value }))}
                              className="font-medium bg-white h-9 text-xs sm:text-sm"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="font-bold text-foreground text-xs uppercase tracking-wider">
                              Mobile Number
                            </Label>
                            <Input
                              value={editTeacherForm.mobile_number}
                              onChange={(e) => setEditTeacherForm(prev => ({ ...prev, mobile_number: e.target.value }))}
                              placeholder="e.g. +44 7123 456789"
                              className="font-medium bg-white h-9 text-xs sm:text-sm"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="font-bold text-foreground text-xs uppercase tracking-wider">
                              Country
                            </Label>
                            <Input
                              value={editTeacherForm.current_country}
                              onChange={(e) => setEditTeacherForm(prev => ({ ...prev, current_country: e.target.value }))}
                              placeholder="e.g. United Kingdom"
                              className="font-medium bg-white h-9 text-xs sm:text-sm"
                            />
                          </div>

                          <div className="space-y-1 sm:col-span-2">
                            <Label className="font-bold text-foreground text-xs uppercase tracking-wider">
                              State / Region
                            </Label>
                            <Input
                              value={editTeacherForm.current_state}
                              onChange={(e) => setEditTeacherForm(prev => ({ ...prev, current_state: e.target.value }))}
                              placeholder="e.g. London / Birmingham"
                              className="font-medium bg-white h-9 text-xs sm:text-sm"
                            />
                          </div>

                          <div className="space-y-1 sm:col-span-2">
                            <Label className="font-bold text-foreground text-xs uppercase tracking-wider">
                              Educational Qualifications
                            </Label>
                            <Textarea
                              value={editTeacherForm.educational_qualifications}
                              onChange={(e) => setEditTeacherForm(prev => ({ ...prev, educational_qualifications: e.target.value }))}
                              placeholder="e.g. B.A. Islamic Studies, Hafiz-ul-Quran"
                              rows={2}
                              className="font-medium bg-white resize-none text-xs sm:text-sm"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setIsEditingTeacher(false)}
                            disabled={isSavingTeacher}
                            className="h-9 px-4 font-semibold text-xs rounded-lg border border-border bg-white hover:bg-muted text-foreground transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveTeacherProfile}
                            disabled={isSavingTeacher}
                            className="h-9 px-4 bg-primary hover:bg-primary/90 text-white font-bold text-xs flex items-center gap-1.5 rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-60"
                          >
                            {isSavingTeacher ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
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
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-muted/15 rounded-xl border border-border/50">
                          <ProfileItem 
                            label="Date of Joining" 
                            value={selectedProfile.date_of_joining ? (
                              selectedProfile.date_of_joining.includes('-') 
                                ? format(parseISO(selectedProfile.date_of_joining.split('T')[0]), 'MMM d, yyyy') 
                                : selectedProfile.date_of_joining
                            ) : (selectedProfile.created_at ? format(new Date(selectedProfile.created_at), 'MMM d, yyyy') : 'N/A')} 
                          />
                          <ProfileItem label="Mobile Number" value={selectedProfile.mobile_number || 'N/A'} />
                          <ProfileItem label="Country" value={selectedProfile.current_country || 'N/A'} />
                          <ProfileItem label="State / Region" value={selectedProfile.current_state || 'N/A'} />
                          <div className="sm:col-span-2">
                            <ProfileItem label="Educational Qualifications" value={selectedProfile.educational_qualifications || 'N/A'} />
                          </div>
                          {selectedProfile.bank_account_number ? (
                            <div className="sm:col-span-2">
                              <ProfileItem label="Bank Account Details" value={`${selectedProfile.bank_name || ''} - ${selectedProfile.bank_account_number}`} />
                            </div>
                          ) : null}
                        </div>

                        {/* Teacher Performance */}
                        <div className="pt-2 border-t border-border">
                          <h5 className="font-bold text-foreground text-sm mb-2.5">Teaching Performance</h5>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {(() => {
                              const teacherClasses = classes.filter(c => c.teacher_id === selectedProfile.id);
                              const assignedStudents = students.filter(s => s.teacher_id === selectedProfile.id);
                              const completed = teacherClasses.filter(c => c.status === 'completed').length;
                              const rate = teacherClasses.length > 0 ? Math.round((completed / teacherClasses.length) * 100) : 0;
                              
                              return (
                                <>
                                  <ModalStatCard label="Assigned" value={assignedStudents.length} />
                                  <ModalStatCard label="Classes" value={teacherClasses.length} />
                                  <ModalStatCard label="Completed" value={completed} color="text-primary" />
                                  <ModalStatCard label="Rate" value={`${rate}%`} color={rate >= 75 ? 'text-primary' : 'text-secondary'} />
                                </>
                              )
                            })()}
                          </div>
                        </div>

                        {/* Assigned Students */}
                        <div className="pt-2 border-t border-border">
                          <Label className="font-bold text-foreground text-xs uppercase tracking-wider">Assigned Students</Label>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {students.filter(s => s.teacher_id === selectedProfile.id).map(s => (
                              <span key={s.id} className="bg-muted text-foreground border border-border px-2.5 py-1 rounded-lg text-xs font-semibold">
                                {s.name}
                              </span>
                            ))}
                            {students.filter(s => s.teacher_id === selectedProfile.id).length === 0 && (
                              <span className="text-xs font-medium text-muted-foreground">No students assigned</span>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border flex justify-around p-1 z-40 md:hidden pb-safe shadow-lg">
        <NavBtn active={activeTab === 'statistics'} onClick={() => setActiveTab('statistics')} icon={<BarChart3 className="size-4" />} label="Stats" />
        <NavBtn active={activeTab === 'students'} onClick={() => setActiveTab('students')} icon={<GraduationCap className="size-4" />} label="Students" />
        <NavBtn active={activeTab === 'teachers'} onClick={() => setActiveTab('teachers')} icon={<BookOpen className="size-4" />} label="Teachers" />
        <NavBtn active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} icon={<CheckCircle className="size-4" />} label="Attendance" />
        <NavBtn active={activeTab === 'manage'} onClick={() => setActiveTab('manage')} icon={<Users className="size-4" />} label="Users" />
      </nav>
    </div>
  )
}

function DashboardStatCard({ title, value, index, gradient }: { title: string, value: any, index: number, gradient: string }) {
  return (
    <AnimatedCard delay={index * 0.1} className={`border-none text-white p-3.5 sm:p-5 relative overflow-hidden bg-gradient-to-br ${gradient}`}>
      <p className="text-white/80 text-[10px] font-black tracking-widest uppercase mb-1 truncate">{title}</p>
      {value === null ? (
        <div className="animate-pulse bg-white/30 h-7 sm:h-8 w-12 rounded mt-1" />
      ) : (
        <p className="text-2xl sm:text-3xl md:text-4xl font-black">{value}</p>
      )}
    </AnimatedCard>
  )
}

function ProfileItem({ label, value }: { label: string, value: any }) {
  return (
    <div className="space-y-0.5">
      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</Label>
      <p className="font-semibold text-foreground text-xs sm:text-sm truncate">{value || 'N/A'}</p>
    </div>
  )
}

function ModalStatCard({ label, value, color = 'text-foreground' }: { label: string, value: any, color?: string }) {
  return (
    <div className="bg-muted/40 border border-border/80 p-2.5 rounded-xl shadow-xs text-center">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-base sm:text-lg font-black ${color}`}>{value}</p>
    </div>
  )
}

function NavTab({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button 
      onClick={onClick} 
      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 border shrink-0 whitespace-nowrap min-h-[36px] ${
        active 
          ? 'bg-[#6B1E2E] text-white border-[#6B1E2E] shadow-sm' 
          : 'text-muted-foreground hover:text-foreground border-transparent hover:bg-muted'
      }`}
    >
      <span className="[&_svg]:size-4">{icon}</span>
      <span>{label}</span>
    </button>
  )
}

function NavBtn({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button 
      onClick={onClick} 
      className={`flex flex-col items-center justify-center min-h-[48px] py-1 px-1 w-full transition-colors ${active ? 'text-primary font-bold' : 'text-muted-foreground'}`}
    >
      <div className={`p-1 rounded-md mb-0.5 ${active ? 'bg-primary/10' : ''}`}>
        {icon}
      </div>
      <span className="text-[10px] whitespace-nowrap">{label}</span>
    </button>
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
