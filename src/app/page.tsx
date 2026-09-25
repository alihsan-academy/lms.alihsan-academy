'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function HomePage() {
  const portals = [
    {
      title: 'Student Portal',
      role: 'Student Login',
      description: 'Access your live sessions, study materials, recordings, and track your progress.',
      href: '/student/login',
      badge: 'Learning Space',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      gradient: 'from-emerald-950/80 to-emerald-900/40',
      hoverBorder: 'hover:border-emerald-500/50',
      buttonBg: 'bg-emerald-600 hover:bg-emerald-500 text-white',
      glow: 'group-hover:bg-emerald-500/10',
      icon: (
        <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      title: 'Tutor Portal',
      role: 'Teacher Login',
      description: 'Conduct interactive classes, monitor student attendance, and evaluate performance.',
      href: '/teacher/login',
      badge: 'Educator Space',
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      gradient: 'from-indigo-950/80 to-indigo-900/40',
      hoverBorder: 'hover:border-indigo-500/50',
      buttonBg: 'bg-indigo-600 hover:bg-indigo-500 text-white',
      glow: 'group-hover:bg-indigo-500/10',
      icon: (
        <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
        </svg>
      )
    },
    {
      title: 'Admin Portal',
      role: 'Management',
      description: 'Oversee academy operations, manage student enrollments, schedules, and reports.',
      href: '/admin/login',
      badge: 'System Admin',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      gradient: 'from-slate-900/90 to-slate-900/50',
      hoverBorder: 'hover:border-amber-500/40',
      buttonBg: 'bg-slate-800 hover:bg-slate-700 text-white border border-white/10',
      glow: 'group-hover:bg-amber-500/5',
      icon: (
        <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-[#070c14] text-white flex flex-col justify-between p-6 md:p-12 relative overflow-hidden font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* Background Decorative Ambient Vector Pattern */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
          <defs>
            <pattern id="bg-stars" width="60" height="60" patternUnits="userSpaceOnUse">
              <rect x="20" y="20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="0.8" />
              <rect x="20" y="20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="0.8" transform="rotate(45 30 30)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#bg-stars)" />
        </svg>
      </div>

      {/* Radial Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-emerald-600/10 blur-[150px] pointer-events-none rounded-full" />

      {/* Navigation / Header */}
      <header className="relative z-10 max-w-6xl mx-auto w-full flex items-center justify-between py-4">
        <div className="flex items-center gap-3.5">
          <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/15 shadow-sm">
            <img 
              src="/alihsan-logo.png" 
              alt="Al Ihsan Academy" 
              className="h-8 w-auto object-contain brightness-0 invert"
            />
          </div>
          <div>
            <h2 className="text-base font-extrabold tracking-tight text-white leading-none">
              AL IHSAN ACADEMY
            </h2>
            <p className="text-[11px] text-white/50 tracking-wider font-light mt-0.5">
              of Moral Education
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs text-white/70 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>alihsanacademy.uk</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-6xl mx-auto w-full my-auto py-12">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-4"
          >
            Digital Learning Gateway
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight"
          >
            Select Your Academy Portal
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-white/60 text-sm md:text-base mt-3 max-w-lg mx-auto font-light"
          >
            Choose your role to access your personalized educational dashboard and tools.
          </motion.p>
        </div>

        {/* Portals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {portals.map((portal, index) => (
            <motion.div
              key={portal.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 + index * 0.1 }}
            >
              <Link
                href={portal.href}
                className={`group relative flex flex-col justify-between h-full p-8 rounded-3xl bg-gradient-to-b ${portal.gradient} border border-white/10 ${portal.hoverBorder} backdrop-blur-xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1.5 overflow-hidden`}
              >
                {/* Hover Ambient Glow inside card */}
                <div className={`absolute inset-0 transition-colors duration-300 pointer-events-none ${portal.glow}`} />

                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md shadow-sm">
                      {portal.icon}
                    </div>
                    <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${portal.badgeColor}`}>
                      {portal.badge}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-white tracking-tight group-hover:text-white transition-colors">
                    {portal.title}
                  </h3>
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mt-1">
                    {portal.role}
                  </p>

                  <p className="text-sm text-white/70 font-light mt-4 leading-relaxed">
                    {portal.description}
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs font-semibold text-white/60 group-hover:text-white transition-colors flex items-center gap-1.5">
                    Enter Portal <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                  <div className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${portal.buttonBg}`}>
                    Login
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-6xl mx-auto w-full py-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/50">
        <p>© 2026 Al Ihsan Academy of Moral Education. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <span className="text-white/70 font-mono">alihsanacademy.uk</span>
          <span>•</span>
          <span>Terms & Privacy</span>
        </div>
      </footer>
    </div>
  )
}
