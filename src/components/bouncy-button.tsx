"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import React from "react"

interface BouncyButtonProps extends React.ComponentProps<typeof Button> {
  className?: string
}

export const BouncyButton = React.forwardRef<HTMLButtonElement, BouncyButtonProps>(
  ({ className, ...props }, ref) => {
    return (
      <Button 
        ref={ref}
        className={cn(
          "transition-all active:scale-[0.98] cursor-pointer",
          className
        )} 
        {...props} 
      />
    )
  }
)

BouncyButton.displayName = "BouncyButton"
