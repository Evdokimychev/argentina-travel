import { cn } from "@/lib/cn";

type BlogStepListProps = {
  items: string[];
  title?: string;
  className?: string;
};

export default function BlogStepList({ items, title, className }: BlogStepListProps) {
  if (items.length === 0) return null;

  return (
    <ol
      className={cn(
        "space-y-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5",
        className,
      )}
      aria-label={title ?? "Пошаговая инструкция"}
    >
      {title ? (
        <li className="list-none pb-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate/80">
          {title}
        </li>
      ) : null}
      {items.map((item, index) => (
        <li key={item.slice(0, 48)} className="flex gap-3 text-sm leading-relaxed text-slate">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky/10 text-xs font-bold text-sky-dark"
            aria-hidden
          >
            {index + 1}
          </span>
          <span className="pt-0.5">{item}</span>
        </li>
      ))}
    </ol>
  );
}
