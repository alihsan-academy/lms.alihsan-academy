"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import React from "react"

interface BouncyButtonProps extends React.ComponentProps<typeof Button> {
  className?: string
}

export const BouncyButton = React.forwardRef<HTMLButtonElement, BouncyButtonProps>(
  ({ className, ...props }, ref) => {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className="inline-block"
      >
        <Button 
          ref={ref}
          className={cn(
            "rounded-xl font-bold shadow-sm transition-shadow hover:shadow-md",
            className
          )} 
          {...props} 
        />
      </motion.div>
    )
  }
)

BouncyButton.displayName = "BouncyButton"
