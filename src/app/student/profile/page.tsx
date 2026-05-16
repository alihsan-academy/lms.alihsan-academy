'use client'

import { useState, useEffect, ChangeEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Upload, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'

function calculateCompletion(data: any) {
  const fields = [
    !!data.full_name,
    !!data.dob,
    !!data.guardian_name,
    !!data.guardian_mobile,
    !!data.address,
    !!data.profile_photo
  ]
  const total = fields.length
  const filled = fields.filter(Boolean).length
  return { filled, total, percent: Math.round((filled / total) * 100) }
}

export default function StudentProfilePage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [completion, setCompletion] = useState({ filled: 0, total: 0, percent: 0 })

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data: stud } = await supabase
        .from('student_profiles')
        .select('*, teacher_profiles(name)')
        .eq('user_id', user.id)
        .single()

      const combined = {
        registered_email: user.email,
        full_name: stud?.name || user.user_metadata?.full_name || '',
        assigned_teacher_name: stud?.teacher_profiles?.name || 'Not Assigned',
        registration_number: stud?.registration_number || '',
        dob: stud?.dob ? format(parseISO(stud.dob), 'yyyy-MM-dd') : '',
        guardian_name: stud?.guardian_name || '',
        guardian_mobile: stud?.guardian_mobile || '',
        address: stud?.address || '',
        profile_photo: stud?.profile_photo || '',
        academy_joined_date: stud?.academy_joined_date ? format(parseISO(stud.academy_joined_date), 'yyyy-MM-dd') : ''
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
    const fileName = `${profile.registration_number || 'profile'}_${Date.now()}.${fileExt}`
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

    const { error: studError } = await supabase.from('student_profiles').update({
      name: profile.full_name,
      dob: profile.dob ? new Date(profile.dob).toISOString() : null,
      guardian_name: profile.guardian_name,
      guardian_mobile: profile.guardian_mobile,
      address: profile.address,
      profile_photo: profile.profile_photo,
      academy_joined_date: profile.academy_joined_date ? new Date(profile.academy_joined_date).toISOString() : null
    }).eq('user_id', user.id)

    if (studError) {
      toast.error('Failed to save student details')
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
        <h2 className="text-2xl font-bold text-green-900">Student Profile</h2>
      </div>

      {/* Profile Header Section */}
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
        <div className="mt-2 inline-flex items-center px-4 py-1.5 rounded-full bg-green-100 border border-green-200 text-green-700 font-bold text-lg shadow-sm">
          Reg No: {profile.registration_number || 'N/A'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4 md:col-span-2">
           <h4 className="font-bold text-gray-700 border-b pb-2">Personal Information</h4>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-gray-500">Registered Email <Lock className="h-3 w-3" /></Label>
          <Input value={profile.registered_email} disabled className="bg-gray-50 border-gray-200" />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-gray-500">Registration Number <Lock className="h-3 w-3" /></Label>
          <Input value={profile.registration_number} disabled className="bg-gray-50 border-gray-200 font-bold text-green-700" />
        </div>

        <div className="space-y-2">
          <Label className="text-gray-700">Full Name</Label>
          <Input name="full_name" value={profile.full_name} onChange={handleChange} placeholder="Enter your full name" />
        </div>

        <div className="space-y-2">
          <Label className="text-gray-700">Date of Birth</Label>
          <Input type="date" name="dob" value={profile.dob} onChange={handleChange} />
        </div>

        <div className="space-y-2">
          <Label className="text-gray-700">Guardian Name</Label>
          <Input name="guardian_name" value={profile.guardian_name} onChange={handleChange} placeholder="Father/Guardian name" />
        </div>

        <div className="space-y-2">
          <Label className="text-gray-700">Guardian Mobile Number</Label>
          <Input name="guardian_mobile" value={profile.guardian_mobile} onChange={handleChange} placeholder="e.g. +91 9876543210" />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label className="text-gray-700">Address</Label>
          <Textarea name="address" value={profile.address} onChange={handleChange} placeholder="Enter your full residential address" rows={3} />
        </div>

        <div className="space-y-4 md:col-span-2 mt-4">
           <h4 className="font-bold text-gray-700 border-b pb-2">Academy Details</h4>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-gray-500">Assigned Teacher <Lock className="h-3 w-3" /></Label>
          <Input value={profile.assigned_teacher_name} disabled className="bg-gray-50 border-gray-200" />
        </div>

        <div className="space-y-2">
          <Label className="text-gray-700">Academy Joined Date</Label>
          <Input type="date" name="academy_joined_date" value={profile.academy_joined_date} onChange={handleChange} />
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
