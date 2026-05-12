"use client"

import { LogoutButton } from '@/components/logout-button'
import { ShieldCheck, Megaphone, FileText, BookOpen, GraduationCap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-green-50 flex flex-col">
      <header className="bg-white border-b border-green-100 p-4 flex justify-between items-center shadow-sm sticky top-0 z-10">
        <div>
          <h2 className="font-bold text-green-800 text-xl flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            Admin Portal
          </h2>
        </div>
        <LogoutButton />
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-8 flex flex-col items-center justify-center">
        
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-green-100 p-4 rounded-full inline-block mb-4">
            <ShieldCheck className="h-12 w-12 text-green-700" />
          </div>
          <h1 className="text-4xl font-extrabold text-green-900 mb-4 tracking-tight">Admin Portal</h1>
          <p className="text-xl text-gray-600 bg-white inline-block px-6 py-2 rounded-full shadow-sm border border-green-100">
            Admin features coming in Version 2
          </p>
        </div>

        <Card className="w-full bg-white shadow-lg border-green-100 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          <div className="bg-green-700 p-6 text-center">
            <h3 className="text-2xl font-bold text-white">Upcoming Features</h3>
            <p className="text-green-100 mt-2">We are actively building these tools for you.</p>
          </div>
          <CardContent className="p-8">
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FeatureItem 
                icon={<Megaphone className="h-6 w-6 text-blue-500" />} 
                title="Class-wise Announcements" 
                desc="Broadcast messages to specific classes or batches easily."
              />
              <FeatureItem 
                icon={<FileText className="h-6 w-6 text-purple-500" />} 
                title="Exam Form Management" 
                desc="Create, distribute, and collect examination forms digitally."
              />
              <FeatureItem 
                icon={<BookOpen className="h-6 w-6 text-orange-500" />} 
                title="Classroom Study Materials" 
                desc="Upload and organize resources for teachers and students."
              />
              <FeatureItem 
                icon={<GraduationCap className="h-6 w-6 text-green-600" />} 
                title="Syllabus & Curriculum" 
                desc="Manage and track syllabus completion across all courses."
              />
            </ul>
          </CardContent>
        </Card>

      </main>
    </div>
  )
}

function FeatureItem({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <li className="flex items-start gap-4 p-4 rounded-xl hover:bg-green-50 transition-colors border border-transparent hover:border-green-100">
      <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-gray-900 text-lg">{title}</h4>
        <p className="text-sm text-gray-500 mt-1">{desc}</p>
      </div>
    </li>
  )
}
