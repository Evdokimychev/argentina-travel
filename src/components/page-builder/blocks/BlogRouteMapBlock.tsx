import BlogMapBlock from "@/components/blog/BlogMapBlock";
import type { BlogRouteMapPoint } from "@/types/blog-content-blocks";

type Props = {
  points: BlogRouteMapPoint[];
  caption?: string;
};

export default function BlogRouteMapBlock({ points, caption }: Props) {
  const filtered = points.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  if (filtered.length === 0) return null;

  const first = filtered[0];
  const label =
    filtered.length === 1
      ? first.label
      : `${first.label} → ${filtered[filtered.length - 1]?.label ?? "маршрут"} (${filtered.length} точек)`;

  return (
    <div className="space-y-3">
      <BlogMapBlock lat={first.lat} lng={first.lng} label={label} />
      {filtered.length > 1 ? (
        <ol className="space-y-1 rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm text-slate">
          {filtered.map((point, index) => (
            <li key={`${point.lat}-${point.lng}-${index}`}>
              <span className="font-medium text-charcoal">{index + 1}.</span> {point.label}
            </li>
          ))}
        </ol>
      ) : null}
      {caption ? <p className="text-xs text-slate">{caption}</p> : null}
    </div>
  );
}
