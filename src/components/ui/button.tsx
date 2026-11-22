import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 shadow-xs",
  {
    variants: {
      variant: {
        default:
          "bg-[#1A6B4A] text-white hover:bg-[#14593C] active:bg-[#104730] shadow-xs cursor-pointer",
        secondary:
          "bg-[#EBF7F0] text-[#1A6B4A] border border-[#C5E8D4] hover:bg-[#DCF3E5] shadow-2xs cursor-pointer",
        outline:
          "border-border bg-white text-foreground hover:bg-slate-50 hover:text-foreground shadow-2xs cursor-pointer",
        ghost:
          "hover:bg-slate-100 hover:text-foreground cursor-pointer shadow-none",
        destructive:
          "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 shadow-2xs cursor-pointer",
        link: "text-[#1A6B4A] underline-offset-4 hover:underline cursor-pointer shadow-none",
      },
      size: {
        default:
          "h-9 gap-1.5 px-3 text-xs sm:text-sm has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        xs: "h-6.5 gap-1 rounded-lg px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-lg px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 rounded-xl px-4 text-sm sm:text-base [&_svg:not([class*='size-'])]:size-4.5",
        icon: "size-8.5 rounded-lg",
        "icon-xs": "size-6.5 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7.5 rounded-lg [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-10 rounded-xl [&_svg:not([class*='size-'])]:size-4.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
