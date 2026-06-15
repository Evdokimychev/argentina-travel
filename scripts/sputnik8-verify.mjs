#!/usr/bin/env node
/**
 * Verify Sputnik8 + Travelpayouts credentials and Argentina catalog scope.
 * Usage: npm run sputnik8:verify
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveSyncCities, resolveSyncCountry } from "./sputnik8-argentina-resolver.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnvLocal() {
  for (const file of [".env.local", ".env"]) {
    const envPath = path.join(root, file);
    if (!fs.existsSync(envPath)) continue;
    const lines = fs.readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

function unwrapResults(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.products ?? data.cities ?? data.countries ?? data.data ?? data.results ?? [];
}

async function verifyTravelpayouts() {
  const tpKey = process.env.TRAVELPAYOUTS_API_KEY?.trim();
  const marker = process.env.TRAVELPAYOUTS_MARKER?.trim();
  const trs = process.env.TRAVELPAYOUTS_TRS?.trim();

  if (!tpKey || !marker || !trs) {
    console.log("Travelpayouts: skipped (env incomplete)");
    return true;
  }

  const response = await fetch("https://api.travelpayouts.com/links/v1/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Access-Token": tpKey,
    },
    body: JSON.stringify({
      trs: Number(trs),
      marker: Number(marker),
      shorten: false,
      links: [{ url: "https://www.sputnik8.com/ru/buenos-aires", sub_id: "sputnik8:verify" }],
    }),
  });
  const body = await response.json();
  const link = body?.result?.links?.[0];
  const ok = response.ok && link?.code === "success";
  console.log("Travelpayouts link:", ok ? "ok" : `failed (${link?.message ?? response.status})`);
  return ok;
}

async function verifySputnik8() {
  const apiKey = process.env.SPUTNIK8_API_KEY?.trim();
  const username = process.env.SPUTNIK8_USERNAME?.trim();
  const apiBase = (process.env.SPUTNIK8_API_BASE?.trim() || "https://api.sputnik8.com/v1").replace(/\/$/, "");

  if (!apiKey || !username) {
    console.log("Sputnik8: skipped (set SPUTNIK8_API_KEY and SPUTNIK8_USERNAME in .env.local)");
    return true;
  }

  console.log("Sputnik8 username:", username);

  const sputnik8Get = async (resourcePath) => {
    const separator = resourcePath.includes("?") ? "&" : "?";
    const url = `${apiBase}${resourcePath}${separator}api_key=${encodeURIComponent(apiKey)}&username=${encodeURIComponent(username)}`;
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(`Sputnik8 ${resourcePath} failed (${response.status})`);
    }
    return body;
  };

  const countries = unwrapResults(await sputnik8Get("/countries"));
  console.log(`Sputnik8 countries: ${countries.length}`);

  const argentina = await resolveSyncCountry(sputnik8Get);
  if (!argentina) {
    throw new Error("Argentina not found via Sputnik8 API");
  }

  console.log(`Argentina country id=${argentina.id} (${argentina.name_ru ?? argentina.name_en ?? argentina.name})`);

  const cities = await resolveSyncCities(sputnik8Get, argentina);
  console.log(`Argentina cities: ${cities.length}`);

  if (cities[0]) {
    const sampleCity = cities[0];
    const products = await sputnik8Get(`/products?city_id=${sampleCity.id}&limit=5`);
    const list = unwrapResults(products);
    console.log(
      `Sample city ${sampleCity.name_ru ?? sampleCity.name_en ?? sampleCity.name}: fetched ${list.length} products`
    );
  }

  return true;
}

async function main() {
  loadEnvLocal();

  const tpOk = await verifyTravelpayouts();
  const sputnik8Ok = await verifySputnik8();

  if (!sputnik8Ok || !tpOk) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
