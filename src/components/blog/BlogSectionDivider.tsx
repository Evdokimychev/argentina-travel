import { cn } from "@/lib/cn";

type BlogSectionDividerProps = {
  label?: string;
  className?: string;
};

export default function BlogSectionDivider({ label, className }: BlogSectionDividerProps) {
  return (
    <div
      className={cn("relative py-2", className)}
      role="separator"
      aria-hidden={!label}
      aria-label={label}
    >
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        {label ? (
          <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate/60">
            {label}
          </span>
        ) : null}
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      </div>
    </div>
  );
}
