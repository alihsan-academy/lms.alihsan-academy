"use client"

import { motion, HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

interface AnimatedCardProps extends HTMLMotionProps<"div"> {
  className?: string
  children: React.ReactNode
  delay?: number
}

export function AnimatedCard({ className, children, delay = 0, ...props }: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ 
        duration: 0.15,
        delay 
      }}
      className={cn(
        "rounded-xl border border-border bg-card text-card-foreground shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}
