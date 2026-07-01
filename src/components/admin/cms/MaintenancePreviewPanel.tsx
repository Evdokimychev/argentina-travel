"use client";

import { useMemo } from "react";
import MaintenanceComingSoonView from "@/components/maintenance/MaintenanceComingSoonView";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import { normalizeSiteBranding, normalizeSiteContact, normalizeSiteMaintenance } from "@/lib/cms/site-globals/normalize";
import { resolveMaintenancePageViewModel } from "@/lib/maintenance-page";
import type { SiteBrandingGlobal, SiteContactGlobal, SiteMaintenanceGlobal } from "@/types/site-globals";

type DraftValues = Partial<SiteMaintenanceGlobal> | Record<string, unknown>;
type BrandingDraft = Partial<SiteBrandingGlobal> | Record<string, unknown>;
type ContactDraft = Partial<SiteContactGlobal> | Record<string, unknown>;

type Props = {
  maintenance: DraftValues;
  branding: BrandingDraft;
  contact: ContactDraft;
};

export default function MaintenancePreviewPanel({ maintenance, branding, contact }: Props) {
  const model = useMemo(
    () =>
      resolveMaintenancePageViewModel({
        maintenance: normalizeSiteMaintenance(maintenance),
        branding: normalizeSiteBranding(branding),
        contact: normalizeSiteContact(contact),
      }),
    [maintenance, branding, contact],
  );

  return (
    <section className={`${cabinetCardClass} space-y-4 p-5`}>
      <div>
        <h2 className="font-heading text-lg font-bold text-charcoal">Предпросмотр страницы /maintenance</h2>
        <p className="mt-1 text-sm text-slate">
          Как заглушка выглядит для посетителей при включённом режиме обслуживания (без сохранения настроек).
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-charcoal shadow-inner">
        <div className="pointer-events-none origin-top-left scale-[0.42] sm:scale-[0.48] lg:scale-[0.52]">
          <div className="h-[720px] w-[1280px] overflow-hidden">
            <MaintenanceComingSoonView model={model} preview />
          </div>
        </div>
      </div>
    </section>
  );
}
