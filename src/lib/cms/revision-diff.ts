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
  seo?: { title?: string; description?: string; image?: string };
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

function diffSectionCollection(
  items: CmsRevisionDiffItem[],
  currentSections: LegalSection[],
  revisionSections: LegalSection[],
  sectionLabelPrefix: string
): void {
  const max = Math.max(currentSections.length, revisionSections.length);
  for (let index = 0; index < max; index += 1) {
    const currentSection = currentSections[index];
    const revisionSection = revisionSections[index];
    const sectionLabel = `${sectionLabelPrefix} ${index + 1}`;

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

function diffLegalBody(
  items: CmsRevisionDiffItem[],
  currentBody: Extract<CmsDocumentBody, { kind: "legal" }>,
  revisionBody: Extract<CmsDocumentBody, { kind: "legal" }>
): void {
  pushTextDiff(items, "Описание", currentBody.description, revisionBody.description);
  diffSectionCollection(items, currentBody.sections, revisionBody.sections, "Раздел");
}

function diffGuideBody(
  items: CmsRevisionDiffItem[],
  currentBody: Extract<CmsDocumentBody, { kind: "guide" }>,
  revisionBody: Extract<CmsDocumentBody, { kind: "guide" }>
): void {
  pushTextDiff(items, "Описание", currentBody.description, revisionBody.description);
  pushTextDiff(items, "Категория", currentBody.category ?? "", revisionBody.category ?? "");
  diffSectionCollection(items, currentBody.sections, revisionBody.sections, "Раздел путеводителя");
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

function diffDestinationBody(
  items: CmsRevisionDiffItem[],
  currentBody: Extract<CmsDocumentBody, { kind: "destination" }>,
  revisionBody: Extract<CmsDocumentBody, { kind: "destination" }>
): void {
  pushTextDiff(items, "Описание", currentBody.description, revisionBody.description);
  pushTextDiff(items, "Введение", currentBody.intro ?? "", revisionBody.intro ?? "");
  pushTextDiff(items, "Группа региона", currentBody.regionGroup ?? "", revisionBody.regionGroup ?? "");
  pushTextDiff(items, "Лучший сезон", currentBody.bestSeason ?? "", revisionBody.bestSeason ?? "");
  pushTextDiff(
    items,
    "Рекомендуемый срок",
    currentBody.idealDuration ?? "",
    revisionBody.idealDuration ?? ""
  );
  pushTextDiff(
    items,
    "Как добраться",
    currentBody.howToGetThere ?? "",
    revisionBody.howToGetThere ?? ""
  );
  diffStringLines(items, "Главная точка", currentBody.highlights, revisionBody.highlights);
  diffStringLines(items, "Совет путешественникам", currentBody.travelTips, revisionBody.travelTips);
}

function diffPlaceBody(
  items: CmsRevisionDiffItem[],
  currentBody: Extract<CmsDocumentBody, { kind: "place" }>,
  revisionBody: Extract<CmsDocumentBody, { kind: "place" }>
): void {
  pushTextDiff(items, "Краткое описание", currentBody.shortDescription, revisionBody.shortDescription);
  pushTextDiff(items, "Подробное описание", currentBody.fullDescription, revisionBody.fullDescription);
  pushTextDiff(
    items,
    "Как добраться",
    currentBody.howToGetThere ?? "",
    revisionBody.howToGetThere ?? ""
  );
  diffStringLines(items, "Интересный факт", currentBody.interestingFacts, revisionBody.interestingFacts);
  pushTextDiff(
    items,
    "FAQ",
    JSON.stringify(currentBody.faq ?? []),
    JSON.stringify(revisionBody.faq ?? [])
  );
}

export function buildCmsRevisionDiff(current: CmsSnapshot, revision: CmsSnapshot): CmsRevisionDiffResult {
  const items: CmsRevisionDiffItem[] = [];

  pushTextDiff(items, "Заголовок", current.title, revision.title);

  pushTextDiff(items, "SEO title", current.seo?.title ?? "", revision.seo?.title ?? "");
  pushTextDiff(items, "SEO description", current.seo?.description ?? "", revision.seo?.description ?? "");
  pushTextDiff(items, "SEO image", current.seo?.image ?? "", revision.seo?.image ?? "");

  if (current.body.kind === "legal" && revision.body.kind === "legal") {
    diffLegalBody(items, current.body, revision.body);
  } else if (current.body.kind === "guide" && revision.body.kind === "guide") {
    diffGuideBody(items, current.body, revision.body);
  } else if (current.body.kind === "blog" && revision.body.kind === "blog") {
    diffBlogBody(items, current.body, revision.body);
  } else if (current.body.kind === "destination" && revision.body.kind === "destination") {
    diffDestinationBody(items, current.body, revision.body);
  } else if (current.body.kind === "place" && revision.body.kind === "place") {
    diffPlaceBody(items, current.body, revision.body);
  } else {
    pushTextDiff(items, "Тип документа", current.body.kind, revision.body.kind);
  }

  return {
    hasChanges: items.length > 0,
    items,
  };
}
