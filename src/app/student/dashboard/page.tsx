"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogoutButton } from '@/components/logout-button'
import { AcademyHeader } from '@/components/academy-header'
import { Home, BarChart3, User, Loader2, Calendar, Clock, Video } from 'lucide-react'
import { format, isToday, isFuture, parseISO } from 'date-fns'
import { Avatar } from '@/components/avatar'
import { motion, AnimatePresence } from 'framer-motion'
import { Skeleton } from '@/components/skeleton'

import StudentProfilePage from '@/app/student/profile/page'

export default function StudentDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'home' | 'attendance' | 'profile'>('home')
  const [isLoading, setIsLoading] = useState(true)
  const [studentName, setStudentName] = useState<string>('')
  const [registrationNumber, setRegistrationNumber] = useState<string>('')
  const supabase = createClient()

  // State data
  const [todayClass, setTodayClass] = useState<any>(null)
  const [upcomingClasses, setUpcomingClasses] = useState<any[]>([])
  const [attendanceData, setAttendanceData] = useState<{
    totalClasses: number
    presentCount: number
    absentCount: number
    percentage: number
    history: any[]
  }>({ totalClasses: 0, presentCount: 0, absentCount: 0, percentage: 0, history: [] })
  const [profileData, setProfileData] = useState<any>(null)
  const [teachers, setTeachers] = useState<any[]>([])
  
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }

        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        const { data: studentProfile } = await supabase
          .from('student_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        // Fix #2 & #3: Set student name + registration number for header
        const resolvedName = studentProfile?.name || user.email?.split('@')[0] || 'Student'
        const resolvedReg = studentProfile?.registration_number || ''
        setStudentName(resolvedName)
        setRegistrationNumber(resolvedReg)

        setProfileData({
          email: user.email,
          name: resolvedName,
          photo_url: studentProfile?.photo_url,
          class_name: studentProfile?.class_name || 'Unassigned',
          date_joined: profile?.created_at || user.created_at
        })

        // Fetch classes via direct Supabase call
        const { data: classesData, error: classesError } = await supabase
          .from('classes')
          .select('*')
          .eq('student_id', user.id)
          .order('scheduled_at', { ascending: true })

        console.log('Student ID:', user.id)
        console.log('Classes:', classesData)
        console.log('Error:', classesError)

        const allClasses = classesData || []

        const today = allClasses.filter((c: any) => {
          const classDate = new Date(c.scheduled_at).toDateString()
          const todayDate = new Date().toDateString()
          return classDate === todayDate
        })
        
        const upcoming = allClasses.filter((c: any) => {
          const classDate = new Date(c.scheduled_at)
          const todayDate = new Date()
          todayDate.setHours(23, 59, 59, 999)
          return classDate > todayDate && c.status === 'scheduled'
        })
        
        // Fetch teachers
        const teacherIds = Array.from(new Set(allClasses.map((c: any) => c.teacher_id))).filter(Boolean)
        const { data: teacherProfiles } = await supabase
          .from('teacher_profiles')
          .select('user_id, name, profile_photo')
          .in('user_id', teacherIds)
        
        setTeachers(teacherProfiles || [])

        setTodayClass(today[0] || null)
        setUpcomingClasses(upcoming)

        // Fetch attendance
        const { data: attendance } = await supabase
          .from('attendance')
          .select('*')
          .eq('student_id', user.id)
          
        const completedClasses = allClasses.filter(c => c.status === 'completed')
        const totalClasses = completedClasses.length
        const presentCount = attendance?.filter(a => a.status === 'present' || !a.status).length || 0 // Default to present if status missing
        const absentCount = attendance?.filter(a => a.status === 'absent').length || 0
        const percentage = totalClasses === 0 ? 0 : Math.round((presentCount / totalClasses) * 100)

        const history = completedClasses.map(c => {
          const att = attendance?.find(a => a.class_id === c.id)
          const status = att && att.status === 'absent' ? 'Absent' : 'Present'
          return {
            date: c.scheduled_at,
            status: status,
            className: c.title || 'Class',
            teacher_id: c.teacher_id
          }
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        setAttendanceData({ totalClasses, presentCount, absentCount, percentage, history })

      } catch (err) {
        console.error("Error fetching data:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex flex-col">
        <header className="bg-white border-b border-green-100 p-4 flex justify-between items-center shadow-sm">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-20" />
        </header>
        <div className="p-8 max-w-4xl mx-auto w-full space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-4">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gradient-to-br from-green-50 to-white flex flex-col pb-20 md:pb-0"
    >
      <header className="bg-white border-b border-green-100 p-4 flex justify-between items-center shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <AcademyHeader size="sm" showTagline={false} />
          {studentName && (
            <div className="hidden sm:flex flex-col border-l border-gray-200 pl-3 ml-1">
              <h2 className="font-bold text-green-800 leading-tight">{studentName}</h2>
              {registrationNumber && (
                <span className="text-xs font-bold text-green-600">#{registrationNumber}</span>
              )}
            </div>
          )}
        </div>
        <LogoutButton />
      </header>

      {/* Desktop Navigation */}
      <div className="hidden md:block bg-white border-b border-green-100 px-8">
        <nav className="flex space-x-8 max-w-4xl mx-auto">
          <button 
            onClick={() => setActiveTab('home')}
            className={`py-4 px-2 border-b-2 font-medium transition-colors flex items-center gap-2 ${activeTab === 'home' ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            <Home className="h-5 w-5" />
            Home
          </button>
          <button 
            onClick={() => setActiveTab('attendance')}
            className={`py-4 px-2 border-b-2 font-medium transition-colors flex items-center gap-2 ${activeTab === 'attendance' ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            <BarChart3 className="h-5 w-5" />
            Attendance
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`py-4 px-2 border-b-2 font-medium transition-colors flex items-center gap-2 ${activeTab === 'profile' ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            <User className="h-5 w-5" />
            Profile
          </button>
        </nav>
      </div>

      <main className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'home' && <HomeTab todayClass={todayClass} upcomingClasses={upcomingClasses} teachers={teachers} />}
            {activeTab === 'attendance' && <AttendanceTab data={attendanceData} teachers={teachers} />}
            {activeTab === 'profile' && <StudentProfilePage />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-2 z-50 md:hidden pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <motion.button 
          whileTap={{ scale: 0.8, y: -3 }}
          whileHover={{ y: -2 }}
          onClick={() => setActiveTab('home')} 
          className={`flex flex-col items-center p-2 w-full transition-colors ${activeTab === 'home' ? 'text-green-700' : 'text-gray-500 hover:text-gray-900'}`}
        >
          <div className={`p-1 rounded-full mb-1 ${activeTab === 'home' ? 'bg-green-100' : ''}`}>
            <Home className="h-6 w-6" />
          </div>
          <span className="text-xs font-medium">Home</span>
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.8, y: -3 }}
          whileHover={{ y: -2 }}
          onClick={() => setActiveTab('attendance')} 
          className={`flex flex-col items-center p-2 w-full transition-colors ${activeTab === 'attendance' ? 'text-green-700' : 'text-gray-500 hover:text-gray-900'}`}
        >
          <div className={`p-1 rounded-full mb-1 ${activeTab === 'attendance' ? 'bg-green-100' : ''}`}>
            <BarChart3 className="h-6 w-6" />
          </div>
          <span className="text-xs font-medium">Attendance</span>
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.8, y: -3 }}
          whileHover={{ y: -2 }}
          onClick={() => setActiveTab('profile')} 
          className={`flex flex-col items-center p-2 w-full transition-colors ${activeTab === 'profile' ? 'text-green-700' : 'text-gray-500 hover:text-gray-900'}`}
        >
          <div className={`p-1 rounded-full mb-1 ${activeTab === 'profile' ? 'bg-green-100' : ''}`}>
            <User className="h-6 w-6" />
          </div>
          <span className="text-xs font-medium">Profile</span>
        </motion.button>
      </nav>
    </motion.div>
  )
}

function HomeTab({ todayClass, upcomingClasses, teachers }: { todayClass: any, upcomingClasses: any[], teachers: any[] }) {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <section>
        <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
          <Calendar className="h-6 w-6 text-green-600" />
          Today's Class
        </h3>
        {todayClass ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -4, boxShadow: "0 12px 30px rgba(0,0,0,0.08)" }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-green-100 flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div className="flex items-center gap-4">
              {(() => {
                const teacher = teachers.find(t => t.user_id === todayClass.teacher_id);
                return (
                  <>
                    <Avatar photoUrl={teacher?.profile_photo} name={teacher?.name} size="lg" />
                    <div className="space-y-1">
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full uppercase tracking-wider mb-1">Live Today</span>
                      <h4 className="font-bold text-2xl text-gray-900">{todayClass.title || 'Live Session'}</h4>
                      <p className="text-sm font-bold text-green-700 mb-1">Teacher: {teacher?.name || 'Assigned Teacher'}</p>
                      <p className="text-gray-600 flex items-center gap-2 font-medium">
                        <Clock className="h-5 w-5 text-gray-400" />
                        {format(parseISO(todayClass.scheduled_at), "EEEE, d MMMM yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </>
                )
              })()}
            </div>
            {todayClass.meet_link ? (
              <motion.a 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                href={todayClass.meet_link} 
                target="_blank" 
                rel="noreferrer"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-bold transition-all hover:shadow-lg flex items-center justify-center gap-2 text-center whitespace-nowrap shadow-md"
              >
                <Video className="h-5 w-5" />
                Join Class
              </motion.a>
            ) : (
              <div className="bg-gray-100 text-gray-500 px-6 py-3 rounded-xl font-medium text-center">
                Link not available yet
              </div>
            )}
          </motion.div>
        ) : (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-green-100 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-green-300" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-1">You're all caught up!</h4>
            <p className="text-gray-500">No class scheduled for today.</p>
          </div>
        )}
      </section>

      <section>
        <h3 className="text-xl font-bold text-green-900 mb-4">Upcoming Classes</h3>
        {upcomingClasses.length > 0 ? (
          <div className="grid gap-3">
            {upcomingClasses.map((c, i) => {
              const teacher = teachers.find(t => t.user_id === c.teacher_id);
              return (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -4, boxShadow: "0 8px 25px rgba(0,0,0,0.06)" }}
                  className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between hover:border-green-200 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar photoUrl={teacher?.profile_photo} name={teacher?.name} size="md" />
                    <div>
                      <h4 className="font-bold text-gray-900">{c.title || 'Live Session'}</h4>
                      <p className="text-xs font-bold text-green-700">{teacher?.name || 'Teacher'}</p>
                      <p className="text-sm text-gray-500 font-medium">{format(parseISO(c.scheduled_at), "MMM d, yyyy • h:mm a")}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
            <p className="text-gray-500">No upcoming classes.</p>
          </div>
        )}
      </section>
    </div>
  )
}

function AttendanceTab({ data, teachers }: { data: any, teachers: any[] }) {
  let barColor = "bg-red-500"
  if (data.percentage > 50 && data.percentage <= 75) barColor = "bg-yellow-500"
  if (data.percentage > 75) barColor = "bg-green-500"

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <h3 className="text-2xl font-bold text-green-900 mb-6">Attendance Overview</h3>
      
      <div className="grid grid-cols-4 gap-3 md:gap-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0 * 0.15 }}
          whileHover={{ scale: 1.03 }}
          className="bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-2xl p-4 md:p-6 shadow-md text-center flex flex-col items-center justify-center"
        >
          <p className="text-blue-100 text-[10px] md:text-sm font-semibold uppercase tracking-wider mb-2">Total</p>
          <p className="text-2xl md:text-4xl font-extrabold">{data.totalClasses}</p>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 * 0.15 }}
          whileHover={{ scale: 1.03 }}
          className="bg-gradient-to-br from-green-400 to-green-600 text-white rounded-2xl p-4 md:p-6 shadow-md text-center flex flex-col items-center justify-center"
        >
          <p className="text-green-100 text-[10px] md:text-sm font-semibold uppercase tracking-wider mb-2">Present</p>
          <p className="text-2xl md:text-4xl font-extrabold">{data.presentCount}</p>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2 * 0.15 }}
          whileHover={{ scale: 1.03 }}
          className="bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-2xl p-4 md:p-6 shadow-md text-center flex flex-col items-center justify-center"
        >
          <p className="text-orange-100 text-[10px] md:text-sm font-semibold uppercase tracking-wider mb-2">Absent</p>
          <p className="text-2xl md:text-4xl font-extrabold">{data.absentCount}</p>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 3 * 0.15 }}
          whileHover={{ scale: 1.03 }}
          className="bg-gradient-to-br from-purple-400 to-purple-600 text-white rounded-2xl p-4 md:p-6 shadow-md text-center flex flex-col items-center justify-center"
        >
          <p className="text-purple-100 text-[10px] md:text-sm font-semibold uppercase tracking-wider mb-2">Percent</p>
          <p className="text-2xl md:text-4xl font-extrabold">{data.percentage}%</p>
        </motion.div>
      </div>

      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
        <div className="flex justify-between items-end mb-4">
          <span className="font-bold text-gray-700">Overall Attendance</span>
          <span className="font-extrabold text-2xl text-gray-900">{data.percentage}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: data.percentage + "%" }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className={`${barColor} h-4 rounded-full shadow-inner`}
          ></motion.div>
        </div>
        <p className="text-xs text-gray-400 mt-3 text-center">Aim for 75% or higher to stay on track!</p>
      </div>

      <div className="mt-8">
        <h4 className="font-bold text-gray-900 mb-4 text-lg">Attendance History</h4>
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          {data.history.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {data.history.map((h: any, i: number) => {
                const teacher = teachers.find(t => t.user_id === h.teacher_id);
                return (
                  <div key={i} className="p-4 md:p-5 flex justify-between items-center hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <Avatar photoUrl={teacher?.profile_photo} name={teacher?.name} size="md" />
                      <div>
                        <p className="font-bold text-gray-900">{h.className}</p>
                        <p className="text-xs font-bold text-green-700">{teacher?.name || 'Teacher'}</p>
                        <p className="text-sm text-gray-500 font-medium">{format(parseISO(h.date), "MMMM d, yyyy")}</p>
                      </div>
                    </div>
                    <div>
                      {h.status === 'Present' ? (
                        <span className="px-4 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-bold border border-green-200">Present</span>
                      ) : (
                        <span className="px-4 py-1.5 bg-red-50 text-red-700 rounded-full text-sm font-bold border border-red-200">Absent</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-10 text-center flex flex-col items-center">
              <BarChart3 className="h-10 w-10 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No past attendance records found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


