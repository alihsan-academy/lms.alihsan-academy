"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogoutButton } from '@/components/logout-button'
import { AcademyHeader } from '@/components/academy-header'
import { Home, BarChart3, User, Loader2, Calendar, Clock, Video, Award, Zap, Star, Trophy } from 'lucide-react'
import { format, isToday, isFuture, parseISO } from 'date-fns'
import { Avatar } from '@/components/avatar'
import { motion, AnimatePresence } from 'framer-motion'
import { Skeleton } from '@/components/skeleton'
import { AnimatedCard } from '@/components/animated-card'
import { BouncyButton } from '@/components/bouncy-button'
import { PageTransition } from '@/components/page-transition'

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

      const studentProfile = data.studentProfile
      const profile = data.profile
      const allClasses = data.classes || []
      const attendance = data.attendance || []
      const teacherProfiles = data.teachers || []

      const resolvedName = studentProfile?.name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Student'
      const resolvedReg = studentProfile?.registration_number || ''
      setStudentName(resolvedName)
      setRegistrationNumber(resolvedReg)

      setProfileData({
        email: user.email,
        name: resolvedName,
        photo_url: studentProfile?.profile_photo || studentProfile?.photo_url || null,
        class_name: studentProfile?.class_name || 'Unassigned',
        date_joined: profile?.created_at || user.created_at
      })

      const now = new Date()
      
      const todayUK = now.toLocaleDateString('en-GB', { 
        timeZone: 'Europe/London'
      })
      
      const todayClasses = allClasses.filter((c: any) => {
        const classDateUK = new Date(c.scheduled_at)
          .toLocaleDateString('en-GB', { 
            timeZone: 'Europe/London'
          })
        return classDateUK === todayUK 
          && c.status === 'scheduled'
      })
      
      const upcoming = allClasses.filter((c: any) => {
        const classTime = new Date(c.scheduled_at)
        return classTime > now 
          && c.status === 'scheduled'
          && !todayClasses.find((tc: any) => tc.id === c.id)
      })
      
      setTeachers(teacherProfiles)
      setTodayClass(todayClasses[0] || null)
      setUpcomingClasses(upcoming)

      const completedClasses = allClasses.filter((c: any) => c.status === 'completed')
      const totalClasses = completedClasses.length
      const presentCount = attendance?.filter((a: any) => a.status === 'present' || !a.status).length || 0 
      const absentCount = attendance?.filter((a: any) => a.status === 'absent').length || 0
      const percentage = totalClasses === 0 ? 0 : Math.round((presentCount / totalClasses) * 100)

      const history = completedClasses.map((c: any) => {
        const att = attendance?.find((a: any) => a.class_id === c.id)
        const status = att && att.status === 'absent' ? 'Absent' : 'Present'
        return {
          date: c.scheduled_at,
          status: status,
          className: c.title || 'Class',
          teacher_id: c.teacher_id
        }
      }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())

      setAttendanceData({ totalClasses, presentCount, absentCount, percentage, history })

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
      <div className="hidden md:block bg-white border-b-2 border-border px-8">
        <nav className="flex space-x-2 max-w-5xl mx-auto py-2">
          <BouncyButton 
            variant={activeTab === 'home' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('home')}
            className={`gap-2 ${activeTab === 'home' ? 'shadow-md' : ''}`}
          >
            <Home className="h-5 w-5" /> Home
          </BouncyButton>
          <BouncyButton 
            variant={activeTab === 'attendance' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('attendance')}
            className={`gap-2 ${activeTab === 'attendance' ? 'bg-primary text-primary-foreground shadow-md' : ''}`}
          >
            <BarChart3 className="h-5 w-5" /> Attendance
          </BouncyButton>
          <BouncyButton 
            variant={activeTab === 'profile' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('profile')}
            className={`gap-2 ${activeTab === 'profile' ? 'bg-primary text-primary-foreground shadow-md' : ''}`}
          >
            <User className="h-5 w-5" /> Profile
          </BouncyButton>
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
              <AttendanceTab data={attendanceData} teachers={teachers} />
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
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-border flex justify-around p-3 z-50 md:hidden pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.08)] rounded-t-3xl">
        <motion.button 
          whileTap={{ scale: 0.85 }}
          onClick={() => setActiveTab('home')} 
          className={`flex flex-col items-center p-2 w-full transition-all ${activeTab === 'home' ? 'text-primary scale-110' : 'text-muted-foreground'}`}
        >
          <div className={`p-2 rounded-2xl mb-1 ${activeTab === 'home' ? 'bg-primary/10' : ''}`}>
            <Home className={`h-6 w-6 ${activeTab === 'home' ? 'fill-primary/20' : ''}`} />
          </div>
          <span className="text-[11px] font-bold">Home</span>
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.85 }}
          onClick={() => setActiveTab('attendance')} 
          className={`flex flex-col items-center p-2 w-full transition-all ${activeTab === 'attendance' ? 'text-primary scale-110' : 'text-muted-foreground'}`}
        >
          <div className={`p-2 rounded-2xl mb-1 ${activeTab === 'attendance' ? 'bg-primary/10' : ''}`}>
            <BarChart3 className={`h-6 w-6 ${activeTab === 'attendance' ? 'fill-primary/20' : ''}`} />
          </div>
          <span className="text-[11px] font-bold">Progress</span>
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.85 }}
          onClick={() => setActiveTab('profile')} 
          className={`flex flex-col items-center p-2 w-full transition-all ${activeTab === 'profile' ? 'text-primary scale-110' : 'text-muted-foreground'}`}
        >
          <div className={`p-2 rounded-2xl mb-1 ${activeTab === 'profile' ? 'bg-primary/10' : ''}`}>
            <User className={`h-6 w-6 ${activeTab === 'profile' ? 'fill-primary/20' : ''}`} />
          </div>
          <span className="text-[11px] font-bold">Profile</span>
        </motion.button>
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
    { text: "No fatigue, nor disease, nor sorrow, nor sadness, nor hurt, nor distress befalls a Muslim, even if it were the prick he receives from a thorn, but that Allah expiates some of his sins for that.", source: "Sahih al-Bukhari" },
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
            Today's Mission
          </h3>
          <button onClick={onRefresh} className="text-sm font-bold text-primary hover:text-primary/80 transition-colors bg-primary/10 px-3 py-1.5 rounded-full">
            ↻ Refresh
          </button>
        </div>

        {todayClass ? (
          <AnimatedCard delay={0.3} className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-card to-blue-50/50 border-primary/20">
            <div className="flex items-center gap-5">
              {(() => {
                const teacher = teachers.find(t => t.user_id === todayClass.teacher_id);
                return (
                  <>
                    <Avatar photoUrl={teacher?.profile_photo} name={teacher?.name} size="lg" />
                    <div className="space-y-1">
                      <span className="inline-block px-3 py-1 bg-destructive text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-sm animate-pulse mb-1">Live Today</span>
                      <h4 className="font-black text-2xl md:text-3xl text-foreground">{todayClass.title || 'Live Session'}</h4>
                      <p className="text-sm font-bold text-primary">Teacher {teacher?.name || 'Assigned'}</p>
                      <div className="text-muted-foreground font-semibold mt-2 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{formatUKTime(todayClass.scheduled_at)} (UK Time)</span>
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>
            {todayClass.meet_link ? (
              <motion.a 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2.5 }}
                href={todayClass.meet_link} 
                target="_blank" 
                rel="noreferrer"
                className="bg-primary hover:bg-primary/90 text-white px-8 py-5 rounded-2xl font-black text-lg transition-all shadow-[0_8px_0_oklch(0.5_0.15_255)] hover:shadow-[0_4px_0_oklch(0.5_0.15_255)] hover:translate-y-1 flex items-center justify-center gap-3 text-center whitespace-nowrap active:shadow-none active:translate-y-2"
              >
                <Video className="h-6 w-6" />
                JOIN CLASS NOW
              </motion.a>
            ) : (
              <div className="bg-muted text-muted-foreground px-6 py-4 rounded-2xl font-bold text-center border-2 border-border border-dashed">
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
          Coming Up Next
        </h3>
        {upcomingClasses.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingClasses.map((c, i) => {
              const teacher = teachers.find(t => t.user_id === c.teacher_id);
              return (
                <AnimatedCard key={i} delay={0.4 + (i * 0.1)} className="p-5 flex items-center justify-between hover:border-primary/50 cursor-pointer">
                  <div className="flex items-center gap-4">
                    <Avatar photoUrl={teacher?.profile_photo} name={teacher?.name} size="md" />
                    <div>
                      <h4 className="font-bold text-foreground text-lg leading-tight">{c.title || 'Live Session'}</h4>
                      <p className="text-xs font-bold text-primary mb-1">{teacher?.name || 'Teacher'}</p>
                      <p className="font-semibold text-muted-foreground text-xs">
                        📅 {formatUKTime(c.scheduled_at)}
                      </p>
                    </div>
                  </div>
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

function AttendanceTab({ data, teachers }: { data: any, teachers: any[] }) {
  let barColor = "bg-destructive"
  if (data.percentage > 50 && data.percentage <= 75) barColor = "bg-secondary"
  if (data.percentage > 75) barColor = "bg-green-500"

  return (
    <div className="space-y-8">
      <h3 className="text-3xl font-black text-foreground mb-2">Your Progress Tracker 🚀</h3>
      <p className="text-muted-foreground font-medium mb-8">Keep up the great work and watch your stats grow!</p>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AnimatedCard delay={0.1} className="bg-primary border-none text-white p-6 text-center flex flex-col items-center justify-center">
          <p className="text-primary-foreground/80 text-xs font-bold tracking-widest uppercase mb-2">Total Classes</p>
          <p className="text-4xl md:text-5xl font-black">{data.totalClasses}</p>
        </AnimatedCard>
        <AnimatedCard delay={0.2} className="bg-green-500 border-none text-white p-6 text-center flex flex-col items-center justify-center">
          <p className="text-green-100 text-xs font-bold tracking-widest uppercase mb-2">Present</p>
          <p className="text-4xl md:text-5xl font-black">{data.presentCount}</p>
        </AnimatedCard>
        <AnimatedCard delay={0.3} className="bg-destructive border-none text-white p-6 text-center flex flex-col items-center justify-center">
          <p className="text-destructive-foreground/80 text-xs font-bold tracking-widest uppercase mb-2">Absent</p>
          <p className="text-4xl md:text-5xl font-black">{data.absentCount}</p>
        </AnimatedCard>
        <AnimatedCard delay={0.4} className="bg-secondary border-none text-secondary-foreground p-6 text-center flex flex-col items-center justify-center">
          <p className="text-secondary-foreground/70 text-xs font-bold tracking-widest uppercase mb-2">Score</p>
          <p className="text-4xl md:text-5xl font-black">{data.percentage}%</p>
        </AnimatedCard>
      </div>

      <AnimatedCard delay={0.5} className="p-8">
        <div className="flex justify-between items-end mb-4">
          <span className="font-bold text-foreground text-lg">Mastery Meter</span>
          <span className="font-black text-3xl text-foreground">{data.percentage}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-6 overflow-hidden border-2 border-border p-0.5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: data.percentage + "%" }}
            transition={{ duration: 1.5, type: "spring", bounce: 0.4 }}
            className={`${barColor} h-full rounded-full`}
          ></motion.div>
        </div>
        <p className="text-sm font-bold text-muted-foreground mt-4 text-center">Aim for 75% or higher to unlock the next level! 🏆</p>
      </AnimatedCard>

      <div className="mt-10">
        <h4 className="font-black text-foreground mb-4 text-2xl">Quest History</h4>
        <AnimatedCard delay={0.6} className="overflow-hidden">
          {data.history.length > 0 ? (
            <div className="divide-y-2 divide-border">
              {data.history.map((h: any, i: number) => {
                const teacher = teachers.find(t => t.user_id === h.teacher_id);
                return (
                  <div key={i} className="p-5 flex justify-between items-center hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <Avatar photoUrl={teacher?.profile_photo} name={teacher?.name} size="md" />
                      <div>
                        <p className="font-black text-foreground text-lg">{h.className}</p>
                        <p className="text-xs font-bold text-primary">{teacher?.name || 'Teacher'}</p>
                        <p className="text-sm text-muted-foreground font-semibold mt-1">{format(parseISO(h.date), "MMMM d, yyyy")}</p>
                      </div>
                    </div>
                    <div>
                      {h.status === 'Present' ? (
                        <span className="px-5 py-2 bg-green-100 text-green-700 rounded-xl text-sm font-black border-2 border-green-200">Present</span>
                      ) : (
                        <span className="px-5 py-2 bg-destructive/10 text-destructive rounded-xl text-sm font-black border-2 border-destructive/20">Absent</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-12 text-center flex flex-col items-center">
              <Award className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-bold text-lg">Your quest history will appear here once you attend classes.</p>
            </div>
          )}
        </AnimatedCard>
      </div>
    </div>
  )
}
