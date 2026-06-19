import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { authorizeCronRequest } from "@/lib/cron/authorize-cron";
import { logCronResult } from "@/lib/cron/log-cron-result";

const execFileAsync = promisify(execFile);
const CRON_ROUTE = "/api/cron/sputnik8-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv && vercelEnv !== "production") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const auth = authorizeCronRequest(request);
  if (!auth.ok) return auth.response;
  const startedAt = Date.now();
  const ranAt = new Date().toISOString();

  const root = process.cwd();
  const scriptPath = path.join(root, "scripts/sputnik8-sync.mjs");

  try {
    const { stdout, stderr } = await execFileAsync(process.execPath, [scriptPath], {
      cwd: root,
      env: {
        ...process.env,
        SPUTNIK8_SKIP_AFFILIATE_LINKS: "true",
      },
      maxBuffer: 10 * 1024 * 1024,
    });

    await logCronResult(CRON_ROUTE, {
      ok: true,
      ranAt,
      message: "Sputnik8 sync completed",
      statusCode: 200,
      durationMs: Date.now() - startedAt,
      details: {
        stdoutTail: stdout.slice(-1000),
        stderrTail: stderr.slice(-800),
      },
    });

    return NextResponse.json({
      ok: true,
      stdout: stdout.slice(-4000),
      stderr: stderr.slice(-2000),
    });
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; message?: string };
    await logCronResult(CRON_ROUTE, {
      ok: false,
      ranAt,
      message: err.message ?? "Sync failed",
      error,
      statusCode: 500,
      durationMs: Date.now() - startedAt,
      details: {
        stdout: err.stdout?.slice(-4000),
        stderr: err.stderr?.slice(-2000),
      },
    });
    return NextResponse.json(
      {
        ok: false,
        error: err.message ?? "Sync failed",
        stdout: err.stdout?.slice(-4000),
        stderr: err.stderr?.slice(-2000),
      },
      { status: 500 }
    );
  }
}
