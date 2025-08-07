import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none border-2 border-gray-900 shadow-[3px_3px_0_#111] focus-visible:ring-4 focus-visible:ring-indigo-200",
  {
    variants: {
      variant: {
        default:
          "bg-yellow-300 text-gray-900 hover:bg-yellow-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_#111]",
        destructive:
          "bg-red-400 text-white hover:bg-red-300 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_#111]",
        outline:
          "bg-white text-gray-900 hover:bg-gray-50 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_#111]",
        secondary:
          "bg-blue-300 text-gray-900 hover:bg-blue-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_#111]",
        ghost:
          "border-transparent shadow-none hover:bg-gray-100",
        link: "text-indigo-600 underline-offset-4 hover:underline border-transparent shadow-none",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-9 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-12 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-10",
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
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
