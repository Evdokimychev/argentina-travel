import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("map accessibility and location privacy", () => {
  const hub = readFileSync(
    join(process.cwd(), "src/components/map/ArgentinaMapFullscreenHub.tsx"),
    "utf8",
  );
  const canvas = readFileSync(
    join(process.cwd(), "src/components/map/ArgentinaMapLibreCanvasInner.tsx"),
    "utf8",
  );

  it("offers a keyboard-accessible list alternative", () => {
    expect(hub).toContain('aria-label="Объекты карты списком"');
    expect(hub).toContain('aria-label="Показать объекты списком"');
    expect(hub).toContain('aria-controls={listOpen ? "map-accessible-list" : undefined}');
  });

  it("explains location use before requesting browser permission", () => {
    expect(hub).toContain("Мы их не сохраняем и не отправляем в профиль");
    expect(hub).toContain("Можно отказаться и найти город через поиск вверху");
    expect(hub).toContain("onClick={requestCurrentLocation}");
    expect(canvas).not.toContain("GeolocateControl");
  });
});
