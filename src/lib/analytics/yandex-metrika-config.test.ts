import { describe, expect, it, vi } from "vitest";
import {
  getYandexMetrikaCounterId,
  isYandexMetrikaEnabled,
} from "./yandex-metrika-config";

describe("yandex-metrika-config", () => {
  it("reads counter id from env", () => {
    vi.stubEnv("NEXT_PUBLIC_YANDEX_METRIKA_ID", "110458660");
    expect(getYandexMetrikaCounterId()).toBe("110458660");
  });

  it("is enabled only in production with counter id", () => {
    vi.stubEnv("NEXT_PUBLIC_YANDEX_METRIKA_ID", "110458660");
    vi.stubEnv("NODE_ENV", "production");
    expect(isYandexMetrikaEnabled()).toBe(true);

    vi.stubEnv("NODE_ENV", "development");
    expect(isYandexMetrikaEnabled()).toBe(false);

    vi.stubEnv("NEXT_PUBLIC_YANDEX_METRIKA_ID", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(isYandexMetrikaEnabled()).toBe(false);
  });
});
