import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-medium font-body transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // AgenticEra design variants
        primary:
          "bg-[var(--orange)] text-white hover:opacity-90 rounded-[10px]",
        secondary:
          "bg-transparent text-foreground border border-[var(--border-med)] hover:bg-card rounded-[10px]",
        ghost:
          "bg-[var(--orange-dim)] border border-[var(--orange-border)] text-[var(--orange)] hover:bg-[rgba(232,121,58,0.2)] rounded-[8px]",
        // shadcn base variants — kept for internal component usage
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 rounded-[10px]",
        outline:
          "border border-border bg-background hover:bg-card hover:text-foreground rounded-[10px]",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-[10px]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // AgenticEra design sizes
        sm: "px-4 py-2 text-[11px]",
        md: "px-[26px] py-[13px] text-[14px]",
        lg: "px-[28px] py-[14px] text-[15px]",
        // shadcn base sizes — kept for internal component usage
        default: "h-8 px-3 text-sm",
        xs: "h-6 px-2 text-xs rounded-md",
        icon: "size-8",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

function Button({
  className,
  variant = "primary",
  size = "md",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
