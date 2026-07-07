#!/usr/bin/env node
/** Статические тематические слои (точки, упрощённые полигоны). */
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "../public/geo/map");

function fc(features) {
  return { type: "FeatureCollection", features };
}

function rect(name, fill, [[minLon, minLat], [maxLon, maxLat]], extra = {}) {
  return {
    type: "Feature",
    properties: { name, fill, source: "Проект — упрощённая зона", ...extra },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [minLon, minLat],
          [maxLon, minLat],
          [maxLon, maxLat],
          [minLon, maxLat],
          [minLon, minLat],
        ],
      ],
    },
  };
}

function point(name, lon, lat, extra = {}) {
  return {
    type: "Feature",
    properties: { name, source: "Координаты курортов / официальные данные", ...extra },
    geometry: { type: "Point", coordinates: [lon, lat] },
  };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const climate = fc([
    rect("Пампа", "#fef3c7", [[-64.5, -41], [-56.5, -33.5]], {
      description: "Умеренный климат Pampeana",
    }),
    rect("Патагония", "#dbeafe", [[-73.5, -55.5], [-63.5, -40]], {
      description: "Прохладная и ветреная Patagonia",
    }),
    rect("Северо-Запад", "#fed7aa", [[-68.5, -29.5], [-64, -21.5]], {
      description: "Субтропики и высокогорье NOA",
    }),
    rect("Куйо", "#fecaca", [[-70.5, -37], [-66, -31.5]], {
      description: "Засушливый континентальный Cuyo",
    }),
    rect("Mesopotamia", "#bbf7d0", [[-60.5, -34], [-53.5, -25.5]], {
      description: "Субтропический влажный Litoral",
    }),
    rect("Южная Атлантика", "#bae6fd", [[-64, -47], [-56, -38]], {
      description: "Прохладное атлантическое побережье",
    }),
  ]);
  await writeFile(path.join(OUT_DIR, "climate-zones.geojson"), JSON.stringify(climate));

  const beaches = fc([
    rect("Mar del Plata", "#38bdf8", [[-57.65, -38.15], [-57.45, -37.95]], {
      description: "Главный пляжный курорт Pampeana",
    }),
    rect("Pinamar / Valeria", "#38bdf8", [[-56.99, -37.18], [-56.78, -36.96]]),
    rect("Cariló / Ostende", "#38bdf8", [[-56.92, -37.2], [-56.72, -37.05]]),
    rect("Villa Gesell", "#38bdf8", [[-57.08, -37.32], [-56.92, -37.18]]),
    rect("Necochea", "#38bdf8", [[-58.82, -38.65], [-58.68, -38.48]]),
    rect("Miramar", "#38bdf8", [[-57.88, -38.32], [-57.72, -38.18]]),
  ]);
  await writeFile(path.join(OUT_DIR, "beach-zones.geojson"), JSON.stringify(beaches));

  const ski = fc([
    point("Cerro Catedral (Bariloche)", -71.484, -41.175, {
      region: "Río Negro",
      description: "Крупнейший курорт Patagonia — 120+ км трасс",
    }),
    point("Las Leñas", -70.073, -35.147, {
      region: "Mendoza",
      description: "Высокогорный курорт в Андах, снег до октября",
    }),
    point("Chapelco", -71.301, -40.165, {
      region: "Neuquén",
      description: "San Martín de los Andes — семейный курорт",
    }),
    point("Caviahue", -71.045, -37.851, {
      region: "Neuquén",
      description: "Copahue — вулкан и термальные источники рядом",
    }),
    point("La Hoya (Esquel)", -71.548, -42.882, {
      region: "Chubut",
      description: "Компактный курорт у Esquel",
    }),
    point("Cerro Castor (Ushuaia)", -68.018, -54.721, {
      region: "Tierra del Fuego",
      description: "Самый южный горнолыжный центр мира",
    }),
    point("Cerro Bayo (Villa La Angostura)", -71.327, -40.761, {
      region: "Neuquén",
      description: "Вид на Nahuel Huapi, рядом с Bariloche",
    }),
    point("Los Penitentes (Mendoza)", -69.913, -32.821, {
      region: "Mendoza",
      description: "Курорт на RN 7 у границы с Чили",
    }),
    point("Batea Mahuida", -70.989, -39.015, {
      region: "Neuquén",
      description: "Небольшой центр у Villa Pehuenia",
    }),
  ]);
  await writeFile(path.join(OUT_DIR, "ski-resorts.geojson"), JSON.stringify(ski));

  const biosphere = fc([
    rect("Nahuel Huapi", "#86efac", [[-71.8, -41.8], [-71.0, -40.5]], {
      description: "Reserva de Biosfera Nahuel Huapi",
    }),
    rect("Valdés", "#86efac", [[-64.5, -42.8], [-63.0, -41.8]], {
      description: "Península Valdés — biosphere reserve",
    }),
    rect("Yungas", "#86efac", [[-65.8, -26.5], [-64.5, -24.5]], {
      description: "Yungas de San Bernardo",
    }),
    rect("Bosques Templados Andinos", "#86efac", [[-71.8, -42.5], [-70.5, -40.0]], {
      description: "Bosques Templados Lluviosos de los Andes Australes",
    }),
  ]);
  await writeFile(path.join(OUT_DIR, "biosphere-reserves.geojson"), JSON.stringify(biosphere));

  console.log("✓ Static thematic GeoJSON written");
}

main();
