"use client";

import { useMemo, useState } from "react";
import { renderBlogBodyBlock } from "@/components/blog/BlogSectionBody";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import { NativeSelect } from "@/components/ui/native-select";
import { listEditorialRegistryEntries } from "@/editorial/registry/definitions";
import { EDITORIAL_PREVIEW_SAMPLES } from "@/editorial/preview/samples";
import { cn } from "@/lib/cn";
import type { BlogEditorialDensity } from "@/types/blog-content-blocks";

export default function EditorialComponentsPreviewView() {
  const [density, setDensity] = useState<BlogEditorialDensity>("comfortable");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [viewport, setViewport] = useState<"mobile" | "tablet" | "desktop">("desktop");
  const entries = useMemo(() => listEditorialRegistryEntries(), []);

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="Редакционные компоненты"
        subtitle="Каталог блоков конструктора статей: variants, density, light/dark, desktop/mobile."
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <NativeSelect value={density} onChange={(e) => setDensity(e.target.value as BlogEditorialDensity)}>
          <option value="compact">compact</option>
          <option value="comfortable">comfortable</option>
          <option value="spacious">spacious</option>
        </NativeSelect>
        <NativeSelect value={theme} onChange={(e) => setTheme(e.target.value as "light" | "dark")}>
          <option value="light">light</option>
          <option value="dark">dark</option>
        </NativeSelect>
        <NativeSelect
          value={viewport}
          onChange={(e) => setViewport(e.target.value as "mobile" | "tablet" | "desktop")}
        >
          <option value="mobile">390px</option>
          <option value="tablet">768px</option>
          <option value="desktop">1280px</option>
        </NativeSelect>
      </div>

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

        <div
          className={cn(
            "mx-auto w-full rounded-2xl border border-border-subtle p-4 sm:p-6",
            theme === "dark" ? "dark bg-charcoal text-white" : "bg-sand/40",
            viewport === "mobile" && "max-w-[390px]",
            viewport === "tablet" && "max-w-[768px]",
            viewport === "desktop" && "max-w-5xl",
            density === "compact" && "[&_.blog-section-body]:space-y-3",
            density === "spacious" && "[&_.blog-section-body]:space-y-8",
          )}
        >
          <div className="blog-section-body space-y-5">
            {EDITORIAL_PREVIEW_SAMPLES.map((block, index) =>
              renderBlogBodyBlock(
                "density" in block ? { ...block, density } : block,
                index,
                false,
              ),
            )}
          </div>
        </div>
      </div>
    </AdminPageShell>
  );
}
