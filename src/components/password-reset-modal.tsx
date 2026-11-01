"use client"

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { SecurityPasswordCard } from '@/components/security-password-card'

interface PasswordResetModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail: string
  userName?: string
  role?: 'student' | 'teacher' | 'admin' | 'superadmin'
}

export function PasswordResetModal({
  isOpen,
  onClose,
  userEmail,
  userName,
  role = 'admin'
}: PasswordResetModalProps) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-border/80 overflow-hidden my-auto"
        >
          <div className="relative">
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3.5 top-3.5 z-10 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <SecurityPasswordCard
              userEmail={userEmail}
              userName={userName}
              role={role}
              className="border-none shadow-none rounded-none"
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
