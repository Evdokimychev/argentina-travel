"use client";

import { useRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { motionClass } from "@/lib/motion";
import { useSiteHeaderOverlayLock } from "@/hooks/useSiteHeaderOverlayLock";
import { useDialogBackClose } from "@/hooks/useDialogBackClose";
import { useDialogSwipeDismiss } from "@/hooks/useDialogSwipeDismiss";

const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;
const DialogPortal = DialogPrimitive.Portal;

type DialogRootProps = React.ComponentProps<typeof DialogPrimitive.Root> & {
  /** Browser/gesture back closes the dialog. Default true. */
  closeOnBackNavigation?: boolean;
};

function Dialog({
  closeOnBackNavigation = true,
  open,
  onOpenChange,
  ...props
}: DialogRootProps) {
  useDialogBackClose(Boolean(open), onOpenChange ?? (() => {}), closeOnBackNavigation && Boolean(open));
  return <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} {...props} />;
}

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
        "fixed inset-0 z-dialog bg-charcoal/50 backdrop-blur-sm",
        motionClass.overlay,
        className,
      )}
      {...props}
    />
  );
}

interface DialogContentProps extends React.ComponentProps<typeof DialogPrimitive.Content> {
  /** Full-screen on mobile, centered panel from `sm` (default). */
  bottomSheet?: boolean;
  /** Visible close control (44×44px). Default true. */
  showClose?: boolean;
  /** Swipe down to dismiss on touch devices (mobile bottom sheet). Default true. */
  swipeToDismiss?: boolean;
}

/** Mobile-first shell: full viewport on phones, centered panel on sm+. */
const dialogMobileFullscreenClass =
  "inset-0 h-[100dvh] max-h-[100dvh] w-full max-w-[100dvw] rounded-none";

const dialogDesktopCenteredClass =
  "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[85vh] sm:w-[min(calc(100dvw-2rem),32rem)] sm:max-w-[calc(100dvw-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl";

function DialogContent({
  className,
  children,
  bottomSheet = true,
  showClose = true,
  swipeToDismiss = true,
  onOpenAutoFocus,
  style,
  ...props
}: DialogContentProps) {
  const swipeDismissRef = useRef<HTMLButtonElement>(null);
  const { offsetY, swipeHandlers } = useDialogSwipeDismiss({
    enabled: bottomSheet && swipeToDismiss,
    onDismiss: () => swipeDismissRef.current?.click(),
  });

  return (
    <DialogPortal>
      <SiteHeaderOverlayLockEffect />
      <DialogOverlay />
      <DialogPrimitive.Content
        onOpenAutoFocus={onOpenAutoFocus}
        style={style}
        className={cn(
          "fixed z-dialog flex flex-col bg-surface-elevated shadow-modal outline-none",
          motionClass.modalContent,
          "overflow-y-auto overflow-x-hidden overscroll-contain",
          bottomSheet
            ? cn(
                dialogMobileFullscreenClass,
                dialogDesktopCenteredClass,
                "pb-[env(safe-area-inset-bottom,0px)] sm:pb-0",
              )
            : cn(
                dialogMobileFullscreenClass,
                "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[85vh] sm:w-[min(calc(100dvw-2rem),32rem)] sm:max-w-[calc(100dvw-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl",
              ),
          className,
        )}
        {...props}
      >
        {bottomSheet && swipeToDismiss ? (
          <div
            className="sticky top-0 z-10 flex shrink-0 justify-center bg-surface-elevated pt-2 sm:hidden"
            {...swipeHandlers}
          >
            <span className="h-1 w-10 rounded-full bg-border-subtle" aria-hidden />
            <span className="sr-only">Проведите вниз, чтобы закрыть</span>
          </div>
        ) : null}
        <div
          className="flex min-h-0 min-w-0 flex-1 flex-col"
          style={
            offsetY > 0
              ? { transform: `translateY(${offsetY}px)`, transition: "none" }
              : undefined
          }
        >
          {children}
        </div>
        <DialogPrimitive.Close
          ref={swipeDismissRef}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
        >
          Закрыть
        </DialogPrimitive.Close>
        {showClose ? (
          <DialogPrimitive.Close
            className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
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
        className,
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
        className,
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
