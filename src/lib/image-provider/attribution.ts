import type { ImageAttribution } from "./types";
import type { MediaSource } from "@/types/media-asset";

export function buildAttributionHtml(
  attribution: ImageAttribution,
  source: MediaSource,
): string {
  const author = attribution.authorProfileUrl
    ? `<a href="${attribution.authorProfileUrl}">${escapeHtml(attribution.authorName)}</a>`
    : escapeHtml(attribution.authorName);

  if (source === "unsplash") {
    return `Фото: ${author} / <a href="${attribution.sourceUrl}">Unsplash</a>`;
  }
  if (source === "pexels") {
    return `Фото: ${author} / <a href="${attribution.sourceUrl}">Pexels</a>`;
  }
  if (source === "wikimedia" || source === "wikipedia") {
    return `Фото: ${author} / <a href="${attribution.sourceUrl}">Wikimedia Commons</a> (${escapeHtml(attribution.license)})`;
  }
  return `Фото: ${author}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
