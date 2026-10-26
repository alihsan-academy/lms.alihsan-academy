"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogoutButton } from '@/components/logout-button'
import { AcademyHeader } from '@/components/academy-header'
import { Home, BarChart3, User, Loader2, Calendar, Clock, Video, Award, Zap, Star, Trophy, Download, AlertCircle, FileText, CheckCircle2, XCircle } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Avatar } from '@/components/avatar'
import { motion, AnimatePresence } from 'framer-motion'
import { Skeleton } from '@/components/skeleton'
import { AnimatedCard } from '@/components/animated-card'
import { BouncyButton } from '@/components/bouncy-button'
import { PageTransition } from '@/components/page-transition'
import { DateRangeFilter } from '@/components/date-range-filter'
import { DateFilterType, getDateRange, calculateStudentAttendanceSummary, formatUKDateTime } from '@/lib/attendance-utils'
import { generateStudentAttendancePDF } from '@/lib/pdf-generator'
import { toast } from 'sonner'

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
  const [allClasses, setAllClasses] = useState<any[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])
  const [studentProfile, setStudentProfile] = useState<any>(null)
  const [profileData, setProfileData] = useState<any>(null)
  const [teachers, setTeachers] = useState<any[]>([])

  const fetchClasses = async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const response = await fetch('/api/student/dashboard-data')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch dashboard data')
      }

      const sp = data.studentProfile
      const profile = data.profile
      const rawClasses = data.classes || []
      const attendance = data.attendance || []
      const teacherProfiles = data.teachers || []

      const classesData = rawClasses.map((c: any) => {
        let title = 'Moral Class Alihsan Academy'
        let recordingUrl = c.recording_url
        if (c.title) title = c.title
        if (c.recording_url && typeof c.recording_url === 'string' && c.recording_url.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(c.recording_url)
            if (parsed.title) title = parsed.title
            recordingUrl = parsed.recording_url || null
          } catch (e) {}
        }
        return {
          ...c,
          title,
          recording_url: recordingUrl,
        }
      })

      setStudentProfile(sp)
      setAllClasses(classesData)
      setAttendanceRecords(attendance)
      setTeachers(teacherProfiles)

      const resolvedName = sp?.name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Student'
      const resolvedReg = sp?.registration_number || ''
      setStudentName(resolvedName)
      setRegistrationNumber(resolvedReg)

      setProfileData({
        email: user.email,
        name: resolvedName,
        photo_url: sp?.profile_photo || sp?.photo_url || null,
        class_name: sp?.class_name || 'Unassigned',
        date_joined: profile?.created_at || user.created_at
      })

      const now = new Date()
      const todayUK = now.toLocaleDateString('en-GB', { timeZone: 'Europe/London' })

      const todayClasses = classesData.filter((c: any) => {
        const classDateUK = new Date(c.scheduled_at).toLocaleDateString('en-GB', { timeZone: 'Europe/London' })
        return classDateUK === todayUK 
      })
      todayClasses.sort((a: any, b: any) => (a.status === 'scheduled' ? -1 : 1))

      const upcoming = classesData.filter((c: any) => {
        const classTime = new Date(c.scheduled_at)
        return classTime > now 
          && c.status === 'scheduled'
          && !todayClasses.find((tc: any) => tc.id === c.id)
      })

      setTodayClass(todayClasses[0] || null)
      setUpcomingClasses(upcoming)

    } catch (err) {
      console.error("Error fetching data:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchClasses()
    const handleVisibilityChange = () => {
      if (!document.hidden) fetchClasses()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  useEffect(() => {
    if (activeTab === 'home') fetchClasses()
  }, [activeTab])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-white border-b border-border p-4 flex justify-between items-center shadow-sm">
          <Skeleton className="h-8 w-40 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </header>
        <div className="p-8 max-w-4xl mx-auto w-full space-y-6">
          <div className="flex gap-4 mb-8">
            <Skeleton className="h-24 w-1/3 rounded-3xl" />
            <Skeleton className="h-24 w-1/3 rounded-3xl" />
            <Skeleton className="h-24 w-1/3 rounded-3xl" />
          </div>
          <Skeleton className="h-10 w-48 rounded-full" />
          <Skeleton className="h-48 w-full rounded-3xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24 md:pb-0 font-sans selection:bg-primary/20">
      <header className="bg-white border-b-2 border-border p-3 md:p-4 flex justify-between items-center sticky top-0 z-50 shadow-sm backdrop-blur-md bg-white/90">
        <div className="flex items-center gap-3">
          <AcademyHeader size="sm" showTagline={false} />
          {studentName && (
            <div className="hidden sm:flex flex-col border-l-2 border-border pl-4 ml-2">
              <h2 className="font-extrabold text-foreground leading-tight text-lg">{studentName}</h2>
              {registrationNumber && (
                <span className="text-xs font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-full w-max">#{registrationNumber}</span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <LogoutButton />
        </div>
      </header>

      {/* Desktop Navigation */}
      <div className="hidden md:block bg-white border-b border-border px-8">
        <nav className="flex space-x-1.5 max-w-5xl mx-auto py-2">
          <button 
            onClick={() => setActiveTab('home')} 
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 border ${
              activeTab === 'home' 
                ? 'bg-[#0D4A47] text-white border-[#0D4A47] shadow-sm' 
                : 'text-muted-foreground hover:text-foreground border-transparent hover:bg-muted'
            }`}
          >
            <Home className="h-4 w-4" /> Home
          </button>
          <button 
            onClick={() => setActiveTab('attendance')} 
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 border ${
              activeTab === 'attendance' 
                ? 'bg-[#0D4A47] text-white border-[#0D4A47] shadow-sm' 
                : 'text-muted-foreground hover:text-foreground border-transparent hover:bg-muted'
            }`}
          >
            <BarChart3 className="h-4 w-4" /> Attendance
          </button>
          <button 
            onClick={() => setActiveTab('profile')} 
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 border ${
              activeTab === 'profile' 
                ? 'bg-[#0D4A47] text-white border-[#0D4A47] shadow-sm' 
                : 'text-muted-foreground hover:text-foreground border-transparent hover:bg-muted'
            }`}
          >
            <User className="h-4 w-4" /> Profile
          </button>
        </nav>
      </div>

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <PageTransition key="home">
              <HomeTab studentName={studentName} todayClass={todayClass} upcomingClasses={upcomingClasses} teachers={teachers} onRefresh={fetchClasses} />
            </PageTransition>
          )}
          {activeTab === 'attendance' && (
            <PageTransition key="attendance">
              <AttendanceTab 
                studentProfile={studentProfile}
                classes={allClasses}
                attendance={attendanceRecords}
                teachers={teachers}
                studentName={studentName}
                registrationNumber={registrationNumber}
              />
            </PageTransition>
          )}
          {activeTab === 'profile' && (
            <PageTransition key="profile">
              <StudentProfilePage />
            </PageTransition>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border flex justify-around p-1 sm:p-2 z-50 md:hidden pb-safe shadow-md">
        <button 
          onClick={() => setActiveTab('home')} 
          className={`flex flex-col items-center justify-center min-h-[48px] py-1 px-2 w-full transition-colors ${activeTab === 'home' ? 'text-primary font-bold' : 'text-muted-foreground'}`}
        >
          <div className={`p-1 rounded-md mb-0.5 ${activeTab === 'home' ? 'bg-primary/10' : ''}`}>
            <Home className="h-5 w-5" />
          </div>
          <span className="text-[10px]">Home</span>
        </button>
        <button 
          onClick={() => setActiveTab('attendance')} 
          className={`flex flex-col items-center justify-center min-h-[48px] py-1 px-2 w-full transition-colors ${activeTab === 'attendance' ? 'text-primary font-bold' : 'text-muted-foreground'}`}
        >
          <div className={`p-1 rounded-md mb-0.5 ${activeTab === 'attendance' ? 'bg-primary/10' : ''}`}>
            <BarChart3 className="h-5 w-5" />
          </div>
          <span className="text-[10px]">Attendance</span>
        </button>
        <button 
          onClick={() => setActiveTab('profile')} 
          className={`flex flex-col items-center justify-center min-h-[48px] py-1 px-2 w-full transition-colors ${activeTab === 'profile' ? 'text-primary font-bold' : 'text-muted-foreground'}`}
        >
          <div className={`p-1 rounded-md mb-0.5 ${activeTab === 'profile' ? 'bg-primary/10' : ''}`}>
            <User className="h-5 w-5" />
          </div>
          <span className="text-[10px]">Profile</span>
        </button>
      </nav>
    </div>
  )
}

function HomeTab({ studentName, todayClass, upcomingClasses, teachers, onRefresh }: { studentName: string, todayClass: any, upcomingClasses: any[], teachers: any[], onRefresh: () => void }) {
  const formatUKTime = (scheduledAt: string) => {
    return new Date(scheduledAt).toLocaleString('en-GB', {
      timeZone: 'Europe/London',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const quotes = [
    { text: "Seek knowledge from the cradle to the grave.", source: "Islamic Proverb" },
    { text: "Allah does not burden a soul beyond that it can bear.", source: "Quran 2:286" },
    { text: "The ink of the scholar is more holy than the blood of the martyr.", source: "Prophet Muhammad (PBUH)" },
    { text: "Indeed, with hardship [will be] ease.", source: "Quran 94:6" },
    { text: "Whoever travels a path in search of knowledge, Allah will make easy for him a path to Paradise.", source: "Sahih Muslim" },
    { text: "The best among you are those who learn the Quran and teach it.", source: "Sahih al-Bukhari" },
    { text: "Read! In the name of your Lord who created.", source: "Quran 96:1" },
    { text: "And He found you lost and guided you.", source: "Quran 93:7" },
    { text: "So remember Me; I will remember you.", source: "Quran 2:152" },
    { text: "When you treat people well, those same people might not treat you well. But Allah will.", source: "Islamic Proverb" },
    { text: "A kind word with forgiveness is better than charity followed by injury.", source: "Quran 2:263" },
    { text: "Do not lose hope, nor be sad.", source: "Quran 3:139" },
    { text: "Patience is a pillar of faith.", source: "Umar ibn Al-Khattab" },
    { text: "Verily, in the remembrance of Allah do hearts find rest.", source: "Quran 13:28" },
    { text: "If Allah wants to do good to somebody, He afflicts him with trials.", source: "Sahih al-Bukhari" },
    { text: "Speak a good word or remain silent.", source: "Prophet Muhammad (PBUH)" },
    { text: "He who has no patience has no faith.", source: "Ali ibn Abi Talib" },
    { text: "Allah is with the doers of good.", source: "Quran 29:69" },
    { text: "A true believer is one who does not defame or curse.", source: "Al-Tirmidhi" },
    { text: "Call upon Me; I will respond to you.", source: "Quran 40:60" },
    { text: "The strong man is not the good wrestler; the strong man is only the one who controls himself when he is angry.", source: "Sahih al-Bukhari" },
    { text: "My mercy encompasses all things.", source: "Quran 7:156" },
    { text: "Be mindful of Allah, and you will find Him in front of you.", source: "Al-Tirmidhi" },
    { text: "O you who have believed, seek help through patience and prayer.", source: "Quran 2:153" },
    { text: "Trust in Allah, but tie your camel.", source: "Prophet Muhammad (PBUH)" },
    { text: "The richest of the rich is the one who is not a prisoner to greed.", source: "Ali ibn Abi Talib" },
    { text: "And whoever turns away from My remembrance - indeed, he will have a depressed life.", source: "Quran 20:124" },
    { text: "The greatest jihad is to battle your own soul, to fight the evil within yourself.", source: "Prophet Muhammad (PBUH)" },
    { text: "Allah is with those who have patience.", source: "Quran 2:153" },
    { text: "Good manners are the beautiful fragrance of the soul.", source: "Islamic Proverb" }
  ];
  
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const quoteIndex = dayOfYear % quotes.length;
  const todayQuote = quotes[quoteIndex];

  return (
    <div className="space-y-8">
      {/* Daily Quote */}
      <AnimatedCard className="bg-gradient-to-br from-primary to-blue-600 border-none text-white p-6 md:p-8 flex flex-col items-center justify-center text-center mb-8 relative overflow-hidden">
        <Star className="h-24 w-24 fill-white/10 absolute -right-4 -top-4 opacity-50 rotate-45" />
        <Star className="h-16 w-16 fill-white/10 absolute -left-4 -bottom-4 opacity-50 -rotate-12" />
        <h4 className="text-xl md:text-2xl font-black italic mb-3 relative z-10">"{todayQuote.text}"</h4>
        <p className="text-sm md:text-base font-bold text-white/80 uppercase tracking-widest relative z-10">— {todayQuote.source}</p>
      </AnimatedCard>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-black text-foreground flex items-center gap-3">
            <span className="bg-primary/20 p-2 rounded-xl text-primary"><Calendar className="h-6 w-6" /></span>
            Today's Class
          </h3>
          <button onClick={onRefresh} className="text-sm font-bold text-primary hover:text-primary/80 transition-colors bg-primary/10 px-3 py-1.5 rounded-full">
            ↻ Refresh
          </button>
        </div>

        {todayClass ? (
          <AnimatedCard delay={0.3} className="p-5 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5 md:gap-6 bg-gradient-to-r from-card to-blue-50/50 border-primary/20">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
              {(() => {
                const teacher = teachers.find(t => t.user_id === todayClass.teacher_id);
                return (
                  <>
                    <Avatar photoUrl={teacher?.profile_photo} name={teacher?.name} size="lg" />
                    <div className="space-y-1">
                      <span className="inline-block px-3 py-1 bg-destructive text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-sm animate-pulse mb-1">Live Today</span>
                      <h4 className="font-black text-xl sm:text-2xl md:text-3xl text-foreground">{todayClass.title || 'Moral Class Alihsan Academy'}</h4>
                      <p className="text-sm font-bold text-primary">Teacher {teacher?.name || 'Assigned'}</p>
                      <div className="text-muted-foreground font-semibold mt-1.5 flex items-center gap-2 text-xs sm:text-sm">
                        <Clock className="h-4 w-4 shrink-0" />
                        <span>{formatUKTime(todayClass.scheduled_at)} (UK Time)</span>
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>
            {todayClass.status === 'completed' && todayClass.recording_url ? (
              <a 
                href={todayClass.recording_url} 
                target="_blank" 
                rel="noreferrer"
                className="w-full sm:w-auto bg-[#1E293B] hover:bg-[#0F172A] text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 text-center whitespace-nowrap min-h-[44px]"
              >
                <Video className="h-4 w-4" />
                Watch Recording
              </a>
            ) : todayClass.status === 'completed' ? (
              <div className="w-full sm:w-auto bg-muted text-muted-foreground px-4 py-2.5 rounded-lg font-medium text-xs text-center border border-border">
                Class completed.
              </div>
            ) : todayClass.meet_link ? (
              <a 
                href={todayClass.meet_link} 
                target="_blank" 
                rel="noreferrer"
                className="w-full sm:w-auto bg-[#0D4A47] hover:bg-[#083836] text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 text-center whitespace-nowrap shadow-sm min-h-[44px]"
              >
                <Video className="h-4 w-4" />
                Join Class
              </a>
            ) : (
              <div className="w-full sm:w-auto bg-muted text-muted-foreground px-4 py-2.5 rounded-lg font-medium text-xs text-center border border-border">
                Link arriving soon...
              </div>
            )}
          </AnimatedCard>
        ) : (
          <AnimatedCard delay={0.3} className="p-10 text-center flex flex-col items-center justify-center border-dashed border-border bg-transparent shadow-none">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <Star className="h-12 w-12 text-green-500 fill-green-500" />
            </div>
            <h4 className="text-2xl font-black text-foreground mb-2">Awesome job, {studentName.split(' ')[0]}!</h4>
            <p className="text-muted-foreground font-medium text-lg">No classes for today. Time to play! 🎉</p>
          </AnimatedCard>
        )}
      </section>

      <section>
        <h3 className="text-2xl font-black text-foreground mb-4 flex items-center gap-3">
          <span className="bg-secondary/20 p-2 rounded-xl text-secondary"><Clock className="h-6 w-6" /></span>
          Upcoming Classes
        </h3>
        {upcomingClasses.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingClasses.map((c, i) => {
              const teacher = teachers.find(t => t.user_id === c.teacher_id);
              return (
                <AnimatedCard key={i} delay={0.4 + (i * 0.1)} className="p-5 flex items-center justify-between hover:border-primary/50">
                  <div className="flex items-center gap-4">
                    <Avatar photoUrl={teacher?.profile_photo} name={teacher?.name} size="md" />
                    <div>
                      <h4 className="font-bold text-foreground text-lg leading-tight">{c.title || 'Moral Class Alihsan Academy'}</h4>
                      <p className="text-xs font-bold text-primary mb-1">{teacher?.name || 'Teacher'}</p>
                      <p className="font-semibold text-muted-foreground text-xs">
                        📅 {formatUKTime(c.scheduled_at)}
                      </p>
                    </div>
                  </div>
                  {c.meet_link && (
                    <div className="flex flex-col items-end gap-1">
                      <a 
                        href={c.meet_link}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <Video className="h-3.5 w-3.5" />
                        Join Class
                      </a>
                    </div>
                  )}
                </AnimatedCard>
              )
            })}
          </div>
        ) : (
          <AnimatedCard delay={0.4} className="p-8 text-center text-muted-foreground font-medium border-dashed bg-transparent shadow-none">
            No upcoming classes scheduled right now.
          </AnimatedCard>
        )}
      </section>
    </div>
  )
}

function AttendanceTab({
  studentProfile,
  classes,
  attendance,
  teachers,
  studentName,
  registrationNumber,
}: {
  studentProfile: any
  classes: any[]
  attendance: any[]
  teachers: any[]
  studentName: string
  registrationNumber: string
}) {
  const [filterType, setFilterType] = useState<DateFilterType>('all_time')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  const dateRange = getDateRange(filterType, customStart, customEnd)
  const summary = calculateStudentAttendanceSummary(classes, attendance, studentProfile, dateRange)

  // Assigned teacher name
  const assignedTeacher = teachers.find(t => t.user_id === studentProfile?.teacher_id)

  const handleDownloadPDF = () => {
    try {
      setIsExporting(true)
      generateStudentAttendancePDF({
        student: {
          name: studentName,
          registration_number: registrationNumber,
          class_name: studentProfile?.class_name,
          enrolment_status: studentProfile?.enrolment_status || 'ongoing',
          teacher_name: assignedTeacher?.name || 'Assigned Educator',
        },
        periodLabel: dateRange.label,
        summary: summary,
      })
      toast.success('Attendance transcript downloaded! 📄')
    } catch (e: any) {
      console.error('PDF export error:', e)
      toast.error('Failed to generate PDF: ' + e.message)
    } finally {
      setIsExporting(false)
    }
  }

  let barColor = "bg-destructive"
  if (summary.attendanceRate > 50 && summary.attendanceRate <= 75) barColor = "bg-secondary"
  if (summary.attendanceRate > 75) barColor = "bg-green-500"

  return (
    <div className="space-y-6">
      {/* Header and Download Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-3xl font-black text-foreground">Attendance & Progress 📊</h3>
          <p className="text-muted-foreground font-medium text-sm mt-1">
            Real-time track record of your classes, attendances, and scheduled sessions.
          </p>
        </div>

        <BouncyButton
          onClick={handleDownloadPDF}
          disabled={isExporting}
          variant="default"
          className="bg-primary hover:bg-primary/90 text-white font-black flex items-center gap-2 self-start md:self-auto shadow-md"
        >
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Download PDF Report
        </BouncyButton>
      </div>

      {/* Date Range Filter Bar */}
      <DateRangeFilter
        currentFilter={filterType}
        customStart={customStart}
        customEnd={customEnd}
        onFilterChange={(f, start, end) => {
          setFilterType(f)
          if (start) setCustomStart(start)
          if (end) setCustomEnd(end)
        }}
        resolvedRange={dateRange}
      />

      {/* Break Alert if student is on break */}
      {summary.isOnBreak && summary.breakDetails && (
        <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-2xl flex items-start gap-3 text-amber-900">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Approved Break Notice</h4>
            <p className="text-xs text-amber-800 mt-0.5">
              You are on an approved leave from <strong>{summary.breakDetails.from}</strong> to <strong>{summary.breakDetails.to}</strong>.
              Reason: <em>{summary.breakDetails.reason}</em>
            </p>
          </div>
        </div>
      )}

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        <AnimatedCard delay={0.1} className="bg-primary border-none text-white p-3.5 sm:p-5 text-center flex flex-col items-center justify-center">
          <p className="text-primary-foreground/80 text-[11px] sm:text-xs font-bold tracking-widest uppercase mb-1">Scheduled</p>
          <p className="text-2xl sm:text-3xl md:text-5xl font-black">{summary.totalScheduled}</p>
          <span className="text-[9px] sm:text-[10px] text-white/70 mt-1">Total in period</span>
        </AnimatedCard>

        <AnimatedCard delay={0.2} className="bg-green-600 border-none text-white p-3.5 sm:p-5 text-center flex flex-col items-center justify-center">
          <p className="text-green-100 text-[11px] sm:text-xs font-bold tracking-widest uppercase mb-1">Attended</p>
          <p className="text-2xl sm:text-3xl md:text-5xl font-black">{summary.attendedCount}</p>
          <span className="text-[9px] sm:text-[10px] text-green-100/80 mt-1">Classes done</span>
        </AnimatedCard>

        <AnimatedCard delay={0.3} className="bg-destructive border-none text-white p-3.5 sm:p-5 text-center flex flex-col items-center justify-center">
          <p className="text-destructive-foreground/80 text-[11px] sm:text-xs font-bold tracking-widest uppercase mb-1">Not Attended</p>
          <p className="text-2xl sm:text-3xl md:text-5xl font-black">{summary.notAttendedCount}</p>
          <span className="text-[9px] sm:text-[10px] text-white/70 mt-1">Absent / Missed</span>
        </AnimatedCard>

        <AnimatedCard delay={0.4} className="bg-secondary border-none text-secondary-foreground p-3.5 sm:p-5 text-center flex flex-col items-center justify-center">
          <p className="text-secondary-foreground/70 text-[11px] sm:text-xs font-bold tracking-widest uppercase mb-1">Score</p>
          <p className="text-2xl sm:text-3xl md:text-5xl font-black">{summary.attendanceRate}%</p>
          <span className="text-[9px] sm:text-[10px] text-secondary-foreground/70 mt-1">Mastery level</span>
        </AnimatedCard>
      </div>

      {/* Secondary Metrics Breakdown Banner */}
      <div className="bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-border shadow-sm grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 text-center">
        <div className="p-2 sm:p-3 bg-red-50 rounded-lg sm:rounded-xl border border-red-100">
          <span className="text-[10px] sm:text-[11px] font-bold text-red-700 block uppercase">Teacher Missed</span>
          <span className="text-lg sm:text-xl font-black text-red-900">{summary.teacherUnavailableCount}</span>
        </div>
        <div className="p-2 sm:p-3 bg-orange-50 rounded-lg sm:rounded-xl border border-orange-100">
          <span className="text-[10px] sm:text-[11px] font-bold text-orange-700 block uppercase">Student Absent</span>
          <span className="text-lg sm:text-xl font-black text-orange-900">{summary.studentUnavailableCount}</span>
        </div>
        <div className="p-2 sm:p-3 bg-amber-50 rounded-lg sm:rounded-xl border border-amber-100">
          <span className="text-[10px] sm:text-[11px] font-bold text-amber-700 block uppercase">On Break</span>
          <span className="text-lg sm:text-xl font-black text-amber-900">{summary.breakCount}</span>
        </div>
        <div className="p-2 sm:p-3 bg-blue-50 rounded-lg sm:rounded-xl border border-blue-100">
          <span className="text-[10px] sm:text-[11px] font-bold text-blue-700 block uppercase">Scheduled</span>
          <span className="text-lg sm:text-xl font-black text-blue-900">{summary.scheduledUpcomingCount}</span>
        </div>
      </div>

      {/* Mastery Meter */}
      <AnimatedCard delay={0.45} className="p-6">
        <div className="flex justify-between items-end mb-3">
          <span className="font-bold text-foreground text-base">Attendance Meter</span>
          <span className="font-black text-2xl text-foreground">{summary.attendanceRate}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-5 overflow-hidden border-2 border-border p-0.5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(summary.attendanceRate, 100)}%` }}
            transition={{ duration: 1.2, type: "spring", bounce: 0.3 }}
            className={`${barColor} h-full rounded-full`}
          />
        </div>
        <p className="text-xs font-bold text-muted-foreground mt-3 text-center">Aim for 75% or higher to unlock the next level! 🏆</p>
      </AnimatedCard>

      {/* Class History for Selected Period */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-black text-foreground text-xl">
            Class Sessions <span className="text-primary text-base font-bold">({summary.filteredClasses.length})</span>
          </h4>
          <span className="text-xs font-semibold text-muted-foreground">{dateRange.label}</span>
        </div>

        <AnimatedCard delay={0.5} className="overflow-hidden p-0 border-2 border-border">
          {summary.filteredClasses.length > 0 ? (
            <div className="divide-y-2 divide-border">
              {summary.filteredClasses.map((item, i) => {
                const teacher = teachers.find(t => t.user_id === item.teacher_id);
                return (
                  <div key={item.id || i} className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
                    <div className="flex items-start md:items-center gap-4">
                      <Avatar photoUrl={teacher?.profile_photo} name={teacher?.name} size="md" />
                      <div>
                        <p className="font-black text-foreground text-base md:text-lg">{item.title || 'Moral Class Alihsan Academy'}</p>
                        <p className="text-xs font-bold text-primary">Teacher {teacher?.name || 'Educator'}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold mt-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{formatUKDateTime(item.scheduled_at)} (UK Time)</span>
                        </div>
                        {item.remarks && (
                          <p className="text-xs font-medium bg-muted/60 text-foreground px-2.5 py-1 rounded-lg mt-2 inline-block border border-border/50">
                            <strong>Note:</strong> {item.remarks}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center mt-2 sm:mt-0">
                      {item.recording_url && (
                        <a 
                          href={item.recording_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 border-2 border-purple-200 px-3 py-1.5 rounded-xl hover:bg-purple-100 transition-colors"
                        >
                          <Video className="h-3.5 w-3.5" /> Watch Recording
                        </a>
                      )}

                      {/* Status Badges */}
                      {item.badgeVariant === 'present' && (
                        <span className="px-3.5 py-1.5 bg-green-100 text-green-800 rounded-xl text-xs font-black border-2 border-green-200 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> Attended
                        </span>
                      )}
                      {item.badgeVariant === 'teacher_unavailable' && (
                        <span className="px-3.5 py-1.5 bg-red-100 text-red-800 rounded-xl text-xs font-black border-2 border-red-200 flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5 text-red-600" /> Teacher Unavailable
                        </span>
                      )}
                      {item.badgeVariant === 'student_unavailable' && (
                        <span className="px-3.5 py-1.5 bg-orange-100 text-orange-800 rounded-xl text-xs font-black border-2 border-orange-200 flex items-center gap-1">
                          <XCircle className="h-3.5 w-3.5 text-orange-600" /> Student Unavailable
                        </span>
                      )}
                      {item.badgeVariant === 'break' && (
                        <span className="px-3.5 py-1.5 bg-amber-100 text-amber-800 rounded-xl text-xs font-black border-2 border-amber-200">
                          ⏸️ On Break
                        </span>
                      )}
                      {item.badgeVariant === 'absent' && (
                        <span className="px-3.5 py-1.5 bg-destructive/10 text-destructive rounded-xl text-xs font-black border-2 border-destructive/20 flex items-center gap-1">
                          <XCircle className="h-3.5 w-3.5 text-destructive" /> Not Attended
                        </span>
                      )}
                      {item.badgeVariant === 'scheduled' && (
                        <span className="px-3.5 py-1.5 bg-blue-100 text-blue-800 rounded-xl text-xs font-black border-2 border-blue-200">
                          Upcoming
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-12 text-center flex flex-col items-center">
              <Award className="h-14 w-14 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground font-bold text-base">No classes found in this period.</p>
              <p className="text-xs text-muted-foreground mt-1">Try changing the date filter above.</p>
            </div>
          )}
        </AnimatedCard>
      </div>
    </div>
  )
}
