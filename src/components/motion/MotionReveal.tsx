"use client";

import { createElement } from "react";
import { cn } from "@/lib/cn";
import { motionRevealClass } from "@/lib/motion";
import { useRevealAnimation } from "@/hooks/useRevealAnimation";

type MotionRevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Stagger delay in ms — use sparingly for grid items */
  delay?: 100 | 200 | 300;
  as?: "div" | "section" | "article" | "li" | "header";
};

/**
 * Scroll-triggered section reveal. Respects prefers-reduced-motion via useRevealAnimation.
 */
export function MotionReveal({
  children,
  className,
  delay,
  as: Tag = "div",
}: MotionRevealProps) {
  const { ref, revealed } = useRevealAnimation<HTMLElement>();

  return createElement(Tag, {
    ref,
    className: cn(!revealed && "opacity-0", revealed && motionRevealClass(delay), className),
    children,
  });
}
