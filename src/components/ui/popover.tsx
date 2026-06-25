"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/cn";
import { motionClass } from "@/lib/motion";

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;

function PopoverContent({
  className,
  align = "start",
  side = "bottom",
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        side={side}
        sideOffset={sideOffset}
        className={cn(
          "z-[110] w-[var(--radix-popover-trigger-width)] min-w-0 max-w-[min(100%,calc(100dvw-2rem))] rounded-card border border-border-subtle bg-surface-elevated p-0 shadow-modal outline-none sm:min-w-[20rem]",
          motionClass.dropdown,
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverTrigger, PopoverContent };
