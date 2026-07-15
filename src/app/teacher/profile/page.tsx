'use client'

import { useState, useEffect, ChangeEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Upload, Lock, Users, Star, Award, GraduationCap, MapPin, Building } from 'lucide-react'
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
    toast.success('Photo uploaded successfully! 📸')
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
      toast.success('Profile saved successfully! ✨')
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
      {/* Profile Completion Bar */}
      <AnimatedCard delay={0.1} className="sticky top-20 z-20 bg-background/90 backdrop-blur-md p-5 rounded-2xl border-2 border-primary/20 shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-secondary fill-secondary" />
            <span className="text-sm font-black text-foreground">Profile Status: {completion.percent}%</span>
          </div>
          <span className="text-xs font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full">{completion.filled}/{completion.total} Sections Complete</span>
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
          <p className="text-xs font-bold text-green-600 mt-2 text-center">Profile is fully complete! Excellent! 🎉</p>
        )}
      </AnimatedCard>

      {/* Profile Card Section */}
      <AnimatedCard delay={0.2} className="bg-gradient-to-br from-purple-500 to-indigo-600 p-8 flex flex-col items-center text-center relative overflow-hidden border-none text-white">
        <div className="absolute top-0 right-0 p-4 opacity-20">
          <GraduationCap className="h-32 w-32" />
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
        <p className="mt-2 text-white/80 font-bold text-lg">Islamic Online Academy Educator</p>
      </AnimatedCard>

      <AnimatedCard delay={0.3} className="p-8 space-y-8">
        <div>
          <h4 className="font-black text-foreground text-xl mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm"><Award className="h-4 w-4" /></span>
            Professional Information
          </h4>
          
          <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 mb-6 shadow-sm">
            <p className="text-sm font-bold text-orange-800 flex items-center gap-2">
              ⏰ Important: Class Time Policy
            </p>
            <p className="text-xs text-orange-700 mt-1 font-semibold">
              All classes at Al-Ihsan Academy are scheduled in UK time (GMT/BST). 
              Please always enter class times in UK timezone when creating sessions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/30 p-6 rounded-2xl border-2 border-border/50">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground font-bold text-xs uppercase tracking-wider">Registered Email <Lock className="h-3 w-3" /></Label>
              <Input value={profile.registered_email} disabled className="bg-muted border-none opacity-70 font-medium" />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-foreground">Full Name</Label>
              <Input name="full_name" value={profile.full_name} onChange={handleChange} placeholder="Enter your full name" className="font-medium bg-white" />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-foreground">Date of Joining Academy</Label>
              <Input type="date" name="date_of_joining" value={profile.date_of_joining} onChange={handleChange} className="font-medium bg-white" />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-foreground">Mobile Number</Label>
              <Input name="mobile_number" value={profile.mobile_number} onChange={handleChange} placeholder="e.g. +44 1234 567890" className="font-medium bg-white" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="font-bold text-foreground">Educational Qualifications</Label>
              <Textarea name="educational_qualifications" value={profile.educational_qualifications} onChange={handleChange} placeholder="Your degrees, certifications, etc." rows={3} className="font-medium bg-white resize-none" />
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-black text-foreground text-xl mb-4 flex items-center gap-2">
             <span className="w-8 h-8 rounded-full bg-secondary/20 text-secondary flex items-center justify-center text-sm"><MapPin className="h-4 w-4" /></span>
            Location & Bank Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/30 p-6 rounded-2xl border-2 border-border/50">
            <div className="space-y-2">
              <Label className="font-bold text-foreground">Current Country</Label>
              <Input name="current_country" value={profile.current_country} onChange={handleChange} placeholder="e.g. United Kingdom" className="font-medium bg-white" />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-foreground">Current State/Region</Label>
              <Input name="current_state" value={profile.current_state} onChange={handleChange} placeholder="e.g. London" className="font-medium bg-white" />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-foreground">Bank Name</Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input name="bank_name" value={profile.bank_name} onChange={handleChange} placeholder="e.g. Barclays" className="pl-9 font-medium bg-white" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-foreground">Bank Account Number / IBAN</Label>
              <Input name="bank_account_number" value={profile.bank_account_number} onChange={handleChange} placeholder="Enter account number" className="font-medium bg-white" />
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-black text-foreground text-xl mb-4 flex items-center gap-2">
             <span className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-sm"><Users className="h-4 w-4" /></span>
             Student Roster
          </h4>
          <div className="bg-muted/30 p-6 rounded-2xl border-2 border-border/50 space-y-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground font-bold text-xs uppercase tracking-wider">Total Students <Lock className="h-3 w-3" /></Label>
              <div className="p-4 bg-primary/10 border-2 border-primary/20 rounded-xl font-black text-primary text-xl">
                {profile.total_students} Active Students
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground font-bold text-xs uppercase tracking-wider">Assigned Students <Lock className="h-3 w-3" /></Label>
              <div className="p-5 bg-white border-2 border-border rounded-xl space-y-2 max-h-60 overflow-y-auto shadow-inner">
                {profile.assigned_students.length > 0 ? (
                  profile.assigned_students.map((name: string, i: number) => (
                    <div key={i} className="text-base font-bold text-foreground flex items-center gap-3 p-2 hover:bg-muted rounded-lg transition-colors">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">
                        {name.charAt(0)}
                      </div>
                      {name}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground font-bold">
                    No students assigned yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <BouncyButton onClick={handleSave} disabled={saving} className="w-full h-16 text-xl shadow-[0_6px_0_oklch(0.5_0.19_255)] hover:shadow-[0_2px_0_oklch(0.5_0.19_255)] active:shadow-none bg-primary hover:bg-primary/90 text-white rounded-2xl active:translate-y-1 hover:translate-y-1">
            {saving ? <Loader2 className="animate-spin mr-2 h-6 w-6" /> : null}
            Save Profile Updates
          </BouncyButton>
        </div>
      </AnimatedCard>
    </div>
  )
}
