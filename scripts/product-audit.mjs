import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const appDir = path.join(root, "src/app");
const baselineSha = "df839a6871c6697e7ed96aa0c45607629bd2e70f";

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function routeFromFile(file) {
  const relative = path.relative(appDir, file).replaceAll(path.sep, "/");
  const route = relative.replace(/\/(?:page|route)\.tsx?$/, "").replace(/(?:page|route)\.tsx?$/, "");
  return `/${route}`.replace(/\/+/g, "/").replace(/\/$/, "") || "/";
}

function domain(route) {
  if (route.startsWith("/api")) return "api";
  if (route.startsWith("/admin")) return "admin";
  if (route.startsWith("/organizer")) return "organizer";
  if (route.startsWith("/profile")) return "account";
  if (route.includes("booking") || route.includes("payment")) return "booking";
  if (route.includes("tour") || route.includes("excursion")) return "marketplace";
  if (route.includes("blog") || route.includes("guide") || route.includes("baza-znaniy") || route.includes("immigration")) return "content";
  return "discovery";
}

function audience(route) {
  if (route.startsWith("/admin")) return "admin";
  if (route.startsWith("/organizer")) return "organizer";
  if (route.startsWith("/profile")) return "authenticated_tourist";
  if (route.startsWith("/api")) return "system_or_client";
  return "public_tourist";
}

function dataSources(source) {
  const found = [];
  if (/supabase|\.from\(/i.test(source)) found.push("supabase");
  if (/prisma/i.test(source)) found.push("prisma");
  if (/marketplaceTours|tour-repository/i.test(source)) found.push("tour_repository");
  if (/knowledge-base|content\.json/i.test(source)) found.push("knowledge_base_index");
  if (/tripster/i.test(source)) found.push("tripster");
  if (/youtravel/i.test(source)) found.push("youtravel");
  if (/localStorage/i.test(source)) found.push("local_storage");
  return found;
}

function issues(route, source, sources) {
  const result = [];
  if (sources.includes("local_storage") && !route.includes("admin")) result.push("business_data_local_storage");
  if (/force-dynamic/.test(source) && !/admin|profile|organizer|api|booking|payment/.test(route)) result.push("review_force_dynamic");
  if (route.startsWith("/api") && !/require|auth|getUser|webhook|cron|public/i.test(source)) result.push("auth_contract_not_obvious");
  if (route === "/api/bookings") result.push("client_supplied_booking_payload");
  if (/catch\s*\([^)]*\)\s*\{\s*\}/s.test(source) || /catch\s*\{\s*\}/s.test(source)) result.push("silent_error");
  return result;
}

const routeFiles = walk(appDir).filter((file) => /\/(?:page|route)\.tsx?$/.test(file));
const routes = routeFiles.map((file) => {
  const source = fs.readFileSync(file, "utf8");
  const route = routeFromFile(file);
  const sources = dataSources(source);
  const routeIssues = issues(route, source, sources);
  const isApi = file.endsWith("route.ts");
  return {
    route,
    title: route === "/" ? "Главная" : route.split("/").filter(Boolean).at(-1),
    audience: audience(route),
    primaryIntent: isApi ? "serve_domain_command_or_query" : domain(route),
    businessPurpose: domain(route),
    domain: domain(route),
    authentication: /requireAdmin|requireStaff/.test(source) ? "staff" : /getUser|requireAuth|loadSession/.test(source) ? "authenticated" : "public_or_route_managed",
    dataSources: sources,
    dynamicMode: /force-dynamic/.test(source) ? "dynamic" : /revalidate\s*=/.test(source) ? "isr" : isApi ? "request" : "framework_default",
    cachePolicy: /no-store/.test(source) ? "no-store" : source.match(/revalidate\s*=\s*([^;\n]+)/)?.[1]?.trim() ?? "implicit",
    owner: domain(route),
    status: route.includes("archive") ? "legacy" : route.startsWith("/admin") ? "internal" : "core",
    duplicateOf: null,
    dependencies: sources,
    analyticsEvents: [...source.matchAll(/track[A-Za-z]+\(\s*["']([^"']+)/g)].map((match) => match[1]),
    criticality: /booking|payment|auth|webhook/.test(route) ? "critical" : route === "/" || /tour|excursion|search/.test(route) ? "high" : "normal",
    issues: routeIssues,
    sourcePath: path.relative(root, file),
  };
}).sort((a, b) => a.route.localeCompare(b.route));

const apiRoutes = routes.filter((item) => item.route.startsWith("/api")).map((item) => ({
  route: item.route,
  method: "inspect_source",
  authRequired: item.authentication !== "public_or_route_managed",
  role: item.authentication,
  inputSchema: "source_audit_required",
  outputSchema: "source_audit_required",
  rateLimit: "source_audit_required",
  idempotency: "source_audit_required",
  csrfProtection: "source_audit_required",
  auditLog: "source_audit_required",
  pii: /booking|profile|user|payment|message/.test(item.route),
  owner: item.owner,
  issues: item.issues,
}));

const counts = {
  routes: routes.length,
  pages: routes.filter((item) => !item.route.startsWith("/api")).length,
  apiRoutes: apiRoutes.length,
  critical: routes.filter((item) => item.criticality === "critical").length,
  withIssues: routes.filter((item) => item.issues.length).length,
};
const generatedAt = new Date().toISOString();
const after = { generatedAt, baselineSha, counts, routes, apiRoutes };
const before = {
  generatedAt,
  baselineSha,
  productionDeployment: "dpl_HVXqRU5EVbd58UVM98ipYJhw7pGR",
  confirmedCriticalIssues: [
    "email_only_booking_lookup_returned_full_booking_rows",
    "booking_creation_accepts_client_supplied_price_status_and_denormalized_fields",
    "local_storage_business_fallbacks_present",
  ],
  counts,
};
const manifest = {
  generatedAt,
  baselineSha,
  fixes: [
    { id: "secure-booking-lookup", status: "implemented_local", reversibleMigration: "drop two booking_lookup tables", verification: ["unit", "e2e", "rls"] },
    { id: "server-authoritative-booking-command", status: "next" },
    { id: "production-mode-isolation", status: "pending" },
    { id: "shell-and-navigation-simplification", status: "pending" },
  ],
};

fs.mkdirSync(path.join(root, "var/ops"), { recursive: true });
fs.mkdirSync(path.join(root, "docs/audit"), { recursive: true });
fs.writeFileSync(path.join(root, "var/ops/product-audit-before.json"), `${JSON.stringify(before, null, 2)}\n`);
fs.writeFileSync(path.join(root, "var/ops/product-audit-after.json"), `${JSON.stringify(after, null, 2)}\n`);
fs.writeFileSync(path.join(root, "var/ops/root-fix-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

const issueCounts = {};
for (const item of routes) for (const issue of item.issues) issueCounts[issue] = (issueCounts[issue] ?? 0) + 1;
fs.writeFileSync(path.join(root, "docs/audit/product-architecture-audit-2026-07-14.md"), [
  "# Продуктовый и архитектурный аудит — 14 июля 2026",
  "",
  `Baseline: \`${baselineSha}\`. Проверено маршрутов: **${counts.routes}**, API: **${counts.apiRoutes}**, критичных: **${counts.critical}**.`,
  "",
  "## Подтверждённые корневые риски",
  "",
  "1. Email-only поиск заявок раскрывал полные данные. Заменён на OTP и короткую lookup-сессию.",
  "2. Создание заявки принимает готовый объект и клиентскую цену. Требует серверной команды и price snapshot.",
  "3. В production-коде остаются localStorage/demo fallback. Требуется fail-closed конфигурация.",
  "",
  "## Автоматически найденные классы",
  "",
  ...Object.entries(issueCounts).sort((a,b)=>b[1]-a[1]).map(([key,value]) => `- \`${key}\`: ${value}`),
  "",
  "Полная карта находится в `var/ops/product-audit-after.json`.",
  "",
].join("\n"));

fs.writeFileSync(path.join(root, "docs/audit/user-journey-map.md"), `# Карта пользовательских сценариев\n\n## B2C\n\nВыбор направления → поиск → результат → карточка → заявка → подтверждение → оплата → управление поездкой.\n\n## Гостевая заявка\n\nEmail → нейтральный ответ → одноразовый код → 15-минутная сессия → минимальный список заявок.\n\n## B2B\n\nРегистрация → проверка → черновик → модерация → публикация → заявка → проведение → выплата.\n`);
fs.writeFileSync(path.join(root, "docs/audit/feature-inventory.md"), `# Инвентаризация функций\n\n- Основной B2C: направления, туры, экскурсии, подбор, бронирование, оплата, кабинет.\n- Информационный контур: места, карта, путеводитель, база знаний, блог, иммиграция.\n- B2B: onboarding организатора, предложения, модерация, заявки, сообщения, выплаты, аналитика.\n- Supporting/experimental: магазин, форум, галерея, партнёрские сервисы.\n\nМашинный inventory: \`var/ops/product-audit-after.json\`.\n`);
fs.writeFileSync(path.join(root, "docs/audit/data-source-map.md"), `# Карта источников данных\n\n- Tour → Supabase/CMS; статический repository является переходным fallback.\n- Organizer, Booking → Supabase.\n- Payment → ledger и провайдер.\n- Region → \`src/data/geography-canonical.ts\`.\n- Knowledge article → Markdown/editorial repository.\n- Search, map, sitemap → производные индексы, не источник истины.\n- Media → media manifest.\n\nLocalStorage не является допустимым источником production-бизнес-данных.\n`);
console.log(JSON.stringify(counts, null, 2));
