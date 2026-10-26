'use client'

import { useState, useEffect, ChangeEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Upload, Lock, Shield, Star, Award, Save } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { motion } from 'framer-motion'
import { AnimatedCard } from '@/components/animated-card'
import { BouncyButton } from '@/components/bouncy-button'

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
        .select('*')
        .eq('user_id', user.id)
        .single()

      let teacherName = 'Not Assigned'
      if (stud?.teacher_id) {
        const { data: tp } = await supabase
          .from('teacher_profiles')
          .select('name')
          .or(`user_id.eq.${stud.teacher_id},id.eq.${stud.teacher_id}`)
          .maybeSingle()
        if (tp?.name) {
          teacherName = tp.name
        }
      }

      const combined = {
        registered_email: user.email,
        full_name: stud?.name || user.user_metadata?.full_name || '',
        assigned_teacher_name: teacherName,
        registration_number: stud?.registration_number || '',
        dob: stud?.dob ? format(parseISO(stud.dob), 'yyyy-MM-dd') : '',
        guardian_name: stud?.guardian_name || '',
        guardian_mobile: stud?.guardian_mobile || '',
        address: stud?.address || '',
        profile_photo: stud?.profile_photo || '',
        academy_joined_date: stud?.academy_joined_date ? format(parseISO(stud.academy_joined_date), 'yyyy-MM-dd') : '',
        year: stud?.year || '',
        term: stud?.term || '',
        enrolment_status: stud?.enrolment_status || 'ongoing',
        break_from_date: stud?.break_from_date || '',
        break_to_date: stud?.break_to_date || '',
        break_reason: stud?.break_reason || '',
        last_class_date: stud?.last_class_date || '',
        stopped_reason: stud?.stopped_reason || ''
      }
      setProfile(combined)
      setCompletion(calculateCompletion(combined))
      setLoading(false)
    }
    fetchProfile()
  }, [])

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
    toast.success('Photo uploaded! Looking good! 📸')
    setSaving(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const updatePayload: any = {
      name: profile.full_name,
      dob: profile.dob ? new Date(profile.dob).toISOString() : null,
      guardian_name: profile.guardian_name,
      guardian_mobile: profile.guardian_mobile,
      address: profile.address,
      profile_photo: profile.profile_photo,
      academy_joined_date: profile.academy_joined_date ? new Date(profile.academy_joined_date).toISOString() : null,
      year: profile.year || null,
      term: profile.term || null,
    }

    let { error: studError } = await supabase.from('student_profiles').update(updatePayload).eq('user_id', user.id)

    if (studError && (studError.message?.includes('year') || studError.code === '42703')) {
      delete updatePayload.year
      delete updatePayload.term
      const retry = await supabase.from('student_profiles').update(updatePayload).eq('user_id', user.id)
      studError = retry.error
    }

    if (studError) {
      toast.error('Failed to save your details.')
    } else {
      toast.success('Profile saved successfully! 🚀')
    }
    setSaving(false)
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
      {/* Profile XP Completion Bar */}
      <AnimatedCard delay={0.1} className="sticky top-20 z-20 bg-background/90 backdrop-blur-md p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 border-primary/20 shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Star className="h-4 w-4 sm:h-5 sm:w-5 text-secondary fill-secondary" />
            <span className="text-xs sm:text-sm font-black text-foreground">Profile XP: {completion.percent}%</span>
          </div>
          <span className="text-[11px] sm:text-xs font-bold text-muted-foreground bg-muted px-2.5 sm:px-3 py-1 rounded-full">{completion.filled}/{completion.total} Quests</span>
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
          <p className="text-xs font-bold text-green-600 mt-2 text-center">Max Level Reached! You are awesome! 🎉</p>
        )}
      </AnimatedCard>

      {/* Profile Card Section */}
      <AnimatedCard delay={0.2} className="bg-[#0D4A47] p-5 sm:p-6 flex flex-col items-center text-center relative overflow-hidden border border-[#145955] text-white rounded-xl sm:rounded-2xl shadow-sm">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Shield className="h-24 w-24" />
        </div>
        <div className="relative mb-4 z-10">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white flex items-center justify-center overflow-hidden border-4 border-white/20 shadow-md">
            {profile.profile_photo ? (
              <img src={profile.profile_photo} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl sm:text-3xl font-bold text-[#0D4A47]">{profile.full_name?.charAt(0) || 'U'}</span>
            )}
          </div>
          <label className="absolute bottom-0 right-0 p-2 bg-[#E8A020] rounded-full text-white cursor-pointer hover:bg-[#D97706] transition-colors shadow-sm border-2 border-white w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center">
            <Upload className="h-3.5 w-3.5" />
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={saving} />
          </label>
        </div>
        
        <h3 className="text-lg sm:text-xl font-bold z-10">{profile.full_name || 'Your Name'}</h3>
        <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white font-medium text-xs gap-1.5">
            <Award className="h-3.5 w-3.5 text-[#FCD34D]" /> Reg No: {profile.registration_number || 'N/A'}
          </div>
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white font-medium text-xs gap-1.5">
            <Award className="h-3.5 w-3.5 text-[#FCD34D]" /> Year: {profile.year || 'N/A'}
          </div>
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white font-medium text-xs gap-1.5">
            <Award className="h-3.5 w-3.5 text-[#FCD34D]" /> Term: {profile.term || 'N/A'}
          </div>
        </div>
      </AnimatedCard>

      <AnimatedCard delay={0.3} className="p-4 sm:p-8 space-y-6 sm:space-y-8 rounded-xl sm:rounded-2xl">
        <div>
          <h4 className="font-black text-foreground text-lg sm:text-xl mb-4 flex items-center gap-2">
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs sm:text-sm">1</span>
            Personal Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 bg-muted/30 p-3.5 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-border/50">
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground font-bold text-xs uppercase tracking-wider">Registered Email <Lock className="h-3 w-3" /></Label>
              <Input value={profile.registered_email} disabled className="bg-muted border-none opacity-70 font-medium h-11 text-base md:text-sm" />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground font-bold text-xs uppercase tracking-wider">Registration Number <Lock className="h-3 w-3" /></Label>
              <Input value={profile.registration_number} disabled className="bg-primary/5 border-primary/20 font-black text-primary h-11 text-base md:text-sm" />
            </div>

            {/* Year */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="year" className="font-bold text-foreground">Year</Label>
              <Input
                id="year"
                name="year"
                placeholder="e.g. 2026"
                value={profile.year || ''}
                onChange={handleChange}
                disabled={saving}
                className="font-medium bg-white h-11 text-base md:text-sm"
              />
            </div>

            {/* Term */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="term" className="font-bold text-foreground">Term</Label>
              <select
                id="term"
                name="term"
                className="w-full rounded-md border border-input bg-background px-3 py-2 font-medium h-11 text-base md:text-sm cursor-pointer"
                value={profile.term || ''}
                onChange={handleChange}
                disabled={saving}
              >
                <option value="">Select term</option>
                <option value="Term-01">Term‑01</option>
                <option value="Term-02">Term‑02</option>
              </select>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label className="font-bold text-foreground">Full Name</Label>
              <Input name="full_name" value={profile.full_name} onChange={handleChange} placeholder="Enter your full name" className="font-medium bg-white h-11 text-base md:text-sm" />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label className="font-bold text-foreground">Date of Birth</Label>
              <Input type="date" name="dob" value={profile.dob} onChange={handleChange} className="font-medium bg-white h-11 text-base md:text-sm" />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label className="font-bold text-foreground">Guardian Name</Label>
              <Input name="guardian_name" value={profile.guardian_name} onChange={handleChange} placeholder="Father/Guardian name" className="font-medium bg-white h-11 text-base md:text-sm" />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label className="font-bold text-foreground">Guardian Mobile Number</Label>
              <Input name="guardian_mobile" value={profile.guardian_mobile} onChange={handleChange} placeholder="e.g. +44 1234 567890" className="font-medium bg-white h-11 text-base md:text-sm" />
            </div>

            <div className="space-y-1.5 sm:space-y-2 md:col-span-2">
              <Label className="font-bold text-foreground">Home Address</Label>
              <Textarea name="address" value={profile.address} onChange={handleChange} placeholder="Enter your full residential address" rows={3} className="font-medium bg-white resize-none text-base md:text-sm" />
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-black text-foreground text-lg sm:text-xl mb-4 flex items-center gap-2">
             <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-secondary/20 text-secondary flex items-center justify-center text-xs sm:text-sm">2</span>
            Academy Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 bg-muted/30 p-3.5 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-border/50">
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground font-bold text-xs uppercase tracking-wider">Assigned Teacher <Lock className="h-3 w-3" /></Label>
              <Input value={profile.assigned_teacher_name} disabled className="bg-muted border-none opacity-70 font-medium h-11 text-base md:text-sm" />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label className="font-bold text-foreground">Academy Joined Date</Label>
              <Input type="date" name="academy_joined_date" value={profile.academy_joined_date} onChange={handleChange} className="font-medium bg-white h-11 text-base md:text-sm" />
            </div>

            <div className="space-y-1.5 sm:space-y-2 md:col-span-2 mt-2">
              <Label className="flex items-center gap-2 text-muted-foreground font-bold text-xs uppercase tracking-wider mb-2">
                Enrolment Status <Lock className="h-3 w-3" />
              </Label>
              <div className="flex flex-col gap-2 bg-white/50 rounded-xl p-3.5 sm:p-4 border-2 border-border/30">
                <div className="flex items-center">
                  <StatusBadge status={profile.enrolment_status || 'ongoing'} />
                </div>
                {profile.enrolment_status === 'break' && (
                  <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-1">
                    Break: {profile.break_from_date} → {profile.break_to_date}
                    {profile.break_reason && <> · <em className="text-foreground/80">{profile.break_reason}</em></>}
                  </p>
                )}
                {profile.enrolment_status === 'stopped' && (
                  <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-1">
                    Last class: {profile.last_class_date}
                    {profile.stopped_reason && <> · <em className="text-foreground/80">{profile.stopped_reason}</em></>}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Minimal Save Changes Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="h-10 px-5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer min-h-[40px]"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </AnimatedCard>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string, className: string }> = {
    ongoing:  { label: '✅ Ongoing',   className: 'bg-green-50 text-green-700 border-green-200' },
    break:    { label: '🕐 On a Break', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    stopped:  { label: '🛑 Stopped',   className: 'bg-red-50 text-red-700 border-red-200' },
  }
  const s = map[status] || map.ongoing
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border-2 ${s.className}`}>
      {s.label}
    </span>
  )
}
