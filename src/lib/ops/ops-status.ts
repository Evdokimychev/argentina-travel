import "server-only";

import fs from "node:fs";
import path from "node:path";

export type OpsAuditLogEntry = {
  ok: boolean;
  source: "static" | "database";
  ranAt: string;
  gitSha: string | null;
  tableCount: number;
  criticalIssueCount: number;
  criticalIssues: Array<{ table: string; kind: string; message: string }>;
};

export type OpsBackupHint = {
  lastBackupAt: string | null;
  lastBackupFile: string | null;
  hint: string;
};

export type CronJobId = "digest" | "cleanupTyping" | "backupHint" | "contentFreshness";

export type CronRunEntry = {
  ranAt: string;
  ok: boolean;
  message: string;
  details?: Record<string, unknown>;
};

export type OpsCronStatus = Record<CronJobId, CronRunEntry | null>;

export type CronRouteRunEntry = {
  route: string;
  ranAt: string;
  ok: boolean;
  message: string;
  statusCode?: number;
  durationMs?: number;
  details?: Record<string, unknown>;
};

export type CronHealthReport = {
  ok: boolean;
  status: "ok" | "degraded";
  generatedAt: string;
  source: "file" | "memory" | "none";
  failingRoutes: string[];
  latestByRoute: Record<string, CronRouteRunEntry>;
  recent: CronRouteRunEntry[];
};

export type OpsStatusSnapshot = {
  rlsAudit: OpsAuditLogEntry | null;
  backup: OpsBackupHint;
  cron: OpsCronStatus;
};

const OPS_DIR = path.join(process.cwd(), "var/ops");
const BACKUPS_DIR = path.join(process.cwd(), "var/backups");
const RLS_AUDIT_FILE = path.join(OPS_DIR, "rls-audit-last.json");
const BACKUP_META_FILE = path.join(OPS_DIR, "backup-last.json");
const CRON_LAST_FILE = path.join(OPS_DIR, "cron-last.json");
const CRON_HEALTH_FILE = path.join(OPS_DIR, "cron-health-last.json");
const CRON_ROUTE_RING_LIMIT = 100;

const EMPTY_CRON_STATUS: OpsCronStatus = {
  digest: null,
  cleanupTyping: null,
  backupHint: null,
  contentFreshness: null,
};

const cronRouteRingBuffer: CronRouteRunEntry[] = [];

function readJsonFile<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return null;
  }
}

function writeJsonFile(filePath: string, payload: unknown): void {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  } catch {
    // In serverless runtimes filesystem may be read-only.
  }
}

function findLatestBackupFile(): { file: string; mtime: Date } | null {
  if (!fs.existsSync(BACKUPS_DIR)) return null;

  const entries = fs
    .readdirSync(BACKUPS_DIR)
    .filter((name) => name.endsWith(".sql"))
    .map((name) => {
      const fullPath = path.join(BACKUPS_DIR, name);
      return { name, mtime: fs.statSync(fullPath).mtime };
    })
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

  const latest = entries[0];
  if (!latest) return null;
  return { file: latest.name, mtime: latest.mtime };
}

function readCronStatus(): OpsCronStatus {
  const raw = readJsonFile<Partial<OpsCronStatus>>(CRON_LAST_FILE);
  if (!raw) return { ...EMPTY_CRON_STATUS };

  return {
    digest: raw.digest ?? null,
    cleanupTyping: raw.cleanupTyping ?? null,
    backupHint: raw.backupHint ?? null,
    contentFreshness: raw.contentFreshness ?? null,
  };
}

export function writeCronRunStatus(job: CronJobId, entry: CronRunEntry): void {
  const current = readCronStatus();
  current[job] = entry;
  writeJsonFile(CRON_LAST_FILE, current);
}

function readCronRouteHistoryFromFile(): CronRouteRunEntry[] {
  const raw = readJsonFile<unknown>(CRON_HEALTH_FILE);
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((item): item is CronRouteRunEntry => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Partial<CronRouteRunEntry>;
      return (
        typeof candidate.route === "string" &&
        typeof candidate.ranAt === "string" &&
        typeof candidate.ok === "boolean" &&
        typeof candidate.message === "string"
      );
    })
    .slice(-CRON_ROUTE_RING_LIMIT);
}

function updateCronRouteRing(entries: CronRouteRunEntry[]): void {
  cronRouteRingBuffer.length = 0;
  cronRouteRingBuffer.push(...entries.slice(-CRON_ROUTE_RING_LIMIT));
}

function readCronRouteHistory(): { source: "file" | "memory" | "none"; entries: CronRouteRunEntry[] } {
  const fromFile = readCronRouteHistoryFromFile();
  if (fromFile.length > 0) {
    updateCronRouteRing(fromFile);
    return { source: "file", entries: fromFile };
  }

  if (cronRouteRingBuffer.length > 0) {
    return { source: "memory", entries: [...cronRouteRingBuffer] };
  }

  return { source: "none", entries: [] };
}

export function appendCronRouteRun(entry: CronRouteRunEntry): void {
  const route = entry.route.trim();
  if (!route) return;

  if (cronRouteRingBuffer.length === 0) {
    const fromDisk = readCronRouteHistoryFromFile();
    if (fromDisk.length > 0) {
      updateCronRouteRing(fromDisk);
    }
  }

  cronRouteRingBuffer.push({
    ...entry,
    route,
  });
  if (cronRouteRingBuffer.length > CRON_ROUTE_RING_LIMIT) {
    cronRouteRingBuffer.splice(0, cronRouteRingBuffer.length - CRON_ROUTE_RING_LIMIT);
  }

  writeJsonFile(CRON_HEALTH_FILE, cronRouteRingBuffer);
}

export function readCronHealthReport(recentLimit = 20): CronHealthReport {
  const resolvedRecentLimit = Math.max(1, Math.min(100, Math.floor(recentLimit)));
  const { source, entries } = readCronRouteHistory();
  const sorted = [...entries].sort((a, b) => b.ranAt.localeCompare(a.ranAt));
  const latestByRouteMap = new Map<string, CronRouteRunEntry>();

  for (const entry of sorted) {
    if (!latestByRouteMap.has(entry.route)) {
      latestByRouteMap.set(entry.route, entry);
    }
  }

  const latestByRoute = Object.fromEntries(latestByRouteMap.entries());
  const failingRoutes = Array.from(latestByRouteMap.values())
    .filter((entry) => !entry.ok)
    .map((entry) => entry.route)
    .sort((a, b) => a.localeCompare(b));

  const ok = failingRoutes.length === 0;

  return {
    ok,
    status: ok ? "ok" : "degraded",
    generatedAt: new Date().toISOString(),
    source,
    failingRoutes,
    latestByRoute,
    recent: sorted.slice(0, resolvedRecentLimit),
  };
}

export function readOpsStatusSnapshot(): OpsStatusSnapshot {
  const rlsAudit = readJsonFile<OpsAuditLogEntry>(RLS_AUDIT_FILE);
  const backupMeta = readJsonFile<{ lastBackupAt?: string; lastBackupFile?: string }>(BACKUP_META_FILE);
  const latestBackup = findLatestBackupFile();

  const lastBackupAt =
    backupMeta?.lastBackupAt ??
    (latestBackup ? latestBackup.mtime.toISOString() : null);
  const lastBackupFile = backupMeta?.lastBackupFile ?? latestBackup?.file ?? null;

  let hint = "Резервная копия схемы не найдена. Запустите: npm run backup:schema";
  if (lastBackupAt && lastBackupFile) {
    hint = `Последний дамп: ${lastBackupFile} (${lastBackupAt})`;
  } else if (lastBackupAt) {
    hint = `Последний дамп: ${lastBackupAt}`;
  }

  return {
    rlsAudit,
    backup: {
      lastBackupAt,
      lastBackupFile,
      hint,
    },
    cron: readCronStatus(),
  };
}

export function getOpsAuditLogPath(): string {
  return RLS_AUDIT_FILE;
}

export function getOpsBackupsDir(): string {
  return BACKUPS_DIR;
}
