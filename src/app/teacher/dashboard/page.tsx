"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogoutButton } from '@/components/logout-button'
import { AcademyHeader } from '@/components/academy-header'
import { Calendar, Plus, BarChart3, Loader2, Video, CheckCircle, Clock, User, Globe, AlertCircle, ChevronDown, Users, Copy, Sparkles } from 'lucide-react'
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
  const supabase = createClient()

  // Data state
  const [students, setStudents] = useState<any[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')
  const [classes, setClasses] = useState<any[]>([])
  const [stats, setStats] = useState<any>({ totalClasses: 0, completed: 0, presentCount: 0, absentCount: 0, studentBreakdown: [] })

  useEffect(() => {
    const fetchStudents = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsLoading(false)
        router.push('/login')
        return
      }
      setTeacherId(user.id)
      setTeacherName(user.user_metadata?.full_name || user.user_metadata?.name || user.email)

      const response = await fetch('/api/teacher/students')
      const result = await response.json()
      
      if (!response.ok) {
        console.error('Teacher students API error:', result?.error)
        setStudents([])
        setIsLoading(false)
        return
      }

      if (result.teacher?.name) {
        setTeacherName(result.teacher.name)
      }
      
      const data = result.students
      
      if (data && data.length > 0) {
        const mappedStudents = data.map((s: any) => ({
          ...s,
          id: s.user_id
        }))
        setStudents(mappedStudents)
        setSelectedStudentId(mappedStudents[0].id)
      }
      setIsLoading(false)
    }
    fetchStudents()
  }, [])

  useEffect(() => {
    if (teacherId && selectedStudentId) {
      fetchClasses(selectedStudentId)
    }
  }, [teacherId, selectedStudentId])

  useEffect(() => {
    if (teacherId && activeTab === 'stats') {
      fetchStats()
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

  async function fetchStats() {
    if (!teacherId) return
    
    const response = await fetch('/api/teacher/stats')
    const result = await response.json()
    
    if (!response.ok) {
      return
    }

    const allTeacherClasses = result.classes || []
    const allAttendance = result.attendance || []

    const completed = allTeacherClasses.filter((c: any) => c.status === 'completed').length
    const presentCount = allAttendance?.filter((a: any) => a.status === 'present' || !a.status).length || 0
    const absentCount = allAttendance?.filter((a: any) => a.status === 'absent').length || 0

    // Breakdown
    const breakdownMap = new Map()
    allTeacherClasses.forEach((c: any) => {
      if (!breakdownMap.has(c.student_id)) {
        breakdownMap.set(c.student_id, { total: 0, completed: 0 })
      }
      const s = breakdownMap.get(c.student_id)
      s.total++
      if (c.status === 'completed') s.completed++
    })

    const breakdown = Array.from(breakdownMap.entries()).map(([sid, data]) => {
      const student = students.find(st => st.id === sid)
      return {
        id: sid,
        name: student?.name || 'Unknown Student',
        profile_photo: student?.profile_photo,
        registration_number: student?.registration_number,
        total: data.total,
        completed: data.completed,
        percentage: data.total === 0 ? 0 : Math.round((data.completed / data.total) * 100)
      }
    })

    setStats({ totalClasses: allTeacherClasses.length, completed, presentCount, absentCount, studentBreakdown: breakdown })
  }

  async function markClassStatus(classObj: any, status: 'present' | 'absent') {
    try {
      const response = await fetch('/api/classes/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: classObj.id,
          studentId: classObj.student_id,
          status: status
        })
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to mark class status")

      if (status === 'present') {
        toast.success("Great! Class marked as completed. 🎉")
      } else {
        toast.success("Student marked as absent.")
      }
      await fetchClasses(selectedStudentId)
      await fetchStats()
    } catch (error: any) {
      toast.error(error.message)
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
      <div className="hidden md:block bg-white border-b-2 border-border px-8">
        <nav className="flex space-x-2 max-w-5xl mx-auto py-2">
          <BouncyButton variant={activeTab === 'classes' ? 'default' : 'ghost'} onClick={() => setActiveTab('classes')} className="gap-2"><Calendar className="h-5 w-5" /> Schedule</BouncyButton>
          <BouncyButton variant={activeTab === 'create' ? 'default' : 'ghost'} onClick={() => setActiveTab('create')} className="gap-2"><Plus className="h-5 w-5" /> New Class</BouncyButton>
          <BouncyButton variant={activeTab === 'stats' ? 'default' : 'ghost'} onClick={() => setActiveTab('stats')} className="gap-2"><BarChart3 className="h-5 w-5" /> Statistics</BouncyButton>
          <BouncyButton variant={activeTab === 'profile' ? 'default' : 'ghost'} onClick={() => setActiveTab('profile')} className="gap-2"><User className="h-5 w-5" /> Profile</BouncyButton>
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
                <div className="relative w-full md:w-72">
                  <select 
                    className="w-full p-3 border-2 border-border rounded-xl bg-muted/50 font-bold text-foreground focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none appearance-none cursor-pointer"
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    disabled={students.length === 0}
                  >
                    {students.length > 0 ? (
                      students.map(s => <option key={s.id} value={s.id}>{s.name} • {s.registration_number || 'No Reg'}</option>)
                    ) : (
                      <option value="">No students assigned</option>
                    )}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
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
                  classes.map((c, index) => (
                    <AnimatedCard key={c.id} delay={index * 0.05} className="p-0 overflow-hidden hover:border-primary/50 transition-colors">
                      <div className="p-5 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center gap-5">
                          {(() => {
                            const student = students.find(s => s.id === c.student_id);
                            return (
                              <>
                                <Avatar photoUrl={student?.profile_photo} name={student?.name} size="lg" />
                                <div className="space-y-1">
                                  <h4 className="font-black text-foreground text-xl">{student?.name || 'Unknown Student'}</h4>
                                  <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <span>{formatUKTime(c.scheduled_at)} (UK Time)</span>
                                  </div>
                                  {c.meet_link && (
                                    <a href={c.meet_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors mt-2">
                                      <Video className="h-4 w-4" />
                                      Join Meeting Link
                                    </a>
                                  )}
                                </div>
                              </>
                            )
                          })()}
                        </div>
                        <div className="flex flex-col md:items-end gap-3 w-full md:w-auto">
                          <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border-2 ${c.status === 'scheduled' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                            {c.status}
                          </span>
                          {c.status === 'scheduled' && (
                            <div className="flex flex-wrap gap-2">
                              <BouncyButton 
                                variant="default"
                                size="sm"
                                onClick={() => markClassStatus(c, 'present')} 
                                className="bg-green-500 hover:bg-green-600 text-white"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" /> Mark Completed
                              </BouncyButton>
                              <BouncyButton 
                                variant="destructive"
                                size="sm"
                                onClick={() => markClassStatus(c, 'absent')} 
                              >
                                <AlertCircle className="h-4 w-4 mr-2" /> Mark Absent
                              </BouncyButton>
                            </div>
                          )}
                        </div>
                      </div>
                    </AnimatedCard>
                  ))
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
                }}
              />
            </PageTransition>
          )}

          {activeTab === 'stats' && (
            <PageTransition key="stats" className="space-y-8">
              <div>
                <h3 className="font-black text-foreground text-2xl mb-4">Your Impact 🌟</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard title="Total Classes" value={stats.totalClasses} index={0} gradient="from-purple-500 to-indigo-600" />
                  <StatCard title="Completed" value={stats.completed} index={1} gradient="from-blue-500 to-cyan-500" />
                  <StatCard title="Total Present" value={stats.presentCount} index={2} gradient="from-green-500 to-emerald-600" />
                  <StatCard title="Total Absent" value={stats.absentCount} index={3} gradient="from-orange-500 to-red-500" />
                </div>
              </div>

              <AnimatedCard delay={0.3} className="p-6 md:p-8">
                <h3 className="font-black text-foreground text-xl mb-6">Student Breakdown</h3>
                <div className="space-y-6">
                  {stats.studentBreakdown.length > 0 ? (
                    stats.studentBreakdown.map((s: any, i: number) => (
                      <div key={i} className="space-y-3 bg-muted/30 p-4 rounded-2xl border-2 border-border/50">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <Avatar photoUrl={s.profile_photo} name={s.name} size="md" />
                            <div>
                              <p className="font-black text-foreground text-lg">{s.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">Reg: {s.registration_number || 'N/A'}</span>
                                <p className="text-xs text-muted-foreground font-bold">{s.completed} / {s.total} Classes</p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-2xl text-foreground">{s.percentage}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3 overflow-hidden border-2 border-border p-0.5">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${s.percentage}%` }}
                            transition={{ duration: 1, delay: i * 0.1 + 0.5 }}
                            className="bg-primary h-full rounded-full" 
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10">
                      <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground font-bold">No data available yet. Start teaching to see your stats!</p>
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

function StatCard({ title, value, index, gradient }: { title: string, value: any, index: number, gradient: string }) {
  return (
    <AnimatedCard delay={index * 0.1} className={`border-none text-white p-6 relative overflow-hidden bg-gradient-to-br ${gradient}`}>
      <Sparkles className="absolute -right-2 -top-2 w-16 h-16 opacity-20" />
      <p className="text-white/80 text-xs font-bold tracking-widest uppercase mb-1">{title}</p>
      <p className="text-4xl md:text-5xl font-black">{value}</p>
    </AnimatedCard>
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

function CreateClassForm({ students, teacherId, onCreated }: { students: any[], teacherId: string | null, onCreated: (studentId: string) => void }) {
  const [formData, setFormData] = useState({ studentId: '', meetLink: '', date: '', time: '', repeatWeekly: false })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (students.length > 0) setFormData(prev => ({ ...prev, studentId: students[0].id }))
  }, [students])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teacherId || !formData.studentId || !formData.date || !formData.time) return
    
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-foreground font-bold">Class Date</Label>
            <Input 
              type="date"
              min={format(startOfToday(), "yyyy-MM-dd")}
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
              className="h-14 rounded-xl border-2 font-medium"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground font-bold">Class Time</Label>
            <Input 
              type="time"
              value={formData.time}
              onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
              required
              className="h-14 rounded-xl border-2 font-medium"
            />
            <div className="bg-primary/10 border-2 border-primary/20 rounded-xl p-3 mt-3">
              <p className="text-sm text-primary font-bold flex items-center gap-2">
                <Globe className="h-4 w-4" /> Schedule in UK Time!
              </p>
              <p className="text-xs text-primary/80 mt-1 font-medium">
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
