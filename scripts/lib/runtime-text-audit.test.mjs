import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { auditRuntimeText } from "./runtime-text-audit.mjs";

function fixture(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "runtime-text-audit-"));
  for (const [relativePath, source] of Object.entries(files)) {
    const target = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, source, "utf8");
  }
  return root;
}

test("blocks developer instructions in UI and raw configuration errors in public APIs", () => {
  const root = fixture({
    "src/components/admin/Panel.tsx": "export default function Panel(){return <p>run npm run audit</p>}",
    "src/app/api/example/route.ts": "return Response.json({error: 'Provider is not configured'})",
  });

  const findings = auditRuntimeText(root);
  assert.deepEqual(findings.map((item) => item.id).sort(), [
    "developer-command",
    "public-api-not-configured",
  ]);
});

test("ignores tests and private operational endpoints", () => {
  const root = fixture({
    "src/components/admin/Panel.test.tsx": "expect(copy).toContain('npm run audit')",
    "src/app/api/admin/check/route.ts": "return Response.json({error: 'Provider is not configured'})",
    "src/app/api/cron/check/route.ts": "throw new Error('API is not configured')",
  });

  assert.deepEqual(auditRuntimeText(root), []);
});
test("accepts owner-facing copy without implementation details", () => {
  const root = fixture({
    "src/components/admin/Panel.tsx": "export default function Panel(){return <p>Требуется проверка владельца</p>}",
    "src/locales/en/common.json": "{\"status\":\"Temporarily unavailable\"}",
    "src/app/api/example/route.ts": "return Response.json({code: 'BOOKING_UNAVAILABLE'})",
  });

  assert.deepEqual(auditRuntimeText(root), []);
});
