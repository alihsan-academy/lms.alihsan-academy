"use client"

import React, { useState, useEffect } from 'react'
import { QuranAssignment, SURAH_LIST } from '@/lib/quran-data'
import { QuranPlayer } from './QuranPlayer'
import {
  BookOpen,
  Sparkles,
  CheckCircle2,
  Clock,
  Calendar,
  Flame,
  Award,
  ChevronRight,
  History,
  Layers,
  Volume2
} from 'lucide-react'
import { toast } from 'sonner'

export function StudentQuranSpace() {
  const [assignments, setAssignments] = useState<QuranAssignment[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [selectedAssignment, setSelectedAssignment] = useState<QuranAssignment | null>(null)
  const [activeTab, setActiveTab] = useState<'player' | 'history'>('player')

  const fetchMyAssignments = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/quran/assignments')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch assignments')

      const list: QuranAssignment[] = data.assignments || []
      setAssignments(list)

      // Set the first active/assigned portion as default if none selected yet
      if (!selectedAssignment && list.length > 0) {
        const active = list.find((a) => a.status !== 'completed') || list[0]
        setSelectedAssignment(active)
      }
    } catch (err: any) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMyAssignments()
  }, [])

  const handleProgressUpdated = (updated: QuranAssignment) => {
    setAssignments((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a))
    )
    if (selectedAssignment?.id === updated.id) {
      setSelectedAssignment(updated)
    }
  }

  const activePortions = assignments.filter((a) => a.status !== 'completed')
  const completedPortions = assignments.filter((a) => a.status === 'completed')

  return (
    <div className="space-y-6">
      {/* Top Welcome Card */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-emerald-950 text-white rounded-3xl p-5 sm:p-7 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#fff_2px,transparent_2px)] [background-size:20px_20px] pointer-events-none" />
        <div className="relative z-10 space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-700/60 text-emerald-200 text-xs font-semibold backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Quran & Tajweed Learning</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            My Quran Lessons & Audio Reader
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            Listen to authentic recitations from renowned Qaris, practice repeating verses for Hifz, and track your daily memorization.
          </p>
        </div>
      </div>

      {/* ACTIVE ASSIGNED PORTIONS CAROUSEL / GRID */}
      {activePortions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              Active Portions Assigned by Teacher ({activePortions.length})
            </h3>
            {completedPortions.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {completedPortions.length} portions in revision
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activePortions.map((a) => {
              const isSelected = selectedAssignment?.id === a.id
              const isOverdue = a.due_date && new Date(a.due_date) < new Date()

              return (
                <div
                  key={a.id}
                  onClick={() => {
                    setSelectedAssignment(a)
                    setActiveTab('player')
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
                      : 'bg-card hover:bg-muted/40 border-border/80'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2 py-0.5 rounded-full font-semibold bg-emerald-600 text-white uppercase text-[10px]">
                        {a.assignment_type === 'hifz' ? 'Hifz' : 'Recitation'}
                      </span>
                      {isOverdue ? (
                        <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                          Due: {new Date(a.due_date!).toLocaleDateString()}
                        </span>
                      ) : a.due_date ? (
                        <span className="text-[11px] text-muted-foreground">
                          Due: {new Date(a.due_date).toLocaleDateString()}
                        </span>
                      ) : null}
                    </div>

                    <h4 className="text-base font-bold text-foreground">
                      Surah {a.surah_name_en} ({a.surah_name_ar})
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Ayahs <strong>{a.from_ayah}</strong> to <strong>{a.to_ayah}</strong> ({a.to_ayah - a.from_ayah + 1} verses)
                    </p>

                    {a.teacher_note && (
                      <p className="text-xs text-muted-foreground bg-muted/40 p-2 rounded-lg italic line-clamp-2">
                        &ldquo;{a.teacher_note}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Flame className="w-3.5 h-3.5 text-orange-500" />
                      Listened: <strong className="text-foreground">{a.listened_count}x</strong>
                    </span>

                    <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                      {isSelected ? 'Loaded in Player' : 'Open in Player'}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TABS: CORE PLAYER VS REVISION HISTORY */}
      <div className="flex items-center gap-2 border-b border-border pb-1">
        <button
          onClick={() => setActiveTab('player')}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'player'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <Volume2 className="w-4 h-4" />
          Interactive Quran Reader & Audio
        </button>

        {completedPortions.length > 0 && (
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <History className="w-4 h-4" />
            Revision History ({completedPortions.length})
          </button>
        )}
      </div>

      {/* MAIN VIEW */}
      {activeTab === 'player' ? (
        <QuranPlayer
          initialAssignment={selectedAssignment}
          onProgressUpdated={handleProgressUpdated}
          userRole="student"
        />
      ) : (
        <div className="space-y-3">
          <div className="p-4 bg-muted/20 border border-border/80 rounded-2xl">
            <p className="text-xs sm:text-sm text-muted-foreground">
              These are Quran portions you have previously completed and mastered. You can re-open any portion anytime to revise (*Muraja&rsquo;ah*) and keep your memorization sharp.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {completedPortions.map((a) => (
              <div
                key={a.id}
                className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3 hover:border-emerald-500/50 transition-all cursor-pointer"
                onClick={() => {
                  setSelectedAssignment(a)
                  setActiveTab('player')
                }}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mastered ({a.assignment_type === 'hifz' ? 'Hifz' : 'Reading'})</span>
                  </div>
                  <h4 className="text-sm font-bold text-foreground">
                    Surah {a.surah_name_en} ({a.from_ayah}–{a.to_ayah})
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Total practice count: {a.listened_count} times
                  </p>
                </div>

                <button className="px-3 py-1.5 min-h-[38px] text-xs font-semibold rounded-xl bg-muted hover:bg-emerald-600 hover:text-white transition-all">
                  Revise Now
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
