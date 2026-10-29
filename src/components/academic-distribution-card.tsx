"use client"

import React, { useMemo } from 'react'
import { GraduationCap, BookOpen, Layers, Users, ArrowUpRight, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { AnimatedCard } from '@/components/animated-card'

export function normalizeTerm(rawTerm?: string | null): 'Term 1' | 'Term 2' | 'Unassigned' {
  if (!rawTerm) return 'Unassigned'
  const t = String(rawTerm).trim().toLowerCase()
  if (t === 'term 1' || t === 'term-01' || t === 'term 01' || t === 'term-1' || t === 'term1' || t === '1') return 'Term 1'
  if (t === 'term 2' || t === 'term-02' || t === 'term 02' || t === 'term-2' || t === 'term2' || t === '2') return 'Term 2'
  if (t.includes('1')) return 'Term 1'
  if (t.includes('2')) return 'Term 2'
  return 'Unassigned'
}

export function normalizeYear(rawYear?: string | null, rawClass?: string | null): string {
  const val = rawYear || rawClass
  if (!val) return 'Unassigned'
  const y = String(val).trim()
  if (!y || y.toLowerCase() === 'n/a' || y.toLowerCase() === 'null') return 'Unassigned'
  if (/^\d+$/.test(y)) return `Year ${y}`
  return y
}

export interface YearTermRow {
  year: string
  rawYear: string
  term1Count: number
  term2Count: number
  unassignedTermCount: number
  total: number
}

interface AcademicDistributionCardProps {
  students: any[]
  onSelectYear?: (year: string) => void
  onSelectTerm?: (term: string) => void
}

export function AcademicDistributionCard({
  students,
  onSelectYear,
  onSelectTerm,
}: AcademicDistributionCardProps) {
  const distributionData = useMemo(() => {
    const yearMap = new Map<string, YearTermRow>()
    let term1Total = 0
    let term2Total = 0
    let unassignedTermTotal = 0

    students.forEach((s) => {
      const yearLabel = normalizeYear(s.year, s.class_name)
      const termLabel = normalizeTerm(s.term)

      if (termLabel === 'Term 1') term1Total++
      else if (termLabel === 'Term 2') term2Total++
      else unassignedTermTotal++

      if (!yearMap.has(yearLabel)) {
        yearMap.set(yearLabel, {
          year: yearLabel,
          rawYear: s.year || s.class_name || yearLabel,
          term1Count: 0,
          term2Count: 0,
          unassignedTermCount: 0,
          total: 0,
        })
      }

      const row = yearMap.get(yearLabel)!
      if (termLabel === 'Term 1') row.term1Count++
      else if (termLabel === 'Term 2') row.term2Count++
      else row.unassignedTermCount++
      row.total++
    })

    // Sort years naturally: Year 1, Year 2, Year 3... then others, Unassigned last
    const rows = Array.from(yearMap.values()).sort((a, b) => {
      if (a.year === 'Unassigned') return 1
      if (b.year === 'Unassigned') return -1

      const numA = parseInt(a.year.replace(/\D/g, ''), 10)
      const numB = parseInt(b.year.replace(/\D/g, ''), 10)

      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB
      }
      return a.year.localeCompare(b.year)
    })

    return {
      rows,
      term1Total,
      term2Total,
      unassignedTermTotal,
      totalStudents: students.length,
      totalYears: rows.filter((r) => r.year !== 'Unassigned').length,
    }
  }, [students])

  const { rows, term1Total, term2Total, totalStudents, totalYears } = distributionData

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm shadow-xs border border-primary/20">
              <Layers className="h-4 w-4" />
            </span>
            Academic Year & Term Distribution
          </h3>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">
            Student breakdown across academic years, separated by Term 1 and Term 2
          </p>
        </div>
      </div>

      {/* Top 3 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Term 1 Card */}
        <div 
          onClick={() => onSelectTerm?.('Term 1')}
          className={`bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-2 border-emerald-500/20 rounded-2xl p-4 transition-all ${
            onSelectTerm ? 'cursor-pointer hover:border-emerald-500/40 hover:shadow-xs active:scale-[0.99]' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
              Term 1 Students
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {totalStudents > 0 ? Math.round((term1Total / totalStudents) * 100) : 0}%
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-950">{term1Total}</span>
            <span className="text-xs font-semibold text-emerald-700">enrolled</span>
          </div>
        </div>

        {/* Term 2 Card */}
        <div 
          onClick={() => onSelectTerm?.('Term 2')}
          className={`bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-2 border-amber-500/20 rounded-2xl p-4 transition-all ${
            onSelectTerm ? 'cursor-pointer hover:border-amber-500/40 hover:shadow-xs active:scale-[0.99]' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-amber-600" />
              Term 2 Students
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              {totalStudents > 0 ? Math.round((term2Total / totalStudents) * 100) : 0}%
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-950">{term2Total}</span>
            <span className="text-xs font-semibold text-amber-700">enrolled</span>
          </div>
        </div>

        {/* Academic Years Active */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/20 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5 text-primary" />
              Active Academic Years
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {totalStudents} total
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-foreground">{totalYears}</span>
            <span className="text-xs font-semibold text-muted-foreground">year levels</span>
          </div>
        </div>
      </div>

      {/* Year & Term Distribution Table Matrix */}
      <AnimatedCard delay={0.15} className="p-0 overflow-hidden border-2 border-border shadow-xs">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[620px]">
            <thead>
              <tr className="bg-muted/80 border-b-2 border-border text-xs font-black text-foreground uppercase tracking-wider">
                <th className="py-3 px-4 w-44">Academic Year</th>
                <th className="py-3 px-4 text-center w-32">
                  <span className="inline-flex items-center gap-1 text-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    Term 1
                  </span>
                </th>
                <th className="py-3 px-4 text-center w-32">
                  <span className="inline-flex items-center gap-1 text-amber-800">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                    Term 2
                  </span>
                </th>
                <th className="py-3 px-4 text-center w-28">Total</th>
                <th className="py-3 px-4 text-left">Term 1 / Term 2 Split</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rows.length > 0 ? (
                rows.map((row, idx) => {
                  const t1Pct = row.total > 0 ? Math.round((row.term1Count / row.total) * 100) : 0
                  const t2Pct = row.total > 0 ? Math.round((row.term2Count / row.total) * 100) : 0

                  return (
                    <motion.tr 
                      key={row.year}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectYear?.(row.year)}
                            className="font-extrabold text-sm text-foreground hover:text-primary transition-colors flex items-center gap-1 cursor-pointer text-left"
                            title="Filter students by this year"
                          >
                            <span>{row.year}</span>
                            {onSelectYear && <ArrowUpRight className="h-3 w-3 text-muted-foreground" />}
                          </button>
                        </div>
                      </td>

                      {/* Term 1 Count */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[32px] px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {row.term1Count}
                        </span>
                      </td>

                      {/* Term 2 Count */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[32px] px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-50 text-amber-800 border border-amber-200">
                          {row.term2Count}
                        </span>
                      </td>

                      {/* Total in Year */}
                      <td className="py-3 px-4 text-center">
                        <span className="font-black text-sm text-foreground">
                          {row.total}
                        </span>
                      </td>

                      {/* Visual Split Bar */}
                      <td className="py-3 px-4">
                        <div className="w-full max-w-xs space-y-1">
                          <div className="w-full h-2 rounded-full bg-muted overflow-hidden flex">
                            {t1Pct > 0 && (
                              <div 
                                style={{ width: `${t1Pct}%` }}
                                className="h-full bg-emerald-500" 
                                title={`Term 1: ${row.term1Count} (${t1Pct}%)`}
                              />
                            )}
                            {t2Pct > 0 && (
                              <div 
                                style={{ width: `${t2Pct}%` }}
                                className="h-full bg-amber-500" 
                                title={`Term 2: ${row.term2Count} (${t2Pct}%)`}
                              />
                            )}
                          </div>
                          <div className="flex justify-between text-[10px] font-bold text-muted-foreground px-0.5">
                            <span className="text-emerald-700">T1: {t1Pct}%</span>
                            <span className="text-amber-700">T2: {t2Pct}%</span>
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground font-bold text-xs">
                    No student records found.
                  </td>
                </tr>
              )}
            </tbody>

            {/* Total Footer Row */}
            {rows.length > 0 && (
              <tfoot>
                <tr className="bg-muted/90 border-t-2 border-border font-black text-xs text-foreground">
                  <td className="py-3 px-4 uppercase tracking-wider">Total Academy Enrolment</td>
                  <td className="py-3 px-4 text-center font-black text-emerald-800 text-sm">{term1Total}</td>
                  <td className="py-3 px-4 text-center font-black text-amber-800 text-sm">{term2Total}</td>
                  <td className="py-3 px-4 text-center font-black text-foreground text-sm">{totalStudents}</td>
                  <td className="py-3 px-4 text-muted-foreground font-bold text-[11px]">
                    {term1Total} in Term 1 · {term2Total} in Term 2
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </AnimatedCard>
    </div>
  )
}
