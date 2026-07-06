import type { KbEntry } from "@/lib/knowledge-base/types";

import KbEntryCard from "./KbEntryCard";

/** Блок связанных записей — «читайте дальше». */
export default function KbRelated({ entries }: { entries: KbEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <section className="mt-10 border-t border-border-subtle pt-6">
      <h2 className="mb-4 text-lg font-semibold text-foreground">
        Читайте дальше
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {entries.map((entry) => (
          <KbEntryCard key={entry.id} entry={entry} />
        ))}
      </div>
    </section>
  );
}
