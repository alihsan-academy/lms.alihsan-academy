'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function HomePage() {
  // Smart Portal Redirection: Automatically route to preferred portal or standalone login
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.has('browse')) return

      const preferred = localStorage.getItem('alihsan_preferred_portal')
      const isStandalone = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://')

      if (preferred === 'teacher') {
        window.location.replace('/teacher/login')
        return
      }
      if (preferred === 'admin' || preferred === 'superadmin') {
        window.location.replace('/portal-superadmin/login')
        return
      }
      if (isStandalone && (preferred === 'student' || !preferred)) {
        window.location.replace('/student/login')
        return
      }
    }
  }, [])

  const studentFeatures = [
    'Live interactive classrooms & session links',
    'Weekly class timetable & academic schedules',
    'Attendance records & term learning reports',
    'Moral education syllabus & study resources'
  ]

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A2B23] flex flex-col justify-between p-4 sm:p-6 md:p-12 relative overflow-x-hidden font-sans selection:bg-[#1A6B4A]/15 selection:text-[#1A6B4A]">
      
      {/* Islamic Geometry Background Overlay Pattern matching Login & Dashboards */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.045]"
        style={{
          backgroundSize: '80px 80px',
          backgroundImage: `
            radial-gradient(circle at 40px 40px, #1A6B4A 1.5px, transparent 1.5px),
            linear-gradient(45deg, transparent 48%, #1A6B4A 49%, #1A6B4A 51%, transparent 52%),
            linear-gradient(-45deg, transparent 48%, #1A6B4A 49%, #1A6B4A 51%, transparent 52%)
          `
        }}
      />

      {/* Navigation / Header with Official Brand Logo */}
      <header className="relative z-10 max-w-5xl mx-auto w-full flex items-center justify-between py-3.5 border-b border-[#DDE4E0]">
        <Link href="/" className="flex items-center group">
          <img
            src="/alihsan-official-logo.png"
            alt="AL IHSAN Academy"
            className="h-10 sm:h-11 w-auto object-contain transition-transform duration-150 group-hover:scale-[1.02]"
          />
        </Link>

        <div className="flex items-center gap-2.5">
          <Link 
            href="/teacher/login"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#DDE4E0] text-xs font-bold text-[#1E293B] shadow-xs hover:border-[#1E293B] hover:bg-[#F1F5F9] transition-colors"
          >
            <span>Tutor Portal</span>
            <span>→</span>
          </Link>
          <a 
            href="https://www.alihsanacademy.uk" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#DDE4E0] text-xs text-[#5C7066] font-medium shadow-xs hover:border-[#1A6B4A] transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-[#1A6B4A]" />
            <span>alihsanacademy.uk</span>
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-5xl mx-auto w-full my-auto py-8 sm:py-12 md:py-16 flex flex-col items-center">
        
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10 px-2">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#E8F5EE] border border-[#1A6B4A]/25 text-[#1A6B4A] text-[11px] font-bold tracking-wide uppercase mb-3 sm:mb-4"
          >
            Digital Learning Gateway
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-[#1A2B23] tracking-tight leading-tight"
          >
            Student Learning Portal
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="text-[#5C7066] text-xs sm:text-sm md:text-base mt-2 sm:mt-3 max-w-lg mx-auto leading-relaxed"
          >
            Sign in to access your interactive live classes, syllabus materials, daily attendance, and moral education dashboard.
          </motion.p>
        </div>

        {/* Centered Focused Student Portal Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
          className="w-full max-w-xl mx-auto"
        >
          <div className="relative p-7 sm:p-9 rounded-3xl bg-white border border-[#DDE4E0] shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
            {/* Top Brand Gradient Accent Bar */}
            <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-[#1A6B4A] via-[#228B5E] to-[#E8A020]" />

            {/* Card Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="p-3.5 rounded-2xl bg-[#E8F5EE] border border-[#1A6B4A]/20 text-[#1A6B4A]">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-md bg-[#E8F5EE] text-[#1A6B4A] border border-[#1A6B4A]/25">
                Learning Space
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-[#1A2B23] tracking-tight">
              Student Portal
            </h2>
            <p className="text-[12px] font-bold text-[#1A6B4A] uppercase tracking-wider mt-1">
              Student & Parent Access
            </p>

            <p className="text-sm sm:text-[15px] text-[#5C7066] mt-3 leading-relaxed">
              Your personal academic space for participating in weekly sessions, tracking your learning progress, and reviewing lesson notes.
            </p>

            {/* Feature Checklist */}
            <div className="mt-6 pt-5 border-t border-[#EEF2F0] space-y-2.5">
              {studentFeatures.map((feat) => (
                <div key={feat} className="flex items-center gap-2.5 text-xs sm:text-sm text-[#374A40] font-medium">
                  <span className="w-5 h-5 rounded-full bg-[#E8F5EE] text-[#1A6B4A] flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            {/* Primary Action Button */}
            <div className="mt-8">
              <Link
                href="/student/login"
                className="group flex items-center justify-center gap-2 w-full bg-[#1A6B4A] hover:bg-[#14553A] text-white font-semibold text-sm sm:text-base py-3.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
              >
                <span>Log In to Student Portal</span>
                <span className="transform group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-5xl mx-auto w-full py-5 border-t border-[#DDE4E0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#5C7066]">
        <p>© 2026 Al Ihsan Academy of Moral Education. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link href="/student/login" className="text-[#1A6B4A] font-semibold hover:underline">
            Student Portal
          </Link>
          <span>•</span>
          <Link href="/teacher/login" className="text-[#1E293B] font-semibold hover:underline">
            Tutor Portal
          </Link>
          <span>•</span>
          <a href="https://www.alihsanacademy.uk" target="_blank" rel="noopener noreferrer" className="text-[#5C7066] hover:underline">
            alihsanacademy.uk
          </a>
        </div>
      </footer>
    </div>
  )
}
