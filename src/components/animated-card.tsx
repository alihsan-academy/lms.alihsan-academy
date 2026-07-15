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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 24, 
        delay 
      }}
      whileHover={{ y: -4, scale: 1.01 }}
      className={cn(
        "rounded-2xl border-2 bg-card text-card-foreground shadow-sm transition-all hover:shadow-md",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}
