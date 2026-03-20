import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden px-2.5 py-0.5 font-medium whitespace-nowrap transition-all [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        // AgentEra design variants
        default:
          "rounded-full text-[12px] bg-card border border-[var(--border-med)] text-muted-foreground",
        orange:
          "rounded-full text-[11px] bg-[var(--orange-dim)] border border-[var(--orange-border)] text-[var(--orange)]",
        green:
          "rounded-full text-[11px] bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.25)] text-[var(--green)]",
        // shadcn base variants — kept for internal component usage
        secondary:
          "rounded-full text-xs bg-secondary text-secondary-foreground",
        destructive:
          "rounded-full text-xs bg-destructive/10 text-destructive",
        outline:
          "rounded-full text-xs border border-border text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
