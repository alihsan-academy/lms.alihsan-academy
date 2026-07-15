"use client"

import React from "react";
import { motion } from "framer-motion";

interface AcademyHeaderProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

export function AcademyHeader({ size = "md", showTagline = true }: AcademyHeaderProps) {
  const sizeClasses = {
    sm: "h-8",
    md: "h-10",
    lg: "h-20",
  };

  const nameClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl",
  };

  const taglineClasses = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-base",
  };

  return (
    <div className="flex items-center gap-4">
      <motion.img
        whileHover={{ rotate: [-5, 5, -5, 0], scale: 1.1 }}
        transition={{ duration: 0.5 }}
        src="/alihsan-logo.png"
        alt="Al Ihsan Academy"
        className={`${sizeClasses[size]} object-contain mix-blend-multiply cursor-pointer`}
      />
      <div className="flex flex-col justify-center">
        <h1 className={`${nameClasses[size]} font-extrabold text-primary tracking-tight leading-tight`}>
          {size === "lg" ? "AL IHSAN Academy of Moral Education" : "AL IHSAN Academy"}
        </h1>
        {showTagline && (
          <p className={`${taglineClasses[size]} text-muted-foreground font-medium mt-0.5`}>
            Building a generation for tomorrow 🌟
          </p>
        )}
      </div>
    </div>
  );
}
