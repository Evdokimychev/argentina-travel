import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { LoadingSpinner } from "@/components/feedback/LoadingSpinner";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-sky text-white hover:bg-sky-dark shadow-sm",
        outline: "border border-gray-200 bg-white hover:bg-gray-50 text-charcoal",
        ghost: "hover:bg-gray-100 text-charcoal",
        secondary: "bg-gray-100 text-charcoal hover:bg-gray-200",
        destructive: "bg-error text-white hover:bg-error/90 shadow-sm",
        link: "h-auto px-0 py-0 text-sky underline-offset-4 hover:underline hover:text-sky-dark",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-8",
        icon: "h-10 w-10",
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
