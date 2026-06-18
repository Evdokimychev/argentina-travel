import { ExternalLink } from "lucide-react";

export default function PartnerTourBanner() {
  return (
    <div className="rounded-2xl border border-sky/20 bg-sky/5 px-4 py-3 sm:px-5 sm:py-4">
      <p className="flex items-start gap-2 text-sm leading-relaxed text-charcoal">
        <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-sky-dark" aria-hidden />
        <span>
          <span className="font-semibold">Партнёрский тур Tripster.</span> Описание и отзывы
          размещены на нашей площадке, а бронирование и оплата проходят на Tripster — сервисе
          авторских туров.
        </span>
      </p>
    </div>
  );
}
