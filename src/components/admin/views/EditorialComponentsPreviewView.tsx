"use client";

import { useMemo, useState } from "react";
import { renderBlogBodyBlock } from "@/components/blog/BlogSectionBody";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import PreviewDeviceFrame, {
  type PreviewTheme,
  type PreviewViewport,
} from "@/components/admin/cms/PreviewDeviceFrame";
import { NativeSelect } from "@/components/ui/native-select";
import { listEditorialRegistryEntries } from "@/editorial/registry/definitions";
import { EDITORIAL_PREVIEW_SAMPLES } from "@/editorial/preview/samples";
import type { BlogEditorialDensity } from "@/types/blog-content-blocks";

export default function EditorialComponentsPreviewView() {
  const [density, setDensity] = useState<BlogEditorialDensity>("comfortable");
  const [theme, setTheme] = useState<PreviewTheme>("light");
  const [viewport, setViewport] = useState<PreviewViewport>("desktop");
  const entries = useMemo(() => listEditorialRegistryEntries(), []);

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="Редакционные компоненты"
        subtitle="Каталог блоков конструктора статей: variants, density, light/dark, desktop/mobile."
      />

      <div className="grid gap-8 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-border-subtle bg-white p-4 dark:bg-surface-elevated">
          <h2 className="font-heading text-sm font-semibold text-charcoal">Registry</h2>
          <ul className="mt-3 max-h-[70vh] space-y-2 overflow-auto text-sm">
            {entries.map((entry) => (
              <li key={entry.type} className="rounded-lg border border-gray-100 px-2 py-1.5 dark:border-white/10">
                <p className="font-medium text-charcoal">{entry.label}</p>
                <p className="text-xs text-slate">
                  {entry.type} · {entry.status} · {entry.mobileBehaviour}
                </p>
              </li>
            ))}
          </ul>
        </aside>

        <PreviewDeviceFrame
          viewport={viewport}
          theme={theme}
          onViewportChange={setViewport}
          onThemeChange={setTheme}
          contentClassName={
            density === "compact"
              ? "p-4 sm:p-6 [&_.blog-section-body]:space-y-3"
              : density === "spacious"
                ? "p-4 sm:p-6 [&_.blog-section-body]:space-y-8"
                : "p-4 sm:p-6"
          }
          extraControls={
            <NativeSelect
              value={density}
              onChange={(e) => setDensity(e.target.value as BlogEditorialDensity)}
              aria-label="Плотность блоков"
            >
              <option value="compact">compact</option>
              <option value="comfortable">comfortable</option>
              <option value="spacious">spacious</option>
            </NativeSelect>
          }
        >
          <div className="blog-section-body space-y-5 p-4 sm:p-6">
            {EDITORIAL_PREVIEW_SAMPLES.map((block, index) =>
              renderBlogBodyBlock(
                "density" in block ? { ...block, density } : block,
                index,
                false,
              ),
            )}
          </div>
        </PreviewDeviceFrame>
      </div>
    </AdminPageShell>
  );
}
