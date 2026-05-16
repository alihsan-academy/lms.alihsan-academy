'use client'

import { useState, useEffect, ChangeEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Upload, Lock, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'

function calculateCompletion(data: any) {
  const fields = [
    !!data.full_name,
    !!data.date_of_joining,
    !!data.educational_qualifications,
    !!data.mobile_number,
    !!data.current_country,
    !!data.current_state,
    !!data.bank_account_number,
    !!data.bank_name,
    !!data.profile_photo
  ]
  const total = fields.length
  const filled = fields.filter(Boolean).length
  return { filled, total, percent: Math.round((filled / total) * 100) }
}

export default function TeacherProfilePage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [completion, setCompletion] = useState({ filled: 0, total: 0, percent: 0 })

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data: teach } = await supabase
        .from('teacher_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      const { data: students } = await supabase
        .from('student_profiles')
        .select('name')
        .eq('teacher_id', user.id)

      const studentNames = students?.map(s => s.name) || []

      const combined = {
        registered_email: user.email,
        full_name: teach?.name || user.user_metadata?.full_name || '',
        date_of_joining: teach?.date_of_joining ? format(parseISO(teach.date_of_joining), 'yyyy-MM-dd') : '',
        educational_qualifications: teach?.educational_qualifications || '',
        mobile_number: teach?.mobile_number || '',
        current_country: teach?.current_country || '',
        current_state: teach?.current_state || '',
        bank_account_number: teach?.bank_account_number || '',
        bank_name: teach?.bank_name || '',
        profile_photo: teach?.profile_photo || '',
        assigned_students: studentNames,
        total_students: studentNames.length
      }
      setProfile(combined)
      setCompletion(calculateCompletion(combined))
      setLoading(false)
    }
    fetchProfile()
  }, [])

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    const updatedProfile = { ...profile, [name]: value }
    setProfile(updatedProfile)
    setCompletion(calculateCompletion(updatedProfile))
  }

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setSaving(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${profile.full_name || 'profile'}_${Date.now()}.${fileExt}`
    const { error: uploadError } = await supabase.storage.from('profiles').upload(fileName, file, { upsert: true })
    
    if (uploadError) {
      toast.error('Photo upload failed')
      setSaving(false)
      return
    }
    
    const { data: urlData } = supabase.storage.from('profiles').getPublicUrl(fileName)
    const updatedProfile = { ...profile, profile_photo: urlData.publicUrl }
    setProfile(updatedProfile)
    setCompletion(calculateCompletion(updatedProfile))
    toast.success('Photo uploaded')
    setSaving(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: teacherError } = await supabase.from('teacher_profiles').update({
      name: profile.full_name,
      date_of_joining: profile.date_of_joining ? new Date(profile.date_of_joining).toISOString() : null,
      educational_qualifications: profile.educational_qualifications,
      mobile_number: profile.mobile_number,
      current_country: profile.current_country,
      current_state: profile.current_state,
      bank_account_number: profile.bank_account_number,
      bank_name: profile.bank_name,
      profile_photo: profile.profile_photo
    }).eq('user_id', user.id)

    if (teacherError) {
      toast.error('Failed to save teacher details')
    } else {
      toast.success('Profile saved')
    }
    setSaving(false)
  }

  if (loading || !profile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-green-600" />
      </div>
    )
  }

  const barColor = completion.percent >= 100 ? 'bg-green-500' : completion.percent >= 50 ? 'bg-orange-500' : 'bg-red-500'

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-8 pb-10">
       {/* Profile Completion Bar */}
       <div className="sticky top-0 z-20 bg-green-50/80 backdrop-blur-md p-4 rounded-xl border border-green-100 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-green-800">Profile {completion.percent}% complete</span>
          <span className="text-xs font-medium text-green-600">{completion.filled}/{completion.total} fields filled</span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full transition-all duration-500 ${barColor}`} style={{ width: `${completion.percent}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-green-900">Teacher Profile</h2>
      </div>

      {/* Photo */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-green-100 flex flex-col items-center text-center">
        <div className="relative mb-4">
          <div className="w-32 h-32 rounded-full bg-green-50 flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
            {profile.profile_photo ? (
              <img src={profile.profile_photo} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-bold text-green-300">{profile.full_name?.charAt(0) || 'U'}</span>
            )}
          </div>
          <label className="absolute bottom-1 right-1 p-2 bg-green-600 rounded-full text-white cursor-pointer hover:bg-green-700 transition-colors shadow-lg">
            <Upload className="h-4 w-4" />
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={saving} />
          </label>
        </div>
        
        <h3 className="text-2xl font-bold text-gray-900">{profile.full_name || 'Your Name'}</h3>
        <p className="mt-2 text-gray-500 font-medium italic">Islamic Online Academy Teacher</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4 md:col-span-2">
           <h4 className="font-bold text-gray-700 border-b pb-2">Professional Information</h4>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-gray-500">Registered Email <Lock className="h-3 w-3" /></Label>
          <Input value={profile.registered_email} disabled className="bg-gray-50 border-gray-200" />
        </div>

        <div className="space-y-2">
          <Label className="text-gray-700">Full Name</Label>
          <Input name="full_name" value={profile.full_name} onChange={handleChange} placeholder="Enter your full name" />
        </div>

        <div className="space-y-2">
          <Label className="text-gray-700">Date of Joining Academy</Label>
          <Input type="date" name="date_of_joining" value={profile.date_of_joining} onChange={handleChange} />
        </div>

        <div className="space-y-2">
          <Label className="text-gray-700">Mobile Number</Label>
          <Input name="mobile_number" value={profile.mobile_number} onChange={handleChange} placeholder="e.g. +91 9876543210" />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label className="text-gray-700">Educational Qualifications</Label>
          <Textarea name="educational_qualifications" value={profile.educational_qualifications} onChange={handleChange} placeholder="Your degrees, certifications, etc." rows={3} />
        </div>

        <div className="space-y-4 md:col-span-2 mt-4">
           <h4 className="font-bold text-gray-700 border-b pb-2">Location & Bank Details</h4>
        </div>

        <div className="space-y-2">
          <Label className="text-gray-700">Current Country</Label>
          <Input name="current_country" value={profile.current_country} onChange={handleChange} placeholder="e.g. India" />
        </div>

        <div className="space-y-2">
          <Label className="text-gray-700">Current State</Label>
          <Input name="current_state" value={profile.current_state} onChange={handleChange} placeholder="e.g. Kerala" />
        </div>

        <div className="space-y-2">
          <Label className="text-gray-700">Bank Name</Label>
          <Input name="bank_name" value={profile.bank_name} onChange={handleChange} placeholder="e.g. State Bank of India" />
        </div>

        <div className="space-y-2">
          <Label className="text-gray-700">Bank Account Number</Label>
          <Input name="bank_account_number" value={profile.bank_account_number} onChange={handleChange} placeholder="Enter account number" />
        </div>

        <div className="space-y-4 md:col-span-2 mt-4">
           <h4 className="font-bold text-gray-700 border-b pb-2 flex items-center gap-2">
             <Users className="h-4 w-4" /> Student Management
           </h4>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-gray-500">Total Students Count <Lock className="h-3 w-3" /></Label>
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg font-bold text-green-700">
            {profile.total_students} Students
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label className="flex items-center gap-2 text-gray-500">Assigned Students <Lock className="h-3 w-3" /></Label>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-1 max-h-40 overflow-y-auto">
            {profile.assigned_students.length > 0 ? (
              profile.assigned_students.map((name: string, i: number) => (
                <div key={i} className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  {name}
                </div>
              ))
            ) : (
              <span className="text-sm text-gray-400 italic">No students assigned yet</span>
            )}
          </div>
        </div>
      </div>

      <div className="pt-6">
        <Button onClick={handleSave} disabled={saving} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6 text-lg rounded-xl shadow-lg transition-all active:scale-[0.98]">
          {saving ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : null}
          Save Profile
        </Button>
      </div>
    </div>
  )
}
