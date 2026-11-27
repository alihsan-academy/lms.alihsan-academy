"use client"

import React, { useState, useEffect, useRef } from 'react'
import {
  SURAH_LIST,
  RECITERS,
  SurahMeta,
  AyahVerse,
  QuranAssignment,
  fetchSurahVerses,
  getAyahAudioUrl
} from '@/lib/quran-data'
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  BookOpen,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  Clock,
  Settings2,
  ChevronRight,
  Flame,
  Award,
  ListRestart
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface QuranPlayerProps {
  initialAssignment?: QuranAssignment | null
  onProgressUpdated?: (updatedAssignment: QuranAssignment) => void
  userRole?: 'student' | 'teacher' | 'admin'
}

export function QuranPlayer({
  initialAssignment,
  onProgressUpdated,
  userRole = 'student'
}: QuranPlayerProps) {
  // Navigation & Selection state
  const [selectedSurahNum, setSelectedSurahNum] = useState<number>(
    initialAssignment?.surah_number || 1
  )
  const [fromAyah, setFromAyah] = useState<number>(initialAssignment?.from_ayah || 1)
  const [toAyah, setToAyah] = useState<number>(
    initialAssignment?.to_ayah || (SURAH_LIST[0]?.total_ayahs || 7)
  )

  // Current verses data
  const [verses, setVerses] = useState<AyahVerse[]>([])
  const [isLoadingVerses, setIsLoadingVerses] = useState<boolean>(true)
  const [versesError, setVersesError] = useState<string | null>(null)

  // Audio Player state
  const [selectedReciter, setSelectedReciter] = useState<string>(
    initialAssignment?.default_reciter || 'Husary_Muallim_128kbps'
  )
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [currentPlayingAyah, setCurrentPlayingAyah] = useState<number>(fromAyah)
  const [currentRepeatCount, setCurrentRepeatCount] = useState<number>(1)
  const [targetRepeats, setTargetRepeats] = useState<number>(
    initialAssignment?.target_repeats || 3
  )
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0)
  const [pauseAfterAyahSeconds, setPauseAfterAyahSeconds] = useState<number>(1.5)
  const [isPauseEnabled, setIsPauseEnabled] = useState<boolean>(true)
  const [isMuted, setIsMuted] = useState<boolean>(false)

  // Memorization Mode (Hifz text mask)
  const [isHifzMode, setIsHifzMode] = useState<boolean>(false)
  const [revealedAyahs, setRevealedAyahs] = useState<Set<number>>(new Set())

  // Text size
  const [fontSizeClass, setFontSizeClass] = useState<'text-xl' | 'text-2xl' | 'text-3xl'>('text-2xl')

  // UI state
  const [showSettings, setShowSettings] = useState<boolean>(false)
  const [isSubmittingProgress, setIsSubmittingProgress] = useState<boolean>(false)
  const [activeAssignment, setActiveAssignment] = useState<QuranAssignment | null>(
    initialAssignment || null
  )

  // Audio HTML Element Ref
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const ayahRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const currentSurah = SURAH_LIST.find((s) => s.number === selectedSurahNum) || SURAH_LIST[0]

  // Sync if initialAssignment changes from outside
  useEffect(() => {
    if (initialAssignment) {
      setActiveAssignment(initialAssignment)
      setSelectedSurahNum(initialAssignment.surah_number)
      setFromAyah(initialAssignment.from_ayah)
      setToAyah(initialAssignment.to_ayah)
      setCurrentPlayingAyah(initialAssignment.from_ayah)
      if (initialAssignment.default_reciter) {
        setSelectedReciter(initialAssignment.default_reciter)
      }
      if (initialAssignment.target_repeats) {
        setTargetRepeats(initialAssignment.target_repeats)
      }
    }
  }, [initialAssignment])

  // Fetch Verses whenever Surah changes
  useEffect(() => {
    let isCancelled = false
    setIsLoadingVerses(true)
    setVersesError(null)

    fetchSurahVerses(selectedSurahNum)
      .then((loaded) => {
        if (!isCancelled) {
          setVerses(loaded)
          setIsLoadingVerses(false)
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error(err)
          setVersesError('Unable to load verses. Please check your internet connection.')
          setIsLoadingVerses(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [selectedSurahNum])

  // Handle Surah change from dropdown
  const handleSurahChange = (num: number) => {
    stopAudio()
    setSelectedSurahNum(num)
    const surah = SURAH_LIST.find((s) => s.number === num)
    const maxAyahs = surah?.total_ayahs || 7
    setFromAyah(1)
    setToAyah(maxAyahs)
    setCurrentPlayingAyah(1)
    setCurrentRepeatCount(1)
    setRevealedAyahs(new Set())
  }

  // Handle Ayah boundary adjustments
  const handleFromAyahChange = (val: number) => {
    const clamped = Math.max(1, Math.min(val, toAyah))
    setFromAyah(clamped)
    if (currentPlayingAyah < clamped) {
      setCurrentPlayingAyah(clamped)
      setCurrentRepeatCount(1)
    }
  }

  const handleToAyahChange = (val: number) => {
    const maxAyahs = currentSurah.total_ayahs
    const clamped = Math.max(fromAyah, Math.min(val, maxAyahs))
    setToAyah(clamped)
    if (currentPlayingAyah > clamped) {
      setCurrentPlayingAyah(fromAyah)
      setCurrentRepeatCount(1)
    }
  }

  // Audio Playback Engine
  const stopAudio = () => {
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current)
      pauseTimeoutRef.current = null
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setIsPlaying(false)
  }

  const playAyah = (ayahNum: number, repeatNum = 1) => {
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current)
      pauseTimeoutRef.current = null
    }

    if (!audioRef.current) return

    const audioUrl = getAyahAudioUrl(selectedReciter, selectedSurahNum, ayahNum)
    audioRef.current.src = audioUrl
    audioRef.current.playbackRate = playbackSpeed
    audioRef.current.muted = isMuted

    audioRef.current
      .play()
      .then(() => {
        setIsPlaying(true)
        setCurrentPlayingAyah(ayahNum)
        setCurrentRepeatCount(repeatNum)

        // Smooth scroll active verse into view
        const element = ayahRefs.current.get(ayahNum)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      })
      .catch((err) => {
        console.warn('Playback interrupted or blocked:', err)
        setIsPlaying(false)
      })
  }

  const togglePlayPause = () => {
    if (isPlaying) {
      stopAudio()
    } else {
      playAyah(currentPlayingAyah, currentRepeatCount)
    }
  }

  // Audio ended handler - controls repetition and advancing to next ayah
  const handleAudioEnded = () => {
    // Check if we need to repeat the current verse
    if (currentRepeatCount < targetRepeats) {
      const nextRepeat = currentRepeatCount + 1
      if (isPauseEnabled && pauseAfterAyahSeconds > 0) {
        setIsPlaying(false)
        pauseTimeoutRef.current = setTimeout(() => {
          playAyah(currentPlayingAyah, nextRepeat)
        }, pauseAfterAyahSeconds * 1000)
      } else {
        playAyah(currentPlayingAyah, nextRepeat)
      }
      return
    }

    // Verse completed target repeats! Check if there is a next verse in range
    if (currentPlayingAyah < toAyah) {
      const nextAyah = currentPlayingAyah + 1
      if (isPauseEnabled && pauseAfterAyahSeconds > 0) {
        setIsPlaying(false)
        pauseTimeoutRef.current = setTimeout(() => {
          playAyah(nextAyah, 1)
        }, pauseAfterAyahSeconds * 1000)
      } else {
        playAyah(nextAyah, 1)
      }
    } else {
      // Entire portion completed!
      stopAudio()
      setCurrentPlayingAyah(fromAyah)
      setCurrentRepeatCount(1)
      toast.success('Masha Allah! You completed listening to this Quran portion.')

      // Automatically log a practice increment if user is student
      if (userRole === 'student' && activeAssignment) {
        recordPracticeSession(false)
      }
    }
  }

  // Jump to specific Ayah
  const jumpToAyah = (ayahNum: number) => {
    playAyah(ayahNum, 1)
  }

  // Previous / Next Ayah buttons
  const handlePreviousAyah = () => {
    const prev = Math.max(fromAyah, currentPlayingAyah - 1)
    playAyah(prev, 1)
  }

  const handleNextAyah = () => {
    const next = Math.min(toAyah, currentPlayingAyah + 1)
    playAyah(next, 1)
  }

  // Speed changer
  const cyclePlaybackSpeed = () => {
    const speeds = [0.75, 1.0, 1.25]
    const currentIndex = speeds.indexOf(playbackSpeed)
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length]
    setPlaybackSpeed(nextSpeed)
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed
    }
  }

  // Toggle Hifz reveal for an ayah
  const toggleAyahReveal = (ayahNum: number) => {
    setRevealedAyahs((prev) => {
      const next = new Set(prev)
      if (next.has(ayahNum)) {
        next.delete(ayahNum)
      } else {
        next.add(ayahNum)
      }
      return next
    })
  }

  // Practice session recorder (calls backend API)
  const recordPracticeSession = async (markCompleted = false) => {
    if (!activeAssignment) return
    setIsSubmittingProgress(true)

    try {
      const res = await fetch('/api/quran/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: activeAssignment.id,
          markCompleted
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update progress')

      setActiveAssignment(data.assignment)
      if (onProgressUpdated) {
        onProgressUpdated(data.assignment)
      }

      toast.success(data.message || 'Progress saved successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Could not save practice record.')
    } finally {
      setIsSubmittingProgress(false)
    }
  }

  // Filter verses to the active range
  const displayedVerses = verses.filter(
    (v) => v.numberInSurah >= fromAyah && v.numberInSurah <= toAyah
  )

  const activeReciterMeta = RECITERS.find((r) => r.id === selectedReciter) || RECITERS[0]

  return (
    <div className="w-full max-w-full space-y-4">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        onError={() => {
          toast.error('Unable to play audio stream for this ayah.')
          setIsPlaying(false)
        }}
      />

      {/* TOP HEADER & ASSIGNMENT NOTICE CARD */}
      {activeAssignment && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-600 text-white uppercase tracking-wider">
                {activeAssignment.assignment_type === 'hifz' ? 'Hifz Memorization' : 'Quran Recitation'}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Listened: <strong className="text-foreground">{activeAssignment.listened_count} times</strong>
              </span>
              {activeAssignment.status === 'completed' && (
                <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Mastered
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-foreground">
              Assigned: {activeAssignment.surah_name_en} (Ayahs {activeAssignment.from_ayah}–{activeAssignment.to_ayah})
            </h3>
            {activeAssignment.teacher_note && (
              <p className="text-xs sm:text-sm text-muted-foreground italic">
                Teacher Note: &ldquo;{activeAssignment.teacher_note}&rdquo;
              </p>
            )}
          </div>

          {userRole === 'student' && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => recordPracticeSession(false)}
                disabled={isSubmittingProgress}
                className="px-3.5 py-2 min-h-[44px] text-xs sm:text-sm font-medium rounded-xl bg-card border border-border hover:bg-muted text-foreground transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <Flame className="w-4 h-4 text-orange-500" />
                +1 Practice Session
              </button>
              {activeAssignment.status !== 'completed' && (
                <button
                  onClick={() => recordPracticeSession(true)}
                  disabled={isSubmittingProgress}
                  className="px-3.5 py-2 min-h-[44px] text-xs sm:text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <Award className="w-4 h-4" />
                  Mark as Mastered
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* SURAH & AYAH RANGE SELECTOR CARD */}
      <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          {/* Surah Picker */}
          <div className="sm:col-span-6 space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Surah
            </label>
            <select
              value={selectedSurahNum}
              onChange={(e) => handleSurahChange(Number(e.target.value))}
              className="w-full h-11 px-3 text-sm sm:text-base font-medium rounded-xl bg-background border border-input focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all cursor-pointer"
            >
              {SURAH_LIST.map((s) => (
                <option key={s.number} value={s.number}>
                  {s.number}. {s.name_en} ({s.name_ar}) · {s.total_ayahs} Ayahs
                </option>
              ))}
            </select>
          </div>

          {/* From Ayah */}
          <div className="sm:col-span-3 space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              From Ayah
            </label>
            <input
              type="number"
              min={1}
              max={currentSurah.total_ayahs}
              value={fromAyah}
              onChange={(e) => handleFromAyahChange(Number(e.target.value))}
              className="w-full h-11 px-3 text-sm sm:text-base font-medium rounded-xl bg-background border border-input focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
            />
          </div>

          {/* To Ayah */}
          <div className="sm:col-span-3 space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              To Ayah
            </label>
            <input
              type="number"
              min={fromAyah}
              max={currentSurah.total_ayahs}
              value={toAyah}
              onChange={(e) => handleToAyahChange(Number(e.target.value))}
              className="w-full h-11 px-3 text-sm sm:text-base font-medium rounded-xl bg-background border border-input focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Quick Utility Toggles (Hifz Mode, Reciter, Settings) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs sm:text-sm">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Hifz Test Mode Toggle */}
            <button
              onClick={() => {
                setIsHifzMode(!isHifzMode)
                setRevealedAyahs(new Set())
              }}
              className={`px-3 py-1.5 min-h-[44px] rounded-xl font-medium transition-all flex items-center gap-1.5 border ${
                isHifzMode
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400 font-semibold'
                  : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'
              }`}
              title="Masks Arabic text for memorization testing. Tap any verse to reveal."
            >
              {isHifzMode ? <EyeOff className="w-4 h-4 text-amber-500" /> : <Eye className="w-4 h-4" />}
              <span>{isHifzMode ? 'Hifz Test: ON (Text Hidden)' : 'Hifz Test Mode'}</span>
            </button>

            {/* Font size control */}
            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl border border-border">
              <button
                onClick={() => setFontSizeClass('text-xl')}
                className={`px-2 py-1 min-h-[36px] rounded-lg text-xs font-medium ${
                  fontSizeClass === 'text-xl' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
                }`}
              >
                A-
              </button>
              <button
                onClick={() => setFontSizeClass('text-2xl')}
                className={`px-2 py-1 min-h-[36px] rounded-lg text-xs font-medium ${
                  fontSizeClass === 'text-2xl' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
                }`}
              >
                A
              </button>
              <button
                onClick={() => setFontSizeClass('text-3xl')}
                className={`px-2 py-1 min-h-[36px] rounded-lg text-xs font-medium ${
                  fontSizeClass === 'text-3xl' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
                }`}
              >
                A+
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="px-3 py-1.5 min-h-[44px] rounded-xl bg-muted/50 border border-border hover:bg-muted text-muted-foreground flex items-center gap-1.5 font-medium transition-all"
            >
              <Settings2 className="w-4 h-4" />
              <span>Audio & Repetition</span>
            </button>
          </div>
        </div>

        {/* Collapsible Audio & Reciter Settings */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden pt-3 border-t border-border/60"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-muted/30 p-3 sm:p-4 rounded-xl border border-border/60 text-xs sm:text-sm">
                {/* Reciter selection */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Qari / Reciter</label>
                  <select
                    value={selectedReciter}
                    onChange={(e) => {
                      setSelectedReciter(e.target.value)
                      if (isPlaying) {
                        playAyah(currentPlayingAyah, currentRepeatCount)
                      }
                    }}
                    className="w-full h-10 px-2.5 text-xs sm:text-sm font-medium rounded-lg bg-background border border-input focus:ring-1 focus:ring-emerald-500"
                  >
                    {RECITERS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.style})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-muted-foreground">{activeReciterMeta.description}</p>
                </div>

                {/* Repetitions per verse */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Repeat each Ayah</label>
                  <select
                    value={targetRepeats}
                    onChange={(e) => setTargetRepeats(Number(e.target.value))}
                    className="w-full h-10 px-2.5 text-xs sm:text-sm font-medium rounded-lg bg-background border border-input focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value={1}>1 time (Normal)</option>
                    <option value={2}>2 times</option>
                    <option value={3}>3 times (Recommended)</option>
                    <option value={5}>5 times (Hifz Memorization)</option>
                    <option value={7}>7 times (Mastery)</option>
                    <option value={10}>10 times (Deep Hifz)</option>
                  </select>
                  <p className="text-[11px] text-muted-foreground">Repeats each verse before moving to next</p>
                </div>

                {/* Pause after verse toggle */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Pause for Repetition</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsPauseEnabled(!isPauseEnabled)}
                      className={`px-3 py-2 h-10 rounded-lg text-xs font-semibold flex-1 border transition-all ${
                        isPauseEnabled
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-background text-muted-foreground border-input'
                      }`}
                    >
                      {isPauseEnabled ? '1.5s Pause (Active)' : 'No Pause'}
                    </button>
                    <button
                      onClick={cyclePlaybackSpeed}
                      className="px-3 py-2 h-10 rounded-lg text-xs font-semibold bg-background border border-input hover:bg-muted text-foreground transition-all min-w-[60px]"
                      title="Playback Speed"
                    >
                      {playbackSpeed}x
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Allows student to recite back during gap</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MUSHAF ARABIC SCRIPT VIEWER */}
      <div className="bg-card border border-border/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Surah Ornamental Header Banner */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-emerald-800 text-white py-6 px-4 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="relative z-10 space-y-1">
            <span className="text-xs uppercase tracking-widest text-emerald-200/80 font-medium">
              {currentSurah.revelation_type} · Surah {currentSurah.number}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-wide font-serif">
              {currentSurah.name_ar}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 font-medium">
              {currentSurah.name_en} — &ldquo;{currentSurah.translation}&rdquo; ({currentSurah.total_ayahs} Ayahs)
            </p>
          </div>
        </div>

        {/* Bismillah (except Surah At-Tawbah #9 and Al-Fatiha #1 where it is ayah 1) */}
        {selectedSurahNum !== 9 && (
          <div className="text-center py-5 border-b border-border/40 bg-muted/20">
            <p className="text-2xl sm:text-3xl font-arabic text-foreground/90 select-none">
              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </p>
          </div>
        )}

        {/* Verses Container */}
        <div className="p-4 sm:p-8 space-y-6 min-h-[320px]">
          {isLoadingVerses ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Loading authentic Uthmani verses...</p>
            </div>
          ) : versesError ? (
            <div className="text-center py-12 space-y-3">
              <p className="text-sm text-red-500">{versesError}</p>
              <button
                onClick={() => handleSurahChange(selectedSurahNum)}
                className="px-4 py-2 min-h-[44px] text-xs font-semibold bg-primary text-primary-foreground rounded-xl"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedVerses.map((verse) => {
                const isPlayingThisAyah = isPlaying && currentPlayingAyah === verse.numberInSurah
                const isMasked = isHifzMode && !revealedAyahs.has(verse.numberInSurah)

                return (
                  <div
                    key={verse.numberInSurah}
                    ref={(el) => {
                      if (el) ayahRefs.current.set(verse.numberInSurah, el)
                      else ayahRefs.current.delete(verse.numberInSurah)
                    }}
                    onClick={() => {
                      if (isHifzMode) {
                        toggleAyahReveal(verse.numberInSurah)
                      } else {
                        jumpToAyah(verse.numberInSurah)
                      }
                    }}
                    className={`group relative p-4 sm:p-5 rounded-2xl transition-all cursor-pointer border ${
                      isPlayingThisAyah
                        ? 'bg-emerald-500/10 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                        : 'bg-card hover:bg-muted/40 border-border/60 hover:border-border'
                    }`}
                  >
                    {/* Ayah Header Bar (Verse number, status, repeat badge) */}
                    <div className="flex items-center justify-between gap-2 pb-3 mb-2 border-b border-border/40 text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                            isPlayingThisAyah
                              ? 'bg-emerald-600 text-white'
                              : 'bg-muted text-muted-foreground group-hover:bg-muted/80'
                          }`}
                        >
                          {verse.numberInSurah}
                        </span>
                        <span className="text-muted-foreground font-medium">
                          Ayah {verse.numberInSurah} of {currentSurah.total_ayahs}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isPlayingThisAyah && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] animate-pulse">
                            Repeating {currentRepeatCount} / {targetRepeats}
                          </span>
                        )}
                        {isHifzMode && (
                          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                            {isMasked ? 'Tap to reveal' : 'Revealed'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Arabic Text Display */}
                    <div className="text-right py-2 leading-loose" dir="rtl">
                      <p
                        className={`font-arabic text-foreground select-none transition-all duration-200 ${fontSizeClass} ${
                          isMasked ? 'blur-md select-none opacity-40 hover:opacity-60' : 'opacity-100'
                        }`}
                        style={{ fontFamily: "'Traditional Arabic', 'Scheherazade New', 'Amiri', serif" }}
                      >
                        {verse.text}{' '}
                        <span className="inline-block px-1.5 text-emerald-600 dark:text-emerald-400 font-serif font-bold text-lg select-none">
                          ۝{verse.numberInSurah}
                        </span>
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* FLOATING / STICKY BOTTOM AUDIO PLAYER CONTROLLER */}
      <div className="sticky bottom-3 z-30 bg-card/95 backdrop-blur-md border border-border/90 rounded-2xl p-3 sm:p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Active Status Info */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isPlaying ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'
                }`}
              >
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-foreground">
                  {currentSurah.name_en} : Ayah {currentPlayingAyah}
                </p>
                <p className="text-[11px] text-muted-foreground truncate max-w-[200px] sm:max-w-[260px]">
                  {activeReciterMeta.name} {targetRepeats > 1 && `(${currentRepeatCount}/${targetRepeats}x)`}
                </p>
              </div>
            </div>

            {/* Quick Speed Switcher on Mobile */}
            <button
              onClick={cyclePlaybackSpeed}
              className="sm:hidden px-2.5 py-1 text-xs font-semibold rounded-lg bg-muted text-foreground border border-border"
            >
              {playbackSpeed}x
            </button>
          </div>

          {/* Core Audio Controls (Previous, Play/Pause, Next, Reset) */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-center">
            {/* Reset to start */}
            <button
              onClick={() => {
                stopAudio()
                setCurrentPlayingAyah(fromAyah)
                setCurrentRepeatCount(1)
              }}
              className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all active:scale-95"
              title="Restart from beginning of portion"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Previous Ayah */}
            <button
              onClick={handlePreviousAyah}
              disabled={currentPlayingAyah <= fromAyah}
              className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-all active:scale-95"
              title="Previous Ayah"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Play / Pause Primary Button */}
            <button
              onClick={togglePlayPause}
              disabled={isLoadingVerses || !!versesError}
              className="w-12 h-12 min-h-[48px] min-w-[48px] rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg hover:shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>

            {/* Next Ayah */}
            <button
              onClick={handleNextAyah}
              disabled={currentPlayingAyah >= toAyah}
              className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-all active:scale-95"
              title="Next Ayah"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Mute toggle */}
            <button
              onClick={() => {
                setIsMuted(!isMuted)
                if (audioRef.current) audioRef.current.muted = !isMuted
              }}
              className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all active:scale-95"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Desktop Speed indicator */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={cyclePlaybackSpeed}
              className="px-3 py-1.5 min-h-[44px] text-xs font-semibold rounded-xl bg-muted/60 hover:bg-muted text-foreground border border-border transition-all"
              title="Click to change playback speed"
            >
              Speed: {playbackSpeed}x
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
