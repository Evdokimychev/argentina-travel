import Link from "next/link";

import {
  KB_SECTIONS,
  entryHref,
  getSectionMeta,
  getSectionCount,
  getSectionGroups,
  sectionHref,
} from "@/lib/knowledge-base/content";

const SIDE_NAV_GROUP_LIMIT = 8;

function SectionContents({
  sectionId,
  currentEntryId,
}: {
  sectionId: string;
  currentEntryId?: string;
}) {
  const { hubs, groups } = getSectionGroups(sectionId);
  const section = getSectionMeta(sectionId);

  return (
    <div className="mt-1 max-h-[55vh] space-y-3 overflow-y-auto border-l border-border-subtle pl-3">
      {hubs.length > 0 && (
        <ul className="space-y-0.5">
          {hubs.map((entry) => (
            <li key={entry.id}>
              <Link
                href={entryHref(entry.id)}
                aria-current={entry.id === currentEntryId ? "page" : undefined}
                className={`block rounded px-2 py-1 ${
                  entry.id === currentEntryId
                    ? "bg-sky/10 font-medium text-sky-ink"
                    : "text-muted hover:bg-surface-muted hover:text-foreground"
                }`}
              >
                {entry.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {groups.map((group) => {
        const visibleEntries = group.entries.slice(0, SIDE_NAV_GROUP_LIMIT);
        const currentEntry = group.entries.find((entry) => entry.id === currentEntryId);
        const showCurrentSeparately =
          currentEntry && !visibleEntries.some((entry) => entry.id === currentEntry.id);
        return (
          <div key={group.type}>
            <p className="mb-1 px-2 text-2xs font-semibold uppercase tracking-wide text-slate">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {visibleEntries.map((entry) => (
                <li key={entry.id}>
                  <Link
                    href={entryHref(entry.id)}
                    aria-current={entry.id === currentEntryId ? "page" : undefined}
                    className={`block rounded px-2 py-1 ${
                      entry.id === currentEntryId
                        ? "bg-sky/10 font-medium text-sky-ink"
                        : "text-muted hover:bg-surface-muted hover:text-foreground"
                    }`}
                  >
                    {entry.title}
                  </Link>
                </li>
              ))}
              {showCurrentSeparately && (
                <li>
                  <Link
                    href={entryHref(currentEntry.id)}
                    aria-current="page"
                    className="block rounded bg-sky/10 px-2 py-1 font-medium text-sky-ink"
                  >
                    {currentEntry.title}
                  </Link>
                </li>
              )}
            </ul>
          </div>
        );
      })}
      {section && (
        <Link
          href={sectionHref(section.slug)}
          className="block rounded px-2 py-1.5 font-medium text-sky-ink hover:bg-surface-muted"
        >
          Все материалы раздела
        </Link>
      )}
    </div>
  );
}

/** Постоянная навигация базы знаний: разделы + содержимое активного раздела. */
export default function KbSideNav({
  sectionId,
  currentEntryId,
}: {
  sectionId?: string;
  currentEntryId?: string;
}) {
  return (
    <nav aria-label="Навигация по базе знаний" className="text-sm">
      <Link
        href="/baza-znaniy"
        className="mb-3 flex items-center gap-2 font-semibold text-foreground hover:text-sky-ink"
      >
        <span aria-hidden>📚</span> База знаний
      </Link>
      <ul className="space-y-0.5">
        {KB_SECTIONS.map((section) => {
          const active = section.id === sectionId;
          return (
            <li key={section.id}>
              <Link
                href={sectionHref(section.slug)}
                aria-current={active ? "page" : undefined}
                className={`flex items-center justify-between gap-2 rounded px-2 py-1.5 ${
                  active
                    ? "bg-surface-muted font-semibold text-foreground"
                    : "text-muted hover:bg-surface-muted hover:text-foreground"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span aria-hidden>{section.icon}</span>
                  {section.title}
                </span>
                <span className="text-2xs text-slate">
                  {getSectionCount(section.id)}
                </span>
              </Link>
              {active && (
                <SectionContents
                  sectionId={section.id}
                  currentEntryId={currentEntryId}
                />
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
