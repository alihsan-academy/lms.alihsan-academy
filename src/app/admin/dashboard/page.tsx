"use client"

import { useState, useEffect } from 'react'
import { LogoutButton } from '@/components/logout-button'
import { AcademyHeader } from '@/components/academy-header'
import { ShieldCheck, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { AdminAttendanceManager } from '@/components/admin-attendance-manager'
import { toast } from 'sonner'

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [students, setStudents] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [])

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
          ...t,
          ...tp,
          name: tp.name || tp.full_name || t.email,
          profile_photo: tp.profile_photo || tp.photo_url || null,
          mobile_number: tp.mobile_number || tp.mobile || '',
          date_of_joining: tp.date_of_joining || tp.joined_date || tp.doj || '',
          educational_qualifications: tp.educational_qualifications || tp.qualification || '',
          current_country: tp.current_country || tp.country || '',
          current_state: tp.current_state || tp.state || '',
        }
      }) || []

      const mappedAllUsers = data.allUsers?.map((u: any) => {
        let name = u.email
        if (u.role === 'student' && u.student_profiles?.[0]?.name) {
          name = u.student_profiles[0].name
        } else if (u.role === 'teacher' && u.teacher_profiles?.[0]?.name) {
          name = u.teacher_profiles[0].name
        }
        return { ...u, name }
      }) || []

      setAllUsers(mappedAllUsers)
      setStudents(mappedStudents)
      setTeachers(mappedTeachers)
      setAttendanceRecords(data.attendance || [])
      setClasses(data.classes || [])
    } catch (error: any) {
      console.error("Error fetching admin data:", error)
      toast.error("Failed to load dashboard data.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background flex flex-col font-sans selection:bg-primary/20"
    >
      <header className="bg-white border-b-2 border-border p-3 md:p-4 flex justify-between items-center sticky top-0 z-50 shadow-sm backdrop-blur-md bg-white/90">
        <div className="flex items-center gap-3">
          <AcademyHeader size="sm" showTagline={false} />
          <div className="flex items-center gap-2 border-l-2 border-border pl-3 ml-2 hidden sm:flex">
             <ShieldCheck className="h-5 w-5 text-green-600" />
             <span className="font-extrabold text-foreground text-lg">Admin Portal</span>
          </div>
          <span className="sm:hidden text-[11px] font-bold text-green-800 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
            Admin
          </span>
        </div>
        <LogoutButton />
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-bold text-muted-foreground">Loading attendance records & analytics...</p>
          </div>
        ) : (
          <AdminAttendanceManager
            students={students}
            teachers={teachers}
            classes={classes}
            attendance={attendanceRecords}
            allUsers={allUsers}
          />
        )}
      </main>
    </motion.div>
  )
}
