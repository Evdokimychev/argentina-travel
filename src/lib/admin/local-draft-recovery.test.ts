import { describe, expect, it } from "vitest";
import {
  buildSessionDraftKey,
  prepareLocalRecoveryDraft,
  readSessionDraft,
  writeSessionDraft,
} from "@/lib/admin/local-draft-recovery";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    values,
  };
}

describe("local CMS draft recovery", () => {
  it("removes known identity fields before using session storage", () => {
    expect(
      prepareLocalRecoveryDraft({
        title: "Патагония",
        authorName: "Private Person",
        body: { email: "private@example.com", text: "Безопасный текст" },
      }),
    ).toEqual({ title: "Патагония", body: { text: "Безопасный текст" } });
  });

  it("fails closed for credentials and contact details in editable text", () => {
    expect(prepareLocalRecoveryDraft({ body: "token=very-secret-value" })).toBeNull();
    expect(prepareLocalRecoveryDraft({ body: "Позвоните +54 11 5555 1234" })).toBeNull();
  });

  it("round-trips only a valid versioned draft and invalidates malformed data", () => {
    const storage = memoryStorage();
    const key = buildSessionDraftKey("knowledge:patagonia:ru");
    expect(
      writeSessionDraft(storage, key, {
        version: 1,
        savedAt: "2026-07-17T10:00:00.000Z",
        serverUpdatedAt: "2026-07-17T09:00:00.000Z",
        draft: { title: "Патагония" },
      }),
    ).toBe(true);
    expect(readSessionDraft<{ title: string }>(storage, key)?.draft.title).toBe("Патагония");

    storage.setItem(key, "not-json");
    expect(readSessionDraft(storage, key)).toBeNull();
    expect(storage.values.has(key)).toBe(false);
  });
});
