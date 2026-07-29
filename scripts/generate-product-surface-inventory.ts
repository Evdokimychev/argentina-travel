import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import ts from "typescript";

const ROOT = process.cwd();
const APP_ROOT = path.join(ROOT, "src/app");
const SRC_ROOT = path.join(ROOT, "src");
const OUTPUT_ROOT = path.join(ROOT, "docs/audit");
const SOURCE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];
const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

type SourceRecord = {
  absolutePath: string;
  relativePath: string;
  text: string;
  sourceFile: ts.SourceFile;
  imports: string[];
};

export type RouteRecord = {
  id: string;
  route_pattern: string;
  kind: "page" | "route_handler" | "metadata" | "middleware";
  http_methods: string;
  source_file: string;
  route_groups: string;
  parallel_segments: string;
  intercepting_segments: string;
  access_signals: string;
  indexability_signals: string;
  locale_signals: string;
  source_sha256: string;
  evidence_level: "static_source";
  runtime_status: "unverified";
};

type MatrixRecord = {
  route_id: string;
  route_pattern: string;
  route_kind: string;
  source_file: string;
  direct_local_imports: string;
  transitive_local_imports_depth_2: string;
  data_source_classes: string;
  supabase_table_candidates: string;
  supabase_rpc_candidates: string;
  storage_bucket_candidates: string;
  external_endpoint_candidates: string;
  access_signals: string;
  dependency_depth: string;
  evidence_level: "static_source";
  runtime_status: "unknown_db_down";
};

export type InteractionRecord = {
  id: string;
  route_patterns: string;
  route_count: string;
  component_file: string;
  source_line: string;
  source_column: string;
  interaction_kind: string;
  http_method: string;
  endpoint_pattern: string;
  source_signals: string;
  test_evidence: "source_only";
  confidence: "high" | "medium";
};

type GeneratedArtifact = { relativePath: string; content: string };

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function posix(relativePath: string): string {
  return relativePath.split(path.sep).join("/");
}

function walk(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) return walk(target);
      return entry.isFile() ? [target] : [];
    });
}

function scriptKind(filePath: string): ts.ScriptKind {
  if (filePath.endsWith(".tsx")) return ts.ScriptKind.TSX;
  if (filePath.endsWith(".jsx")) return ts.ScriptKind.JSX;
  if (filePath.endsWith(".js")) return ts.ScriptKind.JS;
  return ts.ScriptKind.TS;
}

function literalText(node: ts.Node | undefined): string | null {
  if (!node) return null;
  if (ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  return null;
}

function readImports(sourceFile: ts.SourceFile): string[] {
  const imports: string[] = [];
  sourceFile.forEachChild((node) => {
    if (ts.isImportDeclaration(node)) {
      const value = literalText(node.moduleSpecifier);
      if (value) imports.push(value);
    } else if (ts.isExportDeclaration(node)) {
      const value = literalText(node.moduleSpecifier);
      if (value) imports.push(value);
    }
  });
  return [...new Set(imports)].sort();
}

function loadSources(): Map<string, SourceRecord> {
  const records = new Map<string, SourceRecord>();
  for (const absolutePath of walk(SRC_ROOT)) {
    if (!SOURCE_EXTENSIONS.some((extension) => absolutePath.endsWith(extension))) continue;
    if (/\.(?:test|spec)\.[jt]sx?$/.test(absolutePath)) continue;
    const relativePath = posix(path.relative(ROOT, absolutePath));
    const text = fs.readFileSync(absolutePath, "utf8");
    const sourceFile = ts.createSourceFile(
      relativePath,
      text,
      ts.ScriptTarget.Latest,
      true,
      scriptKind(absolutePath),
    );
    records.set(relativePath, {
      absolutePath,
      relativePath,
      text,
      sourceFile,
      imports: readImports(sourceFile),
    });
  }
  return records;
}

function resolveLocalImport(fromFile: string, specifier: string, sources: Map<string, SourceRecord>): string | null {
  let base: string;
  if (specifier.startsWith("@/")) {
    base = `src/${specifier.slice(2)}`;
  } else if (specifier.startsWith(".")) {
    base = posix(path.normalize(path.join(path.dirname(fromFile), specifier)));
  } else {
    return null;
  }

  const withoutExtension = SOURCE_EXTENSIONS.some((extension) => base.endsWith(extension))
    ? base.slice(0, base.lastIndexOf("."))
    : base;
  const candidates = [
    ...SOURCE_EXTENSIONS.map((extension) => `${withoutExtension}${extension}`),
    ...SOURCE_EXTENSIONS.map((extension) => `${withoutExtension}/index${extension}`),
  ];
  return candidates.find((candidate) => sources.has(candidate)) ?? null;
}

function localImports(record: SourceRecord, sources: Map<string, SourceRecord>): string[] {
  return [...new Set(record.imports
    .map((specifier) => resolveLocalImport(record.relativePath, specifier, sources))
    .filter((value): value is string => Boolean(value)))]
    .sort();
}

export function routePatternFromAppFile(relativePath: string): {
  pattern: string;
  groups: string[];
  parallel: string[];
  intercepting: string[];
} {
  const normalized = posix(relativePath);
  const insideApp = normalized.replace(/^src\/app\//, "");
  const segments = insideApp.split("/").slice(0, -1);
  const groups = segments.filter((segment) => /^\([^.)][^)]*\)$/.test(segment));
  const parallel = segments.filter((segment) => segment.startsWith("@"));
  const intercepting = segments.filter((segment) => /^\((?:\.{1,3})\)/.test(segment));
  const publicSegments = segments.filter(
    (segment) => !groups.includes(segment) && !parallel.includes(segment) && !intercepting.includes(segment),
  );
  return {
    pattern: publicSegments.length ? `/${publicSegments.join("/")}` : "/",
    groups,
    parallel,
    intercepting,
  };
}

export function exportedHttpMethods(sourceFile: ts.SourceFile): string[] {
  const methods = new Set<string>();
  sourceFile.forEachChild((node) => {
    if (!ts.canHaveModifiers(node)) return;
    const exported = ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
    if (!exported) return;
    if ((ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) && node.name) {
      if (HTTP_METHODS.includes(node.name.text)) methods.add(node.name.text);
    }
    if (ts.isVariableStatement(node)) {
      for (const declaration of node.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name) && HTTP_METHODS.includes(declaration.name.text)) {
          methods.add(declaration.name.text);
        }
      }
    }
  });
  return HTTP_METHODS.filter((method) => methods.has(method));
}

function joinedSignals(text: string, definitions: Array<[string, RegExp]>): string {
  return definitions.filter(([, pattern]) => pattern.test(text)).map(([name]) => name).join("|") || "none_detected";
}

function accessSignals(text: string): string {
  return joinedSignals(text, [
    ["admin", /(?:requireAdmin|isAdmin|roles?\.includes\(["']admin|\/admin)/],
    ["organizer", /(?:requireOrganizer|isOrganizer|roles?\.includes\(["']organizer|\/organizer)/],
    ["authenticated", /(?:getUser\(|requireAuth|auth\.getSession|currentUser)/],
    ["cron_secret", /(?:CRON_SECRET|verifyCron|authorization)/i],
    ["webhook_signature", /(?:signature|webhookSecret|verifyWebhook)/i],
    ["rate_limit", /(?:rateLimit|checkRateLimit)/],
  ]);
}

function routeRows(sources: Map<string, SourceRecord>): RouteRecord[] {
  const rows: RouteRecord[] = [];
  const appFiles = [...sources.values()].filter((record) => record.relativePath.startsWith("src/app/"));
  for (const record of appFiles) {
    const basename = path.basename(record.relativePath);
    let kind: RouteRecord["kind"] | null = null;
    let methods = "GET";
    let route = routePatternFromAppFile(record.relativePath);
    if (/^page\.[jt]sx?$/.test(basename)) {
      kind = "page";
    } else if (/^route\.[jt]sx?$/.test(basename)) {
      kind = "route_handler";
      methods = exportedHttpMethods(record.sourceFile).join("|") || "UNRESOLVED";
    } else if (/^sitemap\.[jt]s$/.test(basename)) {
      kind = "metadata";
      route = { ...route, pattern: `${route.pattern === "/" ? "" : route.pattern}/sitemap.xml` };
    } else if (/^(?:robots|manifest)\.[jt]s$/.test(basename)) {
      kind = "metadata";
      const extension = basename.startsWith("robots") ? "txt" : "webmanifest";
      route = { ...route, pattern: `${route.pattern === "/" ? "" : route.pattern}/${basename.split(".")[0]}.${extension}` };
    }
    if (!kind) continue;
    rows.push({
      id: sha256(`${kind}:${route.pattern}:${record.relativePath}`).slice(0, 16),
      route_pattern: route.pattern,
      kind,
      http_methods: methods,
      source_file: record.relativePath,
      route_groups: route.groups.join("|"),
      parallel_segments: route.parallel.join("|"),
      intercepting_segments: route.intercepting.join("|"),
      access_signals: accessSignals(record.text),
      indexability_signals: joinedSignals(record.text, [
        ["metadata", /(?:generateMetadata|export const metadata)/],
        ["noindex", /(?:noindex|robots:\s*\{)/],
        ["canonical", /canonical/],
      ]),
      locale_signals: joinedSignals(record.text, [
        ["locale_param", /(?:params[\s\S]*locale|locale[\s\S]*params)/],
        ["i18n_import", /(?:@\/lib\/i18n|useTranslations|next-intl)/],
      ]),
      source_sha256: sha256(record.text),
      evidence_level: "static_source",
      runtime_status: "unverified",
    });
  }

  const middleware = sources.get("src/middleware.ts") ?? sources.get("src/middleware.tsx");
  if (middleware) {
    const matcher = middleware.text.match(/matcher:\s*\[\s*(["'`])([\s\S]*?)\1/)?.[2] ?? "all_matching_requests";
    rows.push({
      id: sha256(`middleware:${middleware.relativePath}`).slice(0, 16),
      route_pattern: matcher,
      kind: "middleware",
      http_methods: "ALL",
      source_file: middleware.relativePath,
      route_groups: "",
      parallel_segments: "",
      intercepting_segments: "",
      access_signals: accessSignals(middleware.text),
      indexability_signals: joinedSignals(middleware.text, [["x_robots_tag", /X-Robots-Tag/], ["canonical_host", /isCanonicalIndexingRequest/]]),
      locale_signals: joinedSignals(middleware.text, [["locale_rewrite", /applyLocalePrefix|stripLocalePrefix/]]),
      source_sha256: sha256(middleware.text),
      evidence_level: "static_source",
      runtime_status: "unverified",
    });
  }

  rows.sort((left, right) =>
    left.route_pattern.localeCompare(right.route_pattern) ||
    left.kind.localeCompare(right.kind) ||
    left.source_file.localeCompare(right.source_file),
  );
  const keys = new Set<string>();
  for (const row of rows) {
    const key = `${row.kind}:${row.route_pattern}`;
    if (keys.has(key) && row.kind !== "middleware") throw new Error(`Duplicate generated route key: ${key}`);
    keys.add(key);
  }
  return rows;
}

function callStringCandidates(record: SourceRecord): {
  tables: Set<string>;
  rpcs: Set<string>;
  buckets: Set<string>;
  endpoints: Set<string>;
} {
  const tables = new Set<string>();
  const rpcs = new Set<string>();
  const buckets = new Set<string>();
  const endpoints = new Set<string>();
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node)) {
      const property = ts.isPropertyAccessExpression(node.expression) ? node.expression.name.text : null;
      const first = literalText(node.arguments[0]);
      if (first && property === "from") {
        if (node.expression.getText(record.sourceFile).includes("storage")) buckets.add(first);
        else tables.add(first);
      }
      if (first && property === "rpc") rpcs.add(first);
      if (first && (ts.isIdentifier(node.expression) && node.expression.text === "fetch")) endpoints.add(first);
    }
    ts.forEachChild(node, visit);
  };
  visit(record.sourceFile);
  return { tables, rpcs, buckets, endpoints };
}

function dataClasses(records: SourceRecord[]): string[] {
  const modules = records
    .flatMap((record) => [record.relativePath, ...record.imports])
    .join("\n");
  const sourceCalls = records.map((record) => record.text).join("\n");
  const matches: Array<[string, boolean]> = [
    ["supabase", /supabase/i.test(modules) || /\.(?:from|rpc)\(\s*["'`]/.test(sourceCalls)],
    ["prisma", /(?:@prisma|\/prisma(?:\/|$)|prisma-client)/i.test(modules)],
    ["cms", /(?:\/cms(?:\/|[-.]|$)|cms-)/i.test(modules)],
    ["tripster", /(?:\/tripster(?:\/|[-.]|$)|tripster-)/i.test(modules)],
    ["youtravel", /(?:\/youtravel(?:\/|[-.]|$)|youtravel-)/i.test(modules)],
    ["sputnik8", /(?:\/sputnik8?(?:\/|[-.]|$)|sputnik8?-)/i.test(modules)],
    ["travelpayouts", /(?:\/travelpayouts(?:\/|[-.]|$)|travelpayouts-)/i.test(modules)],
    ["airalo", /(?:\/airalo(?:\/|[-.]|$)|airalo-)/i.test(modules)],
    ["static_data", /(?:@\/data\/|src\/data\/)/.test(modules)],
    ["external_http", /(?:\bfetch\s*\(|axios|\bky\s*\()/.test(sourceCalls)],
    ["filesystem", /(?:node:fs|^["']?fs["']?$)/m.test(modules)],
  ];
  return matches.filter(([, matched]) => matched).map(([name]) => name);
}

function matrixRows(routes: RouteRecord[], sources: Map<string, SourceRecord>): MatrixRecord[] {
  return routes
    .filter((route) => route.kind !== "middleware")
    .map((route) => {
      const entry = sources.get(route.source_file);
      if (!entry) throw new Error(`Missing source for ${route.source_file}`);
      const direct = localImports(entry, sources);
      const depthTwo = [...new Set(direct.flatMap((file) => {
        const dependency = sources.get(file);
        return dependency ? localImports(dependency, sources) : [];
      }).filter((file) => file !== entry.relativePath && !direct.includes(file)))].sort();
      const evidenceRecords = [entry, ...direct.map((file) => sources.get(file)), ...depthTwo.map((file) => sources.get(file))]
        .filter((record): record is SourceRecord => Boolean(record));
      const candidates = evidenceRecords.map(callStringCandidates);
      const merge = (key: "tables" | "rpcs" | "buckets" | "endpoints") =>
        [...new Set(candidates.flatMap((candidate) => [...candidate[key]]))].sort().join("|");
      return {
        route_id: route.id,
        route_pattern: route.route_pattern,
        route_kind: route.kind,
        source_file: route.source_file,
        direct_local_imports: direct.join("|"),
        transitive_local_imports_depth_2: depthTwo.join("|"),
        data_source_classes: dataClasses(evidenceRecords).join("|") || "none_detected",
        supabase_table_candidates: merge("tables"),
        supabase_rpc_candidates: merge("rpcs"),
        storage_bucket_candidates: merge("buckets"),
        external_endpoint_candidates: merge("endpoints"),
        access_signals: [...new Set(evidenceRecords.map((record) => accessSignals(record.text)).filter((value) => value !== "none_detected"))].sort().join("|") || "none_detected",
        dependency_depth: "2",
        evidence_level: "static_source",
        runtime_status: "unknown_db_down",
      };
    });
}

function fullDependencyClosure(startFiles: string[], sources: Map<string, SourceRecord>): Set<string> {
  const seen = new Set<string>();
  const pending = [...startFiles];
  while (pending.length) {
    const file = pending.pop();
    if (!file || seen.has(file)) continue;
    seen.add(file);
    const record = sources.get(file);
    if (!record) continue;
    for (const dependency of localImports(record, sources)) pending.push(dependency);
  }
  return seen;
}

function pageRoots(route: RouteRecord, routes: RouteRecord[], sources: Map<string, SourceRecord>): string[] {
  const roots = [route.source_file];
  const pageDirectory = path.posix.dirname(route.source_file);
  const appRoot = "src/app";
  let current = pageDirectory;
  while (current.startsWith(appRoot)) {
    for (const extension of SOURCE_EXTENSIONS) {
      const layout = `${current}/layout${extension}`;
      if (sources.has(layout)) roots.push(layout);
    }
    if (current === appRoot) break;
    current = path.posix.dirname(current);
  }
  // Parallel route layouts can be shared by sibling pages. Route mapping remains source-derived.
  return [...new Set(roots)].filter((file) => routes.some((candidate) => candidate.source_file === file) || sources.has(file));
}

function methodFromFetch(node: ts.CallExpression): string {
  const options = node.arguments[1];
  if (!options || !ts.isObjectLiteralExpression(options)) return "GET";
  const method = options.properties.find((property): property is ts.PropertyAssignment =>
    ts.isPropertyAssignment(property) && property.name.getText().replace(/["']/g, "") === "method",
  );
  return literalText(method?.initializer)?.toUpperCase() ?? "UNRESOLVED";
}

export function interactionsFromSource(record: SourceRecord): Omit<InteractionRecord, "route_patterns" | "route_count">[] {
  const interactions: Omit<InteractionRecord, "route_patterns" | "route_count">[] = [];
  const add = (
    node: ts.Node,
    kind: string,
    method = "",
    endpoint = "",
    signal = node.getText(record.sourceFile).slice(0, 180).replace(/\s+/g, " "),
    confidence: InteractionRecord["confidence"] = "high",
  ) => {
    const location = record.sourceFile.getLineAndCharacterOfPosition(node.getStart(record.sourceFile));
    const line = location.line + 1;
    const column = location.character + 1;
    interactions.push({
      id: sha256(`${record.relativePath}:${line}:${column}:${kind}:${method}:${endpoint}`).slice(0, 16),
      component_file: record.relativePath,
      source_line: String(line),
      source_column: String(column),
      interaction_kind: kind,
      http_method: method,
      endpoint_pattern: endpoint,
      source_signals: signal,
      test_evidence: "source_only",
      confidence,
    });
  };
  const visit = (node: ts.Node): void => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(record.sourceFile);
      if (tag === "form") {
        const action = node.attributes.properties.find((property) => ts.isJsxAttribute(property) && property.name.getText() === "action");
        const onSubmit = node.attributes.properties.find((property) => ts.isJsxAttribute(property) && property.name.getText() === "onSubmit");
        if (action || onSubmit) add(node, "form_submit", "POST", action?.getText(record.sourceFile) ?? "handler", undefined, "medium");
      }
      for (const attribute of node.attributes.properties) {
        if (!ts.isJsxAttribute(attribute)) continue;
        const name = attribute.name.getText(record.sourceFile);
        if (["onClick", "onChange", "onInput", "onKeyDown", "onDrop"].includes(name)) {
          add(attribute, `ui_${name.slice(2).toLowerCase()}`, "", "", undefined, "medium");
        }
      }
    }
    if (ts.isCallExpression(node)) {
      const expressionText = node.expression.getText(record.sourceFile);
      const first = literalText(node.arguments[0]) ?? "dynamic";
      if (ts.isIdentifier(node.expression) && node.expression.text === "fetch") {
        add(node, "http_request", methodFromFetch(node), first, undefined, first === "dynamic" ? "medium" : "high");
      } else if (/\.(?:push|replace)$/.test(expressionText) && /(?:router|navigation)/i.test(expressionText)) {
        add(node, "client_navigation", "", first, undefined, first === "dynamic" ? "medium" : "high");
      } else if (/^(?:window\.open|navigator\.share|navigator\.clipboard\.)/.test(expressionText)) {
        add(node, "browser_capability", "", expressionText, undefined, "high");
      } else if (/\.(?:insert|update|upsert|delete)$/.test(expressionText)) {
        add(node, "data_mutation", expressionText.split(".").at(-1)?.toUpperCase() ?? "MUTATION", "supabase_or_repository", undefined, "medium");
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(record.sourceFile);
  return interactions;
}

function interactionRows(routes: RouteRecord[], sources: Map<string, SourceRecord>): InteractionRecord[] {
  const routesByFile = new Map<string, Set<string>>();
  for (const route of routes.filter((candidate) => candidate.kind === "page")) {
    const closure = fullDependencyClosure(pageRoots(route, routes, sources), sources);
    for (const file of closure) {
      const patterns = routesByFile.get(file) ?? new Set<string>();
      patterns.add(route.route_pattern);
      routesByFile.set(file, patterns);
    }
  }
  const rows: InteractionRecord[] = [];
  for (const record of [...sources.values()].sort((left, right) => left.relativePath.localeCompare(right.relativePath))) {
    const patterns = [...(routesByFile.get(record.relativePath) ?? [])].sort();
    if (!patterns.length) continue;
    for (const interaction of interactionsFromSource(record)) {
      rows.push({
        ...interaction,
        route_patterns: patterns.slice(0, 12).join("|") + (patterns.length > 12 ? "|…" : ""),
        route_count: String(patterns.length),
      });
    }
  }
  return rows.sort((left, right) =>
    left.component_file.localeCompare(right.component_file) ||
    Number(left.source_line) - Number(right.source_line) ||
    left.interaction_kind.localeCompare(right.interaction_kind),
  );
}

export function csvCell(value: unknown): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export function toCsv<T extends Record<string, unknown>>(headers: Array<keyof T & string>, rows: T[]): string {
  return `${headers.map(csvCell).join(",")}\n${rows.map((row) => headers.map((header) => csvCell(row[header])).join(",")).join("\n")}\n`;
}

function architectureMarkdown(routes: RouteRecord[], matrix: MatrixRecord[], interactions: InteractionRecord[]): string {
  const routeCounts = Object.fromEntries(["page", "route_handler", "metadata", "middleware"].map((kind) => [kind, routes.filter((route) => route.kind === kind).length]));
  const methodCounts = Object.fromEntries(HTTP_METHODS.map((method) => [
    method,
    routes.filter((route) => route.kind === "route_handler" && route.http_methods.split("|").includes(method)).length,
  ]));
  const dataCounts = [...new Set(matrix.flatMap((row) => row.data_source_classes.split("|")).filter((value) => value !== "none_detected"))]
    .sort()
    .map((dataClass) => [dataClass, matrix.filter((row) => row.data_source_classes.split("|").includes(dataClass)).length]);
  const digest = sha256(JSON.stringify({ routes, matrix, interactions })).slice(0, 16);
  return [
    "# Текущая архитектура продуктовой поверхности",
    "",
    "> Этот файл сгенерирован из исходного кода. Ручные правки будут перезаписаны командой `npm run inventory:generate`.",
    "",
    `Детерминированный digest снимка: \`${digest}\`.`,
    "",
    "## Покрытие",
    "",
    `- Страницы App Router: **${routeCounts.page}**.`,
    `- Route handlers: **${routeCounts.route_handler}**.`,
    `- Metadata routes: **${routeCounts.metadata}**.`,
    `- Middleware matchers: **${routeCounts.middleware}**.`,
    `- Статически обнаруженные взаимодействия в достижимом от страниц UI: **${interactions.length}**.`,
    `- Строк route → component/data: **${matrix.length}**.`,
    "",
    "## HTTP-методы route handlers",
    "",
    ...Object.entries(methodCounts).map(([method, count]) => `- ${method}: **${count}**.`),
    "",
    "## Классы источников данных",
    "",
    ...dataCounts.map(([dataClass, count]) => `- ${dataClass}: **${count}** маршрутов со статическим сигналом.`),
    "",
    "## Системное влияние",
    "",
    "- Турист: страницы и клиентские взаимодействия связаны с конкретными исходниками; это не подтверждение успешного UX в браузере.",
    "- Организатор и администратор: access-сигналы показывают наличие проверок в достижимом коде, но не доказывают live-роли или RLS.",
    "- Бронирование, CRM, аналитика и платежи: HTTP/data-связи фиксируются как кандидаты; backend effect и доставка событий требуют отдельных integration/smoke evidence.",
    "- Supabase, CMS и партнёры: `static_source` означает только наличие сигнала в репозитории. При недоступной live-БД состояние схемы, grants, RLS, строки и freshness остаются неизвестными.",
    "",
    "## Границы доказательства",
    "",
    "- Генератор не исполняет модули приложения, не обращается к БД, CMS, Vercel или партнёрским API и не читает секреты.",
    "- Матрица данных анализирует файл маршрута, прямые локальные импорты и ещё один локальный уровень (depth 2). Имена `.from()`, `.rpc()` и storage bucket — кандидаты, а не подтверждённая live-схема.",
    "- Interaction inventory строится по AST и графу импортов. Он показывает технические поверхности, но не обещанный бизнес-эффект и не тестовое покрытие.",
    "- Redirects из динамических реестров и control plane не разворачиваются в отдельные route-строки: их runtime-состояние требует отдельного evidence.",
    "",
    "## Артефакты",
    "",
    "- `route-inventory.csv` — App Router и middleware.",
    "- `route-component-data-matrix.csv` — ограниченный статический граф данных.",
    "- `interaction-inventory.csv` — UI-взаимодействия с исходной строкой и confidence.",
    "",
  ].join("\n");
}

export function generateProductSurfaceArtifacts(): GeneratedArtifact[] {
  const sources = loadSources();
  const routes = routeRows(sources);
  const matrix = matrixRows(routes, sources);
  const interactions = interactionRows(routes, sources);
  const artifacts: GeneratedArtifact[] = [
    {
      relativePath: "docs/audit/route-inventory.csv",
      content: toCsv(Object.keys(routes[0]!) as Array<keyof RouteRecord & string>, routes),
    },
    {
      relativePath: "docs/audit/route-component-data-matrix.csv",
      content: toCsv(Object.keys(matrix[0]!) as Array<keyof MatrixRecord & string>, matrix),
    },
    {
      relativePath: "docs/audit/interaction-inventory.csv",
      content: toCsv(Object.keys(interactions[0]!) as Array<keyof InteractionRecord & string>, interactions),
    },
    {
      relativePath: "docs/audit/architecture-current.md",
      content: architectureMarkdown(routes, matrix, interactions),
    },
  ];
  return artifacts;
}

export function writeOrCheckProductSurfaceArtifacts(check: boolean): void {
  const artifacts = generateProductSurfaceArtifacts();
  const stale: string[] = [];
  for (const artifact of artifacts) {
    const absolutePath = path.join(ROOT, artifact.relativePath);
    if (check) {
      const current = fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, "utf8") : null;
      if (current !== artifact.content) stale.push(artifact.relativePath);
    } else {
      fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
      fs.writeFileSync(absolutePath, artifact.content, "utf8");
    }
  }
  if (stale.length) {
    throw new Error(`Product surface inventory is stale:\n${stale.map((file) => `- ${file}`).join("\n")}\nRun npm run inventory:generate.`);
  }
  const mode = check ? "verified" : "generated";
  console.log(`${mode}: ${artifacts.map((artifact) => artifact.relativePath).join(", ")}`);
}

if (process.argv[1]?.endsWith("generate-product-surface-inventory.ts")) {
  try {
    writeOrCheckProductSurfaceArtifacts(process.argv.includes("--check"));
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
