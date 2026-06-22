import { SITE_OFFICE } from "@/data/site-contacts";

export default function ContactOfficeMap() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card ring-1 ring-gray-100">
      <iframe
        title={`Карта — ${SITE_OFFICE.display}`}
        src={SITE_OFFICE.mapEmbedUrl}
        className="h-64 w-full border-0 sm:h-72"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
      <p className="border-t border-gray-100 px-4 py-3 text-xs text-slate">{SITE_OFFICE.note}</p>
    </div>
  );
}
