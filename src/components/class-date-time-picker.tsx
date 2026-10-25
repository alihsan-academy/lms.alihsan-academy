'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  Check, 
  Sparkles, 
  Globe 
} from 'lucide-react'
import { 
  format, 
  parseISO, 
  startOfToday, 
  addDays, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isBefore,
  isValid
} from 'date-fns'

// -------------------------------------------------------------
// CLASS DATE PICKER
// -------------------------------------------------------------
interface ClassDatePickerProps {
  value: string // "YYYY-MM-DD"
  onChange: (dateStr: string) => void
  label?: string
  minDate?: Date
}

export function ClassDatePicker({
  value,
  onChange,
  label = 'Class Date',
  minDate = startOfToday()
}: ClassDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Current view month in the calendar
  const initialDate = value && isValid(parseISO(value)) ? parseISO(value) : minDate
  const [viewMonth, setViewMonth] = useState<Date>(initialDate)

  // Sync viewMonth when value changes externally
  useEffect(() => {
    if (value && isValid(parseISO(value))) {
      setViewMonth(parseISO(value))
    }
  }, [value])

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const selectedDate = value && isValid(parseISO(value)) ? parseISO(value) : null
  const today = startOfToday()

  // Generate days grid for viewMonth
  const monthStart = startOfMonth(viewMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: startDate, end: endDate })

  const quickPresets = [
    { label: 'Today', date: today },
    { label: 'Tomorrow', date: addDays(today, 1) },
    { label: 'In 2 Days', date: addDays(today, 2) },
    { label: 'Next Week', date: addDays(today, 7) }
  ]

  const handleSelectDate = (date: Date) => {
    const formatted = format(date, 'yyyy-MM-dd')
    onChange(formatted)
    setIsOpen(false)
  }

  const formattedDisplay = selectedDate 
    ? format(selectedDate, 'EEE, d MMM yyyy')
    : 'Select class date'

  return (
    <div className="relative space-y-2" ref={containerRef}>
      <label className="text-foreground font-bold text-sm block">{label}</label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-14 px-4 rounded-xl border-2 transition-all flex items-center justify-between text-left ${
          isOpen 
            ? 'border-primary ring-4 ring-primary/10 bg-white' 
            : 'border-border bg-muted/20 hover:bg-muted/40 hover:border-primary/40'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div className="truncate">
            <span className={`block font-bold text-sm sm:text-base leading-tight ${selectedDate ? 'text-foreground' : 'text-muted-foreground'}`}>
              {formattedDisplay}
            </span>
            {selectedDate && (
              <span className="text-[11px] font-semibold text-muted-foreground block">
                {isSameDay(selectedDate, today) ? 'Scheduled for today' : format(selectedDate, 'EEEE')}
              </span>
            )}
          </div>
        </div>
        <ChevronDown className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform ${isOpen ? 'rotate-180 text-primary' : ''}`} />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 sm:right-auto sm:w-[350px] mt-2 bg-white border-2 border-border/80 rounded-2xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-150">
          {/* Quick Preset Buttons */}
          <div className="mb-3.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-secondary" /> Quick Select
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {quickPresets.map((preset) => {
                const isSelected = selectedDate && isSameDay(selectedDate, preset.date)
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleSelectDate(preset.date)}
                    className={`px-2 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-muted/40 hover:bg-muted text-foreground border-border/60 hover:border-primary/40'
                    }`}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="border-t border-border/60 pt-3">
            {/* Month & Year Navigation Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <button
                type="button"
                onClick={() => setViewMonth(subMonths(viewMonth, 1))}
                className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <span className="font-black text-sm text-foreground">
                {format(viewMonth, 'MMMM yyyy')}
              </span>

              <button
                type="button"
                onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                title="Next Month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Days of Week */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <span key={d} className="text-[11px] font-bold text-muted-foreground/70 py-0.5">
                  {d}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, idx) => {
                const isCurrentMonth = isSameMonth(day, viewMonth)
                const isSelected = selectedDate && isSameDay(day, selectedDate)
                const isDayToday = isSameDay(day, today)
                const isPast = isBefore(day, today)

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isPast}
                    onClick={() => handleSelectDate(day)}
                    className={`h-9 w-full rounded-lg text-xs font-bold transition-all flex items-center justify-center relative ${
                      isSelected
                        ? 'bg-primary text-white shadow-sm font-black'
                        : isPast
                        ? 'text-muted-foreground/30 cursor-not-allowed'
                        : !isCurrentMonth
                        ? 'text-muted-foreground/40 hover:bg-muted/30'
                        : 'text-foreground hover:bg-primary/10 hover:text-primary'
                    }`}
                  >
                    {format(day, 'd')}
                    {isDayToday && !isSelected && (
                      <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// -------------------------------------------------------------
// CLASS TIME PICKER
// -------------------------------------------------------------
interface ClassTimePickerProps {
  value: string // "HH:mm" (24-hour format, e.g. "15:30")
  onChange: (timeStr: string) => void
  label?: string
}

export function ClassTimePicker({
  value,
  onChange,
  label = 'Class Time'
}: ClassTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Parse 24h "HH:mm" into 12h parts
  const parse24To12 = (val: string) => {
    if (!val || !val.includes(':')) {
      return { hour12: '04', minute: '00', period: 'PM' as 'AM' | 'PM' }
    }
    const [hStr, mStr] = val.split(':')
    const hNum = parseInt(hStr, 10) || 0
    const mNum = parseInt(mStr, 10) || 0

    const period: 'AM' | 'PM' = hNum >= 12 ? 'PM' : 'AM'
    const h12Num = hNum % 12 === 0 ? 12 : hNum % 12
    const hour12 = h12Num.toString().padStart(2, '0')
    const minute = mNum.toString().padStart(2, '0')
    return { hour12, minute, period }
  }

  // Convert 12h parts back to 24h "HH:mm"
  const format12To24 = (h12: string, min: string, per: 'AM' | 'PM') => {
    let h = parseInt(h12, 10) || 12
    if (per === 'PM' && h < 12) h += 12
    if (per === 'AM' && h === 12) h = 0
    return `${h.toString().padStart(2, '0')}:${min.padStart(2, '0')}`
  }

  const { hour12, minute, period } = parse24To12(value)

  // Internal state when picker is open
  const [selectedHour, setSelectedHour] = useState(hour12)
  const [selectedMinute, setSelectedMinute] = useState(minute)
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>(period)

  useEffect(() => {
    const parsed = parse24To12(value)
    setSelectedHour(parsed.hour12)
    setSelectedMinute(parsed.minute)
    setSelectedPeriod(parsed.period)
  }, [value])

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const applyTime = (h: string, m: string, p: 'AM' | 'PM') => {
    setSelectedHour(h)
    setSelectedMinute(m)
    setSelectedPeriod(p)
    const time24 = format12To24(h, m, p)
    onChange(time24)
  }

  // Quick preset slots commonly used in academies
  const quickTimeSlots = [
    { label: '09:00 AM', h: '09', m: '00', p: 'AM' as const },
    { label: '10:30 AM', h: '10', m: '30', p: 'AM' as const },
    { label: '11:30 AM', h: '11', m: '30', p: 'AM' as const },
    { label: '02:00 PM', h: '02', m: '00', p: 'PM' as const },
    { label: '03:30 PM', h: '03', m: '30', p: 'PM' as const },
    { label: '04:30 PM', h: '04', m: '30', p: 'PM' as const },
    { label: '05:00 PM', h: '05', m: '00', p: 'PM' as const },
    { label: '06:30 PM', h: '06', m: '30', p: 'PM' as const },
    { label: '07:30 PM', h: '07', m: '30', p: 'PM' as const }
  ]

  const hoursList = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
  const minutesList = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']

  const displayTime = value 
    ? `${hour12}:${minute} ${period} (UK Time)`
    : 'Select class time'

  return (
    <div className="relative space-y-2" ref={containerRef}>
      <label className="text-foreground font-bold text-sm block">{label}</label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-14 px-4 rounded-xl border-2 transition-all flex items-center justify-between text-left ${
          isOpen 
            ? 'border-primary ring-4 ring-primary/10 bg-white' 
            : 'border-border bg-muted/20 hover:bg-muted/40 hover:border-primary/40'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div className="truncate">
            <span className={`block font-bold text-sm sm:text-base leading-tight ${value ? 'text-foreground' : 'text-muted-foreground'}`}>
              {displayTime}
            </span>
            {value && (
              <span className="text-[11px] font-semibold text-emerald-700 block">
                Scheduled in UK Time
              </span>
            )}
          </div>
        </div>
        <ChevronDown className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform ${isOpen ? 'rotate-180 text-primary' : ''}`} />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 sm:right-auto sm:w-[360px] mt-2 bg-white border-2 border-border/80 rounded-2xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-150">
          {/* Quick Preset Slots */}
          <div className="mb-3.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-secondary" /> Common Class Slots
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {quickTimeSlots.map((slot) => {
                const isSelected = 
                  selectedHour === slot.h && 
                  selectedMinute === slot.m && 
                  selectedPeriod === slot.p

                return (
                  <button
                    key={slot.label}
                    type="button"
                    onClick={() => {
                      applyTime(slot.h, slot.m, slot.p)
                    }}
                    className={`px-2 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-muted/40 hover:bg-muted text-foreground border-border/60 hover:border-primary/40'
                    }`}
                  >
                    {slot.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Custom Time Selector */}
          <div className="border-t border-border/60 pt-3 space-y-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
              Custom Time (UK)
            </span>

            <div className="flex items-center justify-between gap-2 bg-muted/30 p-2.5 rounded-xl border border-border/60">
              {/* Hour Select */}
              <div className="flex-1 space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase text-center block">Hour</span>
                <select
                  value={selectedHour}
                  onChange={(e) => applyTime(e.target.value, selectedMinute, selectedPeriod)}
                  className="w-full h-11 px-2 text-center font-black text-base bg-white border-2 border-border rounded-lg focus:border-primary focus:outline-none"
                >
                  {hoursList.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <span className="font-black text-lg text-muted-foreground mt-4">:</span>

              {/* Minute Select */}
              <div className="flex-1 space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase text-center block">Minute</span>
                <select
                  value={selectedMinute}
                  onChange={(e) => applyTime(selectedHour, e.target.value, selectedPeriod)}
                  className="w-full h-11 px-2 text-center font-black text-base bg-white border-2 border-border rounded-lg focus:border-primary focus:outline-none"
                >
                  {minutesList.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* AM / PM Toggle */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase text-center block">Period</span>
                <div className="flex h-11 bg-muted rounded-lg p-0.5 border border-border">
                  <button
                    type="button"
                    onClick={() => applyTime(selectedHour, selectedMinute, 'AM')}
                    className={`px-2.5 rounded-md font-bold text-xs transition-colors ${
                      selectedPeriod === 'AM'
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTime(selectedHour, selectedMinute, 'PM')}
                    className={`px-2.5 rounded-md font-bold text-xs transition-colors ${
                      selectedPeriod === 'PM'
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>

            {/* Timezone Note & Done Button */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-bold text-primary flex items-center gap-1">
                <Globe className="h-3.5 w-3.5 text-primary" /> GMT / BST Time
              </span>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-primary hover:bg-primary/90 text-white flex items-center gap-1 transition-colors"
              >
                <Check className="h-3.5 w-3.5" /> Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
