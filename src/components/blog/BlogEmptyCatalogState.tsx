import Link from "next/link";
import { Compass, RotateCcw } from "lucide-react";
import { blogHubPath } from "@/data/blog-hubs";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type BlogEmptyCatalogStateProps = {
  onReset?: () => void;
  className?: string;
};

export default function BlogEmptyCatalogState({ onReset, className }: BlogEmptyCatalogStateProps) {
  return (
    <div
      className={cn(
        "mt-8 flex flex-col items-center rounded-panel border border-dashed border-border-subtle bg-surface-elevated px-6 py-12 text-center sm:px-10",
        className,
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky/10 text-sky">
        <Compass className="h-8 w-8" aria-hidden />
      </div>
      <p className="mt-5 font-heading text-lg font-bold text-charcoal">Ничего не найдено</p>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-slate">
        По вашим фильтрам статей нет. Сбросьте условия или откройте подборку «Путеводитель» — там базовые
        материалы для первой поездки.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {onReset ? (
          <button
            type="button"
            onClick={onReset}
            className={cn(buttonVariants({ variant: "outline" }), "inline-flex items-center gap-2 rounded-full px-6")}
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            Сбросить фильтры
          </button>
        ) : null}
        <Link href={blogHubPath("putevoditel")} className={cn(buttonVariants(), "rounded-full px-6")}>
          Путеводитель
        </Link>
      </div>
    </div>
  );
}
