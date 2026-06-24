"use client";

import { useEffect } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { motionClass } from "@/lib/motion";
import { useSiteHeaderOverlayLock } from "@/hooks/useSiteHeaderOverlayLock";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;
const DialogPortal = DialogPrimitive.Portal;

function SiteHeaderOverlayLockEffect() {
  useSiteHeaderOverlayLock(true);
  return null;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-[115] bg-charcoal/50 backdrop-blur-sm",
        motionClass.overlay,
        className
      )}
      {...props}
    />
  );
}

interface DialogContentProps extends React.ComponentProps<typeof DialogPrimitive.Content> {
  /** Mobile bottom sheet + centered panel on sm+ (default). */
  bottomSheet?: boolean;
  showClose?: boolean;
}

function DialogContent({
  className,
  children,
  bottomSheet = true,
  showClose = false,
  onOpenAutoFocus,
  ...props
}: DialogContentProps) {
  return (
    <DialogPortal>
      <SiteHeaderOverlayLockEffect />
      <DialogOverlay />
      <DialogPrimitive.Content
        onOpenAutoFocus={onOpenAutoFocus}
        className={cn(
          "fixed z-[115] bg-surface-elevated shadow-modal outline-none",
          motionClass.modalContent,
          bottomSheet
            ? "inset-x-0 bottom-0 max-h-[92vh] w-full overflow-y-auto rounded-t-2xl pb-[env(safe-area-inset-bottom,0px)] sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[85vh] sm:w-[calc(100%-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:pb-0"
            : "left-1/2 top-1/2 w-[calc(100%-2rem)] max-h-[85vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl",
          className
        )}
        {...props}
      >
        {children}
        {showClose ? (
          <DialogPrimitive.Close
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

/** Единые отступы модального окна: px-5 py-4 sm:px-6 */
const dialogSectionPaddingClass = "px-5 py-4 sm:px-6";

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 border-b border-border-subtle",
        dialogSectionPaddingClass,
        className
      )}
      {...props}
    />
  );
}

function DialogBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(dialogSectionPaddingClass, className)} {...props} />;
}

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 border-t border-border-subtle sm:flex-row sm:justify-end",
        dialogSectionPaddingClass,
        className
      )}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn("font-heading text-xl font-bold text-foreground", className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description className={cn("text-sm text-muted", className)} {...props} />
  );
}

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
