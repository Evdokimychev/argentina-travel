"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/cn";
import { motionClass } from "@/lib/motion";
import {
  popoverContentShellClass,
  popoverScrollMaxHeightClass,
} from "@/lib/responsive-ui";
import { useMaxSm } from "@/hooks/useMaxSm";

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;

type PopoverContentProps = React.ComponentProps<typeof PopoverPrimitive.Content> & {
  /** Full-width centered panel on mobile (default true). */
  mobileFullWidth?: boolean;
};

function PopoverContent({
  className,
  align,
  side = "bottom",
  sideOffset = 8,
  collisionPadding = 16,
  mobileFullWidth = true,
  ...props
}: PopoverContentProps) {
  const isMobile = useMaxSm();
  const resolvedAlign = isMobile && mobileFullWidth ? "center" : (align ?? "start");

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={resolvedAlign}
        side={side}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
          "z-popover rounded-card border border-border-subtle bg-surface-elevated p-0 shadow-modal outline-none",
          mobileFullWidth && popoverContentShellClass,
          mobileFullWidth && popoverScrollMaxHeightClass,
          motionClass.dropdown,
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverTrigger, PopoverContent };
