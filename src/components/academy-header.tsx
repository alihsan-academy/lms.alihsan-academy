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
    <div className="flex items-center gap-3">
      <Link href="/" className="flex items-center gap-2.5 text-inherit no-underline">
        {/* Official Direction B Vector Minaret */}
        <svg
          style={{
            width: isSm ? "26px" : isLg ? "38px" : "30px",
            height: isSm ? "30px" : isLg ? "44px" : "36px",
            flexShrink: 0,
          }}
          viewBox="0 0 100 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M50 5 L65 30 L35 30 Z" fill="#E8A020" />
          <path d="M30 35 C55 33, 70 38, 75 42 L72 50 C55 46, 40 45, 27 48 Z" fill="#1A6B4A" />
          <path d="M24 53 C55 50, 75 55, 80 60 L77 68 C55 64, 38 63, 21 66 Z" fill="#1A6B4A" />
          <path d="M18 71 C55 67, 80 73, 85 78 L81 86 C55 81, 35 80, 15 84 Z" fill="#1A6B4A" />
          <rect x="25" y="90" width="8" height="8" fill="#E8A020" />
        </svg>

        <div className="flex flex-col justify-center">
          <div
            className={`font-bold tracking-tight text-[#1A6B4A] leading-tight ${
              isSm ? "text-[14px]" : isLg ? "text-[22px]" : "text-[16px]"
            }`}
          >
            AL IHSAN Academy
          </div>
          {showTagline ? (
            <div
              className={`text-[#92A89B] font-semibold uppercase tracking-[0.08em] ${
                isSm ? "text-[9px]" : isLg ? "text-[11px]" : "text-[10px]"
              }`}
            >
              Moral Education
            </div>
          ) : null}
        </div>
      </Link>

      {portalName && (
        <>
          <div className="h-6 w-px bg-[#DDE4E0] mx-1" />
          <span className="text-[13px] font-bold text-[#1A2B23]">{portalName}</span>
        </>
      )}
    </div>
  )
}

