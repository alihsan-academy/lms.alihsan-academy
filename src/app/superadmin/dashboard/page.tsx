"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LogoutButton } from '@/components/logout-button'
import { AcademyHeader } from '@/components/academy-header'
import { Users, GraduationCap, BookOpen, BarChart3, Loader2, UserPlus, UserMinus, ShieldAlert, CheckCircle, Search, AlertCircle, X, RefreshCw, Trash } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Avatar } from '@/components/avatar'
import { motion, AnimatePresence } from 'framer-motion'
import { Skeleton } from '@/components/skeleton'
import { AnimatedCard } from '@/components/animated-card'
import { BouncyButton } from '@/components/bouncy-button'
import { PageTransition } from '@/components/page-transition'

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
  const [removeAccessSearchQuery, setRemoveAccessSearchQuery] = useState('')
  const [removeAccessRoleFilter, setRemoveAccessRoleFilter] = useState('all')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'student', name: '', className: '', teacherId: '', registrationNumber: '' })
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null)
  const [reassigningStudentId, setReassigningStudentId] = useState<string | null>(null)
  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const [selectedProfile, setSelectedProfile] = useState<any>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

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
          name: sp.name || s.email,
          class_name: sp.class_name || 'N/A',
          teacher_id: sp.teacher_id || null,
          registration_number: sp.registration_number || 'N/A',
          profile_photo: sp.profile_photo || null,
          created_at: sp.joined_date || s.created_at
        }
      }) || []

      const mappedTeachers = data.teachers?.map((t: any) => {
        const tp = t.teacher_profiles?.[0] || {}
        return {
          ...t,
          name: tp.name || t.email,
          profile_photo: tp.profile_photo || null,
          mobile_number: tp.mobile_number || tp.mobile || null,
          date_of_joining: tp.date_of_joining || tp.doj || null,
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
      
      toast.success("User created successfully! 🎉")
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
      
      toast.success('User removed successfully 🗑️')
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
      
      toast.success("Student reassigned successfully ✨")
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

  const safeLower = (value: unknown) => String(value ?? '').toLowerCase()

  const filteredStudents = students.filter(s => 
    safeLower(s.name).includes(safeLower(searchQuery)) || 
    safeLower(s.email).includes(safeLower(searchQuery)) ||
    safeLower(s.registration_number).includes(safeLower(searchQuery))
  )

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

      {/* Desktop Navigation */}
      <div className="hidden md:block bg-white border-b-2 border-border px-8">
        <nav className="flex space-x-2 max-w-6xl mx-auto py-2">
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
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                    <table className="w-full text-left border-collapse">
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
                    <table className="w-full text-left border-collapse">
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
                    <table className="w-full text-left border-collapse">
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
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    placeholder="Search students..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-2 bg-muted/30 font-medium h-12"
                  />
                </div>
              </div>

              <AnimatedCard delay={0.1} className="p-0 overflow-hidden border-2 border-border">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted border-b-2 border-border">
                        <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest">Reg No</th>
                        <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest">Student Name</th>
                        <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest">Class</th>
                        <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest">Assigned Teacher</th>
                        <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest">Joined Date</th>
                        <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-border">
                      {filteredStudents.length > 0 ? filteredStudents.map((s) => (
                        <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-4 font-black text-primary">{s.registration_number}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar photoUrl={s.profile_photo} name={s.name} size="sm" />
                              <div>
                                <p className="font-bold text-foreground">{s.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-bold text-foreground">
                            <span className="bg-primary/10 text-primary border-2 border-primary/20 px-3 py-1 rounded-xl text-xs uppercase">{s.class_name}</span>
                          </td>
                          <td className="p-4 text-sm font-medium text-foreground">
                            {editingStudentId === s.id ? (
                              <div className="flex items-center gap-2">
                                <select
                                  className="bg-muted border-2 border-border rounded-lg outline-none focus:border-primary text-sm py-1.5 px-2 w-full max-w-[220px]"
                                  value={selectedTeacherId}
                                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                                >
                                  <option value="" className="text-muted-foreground italic">Unassigned</option>
                                  {teachers.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                  ))}
                                </select>
                                <BouncyButton
                                  size="sm"
                                  onClick={() => handleReassignTeacher(s.id, selectedTeacherId)}
                                  disabled={reassigningStudentId === s.id}
                                >
                                  {reassigningStudentId === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                                </BouncyButton>
                                <BouncyButton
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingStudentId(null)
                                    setSelectedTeacherId('')
                                  }}
                                >
                                  Cancel
                                </BouncyButton>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-foreground min-w-[140px]">
                                  {teachers.find(t => t.id === s.teacher_id)?.name || 'Unassigned'}
                                </span>
                                <BouncyButton
                                  size="sm"
                                  variant="outline"
                                  className="text-xs py-1 h-8"
                                  onClick={() => {
                                    setEditingStudentId(s.id)
                                    setSelectedTeacherId(s.teacher_id || '')
                                  }}
                                >
                                  Change
                                </BouncyButton>
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-sm text-muted-foreground font-bold">
                            {format(new Date(s.created_at), "MMM d, yyyy")}
                          </td>
                          <td className="p-4 text-right">
                            <BouncyButton 
                              size="sm" 
                              variant="ghost"
                              onClick={() => {
                                setSelectedProfile(s)
                                setIsProfileModalOpen(true)
                              }}
                            >
                              Profile
                            </BouncyButton>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan={6} className="p-8 text-center text-muted-foreground font-bold">No students found.</td></tr>
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
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted border-b-2 border-border">
                        <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest">Teacher Name</th>
                        <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest">Students Count</th>
                        <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest">Joined Date</th>
                        <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-border">
                      {filteredTeachers.length > 0 ? filteredTeachers.map((t) => {
                        const studentCount = students.filter(s => s.teacher_id === t.id).length;
                        return (
                        <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar photoUrl={t.profile_photo} name={t.name} size="sm" />
                              <div>
                                <p className="font-bold text-foreground text-lg">{t.name}</p>
                                <p className="text-xs font-medium text-muted-foreground">{t.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-foreground font-black text-xl">{studentCount}</td>
                          <td className="p-4 text-sm text-muted-foreground font-bold">
                            {format(new Date(t.created_at), "MMM d, yyyy")}
                          </td>
                          <td className="p-4 text-right">
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
            <PageTransition key="attendance" className="space-y-6">
              <h3 className="text-2xl font-black text-foreground mb-4">Academy Attendance Records</h3>
              
              <AnimatedCard delay={0.1} className="p-0 overflow-hidden border-2 border-border">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted border-b-2 border-border">
                        <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest">Student</th>
                        <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest">Teacher</th>
                        <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest">Class Date</th>
                        <th className="p-4 text-xs font-black text-foreground uppercase tracking-widest">Marked At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-border">
                      {attendanceRecords.length > 0 ? attendanceRecords.map((a) => {
                        const studentName = allUsers.find(u => u.id === a.student_id)?.name || 'Unknown'
                        const teacherName = allUsers.find(u => u.id === a.teacher_id)?.name || 'Unknown'
                        return (
                          <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-4">
                              <p className="font-bold text-foreground text-lg">{studentName}</p>
                            </td>
                            <td className="p-4">
                              <p className="font-bold text-foreground">{teacherName}</p>
                            </td>
                            <td className="p-4 text-sm font-bold text-muted-foreground">
                              {a.classes?.scheduled_at ? formatUKTime(a.classes.scheduled_at) : 'N/A'}
                            </td>
                            <td className="p-4 text-sm font-semibold text-muted-foreground">
                              {formatUKTime(a.marked_at)}
                            </td>
                          </tr>
                        )
                      }) : (
                        <tr><td colSpan={4} className="p-8 text-center text-muted-foreground font-bold">No attendance records found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </AnimatedCard>
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
                  <h3 className="text-2xl font-black text-destructive flex items-center gap-3 m-0">
                    <UserMinus className="h-6 w-6" /> Danger Zone
                  </h3>
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
                      <table className="w-full text-left border-collapse">
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border-4 border-border"
            >
            <div className="p-6 border-b-2 border-border flex justify-between items-center bg-muted/50">
              <h3 className="text-2xl font-black text-foreground">
                {selectedProfile.role === 'student' ? 'Student Profile' : 'Teacher Profile'}
              </h3>
              <BouncyButton variant="ghost" size="icon" onClick={() => setIsProfileModalOpen(false)}>
                <X className="h-6 w-6" />
              </BouncyButton>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              <div className="flex flex-col items-center mb-8 text-center">
                <Avatar photoUrl={selectedProfile.profile_photo} name={selectedProfile.name} size="lg" className="border-4 border-primary shadow-xl mb-4" />
                <h4 className="text-3xl font-black text-foreground">{selectedProfile.name}</h4>
                <p className="text-muted-foreground font-bold">{selectedProfile.email}</p>
                {selectedProfile.role === 'student' && (
                  <div className="mt-3 inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary border-2 border-primary/20 text-sm font-black">
                    Reg. No: {selectedProfile.registration_number}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedProfile.role === 'student' ? (
                  <>
                    <ProfileItem label="Assigned Teacher" value={teachers.find(t => t.id === selectedProfile.teacher_id)?.name || 'Unassigned'} />
                    <ProfileItem label="Class Name" value={selectedProfile.class_name} />
                    <ProfileItem label="Date of Birth" value={selectedProfile.dob ? format(parseISO(selectedProfile.dob), 'MMM d, yyyy') : 'N/A'} />
                    <ProfileItem label="Guardian Name" value={selectedProfile.guardian_name} />
                    <ProfileItem label="Guardian Mobile" value={selectedProfile.guardian_mobile} />
                    <ProfileItem label="Address" value={selectedProfile.address} />
                    <ProfileItem label="Academy Joined Date" value={selectedProfile.academy_joined_date ? format(parseISO(selectedProfile.academy_joined_date), 'MMM d, yyyy') : (selectedProfile.created_at ? format(new Date(selectedProfile.created_at), 'MMM d, yyyy') : 'N/A')} />
                    
                    {/* Attendance Stats */}
                    <div className="md:col-span-2 mt-4 pt-6 border-t-2 border-border">
                      <h5 className="font-black text-foreground text-xl mb-4">Attendance Stats</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                              <ModalStatCard label="Progress" value={`${percentage}%`} color={percentage >= 75 ? 'text-primary' : 'text-secondary'} />
                            </>
                          )
                        })()}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <ProfileItem label="Date of Joining" value={selectedProfile.date_of_joining ? format(parseISO(selectedProfile.date_of_joining), 'MMM d, yyyy') : (selectedProfile.created_at ? format(new Date(selectedProfile.created_at), 'MMM d, yyyy') : 'N/A')} />
                    <ProfileItem label="Mobile Number" value={selectedProfile.mobile_number} />
                    <ProfileItem label="Country" value={selectedProfile.current_country} />
                    <ProfileItem label="State" value={selectedProfile.current_state} />
                    <div className="md:col-span-2">
                      <ProfileItem label="Educational Qualifications" value={selectedProfile.educational_qualifications} />
                    </div>
                    <div className="md:col-span-2">
                      <ProfileItem label="Bank Account Details" value={selectedProfile.bank_account_number ? `${selectedProfile.bank_name} - ${selectedProfile.bank_account_number}` : 'N/A'} />
                    </div>

                    {/* Teacher Performance */}
                    <div className="md:col-span-2 mt-4 pt-6 border-t-2 border-border">
                      <h5 className="font-black text-foreground text-xl mb-4">Teaching Performance</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {(() => {
                          const teacherClasses = classes.filter(c => c.teacher_id === selectedProfile.id);
                          const assignedStudents = students.filter(s => s.teacher_id === selectedProfile.id);
                          const completed = teacherClasses.filter(c => c.status === 'completed').length;
                          const rate = teacherClasses.length > 0 ? Math.round((completed / teacherClasses.length) * 100) : 0;
                          
                          return (
                            <>
                              <ModalStatCard label="Students" value={assignedStudents.length} />
                              <ModalStatCard label="Classes" value={teacherClasses.length} />
                              <ModalStatCard label="Completed" value={completed} color="text-primary" />
                              <ModalStatCard label="Rate" value={`${rate}%`} color={rate >= 75 ? 'text-primary' : 'text-secondary'} />
                            </>
                          )
                        })()}
                      </div>
                      <div className="mt-6">
                        <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Assigned Students</Label>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {students.filter(s => s.teacher_id === selectedProfile.id).map(s => (
                            <span key={s.id} className="bg-muted text-foreground border-2 border-border px-3 py-1.5 rounded-xl text-sm font-bold shadow-sm">
                              {s.name}
                            </span>
                          )) || <span className="text-sm font-bold text-muted-foreground">No students assigned</span>}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function DashboardStatCard({ title, value, index, gradient }: { title: string, value: any, index: number, gradient: string }) {
  return (
    <AnimatedCard delay={index * 0.1} className={`border-none text-white p-5 relative overflow-hidden bg-gradient-to-br ${gradient}`}>
      <p className="text-white/80 text-[10px] font-black tracking-widest uppercase mb-1">{title}</p>
      {value === null ? (
        <div className="animate-pulse bg-white/30 h-8 w-12 rounded mt-1" />
      ) : (
        <p className="text-4xl font-black">{value}</p>
      )}
    </AnimatedCard>
  )
}

function ProfileItem({ label, value }: { label: string, value: any }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">{label}</Label>
      <p className="font-bold text-foreground text-lg">{value || 'N/A'}</p>
    </div>
  )
}

function ModalStatCard({ label, value, color = 'text-foreground' }: { label: string, value: any, color?: string }) {
  return (
    <div className="bg-muted/30 border-2 border-border p-4 rounded-2xl shadow-sm text-center">
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
    </div>
  )
}

function NavTab({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <BouncyButton 
      variant={active ? 'default' : 'ghost'} 
      onClick={onClick} 
      className={`gap-2 ${active ? 'shadow-md' : ''}`}
    >
      {icon} {label}
    </BouncyButton>
  )
}

function NavBtn({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <motion.button 
      whileTap={{ scale: 0.85 }}
      onClick={onClick} 
      className={`flex flex-col items-center p-2 w-full transition-all ${active ? 'text-primary scale-110' : 'text-muted-foreground'}`}
    >
      <div className={`p-2 rounded-2xl mb-1 ${active ? 'bg-primary/10' : ''}`}>
        {icon}
      </div>
      <span className="text-[11px] font-bold">{label}</span>
    </motion.button>
  )
}
