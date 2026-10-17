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
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.12 }}
        className="inline-block"
      >
        <Button 
          ref={ref}
          className={cn(
            "rounded-lg font-semibold shadow-none border transition-colors",
            className
          )} 
          {...props} 
        />
      </motion.div>
    )
  }
)

BouncyButton.displayName = "BouncyButton"
