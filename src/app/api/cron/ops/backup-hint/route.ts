import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { authorizeCronRequest } from "@/lib/cron/authorize-cron";
import { logCronResult } from "@/lib/cron/log-cron-result";
import { readOpsStatusSnapshot, writeCronRunStatus } from "@/lib/ops/ops-status";

const execFileAsync = promisify(execFile);
const CRON_ROUTE = "/api/cron/ops/backup-hint";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

async function runBackupHint(): Promise<NextResponse> {
  const ranAt = new Date().toISOString();
  const root = process.cwd();
  const scriptPath = path.join(root, "scripts/backup-supabase-schema.mjs");

  if (!process.env.DATABASE_URL?.trim()) {
    const message = "DATABASE_URL не задан — резервное копирование пропущено";
    console.log(`[cron:backup-hint] ${message}`);
    writeCronRunStatus("backupHint", { ranAt, ok: true, message, details: { skipped: true } });
    await logCronResult(CRON_ROUTE, {
      ok: true,
      ranAt,
      message,
      details: { skipped: true },
      statusCode: 200,
    });
    return NextResponse.json({ ok: true, skipped: true, message });
  }

  try {
    console.log("[cron:backup-hint] Запуск резервного копирования схемы…");
    const { stdout, stderr } = await execFileAsync(process.execPath, [scriptPath], {
      cwd: root,
      env: process.env,
      maxBuffer: 4 * 1024 * 1024,
    });

    const snapshot = readOpsStatusSnapshot();
    const message = snapshot.backup.hint;
    console.log(`[cron:backup-hint] ${message}`);

    writeCronRunStatus("backupHint", {
      ranAt,
      ok: true,
      message,
      details: {
        lastBackupAt: snapshot.backup.lastBackupAt,
        lastBackupFile: snapshot.backup.lastBackupFile,
        stdout: stdout.slice(-2000),
        stderr: stderr.slice(-1000),
      },
    });
    await logCronResult(CRON_ROUTE, {
      ok: true,
      ranAt,
      message,
      statusCode: 200,
      details: {
        lastBackupAt: snapshot.backup.lastBackupAt,
        lastBackupFile: snapshot.backup.lastBackupFile,
      },
    });

    return NextResponse.json({
      ok: true,
      message,
      backup: snapshot.backup,
    });
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; message?: string };
    const message = err.message ?? "Ошибка резервного копирования";
    console.error(`[cron:backup-hint] ${message}`);

    writeCronRunStatus("backupHint", {
      ranAt,
      ok: false,
      message,
      details: {
        stdout: err.stdout?.slice(-2000),
        stderr: err.stderr?.slice(-1000),
      },
    });
    await logCronResult(CRON_ROUTE, {
      ok: false,
      ranAt,
      message,
      error,
      statusCode: 500,
      details: {
        stdout: err.stdout?.slice(-2000),
        stderr: err.stderr?.slice(-1000),
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error: message,
        stdout: err.stdout?.slice(-2000),
        stderr: err.stderr?.slice(-1000),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = authorizeCronRequest(request);
  if (!auth.ok) return auth.response;
  return runBackupHint();
}

/** Vercel Cron вызывает маршруты через GET — делегируем в ту же логику. */
export async function GET(request: Request) {
  const auth = authorizeCronRequest(request);
  if (!auth.ok) return auth.response;
  return runBackupHint();
}
