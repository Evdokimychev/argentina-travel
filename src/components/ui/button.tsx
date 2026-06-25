import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import {
  tokenButtonOutlineClass,
  tokenButtonPrimaryClass,
  tokenFocusRingClass,
} from "@/lib/design-tokens";
import { motionClass } from "@/lib/motion";
import { LoadingSpinner } from "@/components/feedback/LoadingSpinner";

const buttonVariants = cva(
  cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-button text-sm font-semibold",
    tokenFocusRingClass,
    "disabled:pointer-events-none disabled:opacity-50",
    motionClass.buttonPress,
    "motion-reduce:active:scale-100"
  ),
  {
    variants: {
      variant: {
        /** Основное действие (CTA) */
        primary: tokenButtonPrimaryClass,
        /** Алиас primary — для обратной совместимости */
        default: tokenButtonPrimaryClass,
        /** Второстепенное действие с рамкой */
        secondary: tokenButtonOutlineClass,
        /** Алиас secondary — для обратной совместимости */
        outline: tokenButtonOutlineClass,
        /** Третичное / иконка в списке */
        ghost: "text-foreground hover:bg-surface-muted",
        destructive: "bg-error text-white hover:bg-error/90 shadow-sm",
        link: "h-auto px-0 py-0 text-sky underline-offset-4 hover:underline hover:text-sky-dark",
      },
        size: {
        default: "h-11 px-5 py-2",
        sm: "h-11 min-h-11 rounded-lg px-3 text-xs sm:h-9",
        lg: "h-12 px-8 text-base",
        icon: "h-11 w-11 rounded-button p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  loadingLabel?: string;
}

export function Button({
  className,
  variant,
  size,
  type = "button",
  loading = false,
  loadingLabel,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <LoadingSpinner className="h-4 w-4" /> : null}
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  );
}

export { buttonVariants };
