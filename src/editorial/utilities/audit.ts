import type { BlogBodyBlock } from "@/types/blog-content-blocks";
import type { BlogPost } from "@/types";
import { getEditorialRegistryEntry } from "@/editorial/registry/definitions";
import { checkEditorialRhythm } from "@/editorial/utilities/rhythm";
import type { EditorialAuditFinding } from "@/editorial/types";
import { resolveBlogSectionBlocks } from "@/lib/blog-section-blocks";

const KNOWN_WIDGETS = new Set([
  "season-matrix",
  "tourism-infographic",
  "tourism-timeline",
]);

function collectBlocks(post: BlogPost): Array<{
  sectionTitle: string;
  blocks: BlogBodyBlock[];
}> {
  return (post.sections ?? []).map((section) => ({
    sectionTitle: section.title,
    blocks: resolveBlogSectionBlocks(section, post.slug),
  }));
}

export function auditEditorialBlocks(
  blocks: BlogBodyBlock[],
  ctx: { slug?: string; sectionTitle?: string } = {},
): EditorialAuditFinding[] {
  const findings: EditorialAuditFinding[] = [];
  const headingLevels: string[] = [];

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    const entry = getEditorialRegistryEntry(block.type);

    if (!entry) {
      findings.push({
        level: "error",
        code: "unknown-block",
        message: `Неизвестный тип блока: ${block.type}`,
        slug: ctx.slug,
        sectionTitle: ctx.sectionTitle,
        blockType: block.type,
        index,
      });
      continue;
    }

    if (entry.status === "deprecated") {
      findings.push({
        level: "warning",
        code: "deprecated-block",
        message: `Устаревший блок ${block.type}; используйте ${entry.deprecatedAliases?.[0] ?? "канонический тип"}`,
        slug: ctx.slug,
        sectionTitle: ctx.sectionTitle,
        blockType: block.type,
        index,
      });
    }

    if (block.type === "paragraph" && !block.text.trim() && !block.html?.trim()) {
      findings.push({
        level: "warning",
        code: "empty-block",
        message: "Пустой текстовый блок",
        slug: ctx.slug,
        sectionTitle: ctx.sectionTitle,
        blockType: block.type,
        index,
      });
    }

    if ((block.type === "media" || block.type === "photo") && !block.alt.trim()) {
      findings.push({
        level: "error",
        code: "missing-alt",
        message: "У изображения отсутствует alt",
        slug: ctx.slug,
        sectionTitle: ctx.sectionTitle,
        blockType: block.type,
        index,
      });
    }

    if (block.type === "gallery") {
      if (block.items.length === 0) {
        findings.push({
          level: "error",
          code: "empty-gallery",
          message: "Галерея без изображений",
          slug: ctx.slug,
          sectionTitle: ctx.sectionTitle,
          blockType: block.type,
          index,
        });
      }
      for (const item of block.items) {
        if (!item.alt.trim()) {
          findings.push({
            level: "error",
            code: "missing-alt",
            message: "У кадра галереи отсутствует alt",
            slug: ctx.slug,
            sectionTitle: ctx.sectionTitle,
            blockType: block.type,
            index,
          });
        }
      }
    }

    if (block.type === "table" || block.type === "comparison-table") {
      if (block.headers.length === 0) {
        findings.push({
          level: "error",
          code: "table-without-headers",
          message: "Таблица без заголовков",
          slug: ctx.slug,
          sectionTitle: ctx.sectionTitle,
          blockType: block.type,
          index,
        });
      }
    }

    if (block.type === "callout" && !block.title.trim()) {
      findings.push({
        level: "warning",
        code: "callout-without-title",
        message: "Выноска без заголовка",
        slug: ctx.slug,
        sectionTitle: ctx.sectionTitle,
        blockType: block.type,
        index,
      });
    }

    if (block.type === "map" && (!Number.isFinite(block.lat) || !Number.isFinite(block.lng))) {
      findings.push({
        level: "error",
        code: "map-without-coordinates",
        message: "Карта без координат",
        slug: ctx.slug,
        sectionTitle: ctx.sectionTitle,
        blockType: block.type,
        index,
      });
    }

    if (block.type === "cta" && !block.href.trim()) {
      findings.push({
        level: "error",
        code: "cta-without-url",
        message: "CTA без URL",
        slug: ctx.slug,
        sectionTitle: ctx.sectionTitle,
        blockType: block.type,
        index,
      });
    }

    if (block.type === "sources") {
      for (const item of block.items) {
        if (!item.url.trim()) {
          findings.push({
            level: "error",
            code: "source-without-url",
            message: "Источник без URL",
            slug: ctx.slug,
            sectionTitle: ctx.sectionTitle,
            blockType: block.type,
            index,
          });
        }
      }
    }

    if (block.type === "widget" && block.widgetKey && !KNOWN_WIDGETS.has(block.widgetKey)) {
      findings.push({
        level: "warning",
        code: "unknown-widget",
        message: `Неизвестный widgetKey: ${block.widgetKey}`,
        slug: ctx.slug,
        sectionTitle: ctx.sectionTitle,
        blockType: block.type,
        index,
      });
    }

    if (block.type === "subheading") {
      headingLevels.push("h3");
    }

    if (
      (block.type === "cta" || block.type === "paragraph") &&
      "href" in block &&
      typeof (block as { href?: string }).href === "string"
    ) {
      const href = (block as { href: string }).href;
      if (href.startsWith("/blog/") || href.startsWith("/guides/")) {
        // reserved for link checker integration
      }
    }
  }

  for (const warning of checkEditorialRhythm(blocks)) {
    findings.push({
      level: "warning",
      code: warning.code,
      message: warning.message,
      slug: ctx.slug,
      sectionTitle: ctx.sectionTitle,
      index: warning.index,
    });
  }

  void headingLevels;
  return findings;
}

export function auditEditorialPost(post: BlogPost): EditorialAuditFinding[] {
  const findings: EditorialAuditFinding[] = [];
  for (const section of collectBlocks(post)) {
    findings.push(
      ...auditEditorialBlocks(section.blocks, {
        slug: post.slug,
        sectionTitle: section.sectionTitle,
      }),
    );
  }

  if (post.slug.includes("legacy") || post.noIndex) {
    findings.push({
      level: "info",
      code: "legacy-slug",
      message: "Статья помечена как legacy/noIndex — проверьте override-слой",
      slug: post.slug,
    });
  }

  return findings;
}
