#!/usr/bin/env node
/**
 * Smoke test E106 → E103 → E104 → E101 → E105 → E102
 * Usage: node scripts/smoke-e101-e106.mjs [baseUrl]
 */
const BASE = process.argv[2]?.replace(/\/$/, "") || "http://localhost:3000";

let pass = 0;
let fail = 0;
let warn = 0;

async function checkPage(epic, path, expect = 200) {
  const url = `${BASE}${path}`;
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (res.status === expect) {
      console.log(`✅ ${epic} PAGE ${path} → ${res.status}`);
      pass++;
    } else {
      console.log(`❌ ${epic} PAGE ${path} → ${res.status} (expected ${expect})`);
      fail++;
    }
  } catch (error) {
    console.log(`❌ ${epic} PAGE ${path} → ${error.message}`);
    fail++;
  }
}

async function checkApi(epic, method, path, { body, expect = 200, assertFn } = {}) {
  const url = `${BASE}${path}`;
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let json;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }

    if (res.status !== expect) {
      console.log(`❌ ${epic} API ${method} ${path} → ${res.status} (expected ${expect})`);
      console.log(`   ${text.slice(0, 180)}`);
      fail++;
      return null;
    }

    console.log(`✅ ${epic} API ${method} ${path} → ${res.status}`);
    pass++;

    if (assertFn) {
      try {
        assertFn(json);
        console.log(`   ↳ ${epic} JSON ok`);
        pass++;
      } catch (e) {
        console.log(`   ⚠️ ${epic} JSON: ${e.message}`);
        warn++;
      }
    }
    return json;
  } catch (error) {
    console.log(`❌ ${epic} API ${method} ${path} → ${error.message}`);
    fail++;
    return null;
  }
}

async function main() {
  console.log(`Smoke base: ${BASE}\n`);

  console.log("=== E106 Trip Prep ===");
  await checkPage("E106", "/trip-prep");
  await checkPage("E106", "/profile/trip-prep");
  await checkApi("E106", "GET", "/api/trip-prep?bookingId=test", { expect: 401 });
  await checkApi("E106", "PATCH", "/api/trip-prep/progress", {
    body: { itemId: "x", checked: true },
    expect: 401,
  });

  console.log("\n=== E103 Map 2.0 ===");
  await checkPage("E103", "/map");
  await checkPage("E103", "/map?layer=tours");
  await checkApi("E103", "GET", "/api/map/layers?includeTours=1&includePlaces=1", {
    assertFn: (d) => {
      if (!d?.tours?.length) throw new Error("tours empty");
      if (!d?.places) throw new Error("places missing");
    },
  });

  console.log("\n=== E104 AI Tour Match ===");
  await checkApi("E104", "GET", "/api/ai/tour-match", {
    assertFn: (d) => {
      if (!d?.endpoint) throw new Error("endpoint missing");
    },
  });
  await checkApi("E104", "POST", "/api/ai/tour-match", {
    body: { query: "Патагония ледники неделя" },
    assertFn: (d) => {
      if (!d?.explanation) throw new Error("explanation missing");
      if (!Array.isArray(d.tours)) throw new Error("tours missing");
    },
  });
  await checkPage("E104", "/podbor");

  console.log("\n=== E101 Local Experts ===");
  await checkPage("E101", "/experts");
  await checkPage("E101", "/experts/maria-iguazu");
  await checkApi("E101", "GET", "/api/experts", {
    assertFn: (d) => {
      if (!d?.experts?.length) throw new Error("experts empty");
    },
  });
  await checkApi("E101", "GET", "/api/experts/maria-iguazu", {
    assertFn: (d) => {
      if (!d?.expert?.slug) throw new Error("expert missing");
    },
  });

  console.log("\n=== E105 Forum ===");
  const forumApi = await checkApi("E105", "GET", "/api/forum/categories", {
    assertFn: (d) => {
      if (!Array.isArray(d?.categories)) throw new Error("categories missing");
    },
  });
  const forumRes = await fetch(`${BASE}/forum`);
  if (forumRes.status === 200 || forumRes.status === 404) {
    console.log(`✅ E105 PAGE /forum → ${forumRes.status} (200=enabled, 404=supabase off)`);
    pass++;
  } else {
    console.log(`❌ E105 PAGE /forum → ${forumRes.status}`);
    fail++;
  }
  if (forumApi?.categories?.length) {
    const slug = forumApi.categories[0].slug;
    await checkPage("E105", `/forum/${slug}`);
  } else {
    console.log("   ⚠️ E105 no categories to test category page");
    warn++;
  }

  console.log("\n=== E102 Group Trips ===");
  await checkPage("E102", "/profile/group-trips");
  await checkApi("E102", "GET", "/api/group-trips", {
    assertFn: (d) => {
      if (!Array.isArray(d?.listings)) throw new Error("listings missing");
    },
  });
  await checkPage("E102", "/organizer/group-trips");

  console.log(`\nSUMMARY: pass=${pass} fail=${fail} warn=${warn}`);
  process.exit(fail > 0 ? 1 : 0);
}

main();
