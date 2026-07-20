import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { Agent } from "undici";
import type { IngestionSourceRecord } from "@/types/ingestion";

const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;
const robotsCache = new Map<string, { expiresAt: number; disallowed: string[] }>();

function isPrivateAddress(address: string): boolean {
  if (address === "::1" || address === "0.0.0.0") return true;
  if (address.startsWith("fc") || address.startsWith("fd") || address.startsWith("fe80:")) return true;
  const parts = address.split(".").map(Number);
  if (parts.length !== 4) return false;
  return parts[0] === 10 || parts[0] === 127 || parts[0] === 0 ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168) ||
    (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127);
}

async function publicAddresses(hostname: string) {
  const addresses = isIP(hostname)
    ? [{ address: hostname, family: isIP(hostname) }]
    : await lookup(hostname, { all: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) throw new Error("PRIVATE_ADDRESS_FORBIDDEN");
  return addresses;
}

export async function validateExternalUrl(rawUrl: string, source?: IngestionSourceRecord): Promise<URL> {
  const url = new URL(rawUrl);
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("UNSUPPORTED_URL_PROTOCOL");
  if (url.username || url.password) throw new Error("URL_CREDENTIALS_FORBIDDEN");
  if (url.hostname === "localhost" || url.hostname.endsWith(".local")) throw new Error("LOCAL_ADDRESS_FORBIDDEN");
  await publicAddresses(url.hostname);
  const allowed = source?.connectionConfig.allowedPaths ?? [];
  const blocked = source?.connectionConfig.blockedPaths ?? [];
  if (allowed.length && !allowed.some((path) => url.pathname.startsWith(path))) throw new Error("PATH_NOT_ALLOWED");
  if (blocked.some((path) => url.pathname.startsWith(path))) throw new Error("PATH_BLOCKED");
  return url;
}

export async function safeFetchText(
  rawUrl: string,
  source?: IngestionSourceRecord,
  init: RequestInit = {},
): Promise<{ text: string; url: string; contentType: string }> {
  let current = await validateExternalUrl(rawUrl, source);
  for (let redirects = 0; redirects <= 4; redirects += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), (source?.timeoutSeconds ?? 30) * 1000);
    const [pinned] = await publicAddresses(current.hostname);
    const dispatcher = new Agent({ connect: { lookup: (_hostname, _options, callback) => callback(null, pinned.address, pinned.family) } });
    try {
      const response = await fetch(current, {
        ...init,
        redirect: "manual",
        signal: controller.signal,
        headers: { "user-agent": "ArgentinaTravelKnowledgeBot/1.0 (+https://www.goargentina.ru)", ...init.headers },
        dispatcher,
      } as RequestInit);
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) throw new Error(`HTTP_${response.status}`);
        current = await validateExternalUrl(new URL(location, current).toString(), source);
        continue;
      }
      if (!response.ok) throw new Error(`HTTP_${response.status}`);
      const length = Number(response.headers.get("content-length") ?? 0);
      if (length > MAX_RESPONSE_BYTES) throw new Error("RESPONSE_TOO_LARGE");
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.byteLength > MAX_RESPONSE_BYTES) throw new Error("RESPONSE_TOO_LARGE");
      return {
        text: new TextDecoder().decode(bytes),
        url: response.url || current.toString(),
        contentType: response.headers.get("content-type") ?? "",
      };
    } finally {
      clearTimeout(timer);
      await dispatcher.close();
    }
  }
  throw new Error("TOO_MANY_REDIRECTS");
}

export async function assertRobotsAllowed(rawUrl: string, source: IngestionSourceRecord): Promise<void> {
  const url = await validateExternalUrl(rawUrl, source);
  const origin = url.origin;
  let rules = robotsCache.get(origin);
  if (!rules || rules.expiresAt < Date.now()) {
    try {
      const robotsSource = { ...source, connectionConfig: { ...source.connectionConfig, allowedPaths: [], blockedPaths: [] } };
      const response = await safeFetchText(`${origin}/robots.txt`, robotsSource);
      let applies = false; const disallowed: string[] = [];
      for (const rawLine of response.text.split("\n")) {
        const line = rawLine.split("#")[0].trim(); const [name, ...parts] = line.split(":"); const value = parts.join(":").trim();
        if (name.toLowerCase() === "user-agent") applies = value === "*" || value.toLowerCase().includes("argentinatravelknowledgebot");
        if (applies && name.toLowerCase() === "disallow" && value) disallowed.push(value);
      }
      rules = { expiresAt: Date.now() + 3_600_000, disallowed }; robotsCache.set(origin, rules);
    } catch { rules = { expiresAt: Date.now() + 300_000, disallowed: [] }; }
  }
  if (rules.disallowed.some((path) => path === "/" || url.pathname.startsWith(path))) throw new Error("ROBOTS_PATH_DISALLOWED");
}

export async function respectSourceRateLimit(source: IngestionSourceRecord): Promise<void> {
  const delay = Math.ceil(60_000 / Math.max(1, source.rateLimitPerMinute));
  if (delay > 0) await new Promise((resolve) => setTimeout(resolve, Math.min(delay, 5_000)));
}
