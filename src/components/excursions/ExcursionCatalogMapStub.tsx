"use client";

import Link from "next/link";
import { ExternalLink, MapPin } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

type ExcursionCatalogMapStubProps = {
  cityName?: string;
  query?: string;
};

function buildGoogleMapsSearchUrl(cityName?: string, query?: string): string {
  const parts = [query?.trim(), cityName ? `экскурсии ${cityName}` : "экскурсии Аргентина"].filter(
    Boolean,
  );
  const term = parts.join(" ").trim() || "экскурсии Буэнос-Айрес";
  return `https://www.google.com/maps/search/${encodeURIComponent(term)}`;
}

export default function ExcursionCatalogMapStub({
  cityName,
  query,
}: ExcursionCatalogMapStubProps) {
  const mapsUrl = buildGoogleMapsSearchUrl(cityName, query);

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="relative flex min-h-[420px] flex-col items-center justify-center bg-gradient-to-br from-sky/5 via-white to-gray-50 p-8 text-center sm:min-h-[520px]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(14,165,233,0.12) 0, transparent 45%), radial-gradient(circle at 80% 70%, rgba(15,23,42,0.06) 0, transparent 40%)",
          }}
        />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-md">
          <MapPin className="h-8 w-8 text-sky" aria-hidden />
        </div>
        <h2 className="relative mt-5 font-heading text-xl font-bold text-charcoal">
          Карта экскурсий
        </h2>
        <p className="relative mt-2 max-w-md text-sm leading-relaxed text-slate">
          Полноценная карта каталога в разработке. Пока можно посмотреть точки интереса на Google
          Картах{cityName ? ` — ${cityName}` : ""}.
        </p>
        <Link
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ className: "relative mt-6 gap-2" })}
        >
          Открыть на Google Картах
          <ExternalLink className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
