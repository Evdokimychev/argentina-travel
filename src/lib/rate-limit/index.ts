import { NextResponse } from "next/server";

type RateLimitBucket = { hits: number[] };

type UpstashEvalResponse = {
  result?: unknown;
  error?: string;
};

const DEFAULT_RATE_LIMIT_MESSAGE = "Слишком много запросов. Попробуйте позже.";
const inMemoryBuckets = new Map<string, RateLimitBucket>();

let hasLoggedUpstashError = false;

type RateLimitSuccess = {
  ok: true;
};

type RateLimitFailure = {
  ok: false;
  retryAfterSec: number;
};

export type RateLimitResult = RateLimitSuccess | RateLimitFailure;

type RateLimitedHandler = (request: Request, ...args: unknown[]) => Response | Promise<Response>;

type RateLimitKeyResolver = (request: Request, ...args: unknown[]) => string | Promise<string>;

export type WithRateLimitOptions = {
  limit: number;
  window: number;
  key?: string | RateLimitKeyResolver;
  keyPrefix?: string;
  message?: string;
};

function sanitizeLimitValue(input: number, fallback: number): number {
  if (!Number.isFinite(input)) return fallback;
  const rounded = Math.floor(input);
  return rounded > 0 ? rounded : fallback;
}

function checkRateLimitInMemory(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;
  const bucket = inMemoryBuckets.get(key) ?? { hits: [] };

  bucket.hits = bucket.hits.filter((timestamp) => timestamp > windowStart);

  if (bucket.hits.length >= limit) {
    const oldestHit = bucket.hits[0] ?? now;
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((oldestHit + windowMs - now) / 1000)),
    };
  }

  bucket.hits.push(now);
  inMemoryBuckets.set(key, bucket);
  return { ok: true };
}

async function evaluateUpstashSlidingWindow(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!upstashUrl) {
    return checkRateLimitInMemory(key, limit, windowMs);
  }

  const now = Date.now();
  const redisKey = `ratelimit:${key}`;
  const member = `${now}:${crypto.randomUUID()}`;
  const script = `
local redisKey = KEYS[1]
local nowMs = tonumber(ARGV[1])
local windowMs = tonumber(ARGV[2])
local maxHits = tonumber(ARGV[3])
local member = ARGV[4]
local windowStart = nowMs - windowMs

redis.call("ZREMRANGEBYSCORE", redisKey, "-inf", windowStart)
local currentHits = redis.call("ZCARD", redisKey)
if currentHits >= maxHits then
  local oldest = redis.call("ZRANGE", redisKey, 0, 0, "WITHSCORES")
  local oldestMs = nowMs
  if oldest[2] then
    oldestMs = tonumber(oldest[2])
  end
  return {0, oldestMs}
end

redis.call("ZADD", redisKey, nowMs, member)
redis.call("PEXPIRE", redisKey, windowMs)
return {1, 0}
`.trim();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (upstashToken) {
    headers.Authorization = `Bearer ${upstashToken}`;
  }

  const response = await fetch(`${upstashUrl}/eval`, {
    method: "POST",
    headers,
    body: JSON.stringify([script, 1, redisKey, now, windowMs, limit, member]),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Upstash returned HTTP ${response.status}`);
  }

  const payload = (await response.json()) as UpstashEvalResponse;
  if (payload.error) {
    throw new Error(payload.error);
  }

  if (!Array.isArray(payload.result)) {
    throw new Error("Unexpected Upstash eval result");
  }

  const allowed = Number(payload.result[0] ?? 0) === 1;
  if (allowed) {
    return { ok: true };
  }

  const oldestHitMs = Number(payload.result[1] ?? now);
  return {
    ok: false,
    retryAfterSec: Math.max(1, Math.ceil((oldestHitMs + windowMs - now) / 1000)),
  };
}

/**
 * Sliding-window limiter backed by Upstash Redis REST API when configured.
 * Falls back to process in-memory limits when UPSTASH_REDIS_REST_URL is not set
 * or when Redis is temporarily unavailable.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const safeLimit = sanitizeLimitValue(limit, 1);
  const safeWindow = sanitizeLimitValue(windowMs, 60_000);

  try {
    return await evaluateUpstashSlidingWindow(key, safeLimit, safeWindow);
  } catch (error) {
    if (!hasLoggedUpstashError) {
      hasLoggedUpstashError = true;
      console.error("[rate-limit] Upstash unavailable, using in-memory fallback.", error);
    }
    return checkRateLimitInMemory(key, safeLimit, safeWindow);
  }
}

export function rateLimitErrorResponse(retryAfterSec: number, message = DEFAULT_RATE_LIMIT_MESSAGE) {
  return NextResponse.json(
    { error: message },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.max(1, Math.floor(retryAfterSec))),
      },
    }
  );
}

function buildDefaultRateLimitKey(request: Request) {
  let pathname = "unknown";
  try {
    pathname = new URL(request.url).pathname;
  } catch {
    pathname = "unknown";
  }
  return `${request.method}:${pathname}:ip:${getClientIp(request)}`;
}

async function resolveRateLimitKey(
  request: Request,
  options: WithRateLimitOptions,
  args: unknown[]
): Promise<string> {
  const configuredKey = options.key;
  const keyValue =
    typeof configuredKey === "function"
      ? await configuredKey(request, ...args)
      : configuredKey ?? buildDefaultRateLimitKey(request);
  const prefix = options.keyPrefix?.trim();
  return prefix ? `${prefix}:${keyValue}` : keyValue;
}

/**
 * Route handler wrapper for Next.js route handlers.
 * `window` is in milliseconds.
 */
export function withRateLimit<T extends RateLimitedHandler>(
  handler: T,
  options: WithRateLimitOptions
): T {
  return (async (request: Request, ...args: unknown[]) => {
    const key = await resolveRateLimitKey(request, options, args);
    const check = await checkRateLimit(key, options.limit, options.window);
    if (check.ok === false) {
      return rateLimitErrorResponse(check.retryAfterSec, options.message);
    }
    return handler(request, ...args);
  }) as T;
}

export function getClientIp(request: Request): string {
  const cfConnectingIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cfConnectingIp) return cfConnectingIp;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  return realIp || "unknown";
}
