import type { WaitlistEntry, WaitlistStatus } from "@/types/waitlist";

async function parseJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? `Request failed (${response.status})`);
  return body;
}

export async function apiFetchOrganizerWaitlist(): Promise<WaitlistEntry[]> {
  const data = await parseJson<{ entries: WaitlistEntry[] }>(
    await fetch("/api/organizer/waitlist", { cache: "no-store" })
  );
  return data.entries;
}

export async function apiFetchOrganizerWaitlistEntry(id: string): Promise<WaitlistEntry | null> {
  const response = await fetch(`/api/organizer/waitlist/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (response.status === 404) return null;
  const data = await parseJson<{ entry: WaitlistEntry }>(response);
  return data.entry;
}

export async function apiUpdateOrganizerWaitlistStatus(
  id: string,
  status: WaitlistStatus
): Promise<WaitlistEntry> {
  const data = await parseJson<{ entry: WaitlistEntry }>(
    await fetch(`/api/organizer/waitlist/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_status", status }),
    })
  );
  return data.entry;
}

export async function apiAddOrganizerWaitlistComment(
  id: string,
  text: string
): Promise<WaitlistEntry> {
  const data = await parseJson<{ entry: WaitlistEntry }>(
    await fetch(`/api/organizer/waitlist/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add_comment", text }),
    })
  );
  return data.entry;
}
