import { afterEach, describe, expect, it, vi } from "vitest";
import {
  YANDEX_METRIKA_INIT_OPTIONS,
  YANDEX_METRIKA_LOADER_SNIPPET,
  YANDEX_METRIKA_TAG_JS,
  buildYandexMetrikaBootstrapScript,
  getConfiguredYandexMetrikaCounterId,
  hitYandexMetrikaPage,
  initYandexMetrika,
  parseYandexMetrikaCounterId,
  resolveYandexMetrikaPageUrl,
} from "./yandex-metrika";

type TestWindow = Window & {
  ym?: ReturnType<typeof vi.fn>;
  __goArgentinaYmInited?: boolean;
  location?: { origin: string };
};

function withWindow<T>(setup: (win: TestWindow) => void, run: () => T): T {
  const win = {
    location: { origin: "https://www.goargentina.ru" },
  } as TestWindow;
  setup(win);
  vi.stubGlobal("window", win);
  try {
    return run();
  } finally {
    vi.unstubAllGlobals();
  }
}

describe("yandex-metrika", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("parseYandexMetrikaCounterId accepts positive numeric ids", () => {
    expect(parseYandexMetrikaCounterId("110458660")).toBe(110458660);
    expect(parseYandexMetrikaCounterId("")).toBeNull();
    expect(parseYandexMetrikaCounterId("abc")).toBeNull();
    expect(parseYandexMetrikaCounterId("-1")).toBeNull();
  });

  it("getConfiguredYandexMetrikaCounterId reads env", () => {
    vi.stubEnv("NEXT_PUBLIC_YANDEX_METRIKA_ID", "110458660");
    expect(getConfiguredYandexMetrikaCounterId()).toBe(110458660);
  });

  it("YANDEX_METRIKA_INIT_OPTIONS follows official SPA defer pattern", () => {
    expect(YANDEX_METRIKA_INIT_OPTIONS).toMatchObject({
      defer: true,
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
    });
  });

  it("loader snippet references tag.js once", () => {
    expect(YANDEX_METRIKA_LOADER_SNIPPET).toContain(YANDEX_METRIKA_TAG_JS);
    expect(YANDEX_METRIKA_LOADER_SNIPPET).toContain("document.scripts");
  });

  it("buildYandexMetrikaBootstrapScript inlines loader, init and readiness flag", () => {
    const script = buildYandexMetrikaBootstrapScript(110458660);
    expect(script).toContain(YANDEX_METRIKA_TAG_JS);
    expect(script).toContain('ym(110458660,"init"');
    expect(script).toContain('"triggerEvent":true');
    expect(script).toContain("window.__goArgentinaYmInited=true");
  });

  it("initYandexMetrika calls ym init once and is idempotent", () => {
    withWindow(
      (win) => {
        win.ym = vi.fn();
      },
      () => {
        expect(initYandexMetrika(110458660)).toBe(true);
        expect(window.ym).toHaveBeenCalledOnce();
        expect(window.ym).toHaveBeenCalledWith(110458660, "init", YANDEX_METRIKA_INIT_OPTIONS);

        expect(initYandexMetrika(110458660)).toBe(true);
        expect(window.ym).toHaveBeenCalledOnce();
      },
    );
  });

  it("initYandexMetrika waits for ym stub", () => {
    withWindow(
      () => {},
      () => {
        expect(initYandexMetrika(110458660)).toBe(false);
      },
    );
  });

  it("hitYandexMetrikaPage sends url, title and referer", () => {
    withWindow(
      (win) => {
        win.ym = vi.fn();
      },
      () => {
        hitYandexMetrikaPage(110458660, "https://www.goargentina.ru/tours", {
          title: "Tours",
          referer: "https://www.goargentina.ru/",
        });

        expect(window.ym).toHaveBeenCalledWith(110458660, "hit", "https://www.goargentina.ru/tours", {
          title: "Tours",
          referer: "https://www.goargentina.ru/",
        });
      },
    );
  });

  it("resolveYandexMetrikaPageUrl builds absolute url", () => {
    withWindow(
      () => {},
      () => {
        expect(resolveYandexMetrikaPageUrl("/tours", "q=patagonia")).toBe(
          "https://www.goargentina.ru/tours?q=patagonia",
        );
        expect(resolveYandexMetrikaPageUrl("/blog", "")).toBe("https://www.goargentina.ru/blog");
      },
    );
  });
});
