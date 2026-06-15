import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const execFileAsync = promisify(execFile);

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv && vercelEnv !== "production") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const secret = process.env.CRON_SECRET?.trim();
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!secret || token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

    return NextResponse.json({
      ok: true,
      stdout: stdout.slice(-4000),
      stderr: stderr.slice(-2000),
    });
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; message?: string };
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
