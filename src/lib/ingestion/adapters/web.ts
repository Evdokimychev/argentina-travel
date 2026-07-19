import { load } from "cheerio";
import { XMLParser } from "fast-xml-parser";
import { assertRobotsAllowed, respectSourceRateLimit, safeFetchText } from "@/lib/ingestion/safe-fetch";
import { getPath, validation, withCommonAdapterMethods } from "@/lib/ingestion/adapters/common";
import type { AdapterRawItem, IngestionSourceRecord, SourceAdapter } from "@/types/ingestion";

function htmlItem(html: string, url: string, source: IngestionSourceRecord): AdapterRawItem {
  const $ = load(html);
  $("script,style,noscript,nav,footer,form,aside").remove();
  const selectors = source.connectionConfig.selectors ?? {};
  const title = $(selectors.title || "h1").first().text().trim() || $("title").text().trim();
  const bodyNode = $(selectors.body || "article,main,[role=main]").first();
  const body = (bodyNode.length ? bodyNode : $("body")).text().replace(/\s*\n\s*/g, "\n").replace(/[ \t]{2,}/g, " ").trim();
  const date = $(selectors.date || "time").first().attr("datetime") || undefined;
  const author = $(selectors.author || "[rel=author],.author").first().text().trim() || undefined;
  const canonical = $("link[rel=canonical]").attr("href");
  return { externalId: canonical || url, sourceUrl: url, canonicalUrl: canonical ? new URL(canonical, url).toString() : url, rawFormat: "html", rawContent: body, rawPayload: { html }, title, author, publishedAt: date };
}

export const websiteAdapter: SourceAdapter = withCommonAdapterMethods({
  type: "website",
  validateConfig: (source) => validation([!source.connectionConfig.url && !source.connectionConfig.urls?.length && "Укажите URL"]),
  fetch: async (source) => {
    const urls = [...(source.connectionConfig.urls ?? []), ...(source.connectionConfig.url ? [source.connectionConfig.url] : [])].slice(0, source.connectionConfig.limit ?? 20);
    const items: AdapterRawItem[] = [];
    for (const url of [...new Set(urls)]) { await assertRobotsAllowed(url, source); const result = await safeFetchText(url, source); items.push(htmlItem(result.text, result.url, source)); await respectSourceRateLimit(source); }
    return { items, checkpoint: { fetchedAt: new Date().toISOString(), urls: items.map((item) => item.sourceUrl ?? "") } };
  },
});

function arrayValue(value: unknown): unknown[] { return value === undefined ? [] : Array.isArray(value) ? value : [value]; }
function textValue(value: unknown): string { return value === null || value === undefined ? "" : typeof value === "object" ? String((value as Record<string, unknown>)["#text"] ?? "") : String(value); }

export const rssAdapter: SourceAdapter = withCommonAdapterMethods({
  type: "rss",
  validateConfig: (source) => validation([!source.connectionConfig.feedUrl && !source.connectionConfig.url && "Укажите адрес RSS/Atom"]),
  fetch: async (source) => {
    const feedUrl = source.connectionConfig.feedUrl || source.connectionConfig.url!;
    const response = await safeFetchText(feedUrl, source);
    const parsed = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" }).parse(response.text) as Record<string, unknown>;
    const channel = getPath(parsed, "rss.channel") ?? getPath(parsed, "feed");
    const entries = arrayValue(getPath(channel, "item") ?? getPath(channel, "entry")).slice(0, source.connectionConfig.limit ?? 30);
    const items = entries.map((entry, index): AdapterRawItem => {
      const row = entry as Record<string, unknown>;
      const linkValue = row.link;
      const link = typeof linkValue === "object" ? textValue((linkValue as Record<string, unknown>)["@_href"]) : textValue(linkValue);
      const body = textValue(row["content:encoded"] ?? row.content ?? row.description ?? row.summary);
      return { externalId: textValue(row.guid ?? row.id) || link || `${feedUrl}#${index}`, sourceUrl: link || feedUrl, canonicalUrl: link || undefined, rawFormat: parsed.rss ? "rss" : "atom", rawContent: load(body).text() || body, rawPayload: row as never, title: textValue(row.title), author: textValue(row.author ?? row["dc:creator"]) || undefined, publishedAt: textValue(row.pubDate ?? row.published ?? row.updated) || undefined };
    });
    return { items, checkpoint: { fetchedAt: new Date().toISOString(), latestExternalId: items[0]?.externalId ?? null } };
  },
});

export const sitemapAdapter: SourceAdapter = withCommonAdapterMethods({
  type: "sitemap",
  validateConfig: (source) => validation([!source.connectionConfig.sitemapUrl && !source.connectionConfig.url && "Укажите адрес sitemap.xml"]),
  fetch: async (source) => {
    const sitemapUrl = source.connectionConfig.sitemapUrl || source.connectionConfig.url!;
    const response = await safeFetchText(sitemapUrl, source);
    const parsed = new XMLParser({ ignoreAttributes: false }).parse(response.text) as Record<string, unknown>;
    const nodes = arrayValue(getPath(parsed, "urlset.url"));
    const urls = nodes.map((node) => textValue((node as Record<string, unknown>).loc)).filter(Boolean).slice(0, source.connectionConfig.limit ?? 20);
    const items: AdapterRawItem[] = [];
    for (const url of urls) { await assertRobotsAllowed(url, source); const page = await safeFetchText(url, source); items.push(htmlItem(page.text, page.url, source)); await respectSourceRateLimit(source); }
    return { items, discovered: nodes.length, checkpoint: { fetchedAt: new Date().toISOString(), lastUrl: urls.at(-1) ?? null } };
  },
});

export const jsonApiAdapter: SourceAdapter = withCommonAdapterMethods({
  type: "json_api",
  validateConfig: (source) => validation([!source.connectionConfig.url && "Укажите адрес JSON API"]),
  fetch: async (source) => {
    const response = await safeFetchText(source.connectionConfig.url!, source, { headers: { accept: "application/json" } });
    const payload = JSON.parse(response.text) as unknown;
    const values = getPath(payload, source.connectionConfig.itemsPath ?? "") ?? payload;
    const rows = (Array.isArray(values) ? values : [values]).slice(0, source.connectionConfig.limit ?? 30);
    const map = source.connectionConfig.fieldMap ?? {};
    const items = rows.map((row, index): AdapterRawItem => ({
      externalId: String(getPath(row, map.id ?? "id") ?? `${response.url}#${index}`),
      sourceUrl: String(getPath(row, map.url ?? "url") ?? response.url), rawFormat: "json", rawPayload: row as never,
      title: String(getPath(row, map.title ?? "title") ?? ""), rawContent: String(getPath(row, map.body ?? "body") ?? getPath(row, "content") ?? ""),
      author: String(getPath(row, map.author ?? "author") ?? "") || undefined, publishedAt: String(getPath(row, map.publishedAt ?? "published_at") ?? "") || undefined,
    }));
    return { items, checkpoint: { fetchedAt: new Date().toISOString(), count: items.length } };
  },
});

export const manualAdapter: SourceAdapter = withCommonAdapterMethods({
  type: "manual",
  validateConfig: (source) => validation([!source.connectionConfig.manualItems?.length && "Добавьте хотя бы один материал"]),
  fetch: async (source) => ({
    items: (source.connectionConfig.manualItems ?? []).map((item) => ({ externalId: item.id, sourceUrl: item.url, rawFormat: "text", rawContent: item.body, title: item.title, publishedAt: item.publishedAt })),
    checkpoint: { fetchedAt: new Date().toISOString(), count: source.connectionConfig.manualItems?.length ?? 0 },
  }),
});
