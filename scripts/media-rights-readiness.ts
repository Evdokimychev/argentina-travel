#!/usr/bin/env tsx

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import sharp from "sharp";

import { blogPosts } from "@/data/blog";
import { DESTINATION_PAGES } from "@/data/destination-pages";
import { galleryItems } from "@/data/gallery-items";
import manifestData from "@/data/media-library/manifest.json";
import { marketplaceTours } from "@/data/marketplace-tours";
import { getAllPlaceListings } from "@/data/places-seed";
import socialFeedConfig from "@/data/social-feed/config.json";
import { filterIndexableBlogPosts } from "@/lib/blog-utils";
import { getAllPageEntries } from "@/lib/image-provider/page-registry";
import { resolvePageImages } from "@/lib/image-provider/image-provider";
import { getAllEntries } from "@/lib/knowledge-base/content";
import {
  getBlogPostHeroResolved,
  getDestinationGallery,
  getDestinationImage,
  getMediaAsset,
  getPlaceCoverImage,
  getPlaceGallery,
  getPodborRegionImage,
  getPodborThemeImage,
  getRichArticleGallery,
  resolveBlogPostCardImage,
} from "@/lib/media-resolver";
import type { MediaAsset } from "@/types/media-asset";

const root = process.cwd();
const publicRoot = path.join(root, "public");
const reportPath = path.join(root, "docs/audit/media-rights-readiness-2026-07-16.md");
const artifactPath = path.join(root, "var/ops/media-rights-readiness.json");

type Severity = "high" | "medium" | "low";

export type MediaAuditIssue = {
  key: string;
  code: string;
  severity: Severity;
  assetId?: string;
  localPath: string;
  message: string;
  contexts: string[];
};

export type AuditedAsset = {
  id: string;
  localPath: string;
  source: string;
  role: string;
  contexts: string[];
  exists: boolean;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  sha256?: string;
  metadata: {
    alt: boolean;
    caption: boolean;
    author: boolean;
    sourceUrl: boolean;
    license: boolean;
  };
};

type DuplicateGroup = {
  sha256: string;
  assetIds: string[];
  localPaths: string[];
  contexts: string[];
  rightsSignatures: string[];
  sameEntityKeys: string[];
  conflictingRights: boolean;
  repeatedWithinEntity: boolean;
};

type ManifestFile = { version: number; assets: MediaAsset[] };

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeMediaPath(value: string): string | null {
  const raw = value.trim().split(/[?#]/, 1)[0] ?? "";
  if (!raw || raw.includes("${") || raw.includes("{")) return null;
  const mediaIndex = raw.indexOf("/media/");
  if (mediaIndex >= 0) return raw.slice(mediaIndex + 1).replace(/^\/+/, "");
  const normalized = raw.replace(/^\/+/, "");
  return normalized.startsWith("media/") ? normalized : null;
}

function addReference(
  references: Map<string, Set<string>>,
  value: string | undefined,
  context: string,
  fallbacks: string[],
) {
  if (!value) return;
  if (value === "/logo-light.svg") {
    fallbacks.push(context);
    return;
  }
  const mediaPath = normalizeMediaPath(value);
  if (!mediaPath) return;
  const contexts = references.get(mediaPath) ?? new Set<string>();
  contexts.add(context);
  references.set(mediaPath, contexts);
}

function scanPublicSourceLiterals(
  references: Map<string, Set<string>>,
  fallbacks: string[],
) {
  const roots = ["src/app", "src/components", "src/data", "src/lib"];
  const skippedSegments = [
    "/admin/",
    "/archive/",
    "/dev/",
    "/__fixtures__/",
    "/media-library/manifest.json",
  ];
  const mediaLiteral = /["'`](\/?media\/[^"'`\s<>]+\.(?:avif|gif|jpe?g|png|svg|webp)(?:\?[^"'`\s<>]*)?)["'`]/gi;

  function walk(relativeDir: string) {
    const absoluteDir = path.join(root, relativeDir);
    if (!fs.existsSync(absoluteDir)) return;
    for (const entry of fs.readdirSync(absoluteDir, { withFileTypes: true })) {
      const relative = path.posix.join(relativeDir, entry.name);
      const normalized = `/${relative.replaceAll("\\", "/")}`;
      if (skippedSegments.some((segment) => normalized.includes(segment))) continue;
      if (entry.isDirectory()) {
        walk(relative);
        continue;
      }
      if (!/\.(?:ts|tsx|json)$/.test(entry.name) || /(?:\.test|\.spec)\.[^.]+$/.test(entry.name)) {
        continue;
      }
      const source = fs.readFileSync(path.join(root, relative), "utf8");
      for (const match of source.matchAll(mediaLiteral)) {
        addReference(references, match[1], `literal:${relative}`, fallbacks);
      }
    }
  }

  for (const relativeDir of roots) walk(relativeDir);
}

export function collectPublicMediaReferences(): {
  references: Map<string, Set<string>>;
  fallbackContexts: string[];
} {
  const references = new Map<string, Set<string>>();
  const fallbackContexts: string[] = [];

  for (const place of getAllPlaceListings()) {
    addReference(references, getPlaceCoverImage(place.slug), `place:${place.slug}:cover`, fallbackContexts);
    for (const image of getPlaceGallery(place.slug)) {
      addReference(references, image, `place:${place.slug}:gallery`, fallbackContexts);
    }
  }

  for (const destination of DESTINATION_PAGES) {
    addReference(
      references,
      getDestinationImage(destination.id),
      `destination:${destination.id}:hero`,
      fallbackContexts,
    );
    for (const image of getDestinationGallery(destination.id)) {
      addReference(references, image, `destination:${destination.id}:gallery`, fallbackContexts);
    }
  }

  for (const tour of marketplaceTours) {
    addReference(references, tour.image, `tour:${tour.slug}:hero`, fallbackContexts);
    for (const image of tour.gallery ?? []) {
      addReference(references, image, `tour:${tour.slug}:gallery`, fallbackContexts);
    }
  }

  for (const post of filterIndexableBlogPosts(blogPosts)) {
    addReference(
      references,
      resolveBlogPostCardImage(post),
      `blog:${post.slug}:card`,
      fallbackContexts,
    );
    addReference(
      references,
      getBlogPostHeroResolved(post).src,
      `blog:${post.slug}:hero`,
      fallbackContexts,
    );
    if (post.richArticleId) {
      for (const image of getRichArticleGallery(post.richArticleId)) {
        addReference(
          references,
          image.src,
          `blog:${post.slug}:rich-gallery`,
          fallbackContexts,
        );
      }
    }
  }

  for (const entry of getAllEntries()) {
    const media = entry.media;
    addReference(references, media?.hero?.url, `kb:${entry.id}:hero`, fallbackContexts);
    for (const image of media?.gallery ?? []) {
      addReference(references, image.url, `kb:${entry.id}:gallery`, fallbackContexts);
    }
    for (const match of entry.body.matchAll(/\/?media\/[^\s)"'<>]+/g)) {
      addReference(references, match[0], `kb:${entry.id}:body`, fallbackContexts);
    }
  }

  for (const entry of getAllPageEntries()) {
    if (
      entry.pageId.startsWith("blog:") ||
      entry.pageId.startsWith("rich:") ||
      entry.pageId.startsWith("podbor:")
    ) {
      continue;
    }
    const resolved = resolvePageImages(entry.pageId, {
      galleryCount: entry.gallery?.length ?? 0,
      sectionIds: Object.keys(entry.sections ?? {}),
    });
    addReference(references, resolved.hero.src, `page:${entry.pageId}:hero`, []);
    for (const image of resolved.gallery) {
      addReference(references, image.src, `page:${entry.pageId}:gallery`, []);
    }
    for (const [slot, image] of Object.entries(resolved.sections)) {
      addReference(references, image.src, `page:${entry.pageId}:${slot}`, []);
    }
    addReference(references, resolved.card?.src, `page:${entry.pageId}:card`, []);
  }

  const manifest = manifestData as ManifestFile;
  for (const themeId of new Set(manifest.assets.flatMap((asset) => asset.podborThemeId ?? []))) {
    addReference(references, getPodborThemeImage(themeId), `podbor:theme:${themeId}`, fallbackContexts);
  }
  for (const regionId of new Set(manifest.assets.flatMap((asset) => asset.podborRegionId ?? []))) {
    addReference(references, getPodborRegionImage(regionId), `podbor:region:${regionId}`, fallbackContexts);
  }

  for (const item of galleryItems) {
    addReference(references, item.imageUrl, `gallery:${item.id}`, fallbackContexts);
  }

  for (const post of socialFeedConfig.posts) {
    if (!post.enabled || !post.mediaAssetId) continue;
    const asset = getMediaAsset(post.mediaAssetId);
    addReference(references, asset?.localPath, `social:${post.id}`, fallbackContexts);
  }

  scanPublicSourceLiterals(references, fallbackContexts);
  return { references, fallbackContexts: [...new Set(fallbackContexts)].sort() };
}

function rightsSignature(asset: MediaAsset): string {
  return [asset.source, clean(asset.sourceUrl), clean(asset.license), clean(asset.author)].join("|");
}

function rightsCoreSignature(asset: MediaAsset): string {
  return [asset.source, clean(asset.license), clean(asset.author)].join("|");
}

function publicContextEntityKeys(contexts: string[]): string[] {
  return [
    ...new Set(
      contexts.flatMap((context) => {
        if (context.startsWith("literal:") || context.startsWith("gallery:")) return [];
        const lastSeparator = context.lastIndexOf(":");
        return lastSeparator > 0 ? [context.slice(0, lastSeparator)] : [];
      }),
    ),
  ];
}

function issue(
  issues: MediaAuditIssue[],
  asset: MediaAsset | undefined,
  localPath: string,
  contexts: string[],
  code: string,
  severity: Severity,
  message: string,
) {
  issues.push({
    key: `${asset?.id ?? "unmanaged"}:${code}:${localPath}`,
    code,
    severity,
    assetId: asset?.id,
    localPath,
    message,
    contexts,
  });
}

export async function auditReferencedMedia(options: {
  assets: MediaAsset[];
  references: Map<string, Set<string>>;
  publicRoot: string;
  assetIds?: Set<string>;
}) {
  const assetsByPath = new Map(
    options.assets.map((asset) => [normalizeMediaPath(asset.localPath), asset] as const),
  );
  const issues: MediaAuditIssue[] = [];
  const auditedAssets: AuditedAsset[] = [];
  const hashes = new Map<string, Array<{ asset: MediaAsset; contexts: string[] }>>();

  const selected = options.assetIds
    ? options.assets.filter((asset) => options.assetIds?.has(asset.id))
    : [...options.references.keys()]
        .map((mediaPath) => assetsByPath.get(mediaPath))
        .filter((asset): asset is MediaAsset => Boolean(asset));

  for (const asset of selected) {
    const localPath = normalizeMediaPath(asset.localPath) ?? asset.localPath;
    const contexts = [...(options.references.get(localPath) ?? new Set(["changed-manifest"]))].sort();
    const absolutePath = path.join(options.publicRoot, localPath);
    const exists = fs.existsSync(absolutePath);
    const metadata = {
      alt: Boolean(clean(asset.alt)),
      caption: Boolean(clean(asset.caption) || clean(asset.imageTitle) || clean(asset.title)),
      author: Boolean(clean(asset.author)),
      sourceUrl: Boolean(clean(asset.sourceUrl)),
      license: Boolean(clean(asset.license)),
    };
    const audited: AuditedAsset = {
      id: asset.id,
      localPath,
      source: asset.source,
      role: asset.role,
      contexts,
      exists,
      metadata,
    };

    if (!exists) {
      issue(issues, asset, localPath, contexts, "missing_file", "high", "Файл отсутствует в public/.");
    } else {
      const bytes = fs.readFileSync(absolutePath);
      audited.bytes = bytes.length;
      audited.sha256 = createHash("sha256").update(bytes).digest("hex");
      try {
        const imageMetadata = await sharp(bytes).metadata();
        audited.width = imageMetadata.width;
        audited.height = imageMetadata.height;
        audited.format = imageMetadata.format;
        if (!imageMetadata.width || !imageMetadata.height) {
          issue(issues, asset, localPath, contexts, "missing_dimensions", "high", "Не удалось определить размеры изображения.");
        } else {
          const minSide = Math.min(imageMetadata.width, imageMetadata.height);
          const maxSide = Math.max(imageMetadata.width, imageMetadata.height);
          if (minSide < 180 || maxSide < 320) {
            issue(issues, asset, localPath, contexts, "too_small", "high", `Размер ${imageMetadata.width}×${imageMetadata.height} ниже безопасного минимума 320×180.`);
          } else if (
            ["hero", "background"].includes(asset.role) &&
            imageMetadata.width < 1200
          ) {
            issue(issues, asset, localPath, contexts, "hero_resolution", "medium", `Hero ${imageMetadata.width}×${imageMetadata.height}: ширина меньше 1200 px.`);
          }
        }
      } catch {
        issue(issues, asset, localPath, contexts, "decode_error", "high", "Файл не декодируется как изображение.");
      }
      const group = hashes.get(audited.sha256) ?? [];
      group.push({ asset, contexts });
      hashes.set(audited.sha256, group);
    }

    if (!metadata.alt) {
      issue(issues, asset, localPath, contexts, "missing_alt", "high", "Не заполнен alt.");
    } else if (/^(?:нет фото|no photo|image|photo|фото)$/i.test(clean(asset.alt))) {
      issue(issues, asset, localPath, contexts, "placeholder_alt", "high", `Alt содержит заглушку «${asset.alt}».`);
    }
    if (!metadata.caption) {
      issue(issues, asset, localPath, contexts, "missing_caption", "medium", "Нет caption, imageTitle или title.");
    }
    if (!metadata.author) {
      issue(issues, asset, localPath, contexts, "missing_author", "high", "Не указан создатель/правообладатель.");
    }
    if (!metadata.sourceUrl) {
      issue(issues, asset, localPath, contexts, "missing_source_url", "high", "Не указана страница источника изображения.");
    }
    if (!metadata.license) {
      issue(issues, asset, localPath, contexts, "missing_license", "high", "Не указана лицензия или основание использования.");
    }
    auditedAssets.push(audited);
  }

  const unmanagedPaths = [...options.references.entries()]
    .filter(([mediaPath]) => !assetsByPath.has(mediaPath))
    .map(([mediaPath, contexts]) => ({ mediaPath, contexts: [...contexts].sort() }));
  for (const unmanaged of unmanagedPaths) {
    const absolutePath = path.join(options.publicRoot, unmanaged.mediaPath);
    if (!fs.existsSync(absolutePath)) {
      issue(issues, undefined, unmanaged.mediaPath, unmanaged.contexts, "unmanaged_missing_file", "high", "Публичная ссылка не имеет manifest-записи, файл отсутствует.");
    } else {
      issue(issues, undefined, unmanaged.mediaPath, unmanaged.contexts, "unmanaged_asset", "medium", "Публичный локальный файл не имеет manifest-записи с правами и атрибуцией.");
    }
  }

  const duplicateGroups: DuplicateGroup[] = [];
  for (const [sha256, members] of hashes) {
    if (members.length < 2) continue;
    const rightsSignatures = [...new Set(members.map(({ asset }) => rightsSignature(asset)))];
    const rightsCoreSignatures = [
      ...new Set(members.map(({ asset }) => rightsCoreSignature(asset))),
    ];
    const byEntity = new Map<string, number>();
    for (const { contexts } of members) {
      for (const key of publicContextEntityKeys(contexts)) {
        byEntity.set(key, (byEntity.get(key) ?? 0) + 1);
      }
    }
    const sameEntityKeys = [...byEntity.entries()]
      .filter(([, count]) => count > 1)
      .map(([key]) => key)
      .sort();
    const group: DuplicateGroup = {
      sha256,
      assetIds: members.map(({ asset }) => asset.id).sort(),
      localPaths: members.map(({ asset }) => asset.localPath).sort(),
      contexts: [...new Set(members.flatMap(({ contexts }) => contexts))].sort(),
      rightsSignatures,
      sameEntityKeys,
      conflictingRights: rightsCoreSignatures.length > 1,
      repeatedWithinEntity: sameEntityKeys.length > 0,
    };
    duplicateGroups.push(group);
    if (group.conflictingRights) {
      for (const { asset, contexts } of members) {
        issue(issues, asset, asset.localPath, contexts, "duplicate_rights_conflict", "high", "Байт-в-байт одинаковый файл имеет противоречивые source/author/license metadata.");
      }
    } else if (group.repeatedWithinEntity) {
      for (const { asset, contexts } of members) {
        issue(issues, asset, asset.localPath, contexts, "duplicate_within_entity", "medium", `Одинаковый файл повторяется внутри ${group.sameEntityKeys.join(", ")}.`);
      }
    }
  }

  const countsBySeverity = { high: 0, medium: 0, low: 0 };
  const countsByCode: Record<string, number> = {};
  for (const current of issues) {
    countsBySeverity[current.severity] += 1;
    countsByCode[current.code] = (countsByCode[current.code] ?? 0) + 1;
  }

  return {
    auditedAssets,
    unmanagedPaths,
    duplicateGroups: duplicateGroups.sort((a, b) => a.sha256.localeCompare(b.sha256)),
    issues: issues.sort((a, b) => a.key.localeCompare(b.key)),
    countsBySeverity,
    countsByCode,
  };
}

function changedManifestAssetIds(current: MediaAsset[]): Set<string> {
  const githubBase = process.env.GITHUB_BASE_REF
    ? `origin/${process.env.GITHUB_BASE_REF}`
    : undefined;
  const baseRef =
    process.env.MEDIA_RIGHTS_BASE_REF ?? githubBase ?? (process.env.CI ? "HEAD^" : "HEAD");
  let previous: ManifestFile = { version: 0, assets: [] };
  try {
    previous = JSON.parse(
      execFileSync("git", ["show", `${baseRef}:src/data/media-library/manifest.json`], {
        cwd: root,
        encoding: "utf8",
        maxBuffer: 50 * 1024 * 1024,
      }),
    ) as ManifestFile;
  } catch {
    return new Set(current.map((asset) => asset.id));
  }
  const previousById = new Map(previous.assets.map((asset) => [asset.id, asset]));
  return new Set(
    current
      .filter((asset) => JSON.stringify(previousById.get(asset.id)) !== JSON.stringify(asset))
      .map((asset) => asset.id),
  );
}

function renderReport(result: Awaited<ReturnType<typeof auditReferencedMedia>>, meta: {
  manifestAssets: number;
  publicReferences: number;
  fallbackContexts: string[];
}) {
  const publicAssets = result.auditedAssets.length;
  const completeRights = result.auditedAssets.filter(
    (asset) => asset.metadata.author && asset.metadata.sourceUrl && asset.metadata.license,
  ).length;
  const highRiskAssets = new Set(
    result.issues
      .filter((current) => current.severity === "high")
      .map((current) => current.assetId ?? current.localPath),
  ).size;
  const lines = [
    "# Media rights readiness — 16 июля 2026",
    "",
    "## Область проверки",
    "",
    "Проверены только локальные медиа, до которых реально доходят публичные места, направления, туры, индексируемые статьи и публичные записи базы знаний, зарегистрированные страницы, галерея и включённые записи социальной ленты. Архивные и административные заготовки не включались.",
    "",
    "## Итог",
    "",
    "| Показатель | Значение |",
    "| --- | ---: |",
    `| Всего записей manifest | ${meta.manifestAssets} |`,
    `| Уникальных публичных media-путей | ${meta.publicReferences} |`,
    `| Публичных assets из manifest | ${publicAssets} |`,
    `| Полный creator/source/license | ${completeRights} (${publicAssets ? Math.round((completeRights / publicAssets) * 1000) / 10 : 100}%) |`,
    `| Строк высокого риска | ${result.countsBySeverity.high} |`,
    `| Уникальных assets высокого риска | ${highRiskAssets} |`,
    `| Средний риск | ${result.countsBySeverity.medium} |`,
    `| Публичные пути вне manifest | ${result.unmanagedPaths.length} |`,
    `| Группы одинаковых файлов (SHA-256) | ${result.duplicateGroups.length} |`,
    `| Конфликтующие права у одинаковых файлов | ${result.duplicateGroups.filter((group) => group.conflictingRights).length} |`,
    `| Публичные контексты с logo/«Нет фото» fallback | ${meta.fallbackContexts.length} |`,
    "",
    "## Что проверено",
    "",
    "- наличие файла и возможность декодирования;",
    "- фактические размеры изображения;",
    "- alt и доступный caption/title;",
    "- creator, source URL, license/rights;",
    "- SHA-256 дубликаты и противоречия прав у идентичных байтов;",
    "- публичные локальные пути вне manifest;",
    "- возврат logo/«Нет фото» вместо контентного изображения.",
    "",
    "## Проблемы по типам",
    "",
    "| Код | Количество |",
    "| --- | ---: |",
    ...Object.entries(result.countsByCode)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([code, count]) => `| ${code} | ${count} |`),
    "",
    "## Блокеры и действия владельца",
    "",
  ];

  const highIssues = result.issues.filter(
    (current) => current.severity === "high" && current.code !== "duplicate_rights_conflict",
  );
  if (highIssues.length === 0) {
    lines.push("Высоких рисков не найдено.", "");
  } else {
    for (const current of highIssues) {
      lines.push(`- \`${current.assetId ?? current.localPath}\` — ${current.message} Контекст: ${current.contexts.slice(0, 3).join(", ") || "не определён"}.`);
    }
    lines.push("");
  }

  const rightsConflicts = result.duplicateGroups.filter((group) => group.conflictingRights);
  if (rightsConflicts.length > 0) {
    lines.push(
      "Ниже одинаковые байты подписаны разными авторами, источниками или лицензиями. Автоматически выбрать правильную запись нельзя: владелец должен сверить исходный download/API log либо заменить файл на подтверждённый.",
      "",
    );
    for (const group of rightsConflicts) {
      lines.push(`- \`${group.sha256.slice(0, 12)}…\`: ${group.assetIds.map((id) => `\`${id}\``).join(", ")}.`);
    }
    lines.push("");
  }

  if (result.unmanagedPaths.length > 0) {
    lines.push("Публичные файлы вне manifest требуют отдельного решения владельца:", "");
    for (const unmanaged of result.unmanagedPaths) {
      lines.push(`- \`${unmanaged.mediaPath}\` — добавить подтверждённые creator/source/license metadata или убрать публичную ссылку; контекст: ${unmanaged.contexts.slice(0, 4).join(", ")}.`);
    }
    lines.push("");
  }

  if (meta.fallbackContexts.length > 0) {
    lines.push(
      `Контентный fallback logo/«Нет фото»: ${meta.fallbackContexts.map((context) => `\`${context}\``).join(", ")}. Нужен подтверждённый asset либо скрытие пустого медиаблока.`,
      "",
    );
  }

  lines.push(
    "## Исправлено в этом спринте",
    "",
    "Три публичных файла зарегистрированы в manifest без догадок: metadata повторно зафиксированы только после полного совпадения SHA-256 с уже атрибутированным файлом.",
    "",
    "- `media/blog/mendoza-wine-route/hero.jpg` — идентичен `blog-mendoza-vinnyj-gid`;",
    "- `media/places/el-chalten/hero.jpg` — идентичен `place-fitz-roy-hero`;",
    "- `media/places/purmamarca/hero.jpg` — идентичен `place-cerro-de-los-7-colores-hero`.",
    "",
    `Повреждённых или отсутствующих файлов: ${result.countsByCode.missing_file ?? 0}; ошибок декодирования: ${result.countsByCode.decode_error ?? 0}; пустых alt: ${result.countsByCode.missing_alt ?? 0}; заглушек в alt: ${result.countsByCode.placeholder_alt ?? 0}.`,
    "",
  );

  const conflicts = result.duplicateGroups.filter(
    (group) => group.conflictingRights || group.repeatedWithinEntity,
  );
  lines.push("## Значимые SHA-256 дубликаты", "");
  if (conflicts.length === 0) {
    lines.push("Конфликтующих или повторяющихся внутри одной сущности файлов нет.", "");
  } else {
    for (const group of conflicts) {
      lines.push(
        `- \`${group.sha256.slice(0, 12)}…\` — ${group.assetIds.join(", ")}; ${group.conflictingRights ? "metadata прав противоречат" : `повтор внутри ${group.sameEntityKeys.join(", ")}`}.`,
      );
    }
    lines.push("");
  }

  lines.push(
    "## Автоматический gate",
    "",
    "`npm run media:rights:check` сравнивает manifest с `MEDIA_RIGHTS_BASE_REF`, базовой веткой GitHub или с `HEAD` локально и блокирует новые/изменённые assets с отсутствующим файлом, невалидными размерами, alt или неполными creator/source/license metadata. Полный аудит: `npm run media:rights:audit`.",
    "",
    "## Ограничения",
    "",
    "- Аудит подтверждает полноту записанных metadata, но не заменяет юридическую проверку условий каждой лицензии.",
    "- Metadata не переносились между разными файлами. Допустимым доказательством считалось только полное совпадение SHA-256.",
    "- Внешние партнёрские изображения, которые приходят динамически и не сохраняются в manifest, находятся вне этого локального аудита.",
    "",
  );
  return `${lines.join("\n")}\n`;
}

async function main() {
  const manifest = manifestData as ManifestFile;
  const { references, fallbackContexts } = collectPublicMediaReferences();
  const checkChanged = process.argv.includes("--changed") || process.argv.includes("--check");
  const assetIds = checkChanged ? changedManifestAssetIds(manifest.assets) : undefined;
  let result = await auditReferencedMedia({
    assets: manifest.assets,
    references,
    publicRoot,
    assetIds,
  });

  if (checkChanged && assetIds && assetIds.size > 0) {
    const publicResult = await auditReferencedMedia({
      assets: manifest.assets,
      references,
      publicRoot,
    });
    const relevantPublicDuplicateGroups = publicResult.duplicateGroups.filter((group) =>
      group.assetIds.some((assetId) => assetIds.has(assetId)),
    );
    const relevantPublicDuplicateIssues = publicResult.issues.filter(
      (current) =>
        current.assetId !== undefined &&
        assetIds.has(current.assetId) &&
        ["duplicate_rights_conflict", "duplicate_within_entity"].includes(current.code),
    );
    const issuesByKey = new Map(
      [...result.issues, ...relevantPublicDuplicateIssues].map((current) => [current.key, current]),
    );
    const issues = [...issuesByKey.values()].sort((a, b) => a.key.localeCompare(b.key));
    const countsBySeverity = { high: 0, medium: 0, low: 0 };
    const countsByCode: Record<string, number> = {};
    for (const current of issues) {
      countsBySeverity[current.severity] += 1;
      countsByCode[current.code] = (countsByCode[current.code] ?? 0) + 1;
    }
    result = {
      ...result,
      duplicateGroups: relevantPublicDuplicateGroups,
      issues,
      countsBySeverity,
      countsByCode,
    };
  }

  if (!checkChanged || process.argv.includes("--write")) {
    const artifact = {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      scope: "publicly-referenced-local-media",
      manifestVersion: manifest.version,
      summary: {
        manifestAssets: manifest.assets.length,
        publicReferences: references.size,
        auditedAssets: result.auditedAssets.length,
        unmanagedPaths: result.unmanagedPaths.length,
        fallbackContexts: fallbackContexts.length,
        duplicateGroups: result.duplicateGroups.length,
        conflictingRightsGroups: result.duplicateGroups.filter((group) => group.conflictingRights).length,
        highRiskAssets: new Set(
          result.issues
            .filter((current) => current.severity === "high")
            .map((current) => current.assetId ?? current.localPath),
        ).size,
        countsBySeverity: result.countsBySeverity,
        countsByCode: result.countsByCode,
      },
      fallbackContexts,
      issues: result.issues,
      duplicateGroups: result.duplicateGroups,
      assets: result.auditedAssets,
    };
    fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
    fs.writeFileSync(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(
      reportPath,
      renderReport(result, {
        manifestAssets: manifest.assets.length,
        publicReferences: references.size,
        fallbackContexts,
      }),
      "utf8",
    );
  }

  console.log(
    `[media-rights] scope=${checkChanged ? "changed" : "public"} assets=${result.auditedAssets.length} high=${result.countsBySeverity.high} medium=${result.countsBySeverity.medium}`,
  );
  if (!checkChanged) {
    console.log(`[media-rights] report=${path.relative(root, reportPath)} artifact=${path.relative(root, artifactPath)}`);
  }
  if (process.argv.includes("--check") && result.countsBySeverity.high > 0) process.exit(1);
}

const isDirectRun = process.argv[1]
  ? import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
  : false;
if (isDirectRun) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
