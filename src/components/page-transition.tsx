"use client"

import { motion } from "framer-motion"
import React from "react"

export function PageTransition({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
