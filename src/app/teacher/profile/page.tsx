'use client'

import { useState, useEffect, ChangeEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Lock, Users, Star, Award, GraduationCap, MapPin, ShieldCheck, Camera, Save, Clock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { motion } from 'framer-motion'
import { AnimatedCard } from '@/components/animated-card'

function calculateCompletion(data: any) {
  const fields = [
    !!data.full_name,
    !!data.date_of_joining,
    !!data.educational_qualifications,
    !!data.mobile_number,
    !!data.current_country,
    !!data.current_state,
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
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [completion, setCompletion] = useState({ filled: 0, total: 0, percent: 0 })

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      let teach: any = null
      try {
        const profileRes = await fetch('/api/teacher/profile', { cache: 'no-store' })
        if (profileRes.ok) {
          const profileData = await profileRes.json()
          if (profileData.profile) {
            teach = profileData.profile
          }
        }
      } catch (err) {
        console.error('Error fetching /api/teacher/profile:', err)
      }

      // Fallback if API returned null
      if (!teach) {
        try {
          const { data: teacherRows } = await supabase
            .from('teacher_profiles')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)

          teach = teacherRows?.[0] || null
        } catch (e) {
          console.warn('Fallback teacher_profiles query failed:', e)
        }
      }

      // Fetch teacher's assigned students via API first for service-role RLS bypass & complete details
      let assignedList: any[] = []
      try {
        const res = await fetch('/api/teacher/students', { cache: 'no-store' })
        if (res.ok) {
          const resData = await res.json()
          if (resData.students && Array.isArray(resData.students)) {
            assignedList = resData.students
          }
        }
      } catch (e) {
        console.error('Error fetching /api/teacher/students:', e)
      }

      // Fallback to direct supabase query if API returned empty
      if (assignedList.length === 0) {
        const { data: students } = await supabase
          .from('student_profiles')
          .select('name, registration_number')
          .eq('teacher_id', user.id)
          .order('name', { ascending: true })

        if (students && students.length > 0) {
          assignedList = students
        }
      }

      const mappedStudents = assignedList.map((s: any, idx: number) => ({
        sl_no: idx + 1,
        reg_no: s.registration_number || 'N/A',
        name: s.name || 'Unnamed Student'
      }))

      const combined = {
        registered_email: user.email,
        full_name: teach?.name || teach?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || '',
        date_of_joining: teach?.date_of_joining ? (teach.date_of_joining.includes('T') ? teach.date_of_joining.split('T')[0] : teach.date_of_joining) : (teach?.joined_date || ''),
        educational_qualifications: teach?.educational_qualifications || teach?.qualification || '',
        mobile_number: teach?.mobile_number || teach?.mobile || '',
        current_country: teach?.current_country || teach?.country || '',
        current_state: teach?.current_state || teach?.state || '',
        profile_photo: teach?.profile_photo || teach?.photo_url || '',
        assigned_students: mappedStudents,
        total_students: mappedStudents.length
      }
      setProfile(combined)
      setCompletion(calculateCompletion(combined))
      setLoading(false)
    }
    fetchProfile()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      if (profile?.profile_photo) {
        await fetch('/api/teacher/photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoUrl: profile.profile_photo })
        })
      }
      toast.success('Profile updates saved successfully.')
    } catch (err: any) {
      toast.error('Failed to save profile updates')
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Quick file validation
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, WebP).')
      return
    }

    setUploadingPhoto(true)
    const toastId = toast.loading('Uploading profile photo...')

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `teacher_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(fileName, file, { upsert: true })

      if (uploadError) {
        throw uploadError
      }

      const { data: urlData } = supabase.storage.from('profiles').getPublicUrl(fileName)
      const photoUrl = urlData.publicUrl

      // Persist photo URL securely through the server endpoint
      const response = await fetch('/api/teacher/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrl })
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save profile photo')
      }

      const updatedProfile = { ...profile, profile_photo: photoUrl }
      setProfile(updatedProfile)
      setCompletion(calculateCompletion(updatedProfile))
      toast.success('Profile photo updated successfully.', { id: toastId })
    } catch (err: any) {
      console.error('Photo upload error:', err)
      toast.error(err.message || 'Photo upload failed. Please try again.', { id: toastId })
    } finally {
      setUploadingPhoto(false)
    }
  }

  if (loading || !profile) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  const barColor = completion.percent >= 100 ? 'bg-green-500' : completion.percent >= 50 ? 'bg-secondary' : 'bg-destructive'

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-5 px-3.5 sm:px-6 pb-20 md:pb-8 pt-3">
      {/* Profile Completion Bar */}
      <AnimatedCard delay={0.1} className="sticky top-20 z-20 bg-background/90 backdrop-blur-md p-3 sm:p-4 rounded-xl border border-primary/20 shadow-xs">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <div className="flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 text-secondary fill-secondary" />
            <span className="text-xs sm:text-sm font-bold text-foreground">Profile Status: {completion.percent}%</span>
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">{completion.filled}/{completion.total} Sections</span>
        </div>
        <div className="w-full h-2.5 sm:h-3 bg-muted rounded-full overflow-hidden border border-border p-0.5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${completion.percent}%` }}
            transition={{ duration: 1, type: "spring" }}
            className={`h-full rounded-full ${barColor}`} 
          />
        </div>
        {completion.percent === 100 && (
          <p className="text-[11px] font-semibold text-green-600 mt-1.5 text-center">Profile is fully complete.</p>
        )}
      </AnimatedCard>

      {/* Profile Card Section */}
      <AnimatedCard delay={0.2} className="bg-[#1E293B] p-4 sm:p-5 flex flex-col items-center text-center relative overflow-hidden border border-[#334155] text-white rounded-xl shadow-xs">
        <div className="absolute top-0 right-0 p-3 opacity-10">
          <GraduationCap className="h-20 w-20" />
        </div>
        <div className="relative mb-3 z-10">
          <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-white flex items-center justify-center overflow-hidden border-3 border-white/20 shadow-sm relative">
            {profile.profile_photo ? (
              <img src={profile.profile_photo} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl sm:text-2xl font-bold text-[#1E293B]">{profile.full_name?.charAt(0) || 'U'}</span>
            )}
            {uploadingPhoto && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              </div>
            )}
          </div>
          <label 
            title="Change Profile Picture"
            className="absolute bottom-0 right-0 p-1.5 bg-[#E8A020] rounded-full text-white cursor-pointer hover:bg-[#D97706] active:scale-95 transition-all shadow-sm border-2 border-white w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center"
          >
            <Camera className="h-3.5 w-3.5" />
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handlePhotoUpload} 
              disabled={uploadingPhoto} 
            />
          </label>
        </div>
        
        <h3 className="text-base sm:text-lg font-bold z-10">{profile.full_name || 'Teacher Profile'}</h3>
        <p className="mt-0.5 text-white/70 font-medium text-xs">Islamic Online Academy Educator</p>
      </AnimatedCard>

      <AnimatedCard delay={0.3} className="p-4 sm:p-6 space-y-5 rounded-xl border border-border/70 shadow-xs">
        {/* Professional Information */}
        <div>
          <h4 className="font-bold text-foreground text-sm sm:text-base mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs"><Award className="h-3.5 w-3.5" /></span>
            Professional Information
          </h4>
          
          <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-2.5 mb-3 text-xs">
            <p className="font-bold text-amber-900 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0 text-amber-700" />
              <span>Important: Class Time Policy</span>
            </p>
            <p className="text-[11px] text-amber-800 mt-0.5 font-medium leading-relaxed">
              All classes at Al-Ihsan Academy are scheduled in UK time (GMT/BST). Please always enter class times in UK timezone when creating sessions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 bg-muted/20 p-3 sm:p-4 rounded-xl border border-border/60">
            <div className="space-y-1">
              <Label className="flex items-center gap-1 text-muted-foreground font-semibold text-[11px] uppercase tracking-wider">
                <span>Registered Email</span>
                <Lock className="h-2.5 w-2.5 text-muted-foreground/60" />
              </Label>
              <Input 
                value={profile.registered_email || ''} 
                disabled 
                readOnly
                className="bg-muted/50 border-border/60 text-muted-foreground font-medium h-9 text-base md:text-xs cursor-not-allowed" 
              />
            </div>

            <div className="space-y-1">
              <Label className="flex items-center gap-1 text-muted-foreground font-semibold text-[11px] uppercase tracking-wider">
                <span>Full Name</span>
                <Lock className="h-2.5 w-2.5 text-muted-foreground/60" />
              </Label>
              <Input 
                value={profile.full_name || 'Not specified'} 
                disabled 
                readOnly
                className="bg-muted/50 border-border/60 text-foreground font-medium h-9 text-base md:text-xs cursor-not-allowed" 
              />
            </div>

            <div className="space-y-1">
              <Label className="flex items-center gap-1 text-muted-foreground font-semibold text-[11px] uppercase tracking-wider">
                <span>Date of Joining Academy</span>
                <Lock className="h-2.5 w-2.5 text-muted-foreground/60" />
              </Label>
              <Input 
                value={profile.date_of_joining ? (profile.date_of_joining.includes('-') ? format(parseISO(profile.date_of_joining), 'MMM d, yyyy') : profile.date_of_joining) : 'Not specified'} 
                disabled 
                readOnly
                className="bg-muted/50 border-border/60 text-foreground font-medium h-9 text-base md:text-xs cursor-not-allowed" 
              />
            </div>

            <div className="space-y-1">
              <Label className="flex items-center gap-1 text-muted-foreground font-semibold text-[11px] uppercase tracking-wider">
                <span>Mobile Number</span>
                <Lock className="h-2.5 w-2.5 text-muted-foreground/60" />
              </Label>
              <Input 
                value={profile.mobile_number || 'Not specified'} 
                disabled 
                readOnly
                className="bg-muted/50 border-border/60 text-foreground font-medium h-9 text-base md:text-xs cursor-not-allowed" 
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label className="flex items-center gap-1 text-muted-foreground font-semibold text-[11px] uppercase tracking-wider">
                <span>Educational Qualifications</span>
                <Lock className="h-2.5 w-2.5 text-muted-foreground/60" />
              </Label>
              <Textarea 
                value={profile.educational_qualifications || 'Not specified'} 
                disabled 
                readOnly
                rows={2} 
                className="bg-muted/50 border-border/60 text-foreground font-medium resize-none text-base md:text-xs cursor-not-allowed" 
              />
            </div>
          </div>
        </div>

        {/* Location Details */}
        <div>
          <h4 className="font-bold text-foreground text-sm sm:text-base mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-secondary/15 text-secondary flex items-center justify-center text-xs"><MapPin className="h-3.5 w-3.5" /></span>
            Location Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 bg-muted/20 p-3 sm:p-4 rounded-xl border border-border/60">
            <div className="space-y-1">
              <Label className="flex items-center gap-1 text-muted-foreground font-semibold text-[11px] uppercase tracking-wider">
                <span>Current Country</span>
                <Lock className="h-2.5 w-2.5 text-muted-foreground/60" />
              </Label>
              <Input 
                value={profile.current_country || 'Not specified'} 
                disabled 
                readOnly
                className="bg-muted/50 border-border/60 text-foreground font-medium h-9 text-base md:text-xs cursor-not-allowed" 
              />
            </div>

            <div className="space-y-1">
              <Label className="flex items-center gap-1 text-muted-foreground font-semibold text-[11px] uppercase tracking-wider">
                <span>Current State/Region</span>
                <Lock className="h-2.5 w-2.5 text-muted-foreground/60" />
              </Label>
              <Input 
                value={profile.current_state || 'Not specified'} 
                disabled 
                readOnly
                className="bg-muted/50 border-border/60 text-foreground font-medium h-9 text-base md:text-xs cursor-not-allowed" 
              />
            </div>
          </div>
        </div>

        {/* Student Roster */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-foreground text-sm sm:text-base flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs"><Users className="h-3.5 w-3.5" /></span>
              Student Roster
            </h4>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              {profile.total_students} {profile.total_students === 1 ? 'Student' : 'Students'} Assigned
            </span>
          </div>

          <div className="border border-border/70 rounded-xl overflow-hidden bg-white shadow-xs">
            {profile.assigned_students && profile.assigned_students.length > 0 ? (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[320px]">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border/60 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="py-2.5 px-3 text-center w-16 whitespace-nowrap">Sl no</th>
                      <th className="py-2.5 px-3 w-32 whitespace-nowrap">Reg no</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">Name of the student</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {profile.assigned_students.map((student: any, i: number) => (
                      <tr key={i} className="hover:bg-muted/15 transition-colors">
                        <td className="py-2 px-3 text-center">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-muted/60 font-bold text-[11px] text-muted-foreground">
                            {student.sl_no || (i + 1)}
                          </span>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-mono font-bold text-[11px] border border-emerald-200/80">
                            {student.reg_no || 'N/A'}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 bg-primary/10 text-primary font-bold rounded-full flex items-center justify-center text-[10px] shrink-0 border border-primary/20">
                              {(student.name || 'S').charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-foreground text-xs sm:text-sm">
                              {student.name}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 px-4 text-muted-foreground font-medium text-xs">
                <Users className="h-6 w-6 text-muted-foreground/30 mx-auto mb-1.5" />
                No students assigned to your profile yet.
              </div>
            )}
          </div>
        </div>

        {/* Minimal, Small Save Changes Button */}
        <div className="pt-1 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || uploadingPhoto}
            className="h-8.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs rounded-lg shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </AnimatedCard>
    </div>
  )
}
