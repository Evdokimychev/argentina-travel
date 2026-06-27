"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { DialogClose, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";

type DialogPanelHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  className?: string;
  onClose?: () => void;
};

/** Header for p-0 dialog shells: title block + aligned 44×44 close control. */
export function DialogPanelHeader({
  title,
  description,
  eyebrow,
  className,
  onClose,
}: DialogPanelHeaderProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_2.75rem] items-start gap-x-3 border-b border-gray-100 bg-gradient-to-r from-sky/[0.04] to-white px-5 py-4 sm:px-6 sm:py-5",
        className
      )}
    >
      <div className="col-start-1 row-start-1 min-w-0 space-y-1">
        {eyebrow ? <div className="pb-0.5">{eyebrow}</div> : null}
        <DialogTitle className="font-heading text-xl font-bold leading-tight text-charcoal">
          {title}
        </DialogTitle>
        {description ? (
          typeof description === "string" ? (
            <DialogDescription className="text-sm leading-relaxed text-slate">
              {description}
            </DialogDescription>
          ) : (
            description
          )
        ) : null}
      </div>
      <DialogClose
        onClick={onClose}
        className="col-start-2 row-start-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate transition-colors hover:bg-gray-100 hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
        aria-label="Закрыть"
      >
        <X className="h-5 w-5" strokeWidth={2} />
      </DialogClose>
    </div>
  );
}
