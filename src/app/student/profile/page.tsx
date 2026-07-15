'use client'

import { useState, useEffect, ChangeEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Upload, Lock, Shield, Star, Award } from 'lucide-react'
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
    toast.success('Photo uploaded! Looking good! 📸')
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
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Profile XP Completion Bar */}
      <AnimatedCard delay={0.1} className="sticky top-20 z-20 bg-background/90 backdrop-blur-md p-5 rounded-2xl border-2 border-primary/20 shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-secondary fill-secondary" />
            <span className="text-sm font-black text-foreground">Profile XP: {completion.percent}%</span>
          </div>
          <span className="text-xs font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full">{completion.filled}/{completion.total} Quests Complete</span>
        </div>
        <div className="w-full h-4 bg-muted rounded-full overflow-hidden border-2 border-border p-0.5">
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

      {/* Profile Player Card Section */}
      <AnimatedCard delay={0.2} className="bg-gradient-to-br from-primary to-blue-500 p-8 flex flex-col items-center text-center relative overflow-hidden border-none text-white">
        <div className="absolute top-0 right-0 p-4 opacity-20">
          <Shield className="h-32 w-32" />
        </div>
        <div className="relative mb-6 z-10">
          <div className="w-36 h-36 rounded-full bg-white flex items-center justify-center overflow-hidden border-8 border-white/20 shadow-xl">
            {profile.profile_photo ? (
              <img src={profile.profile_photo} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-6xl font-black text-primary">{profile.full_name?.charAt(0) || 'U'}</span>
            )}
          </div>
          <label className="absolute bottom-0 right-0 p-3 bg-secondary rounded-full text-white cursor-pointer hover:bg-orange-500 transition-colors shadow-lg border-4 border-white active:scale-95">
            <Upload className="h-5 w-5" />
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={saving} />
          </label>
        </div>
        
        <h3 className="text-3xl font-black z-10">{profile.full_name || 'Your Name'}</h3>
        <div className="mt-3 inline-flex items-center px-5 py-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white font-bold text-lg shadow-sm z-10 gap-2">
          <Award className="h-5 w-5" /> Reg No: {profile.registration_number || 'N/A'}
        </div>
      </AnimatedCard>

      <AnimatedCard delay={0.3} className="p-8 space-y-8">
        <div>
          <h4 className="font-black text-foreground text-xl mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm">1</span>
            Personal Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/30 p-6 rounded-2xl border-2 border-border/50">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground font-bold text-xs uppercase tracking-wider">Registered Email <Lock className="h-3 w-3" /></Label>
              <Input value={profile.registered_email} disabled className="bg-muted border-none opacity-70 font-medium" />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground font-bold text-xs uppercase tracking-wider">Registration Number <Lock className="h-3 w-3" /></Label>
              <Input value={profile.registration_number} disabled className="bg-primary/5 border-primary/20 font-black text-primary" />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-foreground">Full Name</Label>
              <Input name="full_name" value={profile.full_name} onChange={handleChange} placeholder="Enter your full name" className="font-medium bg-white" />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-foreground">Date of Birth</Label>
              <Input type="date" name="dob" value={profile.dob} onChange={handleChange} className="font-medium bg-white" />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-foreground">Guardian Name</Label>
              <Input name="guardian_name" value={profile.guardian_name} onChange={handleChange} placeholder="Father/Guardian name" className="font-medium bg-white" />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-foreground">Guardian Mobile Number</Label>
              <Input name="guardian_mobile" value={profile.guardian_mobile} onChange={handleChange} placeholder="e.g. +44 1234 567890" className="font-medium bg-white" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="font-bold text-foreground">Home Address</Label>
              <Textarea name="address" value={profile.address} onChange={handleChange} placeholder="Enter your full residential address" rows={3} className="font-medium bg-white resize-none" />
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-black text-foreground text-xl mb-4 flex items-center gap-2">
             <span className="w-8 h-8 rounded-full bg-secondary/20 text-secondary flex items-center justify-center text-sm">2</span>
            Academy Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/30 p-6 rounded-2xl border-2 border-border/50">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground font-bold text-xs uppercase tracking-wider">Assigned Teacher <Lock className="h-3 w-3" /></Label>
              <Input value={profile.assigned_teacher_name} disabled className="bg-muted border-none opacity-70 font-medium" />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-foreground">Academy Joined Date</Label>
              <Input type="date" name="academy_joined_date" value={profile.academy_joined_date} onChange={handleChange} className="font-medium bg-white" />
            </div>
          </div>
        </div>

        <div className="pt-4">
          <BouncyButton onClick={handleSave} disabled={saving} className="w-full h-16 text-xl shadow-[0_6px_0_oklch(0.5_0.19_255)] hover:shadow-[0_2px_0_oklch(0.5_0.19_255)] active:shadow-none bg-primary hover:bg-primary/90 text-white rounded-2xl active:translate-y-1 hover:translate-y-1">
            {saving ? <Loader2 className="animate-spin mr-2 h-6 w-6" /> : null}
            Save Profile XP
          </BouncyButton>
        </div>
      </AnimatedCard>
    </div>
  )
}
