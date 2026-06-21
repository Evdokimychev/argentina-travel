#!/usr/bin/env node
/**
 * Generates blog rich article TS files from docs/articles/*.md
 * Preserves markdown text verbatim; maps structure to BlogRichArticle blocks.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = path.resolve(import.meta.dirname, "..");
const DOCS = path.join(ROOT, "docs", "articles");
const OUT = path.join(ROOT, "src/data/blog-articles");

const ARTICLES = [
  {
    md: "Национальный-парк-Игуасу.md",
    out: "iguazu-national-park.ts",
    exportName: "iguazuNationalParkArticle",
    id: "iguazu-national-park",
  },
  {
    md: "Национальный-парк-Огненная-Земля.md",
    out: "tierra-del-fuego-national-park.ts",
    exportName: "tierraDelFuegoNationalParkArticle",
    id: "tierra-del-fuego-national-park",
  },
  {
    md: "Национальный-парк-Науэль-Уапи.md",
    out: "nahuel-huapi-national-park.ts",
    exportName: "nahuelHuapiNationalParkArticle",
    id: "nahuel-huapi-national-park",
  },
  {
    md: "Национальный-парк-Лос-Гласьярес.md",
    out: "los-glaciares-national-park.ts",
    exportName: "losGlaciaresNationalParkArticle",
    id: "los-glaciares-national-park",
  },
  {
    md: "Национальный-парк-Ибера.md",
    out: "ibera-national-park.ts",
    exportName: "iberaNationalParkArticle",
    id: "ibera-national-park",
  },
  {
    md: "Национальный-парк-Ланин.md",
    out: "lanin-national-park.ts",
    exportName: "laninNationalParkArticle",
    id: "lanin-national-park",
  },
  {
    md: "Национальный-парк-Лос-Алерсес.md",
    out: "los-alerces-national-park.ts",
    exportName: "losAlercesNationalParkArticle",
    id: "los-alerces-national-park",
  },
  {
    md: "Национальный-парк-Лос-Кардонес.md",
    out: "los-cardones-national-park.ts",
    exportName: "losCardonesNationalParkArticle",
    id: "los-cardones-national-park",
  },
  {
    md: "Национальный-парк-Патагония.md",
    out: "patagonia-national-park.ts",
    exportName: "patagoniaNationalParkArticle",
    id: "patagonia-national-park",
  },
  {
    md: "Национальный-парк-Талампая.md",
    out: "talampaya-national-park.ts",
    exportName: "talampayaNationalParkArticle",
    id: "talampaya-national-park",
  },
  {
    md: "Баньядо-ла-Эстрелья.md",
    out: "banado-la-estrella.ts",
    exportName: "banadoLaEstrellaArticle",
    id: "banado-la-estrella",
  },
  {
    md: "Все-национальные-парки-Аргентины.md",
    out: "all-argentina-national-parks.ts",
    exportName: "allArgentinaNationalParksArticle",
    id: "all-argentina-national-parks",
  },
  {
    md: "Парк-Исчигуаласто-Долина-Луны.md",
    out: "ischigualasto-valley-of-the-moon.ts",
    exportName: "ischigualastoValleyOfTheMoonArticle",
    id: "ischigualasto-valley-of-the-moon",
  },
  // Valdes: MD stub (~42 lines) — full article in valdes-peninsula-national-park.ts until MD expanded.
];

function escapeTs(str) {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n/g, "\\n")
    .replace(/"/g, '\\"');
}

function stripMdInline(text) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`/g, "")
    .trim();
}

function parseMapComment(line) {
  const m = line.match(
    /<!--\s*map:\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)(?:\s*,\s*(.+?))?\s*-->/,
  );
  if (!m) return null;
  return {
    lat: Number(m[1]),
    lng: Number(m[2]),
    label: m[3]?.trim() || "Открыть на Google Maps",
  };
}

function parseTicketComment(line) {
  const m = line.match(/<!--\s*ticket:\s*(https?:\/\/[^\s,]+)(?:\s*,\s*(.+?))?\s*-->/);
  if (!m) return null;
  return { url: m[1], label: m[2]?.trim() || "Купить билет онлайн" };
}

function parseMarkdownLinks(text) {
  const items = [];
  const re = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    items.push({ label: stripMdInline(m[1]), href: m[2], external: true });
  }
  return items;
}

function parseMapsFromText(text) {
  const maps = [];
  const seen = new Set();
  for (const line of text.split("\n")) {
    const comment = parseMapComment(line);
    if (comment) {
      const key = `${comment.lat},${comment.lng}`;
      if (!seen.has(key)) {
        seen.add(key);
        maps.push(comment);
      }
      continue;
    }
    const urlMatch = line.match(/maps\?q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (urlMatch) {
      const lat = Number(urlMatch[1]);
      const lng = Number(urlMatch[2]);
      const key = `${lat},${lng}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const labelMatch = line.match(/^([^:`]+?)(?:\s*—|:)\s*`?https?:/);
      const label = labelMatch
        ? stripMdInline(labelMatch[1].replace(/Рекомендуемая точка[^—]*—\s*/, ""))
        : "Открыть на Google Maps";
      maps.push({ lat, lng, label });
    }
  }
  return maps;
}

function sectionImageBlock(slotId, alt, caption) {
  return { type: "section-image", slotId, alt, caption };
}

const SECTION_IMAGE_PRESETS = {
  overview: {
    alt: "Общий вид национального парка",
    caption: "Панорама и масштаб парка",
  },
  seasons: {
    alt: "Сезонные условия в парке",
    caption: "Как меняется парк по сезонам",
  },
  logistics: {
    alt: "Дорога и логистика до парка",
    caption: "Как добраться и организовать визит",
  },
  landmark: {
    alt: "Главная достопримечательность — вид на парк",
    caption: "Главные виды и символы парка",
  },
  trails: {
    alt: "Тропы и маршруты — прогулка по парку",
    caption: "Маршруты и активности для путешественника",
  },
  wildlife: {
    alt: "Флора и фауна — обитатели парка",
    caption: "Дикая природа и типичные виды",
  },
};

function parseMd(content) {
  const lines = content.split("\n");
  let i = 0;
  const title = lines[i].replace(/^#\s+/, "").trim();
  i++;

  while (i < lines.length && lines[i]?.trim() === "") i++;

  let updatedLabel = "";
  if (lines[i]?.startsWith(">")) {
    updatedLabel = lines[i].replace(/^>\s*/, "").trim();
    i++;
  }
  while (i < lines.length && lines[i]?.trim() === "") i++;

  const intro = [];
  while (i < lines.length && !lines[i].startsWith("---")) {
    const line = lines[i].trim();
    if (line && !line.startsWith(">")) intro.push(stripMdInline(line));
    i++;
  }
  if (lines[i]?.startsWith("---")) i++;

  const lede = intro.shift() ?? "";
  const introRest = intro;

  const sections = [];
  while (i < lines.length) {
    if (lines[i].startsWith("## ")) {
      const sectionTitle = lines[i].replace(/^##\s+/, "").trim();
      i++;
      const bodyLines = [];
      while (i < lines.length && !lines[i].startsWith("## ") && !lines[i].startsWith("---")) {
        bodyLines.push(lines[i]);
        i++;
      }
      if (sectionTitle.startsWith("SEO-блок")) break;
      sections.push({ title: sectionTitle, body: bodyLines.join("\n").trim() });
    } else if (lines[i]?.startsWith("---")) {
      i++;
    } else {
      i++;
    }
  }

  return { title, updatedLabel, lede, intro: introRest, sections };
}

function parseSourcesSection(content) {
  const m = content.match(/## Источники\n([\s\S]*?)(?=\n---\s*$|\n---\n|$)/);
  if (!m?.[1]?.trim()) return null;
  return { title: "Источники", body: m[1].trim() };
}

function slugify(title) {
  const map = {
    "Краткая информация": "overview",
    "Где находится парк": "location",
    "Где находится": "location",
    "Чем знаменит этот парк": "highlights",
    "Чем знаменит парк": "highlights",
    "Чем знаменито это место": "highlights",
    "Что обязательно посмотреть: ТОП-10": "top-10",
    "Что обязательно увидеть и сделать: ТОП-10": "top-10",
    "Лучшие маршруты": "routes",
    "Лучшие маршруты (экскурсии)": "routes",
    "Лучшие активности и порталы": "routes",
    "Форматы посещения": "routes",
    "Коротко о системе национальных парков": "system",
    "Сравнительная таблица всех национальных парков": "all-parks-table",
    "Парки по регионам": "regions",
    "Подробные гиды по паркам": "park-guides",
    "Какой парк выбрать": "choose-park",
    "Билеты, цены и полезное": "tickets",
    "Флора и фауна": "wildlife",
    "Когда лучше ехать": "seasons",
    "Как добраться": "getting-there",
    "Билеты и стоимость посещения": "tickets",
    "Билеты и стоимость": "tickets",
    "Инфраструктура": "infrastructure",
    "Практические советы": "tips",
    "Советы местного гида": "guide-tips",
    "Советы «местного гида»": "guide-tips",
    "Интересные факты": "facts",
    "Часто задаваемые вопросы": "faq",
    Итог: "summary",
    Источники: "sources",
  };
  return map[title] ?? title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function parseTable(text) {
  const rows = text.split("\n").filter((l) => l.trim().startsWith("|"));
  if (rows.length < 2) return null;
  const parseRow = (row) =>
    row
      .split("|")
      .slice(1, -1)
      .map((c) => stripMdInline(c.trim()));
  const headers = parseRow(rows[0]);
  const dataRows = rows.slice(2).map(parseRow);
  return { headers, rows: dataRows };
}

function parseSpots(text) {
  const spots = [];
  const blocks = text.split(/(?:^|\n)###\s+/m).filter(Boolean);
  for (const block of blocks) {
    const lines = block.split("\n");
    const header = lines[0].trim();
    const rankMatch = header.match(/^(\d+)\.\s+(.+)/);
    if (!rankMatch) continue;
    const rank = Number(rankMatch[1]);
    const title = rankMatch[2].trim();
    const fields = { why: "", duration: "", difficulty: "", tip: "" };
    for (const line of lines.slice(1)) {
      const m = line.match(/^\*\*([^*]+):\*\*\s*(.+)/);
      if (!m) continue;
      const key = m[1].toLowerCase();
      const val = stripMdInline(m[2]);
      if (key.includes("почему")) fields.why = val;
      else if (key.includes("время")) fields.duration = val;
      else if (key.includes("сложность")) fields.difficulty = val;
      else if (key.includes("совет")) fields.tip = val;
    }
    spots.push({ rank, title, ...fields });
  }
  return spots;
}

function parseNumberedTips(text) {
  return text
    .split("\n")
    .map((l) => l.match(/^\d+\.\s+(.+)/))
    .filter(Boolean)
    .map((m) => stripMdInline(m[1]));
}

function parseFaq(text) {
  const items = [];
  const re = /\*\*(\d+\.\s*)?([^*]+)\*\*\s*\n([\s\S]*?)(?=\n\*\*|\n---|\n##|$)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const question = stripMdInline(m[2]);
    const answer = stripMdInline(m[3].replace(/\n+/g, " "));
    if (question && answer) items.push({ question, answer });
  }
  return items;
}

function parseBullets(text) {
  return text
    .split("\n")
    .filter((l) => /^[-*]\s+/.test(l.trim()) || /^\d+\.\s+/.test(l.trim()))
    .map((l) => stripMdInline(l.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, "")));
}

function parseSeasons(text) {
  const items = [];
  const blocks = text.split(/\*\*([^*]+)\*\*\s*\n/);
  for (let i = 1; i < blocks.length; i += 2) {
    const name = blocks[i].trim().replace(/\.$/, "");
    const body = blocks[i + 1] ?? "";
    const pros = [];
    const cons = [];
    for (const line of body.split("\n")) {
      const t = line.trim();
      if (t.startsWith("Плюсы:")) pros.push(stripMdInline(t.replace(/^Плюсы:\s*/, "")));
      else if (t.startsWith("Минусы:")) cons.push(stripMdInline(t.replace(/^Минусы:\s*/, "")));
    }
    if (name) items.push({ name, pros, cons });
  }
  const conclusionMatch = text.match(/\*\*Вывод:\*\*\s*(.+)/);
  const conclusion = conclusionMatch ? stripMdInline(conclusionMatch[1]) : undefined;
  return { items, conclusion };
}

function parseSeoFaq(content) {
  const m = content.match(/### FAQ Schema[\s\S]*?```json\s*([\s\S]*?)```/);
  if (!m) return [];
  try {
    const json = JSON.parse(m[1]);
    return json.mainEntity.map((q) => ({
      question: q.name,
      answer: q.acceptedAnswer.text,
    }));
  } catch {
    return [];
  }
}

function cleanupBlocks(section) {
  section.blocks = section.blocks.filter((b) => {
    if (["bullets", "paragraphs", "numbered-tips"].includes(b.type)) return b.items?.length > 0;
    if (b.type === "spots") return b.items?.length > 0;
    if (b.type === "faq") return b.items?.length > 0;
    return true;
  });
  return section;
}

function parseSubsections(body) {
  const blocks = [];
  const parts = body.split(/\n(?=###\s)/);
  for (const part of parts) {
    if (part.startsWith("###")) {
      const lines = part.split("\n");
      const heading = stripMdInline(lines[0].replace(/^###\s+/, ""));
      const rest = lines.slice(1).join("\n").trim();
      const bullets = parseBullets(rest);
      if (bullets.length) {
        blocks.push({ type: "bullets", title: heading, items: bullets });
      } else {
        const paras = rest
          .split(/\n\n+/)
          .map(stripMdInline)
          .filter(Boolean);
        if (paras.length) blocks.push({ type: "paragraphs", items: paras.map((p) => `${heading}. ${p}`) });
      }
    } else {
      for (const chunk of part.split(/\n\n+/)) {
        if (!chunk.trim()) continue;
        if (chunk.includes("**Совет по логистике:**") || chunk.includes("**Маленький секрет")) {
          const m = chunk.match(/\*\*([^*]+):\*\*\s*([\s\S]+)/);
          if (m) {
            blocks.push({
              type: "callout",
              variant: "tip",
              title: stripMdInline(m[1]),
              body: stripMdInline(m[2]),
            });
          }
        } else if (chunk.trim().startsWith("-")) {
          blocks.push({ type: "bullets", items: parseBullets(chunk) });
        } else {
          const p = stripMdInline(chunk);
          if (p) blocks.push({ type: "paragraphs", items: [p] });
        }
      }
    }
  }
  return blocks;
}

function parseHighlights(body) {
  const blocks = [];
  for (const chunk of body.split(/\n\n+/)) {
    if (/^\*\*Ради чего/.test(chunk)) {
      blocks.push({
        type: "callout",
        variant: "tip",
        title: "Ради чего едут",
        body: stripMdInline(chunk.replace(/^\*\*Ради чего[^*]*\*\*\s*/, "")),
      });
    } else if (/^-\s/m.test(chunk)) {
      const lines = chunk.split("\n");
      const first = lines[0];
      if (/^\*\*[^*]+\*\*/.test(first) && !first.trim().startsWith("-")) {
        blocks.push({ type: "paragraphs", items: [stripMdInline(first)] });
        const bullets = parseBullets(lines.slice(1).join("\n"));
        if (bullets.length) blocks.push({ type: "bullets", items: bullets });
      } else {
        blocks.push({ type: "bullets", items: parseBullets(chunk) });
      }
    } else if (chunk.trim()) {
      blocks.push({ type: "paragraphs", items: [stripMdInline(chunk)] });
    }
  }
  return blocks;
}

function parseWildlife(body) {
  const blocks = [];
  const introMatch = body.match(/^([\s\S]*?)(?=\*\*Какие )/);
  if (introMatch?.[1]?.trim()) {
    blocks.push({ type: "paragraphs", items: [stripMdInline(introMatch[1].trim())] });
  }
  for (const chunk of body.split(/\n\n+/)) {
    const titleMatch = chunk.match(/^\*\*([^*]+)\*\*/);
    if (titleMatch && /^-\s/m.test(chunk)) {
      blocks.push({
        type: "bullets",
        title: stripMdInline(titleMatch[1]),
        items: parseBullets(chunk.replace(/^\*\*[^*]+\*\*\s*/, "")),
      });
    }
  }
  return blocks;
}

function parseGuideTips(body) {
  const blocks = [];
  const intro = body.match(/^([\s\S]*?)(?=\*\*Лучшие|\*\*Как сделать|\*\*Маленький|$)/);
  if (intro?.[1]?.trim() && !intro[1].includes("**Лучшие")) {
    blocks.push({ type: "paragraphs", items: [stripMdInline(intro[1].trim())] });
  }
  for (const chunk of body.split(/\n\n+/)) {
    if (/^\*\*Маленький секрет/.test(chunk)) {
      const m = chunk.match(/\*\*([^*]+):\*\*\s*([\s\S]+)/);
      if (m) {
        blocks.push({
          type: "callout",
          variant: "tip",
          title: stripMdInline(m[1]),
          body: stripMdInline(m[2]),
        });
      }
    } else if (/^\*\*[^*]+\*\*/.test(chunk)) {
      const titleMatch = chunk.match(/^\*\*([^*]+)\*\*/);
      const rest = chunk.replace(/^\*\*[^*]+\*\*\s*/, "").trim();
      blocks.push({
        type: "paragraphs",
        items: [`${stripMdInline(titleMatch[1])}. ${stripMdInline(rest)}`],
      });
    }
  }
  return blocks;
}

function parseFacts(body) {
  const items = parseBullets(body);
  return items.length ? [{ type: "bullets", items }] : [];
}

function parseSources(body) {
  const blocks = [];
  const items = [];
  for (const line of body.split("\n")) {
    const m = line.match(/^-\s+(.+?):\s+(https?:\/\/\S+)/);
    if (m) items.push({ label: stripMdInline(m[1]), href: m[2], external: true });
  }
  if (items.length) blocks.push({ type: "links", title: "Источники", items });
  const noteMatch = body.match(/>\s*Примечание[^:]*:\s*([\s\S]+)/);
  if (noteMatch) {
    blocks.push({
      type: "callout",
      variant: "info",
      title: "Примечание о достоверности",
      body: stripMdInline(noteMatch[1]),
    });
  }
  return blocks;
}

function parseRatings(text) {
  const audience = [];
  const audMatch = text.match(/\*\*Кому подойдёт:\*\*([\s\S]*?)(?=\*\*Итоговая|\*\*Где данные|$)/);
  if (audMatch) {
    for (const line of audMatch[1].split("\n")) {
      const m = line.match(/^[-*]\s+\*\*([^*]+)\*\*\s*—\s*(.+)/);
      if (m) audience.push(`${m[1]} — ${stripMdInline(m[2])}`);
      else {
        const plain = line.match(/^[-*]\s+(.+)/);
        if (plain) audience.push(stripMdInline(plain[1]));
      }
    }
  }
  const items = [];
  for (const line of text.split("\n")) {
    const m = line.match(/\*\*([^*]+)\*\*\s*[★☆]+/);
    const stars = (line.match(/★/g) || []).length;
    if (m && stars) items.push({ label: m[1].trim(), stars });
  }
  const noteMatch = text.match(/\*\*Где данные[^*]*\*\*([^]*?)(?=\n---|\n##|$)/);
  const note = noteMatch ? stripMdInline(noteMatch[1].replace(/\n+/g, " ")) : undefined;
  const summaryMatch = text.match(/^([\s\S]*?)(?=\*\*Кому подойдёт|\*\*Итоговая)/);
  const summary = summaryMatch ? stripMdInline(summaryMatch[1].trim()) : "";
  return { summary, audience, items, note };
}

function sectionBlocks(section) {
  const { title, body } = section;
  const id = slugify(title);
  const blocks = [];

  if (title === "Краткая информация") {
    const table = parseTable(body);
    if (table) {
      blocks.push({
        type: "stats",
        items: table.rows.map(([label, value]) => ({ label, value })),
      });
    }
    const preset = SECTION_IMAGE_PRESETS.overview;
    blocks.push(sectionImageBlock("overview", preset.alt, preset.caption));
    return cleanupBlocks({ id, title, blocks });
  }

  if (
    title === "Где находится парк" ||
    title === "Где находится"
  ) {
    const maps = parseMapsFromText(body);
    const bodyWithoutMaps = body
      .split("\n")
      .filter(
        (line) =>
          !line.includes("ВСТАВИТЬ GOOGLE MAPS") &&
          !parseMapComment(line) &&
          !line.includes("maps?q=") &&
          !line.includes("iframe Google Maps"),
      )
      .join("\n");

    for (const chunk of bodyWithoutMaps.split(/\n\n+/)) {
      if (!chunk.trim()) continue;
      if (chunk.trim().startsWith("|")) {
        const table = parseTable(chunk);
        if (table) blocks.push({ type: "table", headers: table.headers, rows: table.rows });
      } else if (/^[-*]\s/m.test(chunk) || /^\d+\.\s/m.test(chunk)) {
        const titleMatch = chunk.match(/^\*\*([^*]+)\*\*/);
        const items = parseBullets(chunk);
        if (items.length) {
          blocks.push({
            type: "bullets",
            title: titleMatch ? stripMdInline(titleMatch[1]) : undefined,
            items,
          });
        }
      } else {
        const p = stripMdInline(chunk);
        if (p) blocks.push({ type: "paragraphs", items: [p] });
      }
    }

    for (const map of maps) {
      blocks.push({ type: "map", lat: map.lat, lng: map.lng, label: map.label });
    }
    return cleanupBlocks({ id, title, blocks });
  }

  if (title.includes("ТОП-10")) {
    const spots = parseSpots(body);
    if (spots.length) blocks.push({ type: "spots", items: spots });
    return cleanupBlocks({ id, title, blocks });
  }

  if (title.includes("знаменит")) {
    blocks.push(...parseHighlights(body));
    const preset = SECTION_IMAGE_PRESETS.landmark;
    blocks.push(sectionImageBlock("landmark", preset.alt, preset.caption));
    return cleanupBlocks({ id, title, blocks });
  }

  if (title === "Флора и фауна") {
    blocks.push(...parseWildlife(body));
    const preset = SECTION_IMAGE_PRESETS.wildlife;
    blocks.push(sectionImageBlock("wildlife", preset.alt, preset.caption));
    return cleanupBlocks({ id, title, blocks });
  }

  if (title === "Советы местного гида" || title.includes("местного гида")) {
    blocks.push(...parseGuideTips(body));
    return cleanupBlocks({ id, title, blocks });
  }

  if (title === "Интересные факты") {
    blocks.push(...parseFacts(body));
    return cleanupBlocks({ id, title, blocks });
  }

  if (title === "Источники") {
    blocks.push(...parseSources(body));
    return cleanupBlocks({ id, title, blocks });
  }

  if (title === "Как добраться") {
    blocks.push(...parseSubsections(body));
    const preset = SECTION_IMAGE_PRESETS.logistics;
    blocks.push(sectionImageBlock("logistics", preset.alt, preset.caption));
    return cleanupBlocks({ id, title, blocks });
  }

  if (
    title === "Лучшие маршруты" ||
    title.includes("Лучшие маршруты") ||
    title === "Лучшие активности и порталы" ||
    title === "Форматы посещения"
  ) {
    const table = parseTable(body);
    if (table) {
      blocks.push({
        type: "table",
        caption: "Сравнение маршрутов",
        headers: table.headers,
        rows: table.rows,
      });
    }
    const paras = body
      .split(/\n\n+/)
      .filter((p) => !p.trim().startsWith("|") && !p.includes("|---|---"))
      .map(stripMdInline)
      .filter(Boolean);
    if (paras.length) blocks.push({ type: "paragraphs", items: paras });
    const preset = SECTION_IMAGE_PRESETS.trails;
    blocks.push(sectionImageBlock("trails", preset.alt, preset.caption));
    return cleanupBlocks({ id, title, blocks });
  }

  if (title === "Когда лучше ехать") {
    const introMatch = body.match(/^([\s\S]*?)(?=\*\*Лето)/);
    if (introMatch?.[1]?.trim()) {
      blocks.push({ type: "paragraphs", items: [stripMdInline(introMatch[1].trim())] });
    }
    const { items, conclusion } = parseSeasons(body);
    if (items.length) blocks.push({ type: "seasons", items, conclusion });
    const preset = SECTION_IMAGE_PRESETS.seasons;
    blocks.push(sectionImageBlock("seasons", preset.alt, preset.caption));
    return cleanupBlocks({ id, title, blocks });
  }

  if (title === "Практические советы") {
    const tips = parseNumberedTips(body);
    if (tips.length) blocks.push({ type: "numbered-tips", items: tips });
    return cleanupBlocks({ id, title, blocks });
  }

  if (title === "Часто задаваемые вопросы") {
    const faq = parseFaq(body);
    if (faq.length) blocks.push({ type: "faq", items: faq });
    return cleanupBlocks({ id, title, blocks });
  }

  if (title === "Итог") {
    const { summary, audience, items, note } = parseRatings(body);
    if (summary) blocks.push({ type: "paragraphs", items: [summary] });
    if (items.length) blocks.push({ type: "ratings", items, audience, note });
    return cleanupBlocks({ id, title, blocks });
  }

  if (
    title === "Билеты и стоимость посещения" ||
    title === "Билеты и стоимость" ||
    title === "Стоимость посещения" ||
    title === "Билеты, цены и полезное"
  ) {
    let ticketComment = null;
    const parts = body.split("\n\n");
    for (const part of parts) {
      for (const line of part.split("\n")) {
        const ticket = parseTicketComment(line);
        if (ticket) ticketComment = ticket;
      }

      if (part.startsWith(">")) {
        const calloutBody = stripMdInline(part.replace(/^>\s*/gm, ""));
        blocks.push({
          type: "callout",
          variant: "info",
          title: "Актуальные тарифы",
          body: calloutBody,
        });
      } else if (part.trim().startsWith("|")) {
        const table = parseTable(part);
        if (table) blocks.push({ type: "table", headers: table.headers, rows: table.rows });
      } else if (
        part.includes("ВСТАВИТЬ") ||
        part.includes("ventaweb.apn") ||
        parseMarkdownLinks(part).length > 0
      ) {
        const links = parseMarkdownLinks(part);
        if (links.length) {
          const primary =
            links.find((l) => l.href.includes("ventaweb.apn")) ?? links[0];
          const secondary = links.filter((l) => l.href !== primary.href);
          blocks.push({
            type: "ticket-link",
            url: ticketComment?.url ?? primary.href,
            label: ticketComment?.label ?? "Купить билет онлайн",
          });
          if (secondary.length) {
            blocks.push({
              type: "links",
              title: "Дополнительные официальные каналы",
              items: secondary,
            });
          }
        }
      } else if (part.includes("**[ВСТАВИТЬ")) {
        // placeholder without parsed links — skip
      } else {
        const bullets = parseBullets(part);
        if (bullets.length) blocks.push({ type: "bullets", items: bullets });
        else {
          const p = stripMdInline(part);
          if (p && !p.startsWith("[ВСТАВИТЬ")) blocks.push({ type: "paragraphs", items: [p] });
        }
      }
    }

    if (ticketComment && !blocks.some((b) => b.type === "ticket-link")) {
      blocks.push({
        type: "ticket-link",
        url: ticketComment.url,
        label: ticketComment.label,
      });
    }

    return cleanupBlocks({ id, title, blocks });
  }

  // Generic section parser
  const parts = body.split(/\n\n+/);
  for (const part of parts) {
    if (part.trim().startsWith("|")) {
      const table = parseTable(part);
      if (table)
        blocks.push({ type: "table", headers: table.headers, rows: table.rows });
    } else if (part.startsWith("**") && part.includes("** —")) {
      blocks.push({ type: "bullets", items: parseBullets(part) });
    } else if (/^[-*]\s/m.test(part) || /^\d+\.\s/m.test(part)) {
      const titleMatch = part.match(/^\*\*([^*]+)\*\*/);
      const items = parseBullets(part);
      if (items.length)
        blocks.push({
          type: "bullets",
          title: titleMatch ? stripMdInline(titleMatch[1]) : undefined,
          items,
        });
    } else if (part.startsWith("**") && part.includes(".**")) {
      const subTitle = part.match(/^\*\*([^*]+)\*\*/)?.[1];
      const rest = part.replace(/^\*\*[^*]+\*\*\s*/, "");
      const items = parseBullets(rest);
      if (items.length)
        blocks.push({ type: "bullets", title: subTitle ? stripMdInline(subTitle) : undefined, items });
      else blocks.push({ type: "paragraphs", items: [stripMdInline(part)] });
    } else if (part.startsWith("**Ради чего")) {
      blocks.push({
        type: "callout",
        variant: "tip",
        title: "Ради чего едут",
        body: stripMdInline(part.replace(/^\*\*Ради чего едут\.?\*\*\s*/, "")),
      });
    } else if (part.includes("**Совет по логистике:**") || part.includes("**Маленький секрет")) {
      const m = part.match(/\*\*([^*]+):\*\*\s*([\s\S]+)/);
      if (m)
        blocks.push({
          type: "callout",
          variant: "tip",
          title: stripMdInline(m[1]),
          body: stripMdInline(m[2]),
        });
    } else if (part.includes("**[ВСТАВИТЬ GOOGLE MAPS]")) {
      const maps = parseMapsFromText(part);
      for (const map of maps) {
        blocks.push({ type: "map", lat: map.lat, lng: map.lng, label: map.label });
      }
    } else {
      const p = stripMdInline(part);
      if (p && !p.startsWith("[ВСТАВИТЬ")) blocks.push({ type: "paragraphs", items: [p] });
    }
  }

  return cleanupBlocks({ id, title, blocks });
}

function serializeBlock(block, indent) {
  const pad = indent;
  const inner = `${pad}  `;
  switch (block.type) {
    case "paragraphs":
      return `${pad}{\n${inner}type: "paragraphs",\n${inner}items: [\n${block.items.map((i) => `${inner}  "${escapeTs(i)}",`).join("\n")}\n${inner}],\n${pad}},`;
    case "stats":
      return `${pad}{\n${inner}type: "stats",\n${inner}items: [\n${block.items.map((i) => `${inner}  { label: "${escapeTs(i.label)}", value: "${escapeTs(i.value)}" },`).join("\n")}\n${inner}],\n${pad}},`;
    case "spots":
      return `${pad}{\n${inner}type: "spots",\n${inner}items: [\n${block.items
        .map(
          (s) =>
            `${inner}  {\n${inner}    rank: ${s.rank},\n${inner}    title: "${escapeTs(s.title)}",\n${inner}    why: "${escapeTs(s.why)}",\n${inner}    duration: "${escapeTs(s.duration)}",\n${inner}    difficulty: "${escapeTs(s.difficulty)}",\n${inner}    tip: "${escapeTs(s.tip)}",\n${inner}  },`
        )
        .join("\n")}\n${inner}],\n${pad}},`;
    case "table":
      return `${pad}{\n${inner}type: "table",${block.caption ? `\n${inner}caption: "${escapeTs(block.caption)}",` : ""}\n${inner}headers: [${block.headers.map((h) => `"${escapeTs(h)}"`).join(", ")}],\n${inner}rows: [\n${block.rows.map((r) => `${inner}  [${r.map((c) => `"${escapeTs(c)}"`).join(", ")}],`).join("\n")}\n${inner}],\n${pad}},`;
    case "bullets":
      return `${pad}{\n${inner}type: "bullets",${block.title ? `\n${inner}title: "${escapeTs(block.title)}",` : ""}\n${inner}items: [\n${block.items.map((i) => `${inner}  "${escapeTs(i)}",`).join("\n")}\n${inner}],\n${pad}},`;
    case "seasons":
      return `${pad}{\n${inner}type: "seasons",${block.conclusion ? `\n${inner}conclusion: "${escapeTs(block.conclusion)}",` : ""}\n${inner}items: [\n${block.items
        .map(
          (s) =>
            `${inner}  {\n${inner}    name: "${escapeTs(s.name)}",\n${inner}    pros: [${s.pros.map((p) => `"${escapeTs(p)}"`).join(", ")}],\n${inner}    cons: [${s.cons.map((c) => `"${escapeTs(c)}"`).join(", ")}],\n${inner}  },`
        )
        .join("\n")}\n${inner}],\n${pad}},`;
    case "faq":
      return `${pad}{\n${inner}type: "faq",\n${inner}items: [\n${block.items
        .map(
          (f) =>
            `${inner}  { question: "${escapeTs(f.question)}", answer: "${escapeTs(f.answer)}" },`
        )
        .join("\n")}\n${inner}],\n${pad}},`;
    case "numbered-tips":
      return `${pad}{\n${inner}type: "numbered-tips",\n${inner}items: [\n${block.items.map((i) => `${inner}  "${escapeTs(i)}",`).join("\n")}\n${inner}],\n${pad}},`;
    case "callout":
      return `${pad}{\n${inner}type: "callout",\n${inner}variant: "${block.variant}",\n${inner}title: "${escapeTs(block.title)}",\n${inner}body: "${escapeTs(block.body)}",\n${pad}},`;
    case "links":
      return `${pad}{\n${inner}type: "links",${block.title ? `\n${inner}title: "${escapeTs(block.title)}",` : ""}\n${inner}items: [\n${block.items
        .map(
          (l) =>
            `${inner}  { label: "${escapeTs(l.label)}", href: "${escapeTs(l.href)}"${l.external ? ", external: true" : ""} },`
        )
        .join("\n")}\n${inner}],\n${pad}},`;
    case "ratings":
      return `${pad}{\n${inner}type: "ratings",${block.note ? `\n${inner}note: "${escapeTs(block.note)}",` : ""}\n${inner}audience: [\n${block.audience.map((a) => `${inner}  "${escapeTs(a)}",`).join("\n")}\n${inner}],\n${inner}items: [\n${block.items.map((r) => `${inner}  { label: "${escapeTs(r.label)}", stars: ${r.stars} },`).join("\n")}\n${inner}],\n${pad}},`;
    case "section-image":
      return `${pad}{\n${inner}type: "section-image",\n${inner}slotId: "${block.slotId}",\n${inner}alt: "${escapeTs(block.alt)}",${block.caption ? `\n${inner}caption: "${escapeTs(block.caption)}",` : ""}\n${pad}},`;
    case "map":
      return `${pad}{\n${inner}type: "map",\n${inner}lat: ${block.lat},\n${inner}lng: ${block.lng},\n${inner}label: "${escapeTs(block.label)}",\n${pad}},`;
    case "ticket-link":
      return `${pad}{\n${inner}type: "ticket-link",\n${inner}url: "${escapeTs(block.url)}",\n${inner}label: "${escapeTs(block.label)}",\n${pad}},`;
    default:
      return "";
  }
}

function generateArticle(config) {
  const mdPath = path.join(DOCS, config.md);
  const content = fs.readFileSync(mdPath, "utf8");
  const mdChecksum = crypto.createHash("sha256").update(content).digest("hex").slice(0, 16);
  const parsed = parseMd(content);
  const topFaq = parseSeoFaq(content);

  const sections = parsed.sections.map(sectionBlocks).filter((s) => s.blocks.length > 0);
  const sourcesSection = parseSourcesSection(content);
  if (sourcesSection) {
    const built = sectionBlocks(sourcesSection);
    if (built.blocks.length > 0) sections.push(built);
  }

  const introBlock =
    parsed.intro.length > 0
      ? `\n  intro: [\n${parsed.intro.map((p) => `    "${escapeTs(p)}",`).join("\n")}\n  ],`
      : "";

  const faqBlock =
    topFaq.length > 0
      ? `\n  faq: [\n${topFaq
          .map(
            (f) =>
              `    {\n      question: "${escapeTs(f.question)}",\n      answer:\n        "${escapeTs(f.answer)}",\n    },`
          )
          .join("\n")}\n  ],`
      : "";

  const sectionsTs = sections
    .map(
      (s) =>
        `    {\n      id: "${s.id}",\n      title: "${escapeTs(s.title)}",\n      blocks: [\n${s.blocks.map((b) => serializeBlock(b, "        ")).join("\n")}\n      ],\n    },`
    )
    .join("\n");

  return `// Generated from docs/${config.md} — md-checksum: ${mdChecksum}
import type { BlogRichArticle } from "@/types/blog-rich-article";

export const ${config.exportName}: BlogRichArticle = {
  id: "${config.id}",
  updatedLabel: "${escapeTs(parsed.updatedLabel)}",
  lede:
    "${escapeTs(parsed.lede)}",${introBlock}${faqBlock}
  sections: [
${sectionsTs}
  ],
};
`;
}

const checkMode = process.argv.includes("--check");
let driftCount = 0;

for (const config of ARTICLES) {
  const ts = generateArticle(config);
  const outPath = path.join(OUT, config.out);
  if (checkMode) {
    const existing = fs.existsSync(outPath) ? fs.readFileSync(outPath, "utf8") : "";
    if (existing !== ts) {
      console.error(`DRIFT: ${config.out} (MD docs/${config.md})`);
      driftCount += 1;
    } else {
      console.log(`OK ${config.out}`);
    }
    continue;
  }
  fs.writeFileSync(outPath, ts, "utf8");
  console.log(`Wrote ${config.out}`);
}

if (checkMode) {
  if (driftCount > 0) {
    console.error(`${driftCount} file(s) out of sync — run: node scripts/sync-blog-rich-articles-from-md.mjs`);
    process.exit(1);
  }
  console.log("All rich articles in sync with MD sources.");
}
