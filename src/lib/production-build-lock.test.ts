import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("production build lock", () => {
  it("prevents dev from mutating .next while a build is active", () => {
    const build = readFileSync(join(process.cwd(), "scripts/build.mjs"), "utf8");
    const dev = readFileSync(join(process.cwd(), "scripts/dev.mjs"), "utf8");
    const start = readFileSync(join(process.cwd(), "scripts/start.mjs"), "utf8");

    expect(build).toContain("writeProductionBuildLock(root)");
    expect(build).toContain('process.on("exit", cleanupBuildLock)');
    expect(dev.indexOf("readProductionBuildLock(root)")).toBeLessThan(
      dev.indexOf("killProjectNextDev(root)")
    );
    expect(dev).toContain("dev start skipped");
    expect(start).toContain("writeProductionBuildLock(root)");
    expect(start).toContain('spawn("npx", ["next", "start"');
    expect(start).toContain("PRODUCTION_LOCK_OWNER_PID");
    expect(start).toContain('process.env.CI ? ".next" : ".next-production"');
    expect(build).toContain("usesInheritedLock");
  });
});
