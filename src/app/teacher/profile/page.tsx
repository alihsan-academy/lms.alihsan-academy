'use client'

import { useState, useEffect, ChangeEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Lock, Users, Star, Award, GraduationCap, MapPin, ShieldCheck, Camera, Save } from 'lucide-react'
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
      
      const { data: teacherRows } = await supabase
        .from('teacher_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)

      const teach = teacherRows?.[0] || null

      const { data: students } = await supabase
        .from('student_profiles')
        .select('name, registration_number')
        .eq('teacher_id', user.id)
        .order('name', { ascending: true })

      const mappedStudents = students?.map((s, idx) => ({
        sl_no: idx + 1,
        reg_no: s.registration_number || 'N/A',
        name: s.name || 'Unnamed Student'
      })) || []

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
      toast.success('Profile updates saved successfully! ✨')
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
      toast.success('Profile photo updated successfully! 📸', { id: toastId })
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
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 px-3.5 sm:px-6 pb-24 md:pb-8 pt-4">
      {/* Profile Completion Bar */}
      <AnimatedCard delay={0.1} className="sticky top-20 z-20 bg-background/90 backdrop-blur-md p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 border-primary/20 shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Star className="h-4 w-4 sm:h-5 sm:w-5 text-secondary fill-secondary" />
            <span className="text-xs sm:text-sm font-black text-foreground">Profile Status: {completion.percent}%</span>
          </div>
          <span className="text-[11px] sm:text-xs font-bold text-muted-foreground bg-muted px-2.5 sm:px-3 py-1 rounded-full">{completion.filled}/{completion.total} Sections</span>
        </div>
        <div className="w-full h-3.5 sm:h-4 bg-muted rounded-full overflow-hidden border-2 border-border p-0.5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${completion.percent}%` }}
            transition={{ duration: 1, type: "spring" }}
            className={`h-full rounded-full ${barColor}`} 
          />
        </div>
        {completion.percent === 100 && (
          <p className="text-xs font-bold text-green-600 mt-2 text-center">Profile is fully complete! Excellent! 🎉</p>
        )}
      </AnimatedCard>

      {/* Profile Card Section */}
      <AnimatedCard delay={0.2} className="bg-[#1E293B] p-5 sm:p-6 flex flex-col items-center text-center relative overflow-hidden border border-[#334155] text-white rounded-xl sm:rounded-2xl shadow-sm">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <GraduationCap className="h-24 w-24" />
        </div>
        <div className="relative mb-4 z-10">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white flex items-center justify-center overflow-hidden border-4 border-white/20 shadow-md relative">
            {profile.profile_photo ? (
              <img src={profile.profile_photo} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl sm:text-3xl font-bold text-[#1E293B]">{profile.full_name?.charAt(0) || 'U'}</span>
            )}
            {uploadingPhoto && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </div>
            )}
          </div>
          <label 
            title="Change Profile Picture"
            className="absolute bottom-0 right-0 p-2 bg-[#E8A020] rounded-full text-white cursor-pointer hover:bg-[#D97706] active:scale-95 transition-all shadow-md border-2 border-white w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center"
          >
            <Camera className="h-4 w-4" />
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handlePhotoUpload} 
              disabled={uploadingPhoto} 
            />
          </label>
        </div>
        
        <h3 className="text-lg sm:text-xl font-bold z-10">{profile.full_name || 'Teacher Profile'}</h3>
        <p className="mt-1 text-white/70 font-medium text-xs">Islamic Online Academy Educator</p>
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/90 text-[11px] font-semibold border border-white/15">
          <Camera className="h-3 w-3 text-secondary" />
          <span>Tap the camera icon to update your profile photo</span>
        </div>
      </AnimatedCard>

      {/* Notice Banner */}
      <div className="bg-amber-50/80 border-2 border-amber-200/90 rounded-xl p-3.5 sm:p-4 text-amber-900 shadow-sm flex items-start gap-3">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5 text-amber-800">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs sm:text-sm font-black text-amber-950">
            Official Academy Records (Read-Only)
          </p>
          <p className="text-[11px] sm:text-xs text-amber-800 mt-1 font-medium leading-relaxed">
            Personal, contact, and qualification records are officially maintained by Academy Administration. To request changes to your name, contact information, or qualifications, please reach out to Administration. You can update your profile photo anytime using the camera button above.
          </p>
        </div>
      </div>

      <AnimatedCard delay={0.3} className="p-4 sm:p-8 space-y-6 sm:space-y-8 rounded-xl sm:rounded-2xl">
        <div>
          <h4 className="font-black text-foreground text-lg sm:text-xl mb-4 flex items-center gap-2">
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs sm:text-sm"><Award className="h-4 w-4" /></span>
            Professional Information
          </h4>
          
          <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-3.5 sm:p-4 mb-4 sm:mb-6 shadow-sm">
            <p className="text-xs sm:text-sm font-bold text-orange-800 flex items-center gap-2">
              ⏰ Important: Class Time Policy
            </p>
            <p className="text-[11px] sm:text-xs text-orange-700 mt-1 font-semibold leading-relaxed">
              All classes at Al-Ihsan Academy are scheduled in UK time (GMT/BST). 
              Please always enter class times in UK timezone when creating sessions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 bg-muted/30 p-3.5 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-border/50">
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="flex items-center gap-1.5 text-muted-foreground font-bold text-xs uppercase tracking-wider">
                <span>Registered Email</span>
                <Lock className="h-3 w-3 text-muted-foreground/70" />
              </Label>
              <Input 
                value={profile.registered_email || ''} 
                disabled 
                readOnly
                className="bg-muted/70 border-border/60 text-muted-foreground font-medium h-11 text-base md:text-sm cursor-not-allowed" 
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label className="flex items-center gap-1.5 text-muted-foreground font-bold text-xs uppercase tracking-wider">
                <span>Full Name</span>
                <Lock className="h-3 w-3 text-muted-foreground/70" />
              </Label>
              <Input 
                value={profile.full_name || 'Not specified'} 
                disabled 
                readOnly
                className="bg-muted/70 border-border/60 text-foreground font-medium h-11 text-base md:text-sm cursor-not-allowed" 
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label className="flex items-center gap-1.5 text-muted-foreground font-bold text-xs uppercase tracking-wider">
                <span>Date of Joining Academy</span>
                <Lock className="h-3 w-3 text-muted-foreground/70" />
              </Label>
              <Input 
                value={profile.date_of_joining ? (profile.date_of_joining.includes('-') ? format(parseISO(profile.date_of_joining), 'MMM d, yyyy') : profile.date_of_joining) : 'Not specified'} 
                disabled 
                readOnly
                className="bg-muted/70 border-border/60 text-foreground font-medium h-11 text-base md:text-sm cursor-not-allowed" 
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label className="flex items-center gap-1.5 text-muted-foreground font-bold text-xs uppercase tracking-wider">
                <span>Mobile Number</span>
                <Lock className="h-3 w-3 text-muted-foreground/70" />
              </Label>
              <Input 
                value={profile.mobile_number || 'Not specified'} 
                disabled 
                readOnly
                className="bg-muted/70 border-border/60 text-foreground font-medium h-11 text-base md:text-sm cursor-not-allowed" 
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2 md:col-span-2">
              <Label className="flex items-center gap-1.5 text-muted-foreground font-bold text-xs uppercase tracking-wider">
                <span>Educational Qualifications</span>
                <Lock className="h-3 w-3 text-muted-foreground/70" />
              </Label>
              <Textarea 
                value={profile.educational_qualifications || 'Not specified'} 
                disabled 
                readOnly
                rows={3} 
                className="bg-muted/70 border-border/60 text-foreground font-medium resize-none text-base md:text-sm cursor-not-allowed" 
              />
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-black text-foreground text-lg sm:text-xl mb-4 flex items-center gap-2">
             <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-secondary/20 text-secondary flex items-center justify-center text-xs sm:text-sm"><MapPin className="h-4 w-4" /></span>
            Location Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 bg-muted/30 p-3.5 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-border/50">
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="flex items-center gap-1.5 text-muted-foreground font-bold text-xs uppercase tracking-wider">
                <span>Current Country</span>
                <Lock className="h-3 w-3 text-muted-foreground/70" />
              </Label>
              <Input 
                value={profile.current_country || 'Not specified'} 
                disabled 
                readOnly
                className="bg-muted/70 border-border/60 text-foreground font-medium h-11 text-base md:text-sm cursor-not-allowed" 
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label className="flex items-center gap-1.5 text-muted-foreground font-bold text-xs uppercase tracking-wider">
                <span>Current State/Region</span>
                <Lock className="h-3 w-3 text-muted-foreground/70" />
              </Label>
              <Input 
                value={profile.current_state || 'Not specified'} 
                disabled 
                readOnly
                className="bg-muted/70 border-border/60 text-foreground font-medium h-11 text-base md:text-sm cursor-not-allowed" 
              />
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-black text-foreground text-lg sm:text-xl mb-4 flex items-center gap-2">
             <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-xs sm:text-sm"><Users className="h-4 w-4" /></span>
             Student Roster
          </h4>
          <div className="bg-muted/30 p-3.5 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-border/50 space-y-4 sm:space-y-6">
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground font-bold text-xs uppercase tracking-wider">Total Students <Lock className="h-3 w-3" /></Label>
              <div className="p-3 sm:p-4 bg-primary/10 border-2 border-primary/20 rounded-xl font-black text-primary text-lg sm:text-xl flex items-center justify-between">
                <span>{profile.total_students} Active Students</span>
                <span className="text-xs font-bold text-primary/80 bg-white/70 px-2.5 py-1 rounded-full border border-primary/20">
                  Assigned
                </span>
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground font-bold text-xs uppercase tracking-wider">Assigned Students <Lock className="h-3 w-3" /></Label>
              <div className="bg-white border-2 border-border rounded-xl overflow-hidden shadow-sm">
                {profile.assigned_students && profile.assigned_students.length > 0 ? (
                  <div className="overflow-x-auto w-full -mx-1 px-1 sm:mx-0 sm:px-0">
                    <table className="w-full text-left border-collapse min-w-[340px]">
                      <thead>
                        <tr className="bg-muted/60 border-b-2 border-border text-xs font-black text-foreground uppercase tracking-wider">
                          <th className="py-3 px-3 text-center w-16 whitespace-nowrap">Sl No</th>
                          <th className="py-3 px-3 w-32 whitespace-nowrap">Reg No</th>
                          <th className="py-3 px-3 whitespace-nowrap">Name of the Student</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {profile.assigned_students.map((student: any, i: number) => (
                          <tr key={i} className="hover:bg-muted/30 transition-colors">
                            <td className="py-3 px-3 text-center">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-foreground font-bold text-xs">
                                {student.sl_no || (i + 1)}
                              </span>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-black text-xs border border-primary/20">
                                {student.reg_no || 'N/A'}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 text-blue-700 font-bold rounded-full flex items-center justify-center text-xs shrink-0">
                                  {(student.name || 'S').charAt(0).toUpperCase()}
                                </div>
                                <span className="font-bold text-foreground text-sm sm:text-base truncate">
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
                  <div className="text-center py-8 text-muted-foreground font-bold text-xs sm:text-sm">
                    No students assigned yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Informational Footer Card */}
        <div className="p-4 sm:p-5 bg-muted/50 border-2 border-border/80 rounded-xl sm:rounded-2xl flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
            <Lock className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <h5 className="font-bold text-foreground text-sm">Official Record Verification</h5>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Teacher profiles are verified and maintained directly by the Al-Ihsan Academy Administration. If your name, contact information, or qualifications need updating, please contact an Administrator.
            </p>
          </div>
        </div>

        {/* Redesigned Save Profile Updates Button */}
        <div className="pt-2 sm:pt-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || uploadingPhoto}
            className="w-full h-12 sm:h-14 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary active:scale-[0.99] text-white font-extrabold text-base sm:text-lg rounded-xl sm:rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 border border-primary/20 flex items-center justify-center gap-2.5 min-h-[48px] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Saving Profile Updates...</span>
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                <span>Save Profile Updates</span>
              </>
            )}
          </button>
        </div>
      </AnimatedCard>
    </div>
  )
}
