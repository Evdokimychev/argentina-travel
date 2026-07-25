import { escapeHtml, formatInlineMarkdown } from "@/lib/rich-text";

/** True when text still carries lightweight Markdown markers readers should not see raw. */
export function hasBlogInlineMarkdown(text: string): boolean {
  return (
    /\*\*[^*]+\*\*/.test(text) ||
    /__[^_]+__/.test(text) ||
    /(^|[^*])\*[^*]+\*(?!\*)/.test(text) ||
    /\[[^\]]+\]\([^)]+\)/.test(text) ||
    /`[^`]+`/.test(text)
  );
}

/** Strip common inline Markdown to plain text (tables, captions, search). */
export function stripBlogInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/(^|[^*\n])\*([^*\n]+)\*(?!\*)/g, "$1$2")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

/**
 * Safe HTML for paragraph/callout bodies with Markdown emphasis and links.
 * Order: protect markdown links → format bold/italic → restore anchors.
 * Supports both absolute https? and site-relative `/path` links from the editor.
 */
export function blogInlineMarkdownToHtml(text: string): string {
  const links: Array<{ href: string; label: string }> = [];
  const withPlaceholders = text.replace(
    /\[([^\]]+)\]\((\/[^)\s]+|https?:\/\/[^)\s]+)\)/g,
    (_, label: string, href: string) => {
      const index = links.length;
      links.push({ href, label });
      return `%%BLOG_MD_LINK_${index}%%`;
    },
  );

  let html = formatInlineMarkdown(withPlaceholders);
  html = html.replace(/%%BLOG_MD_LINK_(\d+)%%/g, (_, rawIndex: string) => {
    const link = links[Number(rawIndex)];
    if (!link) return "";
    const external = /^https?:\/\//i.test(link.href);
    const attrs = external
      ? ` href="${escapeHtml(link.href)}" rel="noopener noreferrer" target="_blank"`
      : ` href="${escapeHtml(link.href)}"`;
    return `<a${attrs}>${escapeHtml(link.label)}</a>`;
  });
  return html;
}
