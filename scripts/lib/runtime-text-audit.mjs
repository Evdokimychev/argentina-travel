import fs from "node:fs";
import path from "node:path";

const UI_RULES = [
  { id: "developer-command", pattern: /\bnpm\s+run\b/i },
  { id: "local-env-file", pattern: /\.env\.local\b/i },
  {
    id: "environment-key",
    pattern: /\b(?:INTUI_API_KEY|AIRALO_FEED_(?:URL|PATH)|YOUTRAVEL_AFFISE_API_KEY|MEILISEARCH_[A-Z0-9_]+)\b/,
  },
  { id: "unfinished-feature-promise", pattern: /\b(?:в разработке|coming soon|готовится)\b/i },
  { id: "test-exchange-rates", pattern: /\btest exchange rates\b/i },
  { id: "raw-provider-configuration", pattern: /провайдеры? не настроен|серверн(?:ый|ого) режим и ключи/i },
  { id: "raw-draft-state", pattern: /черновик из контент-плана/i },
  { id: "raw-database-instruction", pattern: /Postgres\/static|проверьте миграции Supabase/i },
];

const PUBLIC_API_RULES = [
  { id: "public-api-not-configured", pattern: /\b(?:is|are|was|were) not configured\b/i },
  { id: "public-api-set-secret", pattern: /\bSet [A-Z][A-Z0-9_]{3,}\b/ },
  { id: "public-api-server-copy", pattern: /\bnot configured on the server\b/i },
];

const NOTIFICATION_RULES = [
  { id: "future-payment-promise", pattern: /онлайн-оплата скоро/i },
];

function walk(directory, files = []) {
  if (!fs.existsSync(directory)) return files;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(target, files);
    else files.push(target);
  }
  return files;
}

function lineForOffset(source, offset) {
  return source.slice(0, offset).split("\n").length;
}

function matchRules(file, source, rules, root, findings) {
  for (const rule of rules) {
    const match = rule.pattern.exec(source);
    if (!match) continue;
    findings.push({
      id: rule.id,
      file: path.relative(root, file),
      line: lineForOffset(source, match.index),
      sample: match[0],
    });
  }
}

function isPublicApiRoute(relativePath) {
  if (!relativePath.startsWith("src/app/api/") || !relativePath.endsWith("/route.ts")) return false;
  return ![
    "/admin/",
    "/cron/",
    "/webhooks/",
    "/acceptance/",
    "/health/",
  ].some((segment) => relativePath.includes(segment));
}

export function auditRuntimeText(root) {
  const files = [
    ...walk(path.join(root, "src/components")),
    ...walk(path.join(root, "src/locales")),
    ...walk(path.join(root, "src/app/api")),
    ...walk(path.join(root, "src/lib/notifications")),
  ];
  const findings = [];

  for (const file of files) {
    const relativePath = path.relative(root, file).split(path.sep).join("/");
    if (/\.(?:test|spec)\.[cm]?[jt]sx?$/.test(relativePath)) continue;
    if (!/\.(?:tsx?|json)$/.test(relativePath)) continue;
    const source = fs.readFileSync(file, "utf8");

    if (relativePath.startsWith("src/components/") || relativePath.startsWith("src/locales/")) {
      matchRules(file, source, UI_RULES, root, findings);
    }
    if (isPublicApiRoute(relativePath)) {
      matchRules(file, source, PUBLIC_API_RULES, root, findings);
    }
    if (relativePath.startsWith("src/lib/notifications/")) {
      matchRules(file, source, NOTIFICATION_RULES, root, findings);
    }
  }

  return findings;
}
