import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FAVORITES_STORE_KEY } from "@/types/tourist";

vi.mock("@/lib/auth-mode", () => ({
  isSupabaseAuthEnabled: () => true,
}));

import {
  addFavorite,
  getUserFavorites,
  refreshRemoteFavorites,
} from "@/lib/favorites-store";

const USER_ID = "user-test-1";
const ACTOR = {
  id: USER_ID,
  role: "tourist" as const,
  roles: ["tourist" as const],
  firstName: "Test",
  lastName: "User",
  fullName: "Test User",
  phone: "+79990000000",
  email: "test@example.com",
  country: "RU",
  dateOfBirth: null,
  avatar: null,
  avatarUrl: null,
  createdAt: "2026-01-01T00:00:00.000Z",
};

function createStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
    clear: () => map.clear(),
  };
}

describe("favorites-store place sync", () => {
  const fetchSpy = vi.fn();
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    const storage = createStorage();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: storage,
    });
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        localStorage: storage,
        dispatchEvent: vi.fn(),
      },
    });
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: { onLine: true },
    });
    fetchSpy.mockReset();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("maps place favorites to remote items during refresh", async () => {
    const added = addFavorite(ACTOR, USER_ID, {
      tourId: "el-calafate",
      tourSlug: "el-calafate",
      tourTitle: "Эль-Калафате",
      tourImage: "",
      kind: "place",
      region: "Патагония",
    });
    expect(added).not.toHaveProperty("error");

    fetchSpy
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ favorites: [] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          favorites: [
            {
              tourId: "el-calafate",
              tourSlug: "el-calafate",
              tourTitle: "Эль-Калафате",
              tourImage: "",
              kind: "place",
              region: "Патагония",
              addedAt: "2026-06-01T00:00:00.000Z",
            },
          ],
        }),
      } as Response);

    const result = await refreshRemoteFavorites(ACTOR, USER_ID);
    expect(result).toEqual({ ok: true });

    const postCall = fetchSpy.mock.calls.find(([, init]) => init?.method === "POST");
    expect(postCall).toBeTruthy();
    expect(JSON.parse(String(postCall?.[1]?.body))).toEqual({
      items: [
        {
          itemType: "place",
          itemId: "el-calafate",
          itemSlug: "el-calafate",
        },
      ],
    });

    const favorites = getUserFavorites(USER_ID);
    expect(favorites).toHaveLength(1);
    expect(favorites[0]?.kind).toBe("place");
    expect(localStorage.getItem(FAVORITES_STORE_KEY)).toContain('"kind":"place"');
  });

  it("replaces local store with hydrated remote favorites including places", async () => {
    addFavorite(ACTOR, USER_ID, {
      tourId: "local-only",
      tourSlug: "local-only",
      tourTitle: "Local only",
      tourImage: "",
      kind: "place",
    });

    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({
        favorites: [
          {
            tourId: "server-place",
            tourSlug: "server-place",
            tourTitle: "Server place",
            tourImage: "/server.jpg",
            kind: "place",
            addedAt: "2026-06-02T00:00:00.000Z",
          },
        ],
      }),
    } as Response);

    await refreshRemoteFavorites(ACTOR, USER_ID);

    const favorites = getUserFavorites(USER_ID);
    expect(favorites).toHaveLength(1);
    expect(favorites[0]?.tourSlug).toBe("server-place");
  });
});
