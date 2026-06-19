#!/usr/bin/env node
/**
 * Verify Tripster + Travelpayouts credentials and Argentina catalog scope.
 * Usage: npm run tripster:verify
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveSyncCities, resolveSyncCountry } from "./tripster-argentina-resolver.mjs";

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
  return Array.isArray(data) ? data : data.results ?? [];
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
      links: [{ url: "https://experience.tripster.ru/experience/Buenos_Aires/", sub_id: "tripster:verify" }],
    }),
  });
  const body = await response.json();
  const link = body?.result?.links?.[0];
  const ok = response.ok && link?.code === "success";
  console.log("Travelpayouts link:", ok ? "ok" : `failed (${link?.message ?? response.status})`);
  return ok;
}

async function verifyTripster() {
  const tripsterPartner = process.env.TRIPSTER_PARTNER?.trim();
  const tripsterSecret = process.env.TRIPSTER_SECRET?.trim();
  const apiBase = (process.env.TRIPSTER_API_BASE?.trim() || "https://experience.tripster.ru/api").replace(
    /\/$/,
    ""
  );

  if (!tripsterPartner || !tripsterSecret) {
    console.log("Tripster: skipped (set TRIPSTER_SECRET in .env.local from partner cabinet)");
    return false;
  }

  console.log("Tripster partner:", tripsterPartner);

  const authResponse = await fetch(`${apiBase}/auth/obtain_token/partner/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ partner: tripsterPartner, secret: tripsterSecret }),
  });
  const authBody = await authResponse.json();
  if (!authResponse.ok || !authBody?.token) {
    throw new Error(`Tripster auth failed (${authResponse.status})`);
  }
  console.log("Tripster token: ok");

  const token = authBody.token;
  const tripsterGet = async (resourcePath) => {
    const response = await fetch(`${apiBase}/partners/${encodeURIComponent(tripsterPartner)}${resourcePath}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const body = await response.json();
    if (!response.ok) {
      throw new Error(`Tripster ${resourcePath} failed (${response.status})`);
    }
    return body;
  };

  const countries = unwrapResults(await tripsterGet("/countries/"));
  console.log(`Tripster countries (page 1 sample): ${countries.length}`);

  const argentina = await resolveSyncCountry(tripsterGet);
  if (!argentina) {
    throw new Error("Argentina not found via Tripster filters/search");
  }

  console.log(`Argentina country id=${argentina.id} (${argentina.name_ru ?? argentina.name_en})`);

  const cities = await resolveSyncCities(tripsterGet, argentina);
  console.log(`Argentina cities: ${cities.length}`);

  if (cities[0]) {
    const sampleCity = cities[0];
    const experiences = await tripsterGet(
      `/experiences/?city=${sampleCity.id}&page=1&page_size=5`
    );
    const list = unwrapResults(experiences);
    console.log(
      `Sample city ${sampleCity.name_ru ?? sampleCity.name_en}: ${experiences.count ?? list.length} experiences total, fetched ${list.length}`
    );
  }

  return true;
}

async function main() {
  loadEnvLocal();

  const tpOk = await verifyTravelpayouts();
  const tripsterOk = await verifyTripster();

  if (!tripsterOk) {
    process.exitCode = 1;
  } else if (!tpOk) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
