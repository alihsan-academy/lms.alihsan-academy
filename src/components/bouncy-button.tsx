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
      <div className="inline-block">
        <Button 
          ref={ref}
          className={cn(
            "rounded-md font-medium shadow-none border transition-colors",
            className
          )} 
          {...props} 
        />
      </div>
    )
  }
)

BouncyButton.displayName = "BouncyButton"
