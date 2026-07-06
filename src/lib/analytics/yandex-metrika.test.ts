import { afterEach, describe, expect, it, vi } from "vitest";
import {
  YANDEX_METRIKA_INIT_OPTIONS,
  YANDEX_METRIKA_LOADER_SNIPPET,
  YANDEX_METRIKA_TAG_JS,
  buildYandexMetrikaBootstrapScript,
  buildYandexMetrikaFirstHitScript,
  getConfiguredYandexMetrikaCounterId,
  getYandexMetrikaReadyEventName,
  hitYandexMetrikaPage,
  initYandexMetrika,
  isYandexMetrikaCounterReady,
  parseYandexMetrikaCounterId,
  resolveYandexMetrikaPageUrl,
  waitForYandexMetrikaReady,
} from "./yandex-metrika";

type TestWindow = Window & {
  ym?: ReturnType<typeof vi.fn>;
  __goArgentinaYmInited?: boolean;
  __goArgentinaYmFirstHitSent?: boolean;
  yaCounter110458660?: object;
  location?: { origin: string };
};

function withWindow<T>(setup: (win: TestWindow) => void, run: () => T): T {
  const win = {
    location: { origin: "https://www.goargentina.ru" },
    setInterval: (...args: Parameters<typeof setInterval>) => setInterval(...args),
    clearInterval: (...args: Parameters<typeof clearInterval>) => clearInterval(...args),
    setTimeout: (...args: Parameters<typeof setTimeout>) => setTimeout(...args),
    clearTimeout: (...args: Parameters<typeof clearTimeout>) => clearTimeout(...args),
  } as unknown as TestWindow;
  setup(win);
  vi.stubGlobal("window", win);
  vi.stubGlobal("document", {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  });
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
    vi.useRealTimers();
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
      triggerEvent: true,
    });
  });

  it("loader snippet references tag.js once", () => {
    expect(YANDEX_METRIKA_LOADER_SNIPPET).toContain(YANDEX_METRIKA_TAG_JS);
    expect(YANDEX_METRIKA_LOADER_SNIPPET).toContain("document.scripts");
  });

  it("buildYandexMetrikaFirstHitScript waits for yacounter inited event", () => {
    const script = buildYandexMetrikaFirstHitScript(110458660);
    expect(script).toContain('"yacounter"+id+"inited"');
    expect(script).toContain("__goArgentinaYmFirstHitSent");
    expect(script).toContain('ym(id,"hit"');
  });

  it("buildYandexMetrikaBootstrapScript inlines loader, init and first-hit fallback", () => {
    const script = buildYandexMetrikaBootstrapScript(110458660);
    expect(script).toContain(YANDEX_METRIKA_TAG_JS);
    expect(script).toContain('ym(110458660,"init"');
    expect(script).toContain('"triggerEvent":true');
    expect(script).toContain('"yacounter"+id+"inited"');
    expect(script).not.toContain("__goArgentinaYmInited=true");
  });

  it("getYandexMetrikaReadyEventName follows Yandex convention", () => {
    expect(getYandexMetrikaReadyEventName(110458660)).toBe("yacounter110458660inited");
  });

  it("isYandexMetrikaCounterReady checks yaCounter instance", () => {
    withWindow(
      (win) => {
        win.ym = vi.fn();
        win.yaCounter110458660 = {};
      },
      () => {
        expect(isYandexMetrikaCounterReady(110458660)).toBe(true);
      },
    );
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

  it("waitForYandexMetrikaReady resolves immediately when yaCounter exists", async () => {
    const win = {
      ym: vi.fn(),
      yaCounter110458660: {},
      setInterval: (...args: Parameters<typeof setInterval>) => setInterval(...args),
      clearInterval: (...args: Parameters<typeof clearInterval>) => clearInterval(...args),
      setTimeout: (...args: Parameters<typeof setTimeout>) => setTimeout(...args),
      clearTimeout: (...args: Parameters<typeof clearTimeout>) => clearTimeout(...args),
    };
    vi.stubGlobal("window", win);
    vi.stubGlobal("document", { addEventListener: vi.fn(), removeEventListener: vi.fn() });

    await expect(waitForYandexMetrikaReady(110458660)).resolves.toBe(true);
  });

  it("waitForYandexMetrikaReady resolves on yacounter inited event", async () => {
    const handlers = new Map<string, () => void>();
    const win = {
      ym: vi.fn(),
      setInterval: (...args: Parameters<typeof setInterval>) => setInterval(...args),
      clearInterval: (...args: Parameters<typeof clearInterval>) => clearInterval(...args),
      setTimeout: (...args: Parameters<typeof setTimeout>) => setTimeout(...args),
      clearTimeout: (...args: Parameters<typeof clearTimeout>) => clearTimeout(...args),
    };

    vi.stubGlobal("window", win);
    vi.stubGlobal("document", {
      addEventListener: vi.fn((event: string, handler: () => void) => {
        handlers.set(event, handler);
      }),
      removeEventListener: vi.fn(),
    });

    const promise = waitForYandexMetrikaReady(110458660, 5000);
    handlers.get(getYandexMetrikaReadyEventName(110458660))?.();
    await expect(promise).resolves.toBe(true);
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
