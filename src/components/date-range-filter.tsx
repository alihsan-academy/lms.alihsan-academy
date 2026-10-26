"use client"

import React, { useState } from 'react'
import { Calendar, Filter, ChevronRight } from 'lucide-react'
import { DateFilterType, DateRange, getDateRange } from '@/lib/attendance-utils'
import { motion } from 'framer-motion'

interface DateRangeFilterProps {
  currentFilter: DateFilterType
  customStart: string
  customEnd: string
  onFilterChange: (filter: DateFilterType, customStart?: string, customEnd?: string) => void
  resolvedRange: DateRange
  className?: string
}

export function DateRangeFilter({
  currentFilter,
  customStart,
  customEnd,
  onFilterChange,
  resolvedRange,
  className = '',
}: DateRangeFilterProps) {
  const [localStart, setLocalStart] = useState(customStart || '')
  const [localEnd, setLocalEnd] = useState(customEnd || '')

  const filterOptions: { id: DateFilterType; label: string }[] = [
    { id: 'last_7_days', label: 'Last 7 Days' },
    { id: 'last_30_days', label: 'Last 30 Days' },
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'all_time', label: 'All Time' },
    { id: 'custom', label: 'Custom Range' },
  ]

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault()
    if (localStart && localEnd) {
      onFilterChange('custom', localStart, localEnd)
    }
  }

  return (
    <div className={`bg-white rounded-2xl p-4 md:p-5 border-2 border-border shadow-sm space-y-4 ${className}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-xl text-primary">
            <Filter className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Filter Attendance Period</span>
            <p className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
              <span>{resolvedRange.label}</span>
            </p>
          </div>
        </div>

        {/* Quick buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {filterOptions.map((opt) => {
            const isActive = currentFilter === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => {
                  if (opt.id === 'custom') {
                    onFilterChange('custom', localStart || customStart, localEnd || customEnd)
                  } else {
                    onFilterChange(opt.id)
                  }
                }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Custom date range picker drawer */}
      {currentFilter === 'custom' && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          onSubmit={handleApplyCustom}
          className="pt-3 border-t-2 border-dashed border-border flex flex-wrap items-center gap-3 bg-muted/20 p-3 rounded-xl"
        >
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-foreground">Custom Period:</span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-0.5">From Date</label>
              <input
                type="date"
                required
                value={localStart}
                onChange={(e) => setLocalStart(e.target.value)}
                className="w-full text-xs font-bold bg-white border-2 border-border rounded-lg px-2.5 py-2 outline-none focus:border-primary"
              />
            </div>

            <ChevronRight className="h-4 w-4 text-muted-foreground hidden sm:block mt-4" />

            <div className="flex-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-0.5">To Date</label>
              <input
                type="date"
                required
                value={localEnd}
                onChange={(e) => setLocalEnd(e.target.value)}
                className="w-full text-xs font-bold bg-white border-2 border-border rounded-lg px-2.5 py-2 outline-none focus:border-primary"
              />
            </div>

            <button
              type="submit"
              className="sm:mt-4 text-xs font-black bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors shadow-sm min-h-[38px] flex items-center justify-center"
            >
              Apply Filter
            </button>
          </div>
        </motion.form>
      )}
    </div>
  )
}
