import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

export type CronAuthSource = "bearer" | "vercel";

function secureCompare(left: string, right: string): boolean {
  const leftBuf = Buffer.from(left, "utf8");
  const rightBuf = Buffer.from(right, "utf8");
  if (leftBuf.length !== rightBuf.length) return false;
  return timingSafeEqual(leftBuf, rightBuf);
}

function isVercelCronRequest(request: Request): boolean {
  if (request.headers.get("x-vercel-cron") === "1") return true;
  const cronToken = request.headers.get("x-vercel-cron-auth-token")?.trim();
  return Boolean(cronToken);
}

function parseBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization")?.trim();
  if (!authHeader?.toLowerCase().startsWith("bearer ")) return null;
  const token = authHeader.slice(7).trim();
  return token || null;
}

export function authorizeCronRequest(
  request: Request
): { ok: true; source: CronAuthSource } | { ok: false; response: NextResponse } {
  if (isVercelCronRequest(request)) {
    return { ok: true, source: "vercel" };
  }

  const secret = process.env.CRON_SECRET?.trim();
  const token = parseBearerToken(request);

  if (!secret || !token || !secureCompare(token, secret)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Не авторизовано" }, { status: 401 }),
    };
  }

  return { ok: true, source: "bearer" };
}
