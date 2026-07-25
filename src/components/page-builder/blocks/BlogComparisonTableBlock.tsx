import BlogContentTable from "@/components/blog/BlogContentTable";
import { cn } from "@/lib/cn";

type Props = {
  headers: string[];
  rows: string[][];
  highlightColumn?: number;
  caption?: string;
  mobileLayout?: "scroll" | "cards";
};

export default function BlogComparisonTableBlock({
  headers,
  rows,
  highlightColumn,
  caption,
  mobileLayout,
}: Props) {
  return (
    <div className="space-y-2">
      <BlogContentTable
        headers={headers}
        rows={rows}
        caption={caption}
        mobileLayout={mobileLayout}
      />
      {highlightColumn != null && highlightColumn >= 0 ? (
        <p className="text-xs text-slate">
          Рекомендуемая колонка:{" "}
          <span className={cn("font-medium text-charcoal")}>
            {headers[highlightColumn] ?? `#${highlightColumn + 1}`}
          </span>
        </p>
      ) : null}
    </div>
  );
}
