#!/usr/bin/env node
/** Fast manifest builder using curated Wikimedia URLs (no API calls). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(path.resolve(__dirname, ".."), "src/data/media-library/manifest.json");

const LICENSE = "CC BY-SA / CC BY (Wikimedia Commons)";
const AUTHOR = "Wikimedia Commons contributors";
const SOURCE = "wikimedia";

/** @type {Record<string, { name: string; category: string; urls: string[] }>} */
const PLACES = {
  "buenos-aires": {
    name: "Буэнос-Айрес",
    category: "city",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/b/b7/Obelisco_Buenos_Aires.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/d/dd/Caminito%2C_La_Boca.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/a/a5/Buenos_Aires_Obelisk_4.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/1/1e/Puerto_Madero%2C_Buenos_Aires_%2840689219792%29_%28cropped%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/f/f9/Torre_Monumental_%28Buenos_Aires%29_edit.jpg",
    ],
  },
  ushuaia: {
    name: "Ушуайя",
    category: "city",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/a/a4/Ushuaia_aerial_panorama.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/b/b9/Aerial_view_of_Ushuaia_Prison_%28crop%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/b/b0/Ushuaia-museu-do-fim-do-mun.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/5/5f/Casa_Beban_%2815952733035%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/7/7f/Parque_Nacional_Tierra_del_Fuego%2C_Argentina.jpg",
    ],
  },
  "el-calafate": {
    name: "Эль-Калафате",
    category: "city",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/3/33/El_Calafate_%2825825005237%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/8/8e/Avenida_del_Libertador%2C_El_Calafate.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/b/bd/Caba%C3%B1as_-_El_Calafate.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/c/c8/Perito_Moreno_Glacier_2023.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/9/95/SantaCruz-PeritoMoreno-P2140146b.jpg",
    ],
  },
  "el-chalten": {
    name: "Эль-Чалтен",
    category: "trekking",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/a/a2/Fitz_Roy%2C_Patagonia%2C_Argentina.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/4/47/El_Chalt%C3%A9n.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/c/c8/Perito_Moreno_Glacier_2023.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/0/05/Vista_a%C3%A9rea_de_Bariloche_y_la_Catedral.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/a/a4/Ushuaia_aerial_panorama.jpg",
    ],
  },
  bariloche: {
    name: "Барилоче",
    category: "city",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/c/c6/San_Carlos_de_Bariloche.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/0/05/Vista_a%C3%A9rea_de_Bariloche_y_la_Catedral.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/1/16/Catedral_desde_el_Lago_Nahuel_Huapi_-_panoramio.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/8/8c/Bariloche_01.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/f/fd/Bariloche-_Argentina.jpg",
    ],
  },
  mendoza: {
    name: "Мендоса",
    category: "city",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/5/53/Downtown_Mendoza.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/f/f1/Wine_Cellar_in_Mendoza%28GN04637%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/5/5f/Vignoble_Mendoza_Argentine.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/5/54/Panor%C3%A1mica_Ciudad_de_Salta.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/0/06/Salta-Square1.jpg",
    ],
  },
  "puerto-madryn": {
    name: "Пуэрто-Мадрин",
    category: "city",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/3/3a/Vista_de_Puerto_Madryn%2C_Argentina.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/e/e2/Southern_right_whale.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/2/2d/Peninsula_Vald%C3%A9s_STS-68.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/b/bc/Ballenafranca%2Balvina.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/2/2d/Peninsula_Vald%C3%A9s_STS-68.jpg",
    ],
  },
  salta: {
    name: "Сальта",
    category: "city",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/5/5f/Salta_Cathedral.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/5/54/Panor%C3%A1mica_Ciudad_de_Salta.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/7/72/Iglesia_San_Francisco%2C_Salta%2C_Argentina_-_panoramio.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/b/bb/Catedral_Bas%C3%ADlica_de_Salta_y_Santuario_del_Se%C3%B1or_y_la_Virgen_del_Milagro.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/0/06/Salta-Square1.jpg",
    ],
  },
  purmamarca: {
    name: "Пурмамарка",
    category: "attraction",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/0/0a/Cerro_de_los_siete_colores.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/4/40/Jujuy-Purmamarca-P3120100.JPG",
      "https://upload.wikimedia.org/wikipedia/commons/4/48/Cerro_de_los_7_colores.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/5/54/Panor%C3%A1mica_Ciudad_de_Salta.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/7/72/Iglesia_San_Francisco%2C_Salta%2C_Argentina_-_panoramio.jpg",
    ],
  },
  "iguazu-falls": {
    name: "Водопады Игуасу",
    category: "waterfall",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/a/a9/Iguazu_Falls.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/c/c4/Iguazu_Cataratas2.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/d/d1/Iguazu_National_Park_Falls.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/2/2c/Iguazu_D%C3%A9cembre_2007_-_Panorama_7.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/e/e2/Parque_Nacional_do_Igua%C3%A7%C3%BA_-_Igua%C3%A7u_National_Park_-_Bilheterias_-_Ticket_toll_%2813932942577%29.jpg",
    ],
  },
  "perito-moreno-glacier": {
    name: "Ледник Перито-Морено",
    category: "glacier",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/c/c8/Perito_Moreno_Glacier_2023.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/9/95/SantaCruz-PeritoMoreno-P2140146b.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/a/ad/Glaciar_Perito_Moreno%2C_Bismarck_o_Francisco_Gormaz.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/1/1e/153_-_Glacier_Perito_Moreno_-_Grotte_glaciaire_-_Janvier_2010.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/5/5c/Perito_Moreno_Glacier_Patagonia_Argentina_Luca_Galuzzi_2005.JPG",
    ],
  },
  "fitz-roy": {
    name: "Фиц Roy",
    category: "mountain",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/a/a2/Fitz_Roy%2C_Patagonia%2C_Argentina.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/4/47/El_Chalt%C3%A9n.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/c/c8/Perito_Moreno_Glacier_2023.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/0/05/Vista_a%C3%A9rea_de_Bariloche_y_la_Catedral.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/3/33/El_Calafate_%2825825005237%29.jpg",
    ],
  },
  "los-glaciares-national-park": {
    name: "Нацпарк Los Glaciares",
    category: "national-park",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/c/c8/Perito_Moreno_Glacier_2023.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/a/ad/Glaciar_Perito_Moreno%2C_Bismarck_o_Francisco_Gormaz.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/a/a2/Fitz_Roy%2C_Patagonia%2C_Argentina.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/3/33/El_Calafate_%2825825005237%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/1/1e/153_-_Glacier_Perito_Moreno_-_Grotte_glaciaire_-_Janvier_2010.jpg",
    ],
  },
  "nahuel-huapi-national-park": {
    name: "Нацпарк Nahuel Huapi",
    category: "national-park",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/1/16/Catedral_desde_el_Lago_Nahuel_Huapi_-_panoramio.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/0/05/Vista_a%C3%A9rea_de_Bariloche_y_la_Catedral.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/8/8c/Bariloche_01.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/f/fd/Bariloche-_Argentina.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/c/c6/San_Carlos_de_Bariloche.jpg",
    ],
  },
  "valdes-peninsula": {
    name: "Полуостров Вальдес",
    category: "wildlife",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/e/e2/Southern_right_whale.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/2/2d/Peninsula_Vald%C3%A9s_STS-68.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/b/bc/Ballenafranca%2Balvina.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/3/3a/Vista_de_Puerto_Madryn%2C_Argentina.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/a/a4/Ushuaia_aerial_panorama.jpg",
    ],
  },
  "cerro-de-los-7-colores": {
    name: "Cerro de los Siete Colores",
    category: "attraction",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/0/0a/Cerro_de_los_siete_colores.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/4/48/Cerro_de_los_7_colores.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/4/40/Jujuy-Purmamarca-P3120100.JPG",
      "https://upload.wikimedia.org/wikipedia/commons/5/54/Panor%C3%A1mica_Ciudad_de_Salta.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/7/72/Iglesia_San_Francisco%2C_Salta%2C_Argentina_-_panoramio.jpg",
    ],
  },
  "tren-de-las-nubes": {
    name: "Поезд в облака",
    category: "transport",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/c/cd/Tren_nubes_trenesarg.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/5/54/Panor%C3%A1mica_Ciudad_de_Salta.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/7/72/Iglesia_San_Francisco%2C_Salta%2C_Argentina_-_panoramio.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/5/5f/Salta_Cathedral.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/0/06/Salta-Square1.jpg",
    ],
  },
  "cueva-de-las-manos": {
    name: "Cueva de las Manos",
    category: "attraction",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/1/1f/SantaCruz-CuevaManos-P2210079b.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/f/f4/SantaCruz-CuevaManos-P2210651b.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/1/1d/Cueva_de_las_Manos.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/a/ad/Glaciar_Perito_Moreno%2C_Bismarck_o_Francisco_Gormaz.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/c/c8/Perito_Moreno_Glacier_2023.jpg",
    ],
  },
  "mar-del-plata": {
    name: "Мар-дель-Плата",
    category: "city",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/a/a5/Hotel_Provincial_y_Casino%2C_Plaza_seca_y_la_Plaza_Col%C3%B3n._Vista_panor%C3%A1mica_desde_el_Palacio_Ed%C3%A9n.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/8/88/PT_TORREON3.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/b/bb/Torre_Tranque_de_Obras_Sanitarias_de_la_Naci%C3%B3n.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/2/2a/Museo_castagnino.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/d/dd/Caminito%2C_La_Boca.jpg",
    ],
  },
  "tierra-del-fuego-national-park": {
    name: "Нацпарк Tierra del Fuego",
    category: "national-park",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/7/7f/Parque_Nacional_Tierra_del_Fuego%2C_Argentina.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/1/1d/Escalonadas_Lakes.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/a/a4/Ushuaia_aerial_panorama.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/b/b9/Aerial_view_of_Ushuaia_Prison_%28crop%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/a/a7/Emblema_Parque_Nacional_Tierra_del_Fuego.jpg",
    ],
  },
};

/** @type {Record<string, { name: string; urls: string[] }>} */
const DESTINATIONS = {
  ba: { name: "Буэнос-Айрес", urls: PLACES["buenos-aires"].urls.slice(0, 4) },
  bariloche: { name: "Барилоче", urls: PLACES.bariloche.urls.slice(0, 4) },
  calafate: { name: "Эль-Калафате", urls: PLACES["el-calafate"].urls.slice(0, 4) },
  ushuaia: { name: "Ушуайя", urls: PLACES.ushuaia.urls.slice(0, 4) },
  iguazu: { name: "Игуасу", urls: PLACES["iguazu-falls"].urls.slice(0, 4) },
  mendoza: { name: "Мендоса", urls: PLACES.mendoza.urls.slice(0, 4) },
  salta: { name: "Сальта", urls: PLACES.salta.urls.slice(0, 4) },
  patagonia: {
    name: "Патагония",
    urls: [
      PLACES["perito-moreno-glacier"].urls[0],
      PLACES["fitz-roy"].urls[0],
      PLACES.bariloche.urls[0],
      PLACES.ushuaia.urls[0],
    ],
  },
};

/** @type {Record<string, { name: string; category: string; url: string }>} */
const BLOG = {
  travel: { name: "Путешествия по Аргентине", category: "travel-guide", url: PLACES["buenos-aires"].urls[0] },
  "buenos-aires": { name: "Буэнос-Айрес", category: "city", url: PLACES["buenos-aires"].urls[1] },
  patagonia: { name: "Патагония", category: "national-park", url: PLACES["perito-moreno-glacier"].urls[0] },
  north: { name: "Север Аргентины", category: "province", url: PLACES.salta.urls[0] },
  iguazu: { name: "Водопады Игуасу", category: "waterfall", url: PLACES["iguazu-falls"].urls[0] },
  "national-parks": { name: "Национальные парки", category: "national-park", url: PLACES["los-glaciares-national-park"].urls[0] },
  trekking: { name: "Горы и треккинг", category: "trekking", url: PLACES["fitz-roy"].urls[0] },
  wineries: { name: "Винодельни", category: "winery", url: "https://upload.wikimedia.org/wikipedia/commons/f/f1/Wine_Cellar_in_Mendoza%28GN04637%29.jpg" },
  wildlife: { name: "Животные Аргентины", category: "wildlife", url: PLACES["valdes-peninsula"].urls[0] },
  food: { name: "Кухня Аргентины", category: "travel-guide", url: "https://upload.wikimedia.org/wikipedia/commons/4/45/Asado_argentino.jpg" },
  transport: { name: "Транспорт", category: "transport", url: PLACES["buenos-aires"].urls[0] },
  safety: { name: "Безопасность", category: "travel-guide", url: PLACES["buenos-aires"].urls[3] },
  money: { name: "Деньги и обмен", category: "banking", url: "https://upload.wikimedia.org/wikipedia/commons/5/53/Downtown_Mendoza.jpg" },
  internet: { name: "Интернет и связь", category: "mobile-operators", url: PLACES["buenos-aires"].urls[2] },
  "ba-neighborhoods": { name: "Районы Буэнос-Айреса", category: "city", url: PLACES["buenos-aires"].urls[1] },
  relocation: { name: "Переезд и релокация", category: "immigration", url: PLACES["buenos-aires"].urls[4] },
};

function ext(url) {
  const m = url.match(/\.(\w+)(?:\?|$)/i);
  const e = (m?.[1] ?? "jpg").toLowerCase();
  return e === "jpeg" ? "jpg" : e;
}

/** @type {object[]} */
const assets = [];

for (const [slug, { name, category, urls }] of Object.entries(PLACES)) {
  const roles = ["hero", "gallery-1", "gallery-2", "gallery-3", "gallery-4"];
  urls.forEach((sourceUrl, i) => {
    const roleKey = roles[i];
    assets.push({
      id: `place-${slug}-${roleKey}`,
      title: `${name} — ${roleKey === "hero" ? "обложка" : `фото ${i}`}`,
      alt: roleKey === "hero" ? `${name}, Аргентина` : `${name} — вид ${i}`,
      caption: `${name}, Wikimedia Commons`,
      category,
      tags: [slug, roleKey === "hero" ? "hero" : "gallery"],
      source: SOURCE,
      sourceUrl,
      license: LICENSE,
      author: AUTHOR,
      localPath: `media/places/${slug}/${roleKey}.${ext(sourceUrl)}`,
      placeId: slug,
      role: roleKey === "hero" ? "hero" : "gallery",
    });
  });
}

for (const [destId, { name, urls }] of Object.entries(DESTINATIONS)) {
  const roles = ["cover", "gallery-1", "gallery-2", "gallery-3"];
  urls.forEach((sourceUrl, i) => {
    const roleKey = roles[i];
    assets.push({
      id: `dest-${destId}-${roleKey}`,
      title: `${name} — ${roleKey}`,
      alt: `${name}, популярное направление`,
      caption: name,
      category: "destination",
      tags: [destId, roleKey === "cover" ? "cover" : "gallery"],
      source: SOURCE,
      sourceUrl,
      license: LICENSE,
      author: AUTHOR,
      localPath: `media/destinations/${destId}/${roleKey}.${ext(sourceUrl)}`,
      destinationId: destId,
      role: roleKey === "cover" ? "hero" : "gallery",
    });
  });
}

for (const [catKey, { name, category, url }] of Object.entries(BLOG)) {
  assets.push({
    id: `blog-${catKey}`,
    title: name,
    alt: `${name} — тематическая иллюстрация`,
    caption: name,
    category,
    tags: ["blog", catKey],
    source: SOURCE,
    sourceUrl: url,
    license: LICENSE,
    author: AUTHOR,
    localPath: `media/blog/${catKey}.${ext(url)}`,
    blogCategory: catKey,
    role: "hero",
  });
}

/** Guide pillar topics — contextual Wikimedia heroes */
const GUIDE = {
  "kak-dobratsya": { name: "Как добраться", category: "transport", url: PLACES["buenos-aires"].urls[0] },
  "gde-zhit": { name: "Где жить", category: "accommodation", url: PLACES["buenos-aires"].urls[3] },
  transport: { name: "На чём передвигаться", category: "transport", url: PLACES.bariloche.urls[0] },
  "turistskie-regiony": { name: "Туристические регионы", category: "destination", url: PLACES["perito-moreno-glacier"].urls[0] },
  dostoprimechatelnosti: { name: "Достопримечательности", category: "attraction", url: PLACES["iguazu-falls"].urls[0] },
  "pogoda-i-sezonnost": { name: "Погода и сезонность", category: "travel-guide", url: PLACES["el-chalten"].urls[0] },
  yazyk: { name: "Язык", category: "travel-guide", url: PLACES["buenos-aires"].urls[1] },
  kultura: { name: "Культура", category: "travel-guide", url: PLACES["buenos-aires"].urls[1] },
  istoriya: { name: "История", category: "travel-guide", url: PLACES["buenos-aires"].urls[0] },
  kukhnya: { name: "Кухня", category: "travel-guide", url: BLOG.food.url },
  svyaz: { name: "Связь", category: "mobile-operators", url: BLOG.internet.url },
  "ekonomika-i-dengi": { name: "Экономика и деньги", category: "banking", url: BLOG.money.url },
  shopping: { name: "Шопинг", category: "travel-guide", url: PLACES["buenos-aires"].urls[2] },
  bezopasnost: { name: "Безопасность", category: "travel-guide", url: PLACES["buenos-aires"].urls[4] },
};

for (const [slug, { name, category, url }] of Object.entries(GUIDE)) {
  assets.push({
    id: `guide-${slug}-hero`,
    title: `${name} — обложка`,
    alt: `${name}, путеводитель по Аргентине`,
    caption: name,
    category,
    tags: ["guide", slug, "hero"],
    source: SOURCE,
    sourceUrl: url,
    license: LICENSE,
    author: AUTHOR,
    localPath: `media/guide/${slug}/hero.${ext(url)}`,
    guideTopicId: slug,
    role: "hero",
  });
}

/** Guide content pages (pillar articles in guide-content.ts) */
const GUIDE_PAGES = {
  "sezony-i-klimat": { name: "Сезоны и климат", category: "travel-guide", url: PLACES["perito-moreno-glacier"].urls[1] },
  "gastronomiya-i-asado": { name: "Гастрономия и asado", category: "travel-guide", url: BLOG.food.url },
  "tango-i-kultura-ba": { name: "Танго и культура BA", category: "travel-guide", url: PLACES["buenos-aires"].urls[1] },
  "patagoniya-s-chego-nachat": { name: "Патагония: с чего начать", category: "trekking", url: PLACES["fitz-roy"].urls[0] },
  "bronirovanie-i-oplata": { name: "Бронирование и оплата", category: "travel-guide", url: PLACES["buenos-aires"].urls[0] },
};

for (const [slug, { name, category, url }] of Object.entries(GUIDE_PAGES)) {
  assets.push({
    id: `guide-page-${slug}-hero`,
    title: `${name} — обложка`,
    alt: `${name}, путеводитель по Аргентине`,
    caption: name,
    category,
    tags: ["guide-page", slug, "hero"],
    source: SOURCE,
    sourceUrl: url,
    license: LICENSE,
    author: AUTHOR,
    localPath: `media/guide/pages/${slug}/hero.${ext(url)}`,
    guidePageSlug: slug,
    role: "hero",
  });
}

/** Marketplace / seed tours */
const TOURS = {
  "patagonia-glaciers": { name: "Ледники Патагонии", placeSlug: "perito-moreno-glacier" },
  "buenos-aires-tango": { name: "Буэнос-Айрес и танго", placeSlug: "buenos-aires" },
  "mendoza-wine": { name: "Винный тур Мендосы", placeSlug: "mendoza" },
  "iguazu-falls": { name: "Водопады Игуасу", placeSlug: "iguazu-falls" },
  "salta-northwest": { name: "Северо-запад", placeSlug: "salta" },
  "ushuaia-end-of-world": { name: "Ушуайя", placeSlug: "ushuaia" },
  "bariloche-lakes": { name: "Барилоче", placeSlug: "bariloche" },
  "fitz-roy-trek": { name: "Fitz Roy", placeSlug: "el-chalten" },
};

for (const [slug, { name, placeSlug }] of Object.entries(TOURS)) {
  const placeUrls = PLACES[placeSlug]?.urls ?? PLACES["buenos-aires"].urls;
  const roles = ["hero", "gallery-1", "gallery-2", "gallery-3", "gallery-4", "gallery-5"];
  placeUrls.slice(0, 6).forEach((sourceUrl, i) => {
    const roleKey = roles[i];
    assets.push({
      id: `tour-${slug}-${roleKey}`,
      title: `${name} — ${roleKey === "hero" ? "обложка" : `фото ${i}`}`,
      alt: `${name} — ${roleKey === "hero" ? "обложка тура" : `фото ${i}`}, Аргентина`,
      caption: name,
      category: "itinerary",
      tags: ["tour", slug, roleKey === "hero" ? "hero" : "gallery"],
      source: SOURCE,
      sourceUrl,
      license: LICENSE,
      author: AUTHOR,
      localPath: `media/tours/${slug}/${roleKey}.${ext(sourceUrl)}`,
      tourSlug: slug,
      role: roleKey === "hero" ? "hero" : "gallery",
    });
  });
}

/** Climate month cards — global + regional overrides */
const CLIMATE_GLOBAL = {
  1: PLACES["mar-del-plata"].urls[0],
  2: PLACES["buenos-aires"].urls[0],
  3: PLACES.mendoza.urls[1],
  4: PLACES.salta.urls[0],
  5: PLACES["iguazu-falls"].urls[0],
  6: PLACES["buenos-aires"].urls[3],
  7: PLACES.bariloche.urls[0],
  8: PLACES["el-chalten"].urls[0],
  9: PLACES.mendoza.urls[0],
  10: PLACES.purmamarca.urls[0],
  11: PLACES["perito-moreno-glacier"].urls[0],
  12: PLACES.ushuaia.urls[0],
};

for (const [month, sourceUrl] of Object.entries(CLIMATE_GLOBAL)) {
  assets.push({
    id: `climate-global-${month}`,
    title: `Климат — месяц ${month}`,
    alt: `Пейзаж Аргентины, месяц ${month}`,
    caption: `Сезонный вид — месяц ${month}`,
    category: "travel-guide",
    tags: ["climate", "global", `month-${month}`],
    source: SOURCE,
    sourceUrl,
    license: LICENSE,
    author: AUTHOR,
    localPath: `media/climate/global/month-${month}.${ext(sourceUrl)}`,
    climateKey: `global-${month}`,
    role: "thumbnail",
  });
}

const CLIMATE_REGION = {
  "ba-1": PLACES["buenos-aires"].urls[0],
  "ba-6": PLACES["buenos-aires"].urls[3],
  "patagonia-1": PLACES["perito-moreno-glacier"].urls[0],
  "patagonia-2": PLACES.bariloche.urls[0],
  "patagonia-7": PLACES["el-chalten"].urls[0],
  "patagonia-11": PLACES["el-calafate"].urls[0],
  "iguazu-2": PLACES["iguazu-falls"].urls[1],
  "iguazu-3": PLACES["iguazu-falls"].urls[0],
  "iguazu-12": PLACES["iguazu-falls"].urls[2],
  "salta-4": PLACES.purmamarca.urls[0],
  "salta-5": PLACES.salta.urls[0],
  "salta-9": PLACES["cerro-de-los-7-colores"].urls[0],
  "mendoza-3": PLACES.mendoza.urls[1],
  "mendoza-4": PLACES.mendoza.urls[3],
  "mendoza-9": PLACES.mendoza.urls[0],
};

for (const [key, sourceUrl] of Object.entries(CLIMATE_REGION)) {
  assets.push({
    id: `climate-${key}`,
    title: `Климат — ${key}`,
    alt: `Климатический вид региона Аргентины (${key})`,
    caption: `Региональный климат — ${key}`,
    category: "travel-guide",
    tags: ["climate", "region", key],
    source: SOURCE,
    sourceUrl,
    license: LICENSE,
    author: AUTHOR,
    localPath: `media/climate/regions/${key}.${ext(sourceUrl)}`,
    climateKey: key,
    role: "thumbnail",
  });
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify({ version: 1, assets }, null, 2) + "\n", "utf8");
console.log(`Wrote ${assets.length} assets`);
