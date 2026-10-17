'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function HomePage() {
  const portals = [
    {
      title: 'Student Portal',
      role: 'Student Login',
      description: 'Access your live sessions, study materials, class recordings, and track your daily learning progress.',
      href: '/student/login',
      badge: 'Learning Space',
      badgeBg: '#E8F5EE',
      badgeColor: '#1A6B4A',
      badgeBorder: 'rgba(26,107,74,0.25)',
      primaryColor: '#1A6B4A',
      hoverBorder: 'hover:border-[#1A6B4A]',
      accentTop: '#1A6B4A',
      icon: (
        <svg className="w-6 h-6 text-[#1A6B4A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      title: 'Tutor Portal',
      role: 'Teacher Login',
      description: 'Conduct interactive live classes, mark student attendance, track curriculum topics, and review student progress.',
      href: '/teacher/login',
      badge: 'Educator Space',
      badgeBg: '#EEF2F6',
      badgeColor: '#1E293B',
      badgeBorder: 'rgba(30,41,59,0.25)',
      primaryColor: '#1E293B',
      hoverBorder: 'hover:border-[#1E293B]',
      accentTop: '#1E293B',
      icon: (
        <svg className="w-6 h-6 text-[#1E293B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
        </svg>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A2B23] flex flex-col justify-between p-6 md:p-12 relative overflow-hidden font-sans selection:bg-[#1A6B4A]/15 selection:text-[#1A6B4A]">
      
      {/* Islamic Geometry Background Overlay Pattern matching Login & Dashboards */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundSize: '80px 80px',
          backgroundImage: `
            radial-gradient(circle at 40px 40px, #1A6B4A 1.5px, transparent 1.5px),
            linear-gradient(45deg, transparent 48%, #1A6B4A 49%, #1A6B4A 51%, transparent 52%),
            linear-gradient(-45deg, transparent 48%, #1A6B4A 49%, #1A6B4A 51%, transparent 52%)
          `
        }}
      />

      {/* Navigation / Header with Direction B Official Minaret Vector Logo */}
      <header className="relative z-10 max-w-5xl mx-auto w-full flex items-center justify-between py-4 border-b border-[#DDE4E0]">
        <div className="flex items-center gap-3">
          <svg
            style={{ width: '36px', height: '42px', flexShrink: 0 }}
            viewBox="0 0 100 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M50 5 L65 30 L35 30 Z" fill="#E8A020" />
            <path d="M30 35 C55 33, 70 38, 75 42 L72 50 C55 46, 40 45, 27 48 Z" fill="#1A6B4A" />
            <path d="M24 53 C55 50, 75 55, 80 60 L77 68 C55 64, 38 63, 21 66 Z" fill="#1A6B4A" />
            <path d="M18 71 C55 67, 80 73, 85 78 L81 86 C55 81, 35 80, 15 84 Z" fill="#1A6B4A" />
            <rect x="25" y="90" width="8" height="8" fill="#E8A020" />
          </svg>
          <div>
            <div className="text-lg md:text-xl font-bold tracking-tight text-[#1A6B4A] leading-tight">
              AL IHSAN Academy
            </div>
            <div className="text-[10px] text-[#5C7066] uppercase tracking-[0.12em] font-bold">
              Moral Education
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#DDE4E0] text-xs text-[#5C7066] font-medium shadow-xs">
          <span className="w-2 h-2 rounded-full bg-[#1A6B4A]" />
          <span>alihsanacademy.uk</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-5xl mx-auto w-full my-auto py-12 md:py-16">
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-14">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#E8F5EE] border border-[#1A6B4A]/20 text-[#1A6B4A] text-[11px] font-bold tracking-wide uppercase mb-4"
          >
            Digital Learning Gateway
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold text-[#1A2B23] tracking-tight leading-tight"
          >
            Select Your Academy Portal
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="text-[#5C7066] text-sm md:text-base mt-3 max-w-md mx-auto leading-relaxed"
          >
            Choose your role to access your personalized educational dashboard and tools.
          </motion.p>
        </div>

        {/* 2 Focused Portals: Student & Tutor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {portals.map((portal, index) => (
            <motion.div
              key={portal.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 + index * 0.1 }}
            >
              <Link
                href={portal.href}
                className={`group relative flex flex-col justify-between h-full p-7 md:p-8 rounded-2xl bg-white border border-[#DDE4E0] ${portal.hoverBorder} transition-all duration-200 shadow-sm hover:shadow-md overflow-hidden`}
              >
                {/* Clean Top Accent Line */}
                <div 
                  className="absolute top-0 left-0 right-0 h-[3px]"
                  style={{ backgroundColor: portal.accentTop }}
                />

                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div 
                      className="p-3 rounded-xl border"
                      style={{ 
                        backgroundColor: portal.badgeBg,
                        borderColor: portal.badgeBorder,
                      }}
                    >
                      {portal.icon}
                    </div>
                    <span 
                      className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md"
                      style={{
                        backgroundColor: portal.badgeBg,
                        color: portal.badgeColor,
                        border: `1px solid ${portal.badgeBorder}`
                      }}
                    >
                      {portal.badge}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-[#1A2B23] tracking-tight group-hover:text-[#1A6B4A] transition-colors">
                    {portal.title}
                  </h3>
                  <p className="text-[11px] font-bold text-[#92A89B] uppercase tracking-wider mt-1">
                    {portal.role}
                  </p>

                  <p className="text-sm text-[#5C7066] mt-4 leading-relaxed font-normal">
                    {portal.description}
                  </p>
                </div>

                <div className="mt-8 pt-5 border-t border-[#DDE4E0] flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#5C7066] group-hover:text-[#1A2B23] transition-colors flex items-center gap-1">
                    Enter Portal <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                  <div 
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-xs transition-opacity group-hover:opacity-90"
                    style={{ backgroundColor: portal.primaryColor }}
                  >
                    Login
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-5xl mx-auto w-full py-5 border-t border-[#DDE4E0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#5C7066]">
        <p>© 2026 Al Ihsan Academy of Moral Education. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <span className="text-[#1A2B23] font-semibold">alihsanacademy.uk</span>
          <span>•</span>
          <span>Student & Teacher Portal Gateway</span>
        </div>
      </footer>
    </div>
  )
}
