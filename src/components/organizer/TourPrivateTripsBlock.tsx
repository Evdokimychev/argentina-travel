"use client";

import { useEffect, useState } from "react";
import { Copy, Link2, RefreshCw } from "lucide-react";
import { SwitchField } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  buildPrivateTourHref,
  generatePrivateAccessToken,
} from "@/lib/tour-private-access";
import { useSiteFeedback } from "@/context/SiteFeedbackContext";

interface TourPrivateTripsBlockProps {
  isPrivate: boolean;
  privateAccessToken?: string;
  catalogSlug: string;
  isPublished: boolean;
  onChange: (patch: { isPrivate: boolean; privateAccessToken?: string }) => void;
}

export default function TourPrivateTripsBlock({
  isPrivate,
  privateAccessToken,
  catalogSlug,
  isPublished,
  onChange,
}: TourPrivateTripsBlockProps) {
  const feedback = useSiteFeedback();
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const privateLink =
    isPrivate && privateAccessToken
      ? buildPrivateTourHref(catalogSlug, privateAccessToken, origin || undefined)
      : "";

  function handleToggle(next: boolean) {
    if (next) {
      onChange({
        isPrivate: true,
        privateAccessToken: privateAccessToken || generatePrivateAccessToken(),
      });
      return;
    }
    onChange({ isPrivate: false, privateAccessToken: undefined });
  }

  async function copyLink() {
    if (!privateLink) return;
    try {
      await navigator.clipboard.writeText(privateLink);
      feedback.success({
        title: "Ссылка скопирована",
        description: "Отправьте её клиенту — без неё тур не виден на сайте.",
      });
    } catch {
      feedback.showError({
        title: "Не удалось скопировать",
        description: "Выделите ссылку и скопируйте вручную.",
      });
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-charcoal/5 text-charcoal">
          <Link2 className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h2 className="font-heading text-xl font-bold text-charcoal sm:text-2xl">Приватный тур</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate">
            Тур не появится в каталоге, поиске и на странице организатора. Клиент увидит его только
            по персональной ссылке — удобно для VIP-маршрутов и индивидуальных предложений.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-charcoal/10 bg-charcoal/[0.03] p-4">
        <SwitchField
          checked={isPrivate}
          onCheckedChange={handleToggle}
          label="Сделать тур приватным"
          description="Работает для туров и экскурсий на платформе. Партнёрские экскурсии Tripster и Sputnik8 не затрагиваются."
        />
      </div>

      {isPrivate ? (
        <div className="space-y-3 rounded-2xl border border-amber-200/80 bg-amber-50/60 p-4">
          {!isPublished ? (
            <p className="text-sm text-amber-950">
              Опубликуйте тур — после этого приватная ссылка станет активной.
            </p>
          ) : null}

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate">Приватная ссылка</p>
            <p className="mt-2 break-all rounded-xl border border-gray-200 bg-white px-3 py-2.5 font-mono text-xs text-charcoal">
              {privateLink || `/tours/${catalogSlug}?access=…`}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={copyLink} disabled={!privateLink}>
              <Copy className="h-4 w-4" aria-hidden />
              Скопировать ссылку
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                onChange({
                  isPrivate: true,
                  privateAccessToken: generatePrivateAccessToken(),
                })
              }
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              Перевыпустить ссылку
            </Button>
          </div>

          <p className="text-xs leading-relaxed text-slate">
            После перевыпуска старая ссылка перестанет работать. Отправляйте новую только нужным
            клиентам.
          </p>
        </div>
      ) : null}
    </section>
  );
}
