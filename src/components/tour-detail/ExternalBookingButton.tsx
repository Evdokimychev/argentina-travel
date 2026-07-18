"use client";

import { ExternalLink } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { TourCustomBookingLinkPublic } from "@/types/tour-custom-booking-link";
import type { MouseEvent } from "react";

interface ExternalBookingButtonProps {
  href: string;
  link: TourCustomBookingLinkPublic;
  label?: string;
  ariaLabel?: string;
  className?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}

export default function ExternalBookingButton({
  href,
  link,
  label,
  ariaLabel,
  className,
  onClick,
}: ExternalBookingButtonProps) {
  return (
    <a
      href={href}
      target={link.openInNewTab ? "_blank" : undefined}
      rel={link.openInNewTab ? "noopener noreferrer" : undefined}
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(buttonVariants({ variant: "default" }), "w-full gap-2", className)}
    >
      <span className="min-w-0 truncate">{label ?? link.label}</span>
      <ExternalLink className="h-4 w-4" aria-hidden />
    </a>
  );
}
