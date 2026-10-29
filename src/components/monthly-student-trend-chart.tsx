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
  ChevronRight,
  PauseCircle,
  UserX,
  BookOpen
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

type ViewMetric = 'active' | 'break' | 'stopped' | 'enrolments' | 'classes'
type TimeRange = '6m' | '12m' | '18m'

interface MonthStat {
  monthKey: string
  label: string
  shortLabel: string
  fullLabel: string
  startDate: Date
  endDate: Date
  activeCount: number
  breakCount: number
  stoppedCount: number
  newEnrolments: number
  classesCount: number
  growthDelta: number
  growthPercent: number
}

function safeParseDate(val: unknown): Date | null {
  if (!val) return null
  try {
    if (typeof val === 'string') {
      if (val.length === 10) return new Date(`${val}T00:00:00`)
      return parseISO(val)
    }
    if (val instanceof Date) return val
    return new Date(val as any)
  } catch {
    return null
  }
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
        const joinDate = safeParseDate(s.academy_joined_date || s.joined_date || s.created_at)
        if (!joinDate) return false
        return isWithinInterval(joinDate, { start, end })
      }).length

      // 2. Stopped classes during this month
      const stoppedCount = students.filter((s: any) => {
        if (s.enrolment_status !== 'stopped' && !s.last_class_date) return false
        const stopDate = safeParseDate(s.last_class_date || s.updated_at)
        if (!stopDate) return false
        return isWithinInterval(stopDate, { start, end })
      }).length

      // 3. Students on break during this month
      const breakCount = students.filter((s: any) => {
        const joinDate = safeParseDate(s.academy_joined_date || s.joined_date || s.created_at)
        if (joinDate && joinDate > end) return false

        // Check if stopped before this month began
        if (s.enrolment_status === 'stopped') {
          const stopDate = safeParseDate(s.last_class_date || s.updated_at)
          if (stopDate && stopDate < start) return false
        }

        if (s.break_from_date) {
          const bStart = safeParseDate(s.break_from_date)
          const bEnd = s.break_to_date ? safeParseDate(s.break_to_date) : new Date(8640000000000000)
          if (bStart && bEnd) {
            return bStart <= end && bEnd >= start
          }
        }

        return s.enrolment_status === 'break'
      }).length

      // 4. Active students in this month
      const activeCount = students.filter((s: any) => {
        const joinDate = safeParseDate(s.academy_joined_date || s.joined_date || s.created_at)
        if (!joinDate) return false
        if (joinDate > end) return false // Joined after this month

        // If stopped, was it before this month started?
        if (s.enrolment_status === 'stopped') {
          const stopDate = safeParseDate(s.last_class_date || s.updated_at)
          if (stopDate && stopDate < start) {
            // Check if had classes in this month
            const hadClasses = classes.some((c: any) => {
              if (c.student_id !== s.id || !c.scheduled_at) return false
              const cDate = safeParseDate(c.scheduled_at)
              return cDate && cDate >= start && cDate <= end
            })
            if (!hadClasses) return false
          }
        }

        // If on complete break for whole month
        if (s.break_from_date && s.break_to_date) {
          const bStart = safeParseDate(s.break_from_date)
          const bEnd = safeParseDate(s.break_to_date)
          if (bStart && bEnd && bStart <= start && bEnd >= end) {
            return false // Full break for entire month
          }
        }

        return true
      }).length

      // 5. Classes conducted/scheduled in this month
      const classesCount = classes.filter((c: any) => {
        if (!c.scheduled_at) return false
        const cDate = safeParseDate(c.scheduled_at)
        return cDate && cDate >= start && cDate <= end
      }).length

      months.push({
        monthKey,
        label,
        shortLabel,
        fullLabel,
        startDate: start,
        endDate: end,
        activeCount,
        breakCount,
        stoppedCount,
        newEnrolments,
        classesCount,
        growthDelta: 0,
        growthPercent: 0
      })
    }

    // Compute month-over-month growth for active count
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
    if (selectedMetric === 'break') return m.breakCount
    if (selectedMetric === 'stopped') return m.stoppedCount
    if (selectedMetric === 'enrolments') return m.newEnrolments
    return m.classesCount
  }

  const maxValue = useMemo(() => {
    const vals = monthlyData.map(getValue)
    const max = Math.max(...vals, 1)
    return Math.max(max + 1, 5)
  }, [monthlyData, selectedMetric])

  // Active highlighted item (defaults to current month if not hovering)
  const activeStat = activeHoverIndex !== null
    ? monthlyData[activeHoverIndex]
    : currentMonthStat

  // Configuration for each view metric
  const metricConfigs = {
    active: {
      label: 'Active Students',
      shortLabel: 'Active',
      gradient: 'from-[#1A6B4A] via-emerald-600 to-teal-500',
      hoverGradient: 'from-emerald-700 via-emerald-600 to-teal-500',
      pillBg: 'bg-emerald-700 text-white',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      accentColor: 'text-emerald-700',
      icon: Users
    },
    break: {
      label: 'Students On Break',
      shortLabel: 'On Break',
      gradient: 'from-amber-500 via-amber-500 to-yellow-400',
      hoverGradient: 'from-amber-600 via-amber-500 to-yellow-500',
      pillBg: 'bg-amber-600 text-white',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
      accentColor: 'text-amber-700',
      icon: PauseCircle
    },
    stopped: {
      label: 'Class Stopped',
      shortLabel: 'Stopped',
      gradient: 'from-rose-600 via-rose-500 to-red-400',
      hoverGradient: 'from-rose-700 via-rose-600 to-red-500',
      pillBg: 'bg-rose-600 text-white',
      badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
      accentColor: 'text-rose-700',
      icon: UserX
    },
    enrolments: {
      label: 'New Admissions',
      shortLabel: 'Admissions',
      gradient: 'from-blue-600 via-blue-500 to-cyan-400',
      hoverGradient: 'from-blue-700 via-blue-600 to-cyan-500',
      pillBg: 'bg-blue-600 text-white',
      badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
      accentColor: 'text-blue-700',
      icon: UserPlus
    },
    classes: {
      label: 'Classes Held',
      shortLabel: 'Classes',
      gradient: 'from-purple-600 via-purple-500 to-indigo-400',
      hoverGradient: 'from-purple-700 via-purple-600 to-indigo-500',
      pillBg: 'bg-purple-600 text-white',
      badgeBg: 'bg-purple-50 text-purple-800 border-purple-200',
      accentColor: 'text-purple-700',
      icon: BookOpen
    }
  }

  const currentCfg = metricConfigs[selectedMetric]

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
                Monthly Student Trend & Analysis
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                Track active counts, students on break, discontinued classes, and admissions month-over-month.
              </p>
            </div>
          </div>
        </div>

        {/* View Switchers */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Metric Selector */}
          <div className="bg-muted/80 p-1 rounded-xl flex items-center border border-border flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setSelectedMetric('active')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedMetric === 'active'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setSelectedMetric('break')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedMetric === 'break'
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              On Break
            </button>
            <button
              type="button"
              onClick={() => setSelectedMetric('stopped')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedMetric === 'stopped'
                  ? 'bg-white text-rose-800 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Stopped
            </button>
            <button
              type="button"
              onClick={() => setSelectedMetric('enrolments')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedMetric === 'enrolments'
                  ? 'bg-white text-blue-800 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Admissions
            </button>
            <button
              type="button"
              onClick={() => setSelectedMetric('classes')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedMetric === 'classes'
                  ? 'bg-white text-purple-800 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Classes
            </button>
          </div>

          {/* Time range selector */}
          <div className="bg-muted/80 p-1 rounded-xl flex items-center border border-border">
            {(['6m', '12m', '18m'] as TimeRange[]).map((r) => (
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        <div className="bg-muted/30 p-3 rounded-xl border border-border">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block truncate">
            Current Active
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl sm:text-2xl font-black text-emerald-800">
              {currentMonthStat?.activeCount ?? 0}
            </span>
            <span className="text-xs font-bold text-muted-foreground">students</span>
          </div>
        </div>

        <div className="bg-muted/30 p-3 rounded-xl border border-border">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block truncate">
            Current On Break
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl sm:text-2xl font-black text-amber-700">
              {currentMonthStat?.breakCount ?? 0}
            </span>
            <span className="text-xs font-bold text-muted-foreground">students</span>
          </div>
        </div>

        <div className="bg-muted/30 p-3 rounded-xl border border-border">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block truncate">
            Stopped This Month
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl sm:text-2xl font-black text-rose-700">
              {currentMonthStat?.stoppedCount ?? 0}
            </span>
            <span className="text-xs font-bold text-muted-foreground">students</span>
          </div>
        </div>

        <div className="bg-muted/30 p-3 rounded-xl border border-border">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block truncate">
            Period Growth
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className={`text-xl sm:text-2xl font-black ${netGrowth >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {netGrowth > 0 ? `+${netGrowth}` : netGrowth}
            </span>
            <span className="text-xs font-bold text-muted-foreground">net active</span>
          </div>
        </div>

        <div className="bg-muted/30 p-3 rounded-xl border border-border">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block truncate">
            Peak Active Month
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-base sm:text-lg font-black text-foreground truncate">
              {peakStat ? peakStat.shortLabel : '—'}
            </span>
            <span className="text-xs font-bold text-emerald-700 truncate">
              ({peakStat?.activeCount ?? 0})
            </span>
          </div>
        </div>

        <div className="bg-muted/30 p-3 rounded-xl border border-border">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block truncate">
            Monthly Average
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl sm:text-2xl font-black text-foreground">
              {avgActive}
            </span>
            <span className="text-xs font-bold text-muted-foreground">active/mo</span>
          </div>
        </div>
      </div>

      {/* Main Visual Chart Container */}
      <div className="bg-slate-50/70 rounded-2xl p-4 sm:p-5 border border-slate-200/80">
        {/* Interactive Highlight Banner */}
        {activeStat && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white rounded-xl border border-border shadow-2xs">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl border ${currentCfg.badgeBg}`}>
                <currentCfg.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-foreground block">
                    {activeStat.fullLabel}
                  </span>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${currentCfg.badgeBg}`}>
                    {currentCfg.label}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs font-semibold text-muted-foreground">
                  <span className="text-emerald-700 font-bold">
                    Active: <strong className="text-foreground">{activeStat.activeCount}</strong>
                  </span>
                  <span>·</span>
                  <span className="text-amber-700 font-bold">
                    On Break: <strong className="text-foreground">{activeStat.breakCount}</strong>
                  </span>
                  <span>·</span>
                  <span className="text-rose-700 font-bold">
                    Stopped: <strong className="text-foreground">{activeStat.stoppedCount}</strong>
                  </span>
                  <span>·</span>
                  <span className="text-blue-700 font-bold">
                    New Joined: <strong className="text-foreground">{activeStat.newEnrolments}</strong>
                  </span>
                  <span>·</span>
                  <span className="text-purple-700 font-bold">
                    Classes: <strong className="text-foreground">{activeStat.classesCount}</strong>
                  </span>
                </div>
              </div>
            </div>

            {onSelectMonth && (
              <button
                type="button"
                onClick={() => onSelectMonth(
                  format(activeStat.startDate, 'yyyy-MM-dd'),
                  format(activeStat.endDate, 'yyyy-MM-dd')
                )}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
              >
                <span>Filter Dashboard to {activeStat.shortLabel}</span>
                <ChevronRight className="h-3.5 w-3.5" />
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
          <div
            className="relative z-10 grid gap-2 sm:gap-4 h-60 items-end"
            style={{ gridTemplateColumns: `repeat(${monthlyData.length}, minmax(0, 1fr))` }}
          >
            {monthlyData.map((stat, idx) => {
              const val = getValue(stat)
              const heightPct = Math.max((val / maxValue) * 100, val > 0 ? 10 : 4)
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
                        ? currentCfg.pillBg
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
                      transition={{ duration: 0.5, delay: idx * 0.04 }}
                      className={`w-full rounded-t-xl transition-all relative overflow-hidden ${
                        isHovered
                          ? `bg-gradient-to-t ${currentCfg.hoverGradient} shadow-md ring-2 ring-emerald-400`
                          : isCurrent
                          ? `bg-gradient-to-t ${currentCfg.gradient} shadow-xs`
                          : 'bg-gradient-to-t from-slate-300 to-slate-400 group-hover:from-emerald-300 group-hover:to-emerald-500'
                      }`}
                    >
                      {/* Sub-bar overlay to indicate new enrolments when viewing active */}
                      {selectedMetric === 'active' && stat.newEnrolments > 0 && (
                        <div
                          style={{
                            height: `${Math.min((stat.newEnrolments / Math.max(stat.activeCount, 1)) * 100, 100)}%`
                          }}
                          className="absolute bottom-0 inset-x-0 bg-white/25 border-t border-white/40"
                          title={`${stat.newEnrolments} admissions in ${stat.label}`}
                        />
                      )}
                    </motion.div>
                  </div>

                  {/* X-Axis Month Label */}
                  <div className="mt-3 text-center">
                    <span
                      className={`block text-xs font-bold transition-colors ${
                        isHovered || isCurrent ? 'text-foreground font-black' : 'text-muted-foreground'
                      }`}
                    >
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
          <div className="flex flex-wrap items-center gap-4">
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
                <span className="font-medium text-muted-foreground">Admissions Portion</span>
              </div>
            )}
          </div>
          <span className="text-[11px] font-medium text-muted-foreground italic">
            Tip: Click any month bar to set the dashboard period filter
          </span>
        </div>
      </div>
    </div>
  )
}
