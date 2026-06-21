import BlogContentTable from "@/components/blog/BlogContentTable";
import { cn } from "@/lib/cn";

type Props = {
  headers: string[];
  rows: string[][];
  highlightColumn?: number;
  caption?: string;
};

export default function BlogComparisonTableBlock({
  headers,
  rows,
  highlightColumn,
  caption,
}: Props) {
  return (
    <div className="space-y-2">
      <BlogContentTable headers={headers} rows={rows} caption={caption} />
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
