'use client'

import React, { useState } from 'react'
import { cn } from "@/lib/utils"

interface AvatarProps {
  photoUrl?: string | null
  name?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

function normalizePhotoUrl(url?: string | null): string | null {
  if (!url) return null
  // Convert Google Drive view or uc link to high-performance direct thumbnail CDN
  const driveMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (driveMatch && driveMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`
  }
  return url
}

export function Avatar({ photoUrl, name, size = 'md', className = '' }: AvatarProps) {
  const [imageError, setImageError] = useState(false)
  const resolvedUrl = normalizePhotoUrl(photoUrl)

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
  }

  const getColorClass = (name: string) => {
    const firstLetter = (name[0] || 'A').toUpperCase()
    if (firstLetter >= 'A' && firstLetter <= 'E') return 'bg-emerald-400'
    if (firstLetter >= 'F' && firstLetter <= 'J') return 'bg-blue-400'
    if (firstLetter >= 'K' && firstLetter <= 'O') return 'bg-purple-400'
    if (firstLetter >= 'P' && firstLetter <= 'T') return 'bg-orange-400'
    return 'bg-rose-400'
  }

  const sizeClasses = {
    sm: 'w-[32px] h-[32px] text-[11px] border-2',
    md: 'w-[48px] h-[48px] text-base border-2',
    lg: 'w-[96px] h-[96px] text-3xl border-4'
  }

  if (resolvedUrl && !imageError) {
    return (
      <div className={cn(
        "rounded-full overflow-hidden flex-shrink-0 border-white shadow-sm bg-muted",
        sizeClasses[size],
        className
      )}>
        <img
          src={resolvedUrl}
          alt={name || 'User'}
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
          className="w-full h-full object-cover"
        />
      </div>
    )
  }

  const userName = name || 'Unknown'
  return (
    <div className={cn(
      "rounded-full flex items-center justify-center text-white font-black flex-shrink-0 border-white shadow-sm",
      sizeClasses[size],
      getColorClass(userName),
      className
    )}>
      {getInitials(userName)}
    </div>
  )
}

