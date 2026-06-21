import { ExternalLink, MapPin } from "lucide-react";

type BlogMapBlockProps = {
  lat: number;
  lng: number;
  label: string;
};

export default function BlogMapBlock({ lat, lng, label }: BlogMapBlockProps) {
  const href = `https://www.google.com/maps?q=${lat},${lng}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex aspect-[16/10] max-h-[220px] flex-col items-center justify-center gap-3 bg-gradient-to-br from-sky/[0.08] via-white to-surface-muted/60 px-6 text-center">
        <MapPin className="h-8 w-8 text-sky" aria-hidden />
        <p className="font-heading text-sm font-semibold text-charcoal">{label}</p>
        <p className="text-xs text-slate">
          {lat.toFixed(4)}°, {lng.toFixed(4)}°
        </p>
      </div>
      <div className="border-t border-gray-100 p-4">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
        >
          Открыть в Google Maps
          <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
        </a>
      </div>
    </div>
  );
}
