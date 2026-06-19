import type { LegalSection } from "@/data/legal-content";
import type { CmsDocumentBody } from "@/types/cms-content";

type CmsBlogSection = { title: string; body: string };

export type CmsRevisionDiffChangeType = "changed" | "added" | "removed";

export type CmsRevisionDiffItem = {
  label: string;
  changeType: CmsRevisionDiffChangeType;
  currentValue: string | null;
  revisionValue: string | null;
};

export type CmsRevisionDiffResult = {
  hasChanges: boolean;
  items: CmsRevisionDiffItem[];
};

type CmsSnapshot = {
  title: string;
  body: CmsDocumentBody;
};

function normalizeText(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function pushTextDiff(
  items: CmsRevisionDiffItem[],
  label: string,
  currentValue: string | null | undefined,
  revisionValue: string | null | undefined
): void {
  const currentText = normalizeText(currentValue);
  const revisionText = normalizeText(revisionValue);
  if (currentText === revisionText) return;

  const changeType: CmsRevisionDiffChangeType = !currentText
    ? "added"
    : !revisionText
      ? "removed"
      : "changed";

  items.push({
    label,
    changeType,
    currentValue: currentText || null,
    revisionValue: revisionText || null,
  });
}

function formatLegalSection(section: LegalSection): string {
  const parts: string[] = [];
  if (section.heading?.trim()) {
    parts.push(`Заголовок: ${section.heading.trim()}`);
  }
  if (section.paragraphs?.length) {
    parts.push(`Абзацы: ${section.paragraphs.join(" | ")}`);
  }
  if (section.list?.length) {
    parts.push(`Список: ${section.list.join(" | ")}`);
  }
  return parts.join("\n");
}

function formatBlogSection(section: CmsBlogSection): string {
  return [`Заголовок: ${section.title}`, `Текст: ${section.body}`].join("\n");
}

function diffStringLines(
  items: CmsRevisionDiffItem[],
  labelPrefix: string,
  currentLines?: string[],
  revisionLines?: string[]
): void {
  const max = Math.max(currentLines?.length ?? 0, revisionLines?.length ?? 0);
  for (let index = 0; index < max; index += 1) {
    pushTextDiff(
      items,
      `${labelPrefix} · строка ${index + 1}`,
      currentLines?.[index] ?? null,
      revisionLines?.[index] ?? null
    );
  }
}

function diffLegalBody(
  items: CmsRevisionDiffItem[],
  currentBody: Extract<CmsDocumentBody, { kind: "legal" }>,
  revisionBody: Extract<CmsDocumentBody, { kind: "legal" }>
): void {
  pushTextDiff(items, "Описание", currentBody.description, revisionBody.description);

  const max = Math.max(currentBody.sections.length, revisionBody.sections.length);
  for (let index = 0; index < max; index += 1) {
    const currentSection = currentBody.sections[index];
    const revisionSection = revisionBody.sections[index];
    const sectionLabel = `Раздел ${index + 1}`;

    if (!currentSection && revisionSection) {
      pushTextDiff(items, `${sectionLabel} · добавлен`, null, formatLegalSection(revisionSection));
      continue;
    }
    if (currentSection && !revisionSection) {
      pushTextDiff(items, `${sectionLabel} · удален`, formatLegalSection(currentSection), null);
      continue;
    }
    if (!currentSection || !revisionSection) continue;

    pushTextDiff(items, `${sectionLabel} · заголовок`, currentSection.heading ?? "", revisionSection.heading ?? "");
    diffStringLines(items, `${sectionLabel} · абзацы`, currentSection.paragraphs, revisionSection.paragraphs);
    diffStringLines(items, `${sectionLabel} · список`, currentSection.list, revisionSection.list);
  }
}

function diffBlogBody(
  items: CmsRevisionDiffItem[],
  currentBody: Extract<CmsDocumentBody, { kind: "blog" }>,
  revisionBody: Extract<CmsDocumentBody, { kind: "blog" }>
): void {
  pushTextDiff(items, "Анонс", currentBody.excerpt ?? "", revisionBody.excerpt ?? "");
  pushTextDiff(
    items,
    "Избранное в каталоге",
    currentBody.featured ? "Да" : "Нет",
    revisionBody.featured ? "Да" : "Нет"
  );
  pushTextDiff(items, "Основной текст", currentBody.content ?? "", revisionBody.content ?? "");

  const currentSections = currentBody.sections ?? [];
  const revisionSections = revisionBody.sections ?? [];
  const max = Math.max(currentSections.length, revisionSections.length);

  for (let index = 0; index < max; index += 1) {
    const currentSection = currentSections[index];
    const revisionSection = revisionSections[index];
    const sectionLabel = `Раздел статьи ${index + 1}`;

    if (!currentSection && revisionSection) {
      pushTextDiff(items, `${sectionLabel} · добавлен`, null, formatBlogSection(revisionSection));
      continue;
    }
    if (currentSection && !revisionSection) {
      pushTextDiff(items, `${sectionLabel} · удален`, formatBlogSection(currentSection), null);
      continue;
    }
    if (!currentSection || !revisionSection) continue;

    pushTextDiff(items, `${sectionLabel} · заголовок`, currentSection.title, revisionSection.title);
    pushTextDiff(items, `${sectionLabel} · текст`, currentSection.body, revisionSection.body);
  }
}

export function buildCmsRevisionDiff(current: CmsSnapshot, revision: CmsSnapshot): CmsRevisionDiffResult {
  const items: CmsRevisionDiffItem[] = [];

  pushTextDiff(items, "Заголовок", current.title, revision.title);

  if (current.body.kind === "legal" && revision.body.kind === "legal") {
    diffLegalBody(items, current.body, revision.body);
  } else if (current.body.kind === "blog" && revision.body.kind === "blog") {
    diffBlogBody(items, current.body, revision.body);
  } else {
    pushTextDiff(items, "Тип документа", current.body.kind, revision.body.kind);
  }

  return {
    hasChanges: items.length > 0,
    items,
  };
}
