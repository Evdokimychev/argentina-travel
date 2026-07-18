"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/cn";
import { motionClass } from "@/lib/motion";

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

function TooltipContent({
  className,
  sideOffset = 7,
  collisionPadding = 12,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
          "z-[120] max-w-64 rounded-lg bg-charcoal px-3 py-2 text-xs leading-relaxed text-white shadow-lg",
          motionClass.dropdown,
          className,
        )}
        {...props}
      >
        {props.children}
        <TooltipPrimitive.Arrow className="fill-charcoal" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent };
