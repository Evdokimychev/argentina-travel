import type { BlogBodyBlock } from "@/types/blog-content-blocks";
import type { BlogRichBlock, BlogRichCalloutVariant } from "@/types/blog-rich-article";

/** Map deprecated / alias block shapes onto canonical BlogBodyBlock types. */
export function migrateLegacyBlogBodyBlock(block: BlogBodyBlock): BlogBodyBlock {
  if (block.type === "infobox") {
    const variant =
      block.variant === "important"
        ? "important"
        : block.variant === "warning"
          ? "warning"
          : "tip";
    return {
      type: "callout",
      variant,
      title: block.title,
      body: block.body,
    };
  }

  if (block.type === "media") {
    return {
      type: "photo",
      src: block.src,
      alt: block.alt,
      caption: block.caption,
      variant: "content-width",
    };
  }

  return block;
}

export function adaptBlogBodyBlocks(
  blocks: BlogBodyBlock[],
  opts: { migrateMediaToPhoto?: boolean } = {},
): BlogBodyBlock[] {
  return blocks.map((block) => {
    if (block.type === "infobox") return migrateLegacyBlogBodyBlock(block);
    if (opts.migrateMediaToPhoto && block.type === "media") {
      return migrateLegacyBlogBodyBlock(block);
    }
    return block;
  });
}

function mapRichCalloutVariant(
  variant: BlogRichCalloutVariant,
): "tip" | "warning" | "important" {
  if (variant === "warning") return "warning";
  if (variant === "info") return "important";
  return "tip";
}

/** Bridge BlogRichBlock → BlogBodyBlock for shared rendering where possible. */
export function adaptRichBlockToBody(block: BlogRichBlock): BlogBodyBlock[] {
  switch (block.type) {
    case "paragraphs":
      return block.items.map((text) => ({ type: "paragraph" as const, text }));
    case "callout":
      return [
        {
          type: "callout",
          variant: mapRichCalloutVariant(block.variant),
          title: block.title,
          body: block.body,
        },
      ];
    case "stats":
      return [
        {
          type: "facts-grid",
          items: block.items.map((item) => ({
            label: item.label,
            value: item.value,
          })),
          columns: 3,
        },
      ];
    case "links":
      return block.items.map((item) => ({
        type: "cta" as const,
        label: item.label,
        href: item.href,
        variant: "secondary" as const,
      }));
    case "spots":
      return [
        {
          type: "option-selector",
          title: "Что посмотреть",
          options: block.items.map((item) => ({
            id: `spot-${item.rank}`,
            title: item.title,
            summary: item.why,
            details: [item.duration, item.difficulty, item.tip].filter(Boolean).join(" · "),
            meta: `#${item.rank}`,
          })),
        },
      ];
    case "table":
      return [
        {
          type: "table",
          headers: block.headers,
          rows: block.rows,
          caption: block.caption,
        },
      ];
    case "bullets":
      return [{ type: "bullets", items: block.items }];
    case "seasons":
      return [
        {
          type: "seasons",
          items: block.items,
          conclusion: block.conclusion,
        },
      ];
    case "faq":
      return [{ type: "faq", items: block.items }];
    case "ratings":
      return [
        {
          type: "facts-grid",
          title: "Оценки",
          items: block.items.map((item) => ({
            label: item.label,
            value: `${"★".repeat(Math.max(0, Math.min(5, item.stars)))}`,
            description: block.note,
          })),
        },
      ];
    case "numbered-tips":
      return [{ type: "steps", items: block.items }];
    case "gallery":
      return [
        {
          type: "gallery",
          items: block.images.map((image) => ({
            src: image.src,
            alt: image.alt,
            caption: image.title,
          })),
          variant: "grid",
        },
      ];
    case "section-image":
      if (!block.src) return [];
      return [
        {
          type: "photo",
          src: block.src,
          alt: block.alt,
          caption: block.caption ?? block.title,
          variant: "content-width",
        },
      ];
    case "map":
      return [{ type: "map", lat: block.lat, lng: block.lng, label: block.label }];
    case "ticket-link":
      return [{ type: "ticket-link", url: block.url, label: block.label }];
    default: {
      const _exhaustive: never = block;
      return _exhaustive;
    }
  }
}

export function adaptRichBlocksToBody(blocks: BlogRichBlock[]): BlogBodyBlock[] {
  return blocks.flatMap(adaptRichBlockToBody);
}
