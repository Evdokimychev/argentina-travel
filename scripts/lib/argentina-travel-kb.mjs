/**
 * Запись и слияние статей базы знаний из данных Argentina.travel.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kbRoot = path.resolve(__dirname, "../../content/knowledge-base");

const TYPE_DIRS = {
  city: "goroda",
  region: "regiony",
  national_park: "natsionalnye-parki",
  attraction: "dostoprimechatelnosti",
};

const REGION_BY_PROVINCE = {
  Mendoza: { region_id: "cuyo", province: "Мендоса" },
  "San Juan": { region_id: "cuyo", province: "Сан-Хуан" },
  "San Luis": { region_id: "cuyo", province: "Сан-Луис" },
  Salta: { region_id: "noa", province: "Сальта" },
  Jujuy: { region_id: "noa", province: "Жужуй" },
  Tucumán: { region_id: "noa", province: "Тукуман" },
  Catamarca: { region_id: "noa", province: "Катамарка" },
  "La Rioja": { region_id: "noa", province: "Ла-Риоха" },
  "Santiago del Estero": { region_id: "noa", province: "Саньяго-дель-Эстеро" },
  Misiones: { region_id: "litoral", province: "Мисьонес" },
  Corrientes: { region_id: "litoral", province: "Корриентес" },
  Chaco: { region_id: "litoral", province: "Чако" },
  Formosa: { region_id: "litoral", province: "Формоса" },
  "Buenos Aires": { region_id: "buenos-aires-province", province: "Провинция Буэнос-Айрес" },
  "Ciudad Autónoma de Buenos Aires": { region_id: "caba", province: "CABA" },
  "Río Negro": { region_id: "patagonia", province: "Рио-Негро" },
  Neuquén: { region_id: "patagonia", province: "Неукен" },
  Chubut: { region_id: "patagonia", province: "Чубут" },
  "Santa Cruz": { region_id: "patagonia", province: "Санта-Крус" },
  "Tierra del Fuego": { region_id: "tierra-del-fuego", province: "Огненная Земля" },
  Córdoba: { region_id: "pampa", province: "Кордова" },
  "Santa Fe": { region_id: "litoral", province: "Санта-Фе" },
  "Entre Ríos": { region_id: "litoral", province: "Энтре-Риос" },
  "La Pampa": { region_id: "pampa", province: "Ла-Пампа" },
};

export function inferKbType(activity) {
  const title = `${activity.titleEs} ${activity.titleEn}`.toLowerCase();
  if (/parque nacional|national park/i.test(title)) return "national_park";
  if (/parque provincial|provincial park/i.test(title)) return "national_park";
  if (/ciudad|city|capital/i.test(title) && activity.tags?.some((t) => /city|ciudad/i.test(t)))
    return "city";
  return "attraction";
}

export function slugToKbId(slugEs) {
  return slugEs
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function findExistingKbFile(kbId) {
  for (const dir of Object.values(TYPE_DIRS)) {
    const file = path.join(kbRoot, dir, `${kbId}.md`);
    if (fs.existsSync(file)) return file;
  }
  return null;
}

export function listAllKbIds() {
  const ids = new Set();
  for (const dir of Object.values(TYPE_DIRS)) {
    const folder = path.join(kbRoot, dir);
    if (!fs.existsSync(folder)) continue;
    for (const file of fs.readdirSync(folder)) {
      if (file.endsWith(".md")) ids.add(file.replace(/\.md$/, ""));
    }
  }
  return ids;
}

function parseFrontmatter(content) {
  const parts = content.split("---");
  if (parts.length < 3) return { fm: {}, body: content };
  const fmText = parts[1];
  const body = parts.slice(2).join("---").trimStart();
  const fm = {};
  for (const line of fmText.split("\n")) {
    const m = line.match(/^([a-z_0-9]+):\s*(.*)$/i);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if (val === "true") val = true;
    else if (val === "false") val = false;
    else if (val.startsWith("[") && val.endsWith("]")) {
      val = val
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else if (val.startsWith("{") && val.endsWith("}")) {
      try {
        val = JSON.parse(val.replace(/(\w+):/g, '"$1":').replace(/'/g, '"'));
      } catch {
        /* keep string */
      }
    } else {
      val = val.replace(/^["']|["']$/g, "");
    }
    fm[key] = val;
  }
  return { fm, body };
}

function yamlQuote(str) {
  if (str == null) return '""';
  const s = String(str);
  if (s.includes(":") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return `"${s}"`;
}

function buildMediaYaml(images, titleRu) {
  if (!images.length) return null;
  const hero = images.find((i) => i.role === "hero") ?? images[0];
  const gallery = images.filter((i) => i !== hero);

  const lines = ["media:", "  hero:"];
  lines.push(`    url: ${yamlQuote(hero.localUrl ?? hero.url)}`);
  lines.push(`    alt: ${yamlQuote(hero.alt ?? titleRu)}`);
  lines.push(`    author: ${yamlQuote(hero.author ?? "INPROTUR / Visit Argentina")}`);
  lines.push(`    license: argentina.travel`);
  lines.push(`    source_page: ${yamlQuote(hero.sourcePage)}`);

  if (gallery.length) {
    lines.push("  gallery:");
    for (const img of gallery.slice(0, 6)) {
      lines.push(`    - url: ${yamlQuote(img.localUrl ?? img.url)}`);
      lines.push(`      alt: ${yamlQuote(img.alt ?? titleRu)}`);
      lines.push(`      author: ${yamlQuote(img.author ?? "INPROTUR / Visit Argentina")}`);
      lines.push(`      license: argentina.travel`);
      lines.push(`      source_page: ${yamlQuote(img.sourcePage)}`);
    }
  }
  return lines.join("\n");
}

export function mergeKbArticle({
  kbId,
  type,
  translation,
  activity,
  images,
  existingPath,
  dryRun,
}) {
  const existing = existingPath && fs.existsSync(existingPath) ? fs.readFileSync(existingPath, "utf8") : null;
  const parsed = existing ? parseFrontmatter(existing) : { fm: {}, body: "" };
  const fm = parsed.fm;

  const provinceName = activity.provinces?.[0] ?? activity.location?.state ?? "";
  const geo = REGION_BY_PROVINCE[provinceName] ?? { region_id: "patagonia", province: provinceName };

  const isRichExisting = existing && parsed.body.length > 400 && fm.site_ready === true;
  const isStub = !existing || fm.status === "stub" || parsed.body.length < 200;

  const nextFm = {
    ...fm,
    id: kbId,
    type: fm.type ?? type,
    title: isRichExisting && fm.title ? fm.title : translation.title,
    title_es: activity.titleEs,
    title_en: activity.titleEn,
    summary: isRichExisting && fm.summary && !isStub ? fm.summary : translation.summary,
    status: isRichExisting ? fm.status ?? "published" : "stub",
    site_sections: fm.site_sections ?? ["puteshestviya-po-argentine", "goroda-i-regiony"],
    region_id: fm.region_id ?? geo.region_id,
    province: fm.province ?? geo.province,
    coordinates: fm.coordinates ?? undefined,
    coordinatesLat: activity.location?.position?.lat,
    coordinatesLng: activity.location?.position?.lng,
    tags: fm.tags ?? activity.tags?.slice(0, 8) ?? [],
    last_verified: new Date().toISOString().slice(0, 10),
    confidence: isRichExisting ? fm.confidence ?? "high" : "medium",
    site_ready: isRichExisting ? fm.site_ready ?? false : false,
  };

  const mediaYaml = buildMediaYaml(images, nextFm.title);
  const body = isRichExisting
    ? parsed.body
    : translation.bodyMarkdown ?? translation.body ?? "";

  const sourceEntry = {
    title: `Visit Argentina — ${activity.titleEs}`,
    url: activity.sourceUrl,
    lang: "es",
    type: "official",
    note: "INPROTUR; текст автопереведён, фото с официального CDN — атрибуция argentina.travel",
  };

  const fmLines = ["---"];
  for (const [key, val] of Object.entries(nextFm)) {
    if (val === undefined || val === null) continue;
    if (key === "coordinatesLat" || key === "coordinatesLng") continue;
    if (Array.isArray(val)) {
      fmLines.push(`${key}: [${val.map((v) => yamlQuote(v)).join(", ")}]`);
    } else if (typeof val === "boolean") {
      fmLines.push(`${key}: ${val}`);
    } else {
      fmLines.push(`${key}: ${yamlQuote(val)}`);
    }
  }

  if (mediaYaml && (!fm.media || !isRichExisting)) {
    fmLines.push(mediaYaml);
  }

  if (nextFm.coordinatesLat != null && nextFm.coordinatesLng != null && !fm.coordinates) {
    fmLines.push(`coordinates: { lat: ${nextFm.coordinatesLat}, lng: ${nextFm.coordinatesLng} }`);
  } else if (fm.coordinates && typeof fm.coordinates === "object" && fm.coordinates.lat != null) {
    fmLines.push(`coordinates: { lat: ${fm.coordinates.lat}, lng: ${fm.coordinates.lng} }`);
  } else if (typeof fm.coordinates === "string" && !fm.coordinates.includes("[object Object]")) {
    fmLines.push(`coordinates: ${fm.coordinates}`);
  }

  fmLines.push("sources:");
  fmLines.push(`  - title: ${yamlQuote(sourceEntry.title)}`);
  fmLines.push(`    url: ${yamlQuote(sourceEntry.url)}`);
  fmLines.push(`    lang: es`);
  fmLines.push(`    type: official`);
  fmLines.push(`    note: ${yamlQuote(sourceEntry.note)}`);
  fmLines.push("---");

  const content = `${fmLines.join("\n")}\n\n${body}\n`;
  const outDir = path.join(kbRoot, TYPE_DIRS[type] ?? TYPE_DIRS.attraction);
  const outPath = existingPath ?? path.join(outDir, `${kbId}.md`);

  if (!dryRun) {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, content, "utf8");
  }

  return {
    path: outPath,
    kbId,
    created: !existing,
    enrichedMedia: Boolean(mediaYaml && (!fm.media || !isRichExisting)),
    skippedBody: isRichExisting,
  };
}

export { kbRoot, TYPE_DIRS };
