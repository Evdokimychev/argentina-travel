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

  const attempts = getYouTravelAuthAttempts();
  let lastStatus = null;

  for (const attempt of attempts) {
    const headers = buildYouTravelAuthHeader(attempt.mode, email, password, apiKey);
    const response = await fetch(`${apiBase}/v1/tours?take=1`, {
      headers: { ...headers, Accept: "application/json" },
    });
    const body = await response.json().catch(() => null);
    const items = Array.isArray(body) ? body : body?.data ?? [];
    lastStatus = response.status;

    if (response.ok && !(body?.success === false && !items.length)) {
      return { headers, mode: attempt.mode };
    }
  }

  throw new Error(`YouTravel auth failed (last status ${lastStatus})`);
}
