# Golden developer / agent path

Use these first — do not scan all 177 npm scripts.

```bash
npm run dev              # local app
npm run audit:quick      # tsc + lint + unit (fast confidence)
npm run release:gate     # full release matrix (same evidence as CI verify core)
npm run production-smoke # against SMOKE_BASE_URL / production
```

Domain deep-dives stay available as `npm run quality:<group>` (aliases into `release:gate --group`).

Generated: 2026-08-18T00:39:50.313Z
