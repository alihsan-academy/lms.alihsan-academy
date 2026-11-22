"use client"

import React from "react"
import Link from "next/link"

interface AcademyHeaderProps {
  size?: "sm" | "md" | "lg"
  showTagline?: boolean
  portalName?: string
}

export function AcademyHeader({ size = "md", showTagline = true, portalName }: AcademyHeaderProps) {
  const isSm = size === "sm"
  const isLg = size === "lg"

  return (
    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
      <Link href="/" className="flex items-center text-inherit no-underline group focus:outline-none">
        <img
          src="/alihsan-official-logo.png"
          alt="AL IHSAN Academy"
          className={`w-auto object-contain transition-transform duration-150 group-hover:scale-[1.02] ${
            isSm ? "h-9 sm:h-10" : isLg ? "h-12 sm:h-14" : "h-10 sm:h-11"
          }`}
        />
      </Link>

      {portalName && (
        <>
          <div className="h-5 sm:h-6 w-px bg-[#DDE4E0] mx-0.5 sm:mx-1 shrink-0" />
          <span className="text-xs sm:text-[13px] font-bold text-[#1A2B23] truncate max-w-[110px] sm:max-w-none">{portalName}</span>
        </>
      )}
    </div>
  )
}

