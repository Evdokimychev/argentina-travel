export function resolveYouTravelEmail() {
  return process.env.YOUTRAVEL_API_EMAIL?.trim().toLowerCase() || null;
}

export function resolveYouTravelPassword() {
  return process.env.YOUTRAVEL_API_PASSWORD?.trim() || null;
}

export function resolveYouTravelApiKey() {
  return process.env.YOUTRAVEL_API_KEY?.trim() || null;
}

export function getYouTravelAuthAttempts() {
  const configured = process.env.YOUTRAVEL_AUTH_MODE?.trim();
  if (configured) {
    return [{ mode: configured, label: configured }];
  }

  const attempts = [];
  if (resolveYouTravelPassword()) {
    attempts.push({ mode: "basic_password", label: "basic (email + password)" });
  }
  if (resolveYouTravelApiKey()) {
    attempts.push({ mode: "basic_api_key", label: "basic (email + api key)" });
    attempts.push({ mode: "bearer_api_key", label: "bearer (api key)" });
  }
  return attempts;
}

export function buildYouTravelAuthHeader(mode, email, password, apiKey) {
  const secret =
    mode === "basic_api_key" || mode === "bearer_api_key"
      ? apiKey || password
      : password || apiKey;

  if (mode === "bearer_api_key") {
    return { Authorization: `Bearer ${secret}` };
  }

  const token = Buffer.from(`${email}:${secret}`, "utf8").toString("base64");
  return { Authorization: `Basic ${token}` };
}

export async function resolveYouTravelAuthHeaders(apiBase) {
  const email = resolveYouTravelEmail();
  const password = resolveYouTravelPassword();
  const apiKey = resolveYouTravelApiKey();

  if (!email || (!password && !apiKey)) {
    throw new Error("Set YOUTRAVEL_API_EMAIL and credentials in .env.local");
  }

  const { fetchSerpPage } = await import("./youtravel-api.mjs");
  const attempts = getYouTravelAuthAttempts();
  let lastStatus = null;

  for (const attempt of attempts) {
    const headers = buildYouTravelAuthHeader(attempt.mode, email, password, apiKey);
    try {
      const { items } = await fetchSerpPage(apiBase, headers, { take: 1, skip: 0 });
      lastStatus = 200;
      if (items.length >= 0) {
        return { headers, mode: attempt.mode };
      }
    } catch (error) {
      lastStatus = Number.parseInt(String(error.message).match(/\((\d+)\)/)?.[1] ?? "", 10) || null;
    }
  }

  throw new Error(`YouTravel auth failed (last status ${lastStatus ?? "unknown"})`);
}
