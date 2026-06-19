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

export type OpsStatusSnapshot = {
  rlsAudit: OpsAuditLogEntry | null;
  backup: OpsBackupHint;
};

const OPS_DIR = path.join(process.cwd(), "var/ops");
const BACKUPS_DIR = path.join(process.cwd(), "var/backups");
const RLS_AUDIT_FILE = path.join(OPS_DIR, "rls-audit-last.json");
const BACKUP_META_FILE = path.join(OPS_DIR, "backup-last.json");

function readJsonFile<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return null;
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
  };
}

export function getOpsAuditLogPath(): string {
  return RLS_AUDIT_FILE;
}

export function getOpsBackupsDir(): string {
  return BACKUPS_DIR;
}
