"use client"

import { LogoutButton } from '@/components/logout-button'
import { AcademyHeader } from '@/components/academy-header'
import { ShieldCheck, Megaphone, FileText, BookOpen, GraduationCap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'

export default function AdminDashboard() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-green-50 to-white flex flex-col"
    >
      <header className="bg-white border-b border-green-100 p-4 flex justify-between items-center shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <AcademyHeader size="sm" showTagline={true} />
          <div className="flex items-center gap-2 border-l border-gray-200 pl-3 ml-3 hidden sm:flex">
             <ShieldCheck className="h-5 w-5 text-green-600" />
             <span className="font-bold text-green-800 text-xl">Admin Portal</span>
          </div>
        </div>
        <LogoutButton />
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-8 flex flex-col items-center justify-center">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
            className="bg-green-100 p-4 rounded-full inline-block mb-4 shadow-inner"
          >
            <ShieldCheck className="h-12 w-12 text-green-700" />
          </motion.div>
          <h1 className="text-4xl font-extrabold text-green-900 mb-4 tracking-tight">Admin Portal</h1>
          <p className="text-xl text-gray-600 bg-white inline-block px-6 py-2 rounded-full shadow-sm border border-green-100">
            Admin features coming in Version 2
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="w-full"
        >
          <Card className="w-full bg-white shadow-xl border-green-100 overflow-hidden">
            <div className="bg-green-700 p-6 text-center">
              <h3 className="text-2xl font-bold text-white">Upcoming Features</h3>
              <p className="text-green-100 mt-2">We are actively building these tools for you.</p>
            </div>
            <CardContent className="p-8">
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FeatureItem 
                  index={0}
                  icon={<Megaphone className="h-6 w-6 text-blue-500" />} 
                  title="Class-wise Announcements" 
                  desc="Broadcast messages to specific classes or batches easily."
                />
                <FeatureItem 
                  index={1}
                  icon={<FileText className="h-6 w-6 text-purple-500" />} 
                  title="Exam Form Management" 
                  desc="Create, distribute, and collect examination forms digitally."
                />
                <FeatureItem 
                  index={2}
                  icon={<BookOpen className="h-6 w-6 text-orange-500" />} 
                  title="Classroom Study Materials" 
                  desc="Upload and organize resources for teachers and students."
                />
                <FeatureItem 
                  index={3}
                  icon={<GraduationCap className="h-6 w-6 text-green-600" />} 
                  title="Syllabus & Curriculum" 
                  desc="Manage and track syllabus completion across all courses."
                />
              </ul>
            </CardContent>
          </Card>
        </motion.div>

      </main>
    </motion.div>
  )
}

function FeatureItem({ icon, title, desc, index }: { icon: React.ReactNode, title: string, desc: string, index: number }) {
  return (
    <motion.li 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 + (index * 0.1) }}
      whileHover={{ scale: 1.02 }}
      className="flex items-start gap-4 p-4 rounded-xl hover:bg-green-50 transition-colors border border-transparent hover:border-green-100 cursor-default"
    >
      <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-gray-900 text-lg">{title}</h4>
        <p className="text-sm text-gray-500 mt-1">{desc}</p>
      </div>
    </motion.li>
  )
}

