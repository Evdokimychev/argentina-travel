"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { SITE_OFFICE } from "@/data/site-contacts";
import { Button } from "@/components/ui/button";

export default function ContactOfficeMap() {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card ring-1 ring-gray-100">
      {open ? (
        <iframe
          id="contact-office-map"
          title={`Карта — ${SITE_OFFICE.display}`}
          src={SITE_OFFICE.mapEmbedUrl}
          className="h-64 w-full border-0 sm:h-72"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      ) : (
        <div className="flex min-h-44 flex-col items-center justify-center px-5 py-7 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sky/10 text-sky" aria-hidden>
            <MapPin className="h-5 w-5" />
          </span>
          <p className="mt-3 font-semibold text-charcoal">{SITE_OFFICE.display}</p>
          <p className="mt-1 max-w-sm text-sm leading-relaxed text-slate">
            Интерактивная карта загрузится только по вашему запросу и не замедлит открытие страницы.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4 min-h-11"
            aria-expanded={open}
            aria-controls="contact-office-map"
            onClick={() => setOpen(true)}
          >
            Открыть карту офиса
          </Button>
        </div>
      )}
    </div>
  );
}
