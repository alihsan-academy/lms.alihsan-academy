import React from 'react'
import { cn } from "@/lib/utils"

interface AvatarProps {
  photoUrl?: string | null
  name?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Avatar({ photoUrl, name, size = 'md', className = '' }: AvatarProps) {
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

  if (photoUrl) {
    return (
      <div className={cn(
        "rounded-full overflow-hidden flex-shrink-0 border-white shadow-sm bg-white",
        sizeClasses[size],
        className
      )}>
        <img src={photoUrl} alt={name || 'User'} className="w-full h-full object-cover" />
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
