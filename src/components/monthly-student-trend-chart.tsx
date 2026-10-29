"use client"

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  TrendingUp,
  UserPlus,
  Calendar,
  Sparkles,
  BarChart3,
  Award,
  ChevronRight
} from 'lucide-react'
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  parseISO
} from 'date-fns'

interface MonthlyStudentTrendChartProps {
  students: any[]
  classes?: any[]
  onSelectMonth?: (startStr: string, endStr: string) => void
  className?: string
}

type ViewMetric = 'active' | 'enrolments' | 'classes'
type TimeRange = '6m' | '12m' | 'all'

interface MonthStat {
  monthKey: string
  label: string
  shortLabel: string
  fullLabel: string
  startDate: Date
  endDate: Date
  activeCount: number
  newEnrolments: number
  classesCount: number
  growthDelta: number
  growthPercent: number
}

export function MonthlyStudentTrendChart({
  students,
  classes = [],
  onSelectMonth,
  className = ''
}: MonthlyStudentTrendChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<ViewMetric>('active')
  const [timeRange, setTimeRange] = useState<TimeRange>('6m')
  const [activeHoverIndex, setActiveHoverIndex] = useState<number | null>(null)

  // Compute month-by-month statistics
  const monthlyData: MonthStat[] = useMemo(() => {
    const now = new Date()
    const monthsCount = timeRange === '6m' ? 6 : timeRange === '12m' ? 12 : 18

    const months: MonthStat[] = []

    for (let i = monthsCount - 1; i >= 0; i--) {
      const monthDate = subMonths(now, i)
      const start = startOfMonth(monthDate)
      const end = endOfMonth(monthDate)
      const monthKey = format(monthDate, 'yyyy-MM')
      const label = format(monthDate, 'MMM yyyy')
      const shortLabel = format(monthDate, 'MMM')
      const fullLabel = format(monthDate, 'MMMM yyyy')

      // 1. New enrolments in this month
      const newEnrolments = students.filter((s: any) => {
        const joinStr = s.academy_joined_date || s.created_at
        if (!joinStr) return false
        try {
          const joinDate = typeof joinStr === 'string' ? parseISO(joinStr) : new Date(joinStr)
          return isWithinInterval(joinDate, { start, end })
        } catch {
          return false
        }
      }).length

      // 2. Total active students by end of this month
      const activeCount = students.filter((s: any) => {
        const joinStr = s.academy_joined_date || s.created_at
        if (!joinStr) return false
        try {
          const joinDate = typeof joinStr === 'string' ? parseISO(joinStr) : new Date(joinStr)
          // Must have joined on or before this month's end
          if (joinDate > end) return false

          // If stopped, must not have stopped before this month's start
          if (s.enrolment_status === 'stopped') {
            const stopStr = s.last_class_date || s.updated_at || s.created_at
            if (stopStr) {
              const stopDate = typeof stopStr === 'string' ? parseISO(stopStr) : new Date(stopStr)
              if (stopDate < start) {
                // If they stopped before this month began, check if they had classes in this month
                const hadClasses = classes.some((c: any) => {
                  if (c.student_id !== s.id || !c.scheduled_at) return false
                  const cDate = new Date(c.scheduled_at)
                  return cDate >= start && cDate <= end
                })
                if (!hadClasses) return false
              }
            }
          }

          return true
        } catch {
          return false
        }
      }).length

      // 3. Classes conducted in this month
      const classesCount = classes.filter((c: any) => {
        if (!c.scheduled_at) return false
        try {
          const cDate = new Date(c.scheduled_at)
          return cDate >= start && cDate <= end
        } catch {
          return false
        }
      }).length

      months.push({
        monthKey,
        label,
        shortLabel,
        fullLabel,
        startDate: start,
        endDate: end,
        activeCount,
        newEnrolments,
        classesCount,
        growthDelta: 0,
        growthPercent: 0
      })
    }

    // Compute month-over-month growth
    for (let i = 0; i < months.length; i++) {
      if (i > 0) {
        const prev = months[i - 1].activeCount
        const curr = months[i].activeCount
        months[i].growthDelta = curr - prev
        months[i].growthPercent = prev > 0 ? Math.round(((curr - prev) / prev) * 100) : 0
      }
    }

    return months
  }, [students, classes, timeRange])

  // Summary KPIs
  const currentMonthStat = monthlyData[monthlyData.length - 1]
  const firstMonthStat = monthlyData[0]
  const netGrowth = currentMonthStat && firstMonthStat
    ? currentMonthStat.activeCount - firstMonthStat.activeCount
    : 0

  const peakStat = useMemo(() => {
    if (monthlyData.length === 0) return null
    return monthlyData.reduce((prev, curr) =>
      curr.activeCount > prev.activeCount ? curr : prev
    , monthlyData[0])
  }, [monthlyData])

  const avgActive = useMemo(() => {
    if (monthlyData.length === 0) return 0
    const sum = monthlyData.reduce((acc, m) => acc + m.activeCount, 0)
    return Math.round((sum / monthlyData.length) * 10) / 10
  }, [monthlyData])

  // Value getter for chart rendering based on selected metric
  const getValue = (m: MonthStat) => {
    if (selectedMetric === 'active') return m.activeCount
    if (selectedMetric === 'enrolments') return m.newEnrolments
    return m.classesCount
  }

  const maxValue = useMemo(() => {
    const vals = monthlyData.map(getValue)
    const max = Math.max(...vals, 1)
    // Add small headroom
    return Math.max(max + 1, 5)
  }, [monthlyData, selectedMetric])

  // Active highlighted item (defaults to current month if not hovering)
  const activeStat = activeHoverIndex !== null
    ? monthlyData[activeHoverIndex]
    : currentMonthStat

  return (
    <div className={`bg-white rounded-2xl border-2 border-border shadow-sm p-4 sm:p-6 space-y-5 ${className}`}>
      {/* Top Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-[#1A6B4A] rounded-xl border border-emerald-200">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-foreground">
                Student Enrolment & Monthly Trend
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                Visualise monthly active students, admission trends, and academy momentum.
              </p>
            </div>
          </div>
        </div>

        {/* View Switchers */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Metric Selector */}
          <div className="bg-muted/80 p-1 rounded-xl flex items-center border border-border">
            <button
              type="button"
              onClick={() => setSelectedMetric('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedMetric === 'active'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Active Students
            </button>
            <button
              type="button"
              onClick={() => setSelectedMetric('enrolments')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedMetric === 'enrolments'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              New Enrolments
            </button>
            <button
              type="button"
              onClick={() => setSelectedMetric('classes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedMetric === 'classes'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Classes
            </button>
          </div>

          {/* Time range selector */}
          <div className="bg-muted/80 p-1 rounded-xl flex items-center border border-border">
            {(['6m', '12m'] as TimeRange[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeRange === r
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="bg-muted/30 p-3 rounded-xl border border-border">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Current Active
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl sm:text-2xl font-black text-foreground">
              {currentMonthStat?.activeCount ?? 0}
            </span>
            <span className="text-xs font-bold text-muted-foreground">students</span>
          </div>
        </div>

        <div className="bg-muted/30 p-3 rounded-xl border border-border">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Period Growth
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className={`text-xl sm:text-2xl font-black ${netGrowth >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {netGrowth > 0 ? `+${netGrowth}` : netGrowth}
            </span>
            <span className="text-xs font-bold text-muted-foreground">net change</span>
          </div>
        </div>

        <div className="bg-muted/30 p-3 rounded-xl border border-border">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Peak Month
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-base sm:text-lg font-black text-foreground truncate">
              {peakStat ? peakStat.shortLabel : '—'}
            </span>
            <span className="text-xs font-bold text-emerald-700">
              ({peakStat?.activeCount ?? 0} students)
            </span>
          </div>
        </div>

        <div className="bg-muted/30 p-3 rounded-xl border border-border">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Monthly Average
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl sm:text-2xl font-black text-foreground">
              {avgActive}
            </span>
            <span className="text-xs font-bold text-muted-foreground">avg / mo</span>
          </div>
        </div>
      </div>

      {/* Main Visual Chart Container */}
      <div className="bg-slate-50/70 rounded-2xl p-4 sm:p-5 border border-slate-200/80">
        {/* Interactive Highlight Banner */}
        {activeStat && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 p-3 bg-white rounded-xl border border-border shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              <div>
                <span className="text-xs font-black text-foreground block">
                  {activeStat.fullLabel}
                </span>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {selectedMetric === 'active' && `${activeStat.activeCount} active students`}
                  {selectedMetric === 'enrolments' && `${activeStat.newEnrolments} new students joined`}
                  {selectedMetric === 'classes' && `${activeStat.classesCount} class sessions scheduled`}
                  {activeStat.growthDelta !== 0 && selectedMetric === 'active' && (
                    <span className={`ml-2 font-bold ${activeStat.growthDelta > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      ({activeStat.growthDelta > 0 ? `+${activeStat.growthDelta}` : activeStat.growthDelta} vs prev month)
                    </span>
                  )}
                </span>
              </div>
            </div>

            {onSelectMonth && (
              <button
                type="button"
                onClick={() => onSelectMonth(
                  format(activeStat.startDate, 'yyyy-MM-dd'),
                  format(activeStat.endDate, 'yyyy-MM-dd')
                )}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
              >
                <span>Filter Dashboard to this Month</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        {/* Graphical Bars & Trend Curves */}
        <div className="relative pt-6 pb-2">
          {/* Y-Axis Gridlines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-30">
            <div className="border-b border-dashed border-slate-300 w-full" />
            <div className="border-b border-dashed border-slate-300 w-full" />
            <div className="border-b border-dashed border-slate-300 w-full" />
            <div className="border-b border-slate-300 w-full" />
          </div>

          {/* Bars Column Container */}
          <div className="relative z-10 grid gap-2 sm:gap-4 h-56 items-end"
            style={{ gridTemplateColumns: `repeat(${monthlyData.length}, minmax(0, 1fr))` }}
          >
            {monthlyData.map((stat, idx) => {
              const val = getValue(stat)
              const heightPct = Math.max((val / maxValue) * 100, val > 0 ? 10 : 3)
              const isHovered = activeHoverIndex === idx
              const isCurrent = idx === monthlyData.length - 1

              return (
                <div
                  key={stat.monthKey}
                  onMouseEnter={() => setActiveHoverIndex(idx)}
                  onMouseLeave={() => setActiveHoverIndex(null)}
                  onClick={() => {
                    setActiveHoverIndex(idx)
                    if (onSelectMonth) {
                      onSelectMonth(
                        format(stat.startDate, 'yyyy-MM-dd'),
                        format(stat.endDate, 'yyyy-MM-dd')
                      )
                    }
                  }}
                  className="flex flex-col items-center justify-end h-full group cursor-pointer"
                >
                  {/* Floating Value Pill */}
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mb-2 px-2 py-0.5 rounded-md text-[11px] font-black tracking-tight transition-all ${
                      isHovered
                        ? 'bg-slate-900 text-white scale-110 shadow-md'
                        : isCurrent
                        ? 'bg-emerald-700 text-white'
                        : 'bg-white text-foreground border border-border shadow-2xs'
                    }`}
                  >
                    {val}
                  </motion.div>

                  {/* Vertical Bar */}
                  <div className="w-full max-w-[42px] sm:max-w-[56px] h-full flex items-end">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPct}%` }}
                      transition={{ duration: 0.5, delay: idx * 0.05 }}
                      className={`w-full rounded-t-xl transition-all relative overflow-hidden ${
                        isHovered
                          ? 'bg-gradient-to-t from-emerald-700 via-emerald-600 to-teal-500 shadow-md ring-2 ring-emerald-400'
                          : isCurrent
                          ? 'bg-gradient-to-t from-[#1A6B4A] to-emerald-500 shadow-xs'
                          : 'bg-gradient-to-t from-slate-300 to-slate-400 group-hover:from-emerald-300 group-hover:to-emerald-500'
                      }`}
                    >
                      {/* Sub-bar overlay to indicate new enrolments */}
                      {selectedMetric === 'active' && stat.newEnrolments > 0 && (
                        <div
                          style={{ height: `${Math.min((stat.newEnrolments / Math.max(stat.activeCount, 1)) * 100, 100)}%` }}
                          className="absolute bottom-0 inset-x-0 bg-white/20 border-t border-white/40"
                          title={`${stat.newEnrolments} new students joined in ${stat.label}`}
                        />
                      )}
                    </motion.div>
                  </div>

                  {/* X-Axis Month Label */}
                  <div className="mt-3 text-center">
                    <span className={`block text-xs font-bold transition-colors ${
                      isHovered || isCurrent ? 'text-foreground font-black' : 'text-muted-foreground'
                    }`}>
                      {stat.shortLabel}
                    </span>
                    <span className="block text-[10px] text-muted-foreground/80 font-medium">
                      {stat.startDate.getFullYear()}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend / Info footer */}
        <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-[#1A6B4A]" />
              <span className="font-semibold text-foreground">Current Month</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-slate-300" />
              <span className="font-semibold text-muted-foreground">Historical Months</span>
            </div>
            {selectedMetric === 'active' && (
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-white/40 border border-slate-400" />
                <span className="font-medium text-muted-foreground">New Admissions Portion</span>
              </div>
            )}
          </div>
          <span className="text-[11px] font-medium text-muted-foreground italic">
            Tip: Click any month bar to filter the entire dashboard
          </span>
        </div>
      </div>
    </div>
  )
}
