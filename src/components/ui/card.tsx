import { cn } from "@/lib/cn";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-2xl border border-gray-100 bg-white shadow-card", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 p-5 sm:p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("font-display text-base font-bold text-charcoal", className)} {...props} />
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
    <div className={cn("flex items-center border-t border-gray-100 p-5 sm:p-6", className)} {...props} />
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
    <Card className={cn("p-6 text-center", className)}>
      <p className={cn("font-display text-3xl font-bold text-charcoal", valueClassName)}>{value}</p>
      <p className="mt-1 text-sm text-slate">{label}</p>
    </Card>
  );
}
