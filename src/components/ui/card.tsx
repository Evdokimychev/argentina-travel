import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import {
  uiCardAdminClass,
  uiCardCabinetClass,
  uiCardHeroClass,
  uiCardPublicClass,
  uiCardStatClass,
} from "@/lib/ui-surfaces";

const cardVariants = cva("", {
  variants: {
    variant: {
      /** Публичный каталог, лендинг, формы */
      public: uiCardPublicClass,
      /** Кабинет туриста / организатора */
      cabinet: uiCardCabinetClass,
      /** Админ-панель */
      admin: uiCardAdminClass,
      /** Герой-блок в кабинете */
      hero: uiCardHeroClass,
      /** KPI-плитка */
      stat: uiCardStatClass,
    },
  },
  defaultVariants: { variant: "public" },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export function Card({ className, variant, ...props }: CardProps) {
  return <div className={cn(cardVariants({ variant }), className)} {...props} />;
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 p-5 sm:p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("font-heading text-base font-bold text-foreground", className)} {...props} />
  );
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-slate", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pt-0 sm:p-6 sm:pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center border-t border-border-subtle p-5 sm:p-6", className)}
      {...props}
    />
  );
}

export function StatCard({
  value,
  label,
  className,
  valueClassName,
}: {
  value: React.ReactNode;
  label: string;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <Card variant="stat" className={cn("p-6 text-center", className)}>
      <p className={cn("font-heading text-3xl font-bold text-foreground", valueClassName)}>{value}</p>
      <p className="mt-1 text-sm text-slate">{label}</p>
    </Card>
  );
}

export { cardVariants };
