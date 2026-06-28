# TESTING

## Pyramid

```
        E2E (Playwright)
       /                \
  Integration (API verify scripts)
 /                              \
Unit (Vitest)
```

## Unit tests — Vitest

```bash
npm test                  # all
npm run test:watch        # watch mode
vitest run path/to.test.ts  # single file
```

Расположение: рядом с кодом `*.test.ts` или `src/**/*.test.ts`

## E2E — Playwright

```bash
npx playwright install    # first time
npm run test:e2e
npm run test:e2e:smoke
npm run test:e2e:visual
npm run test:e2e:ux-audit
```

Config: `playwright.config.ts`, `playwright.ux-audit.config.ts`

## Partner regression

```bash
npm run test:partner-regression
```

## Integration verify scripts

| Script | Purpose |
|--------|---------|
| `npm run tripster:verify` | Tripster API connectivity |
| `npm run youtravel:verify` | YouTravel API |
| `npm run supabase:verify` | DB schema integrity |
| `npm run production-smoke` | Production HTTP smoke |

## CI

All unit tests + build in `.github/workflows/ci.yml`
E2E UX audit — continue-on-error (expand later)

## Coverage

Vitest coverage not configured by default. To add:

```bash
# future: vitest --coverage
```

## Accessibility

- Lighthouse a11y category in CI (blog sample)
- Manual: keyboard nav, screen reader spot checks
- Future: axe-core in Playwright

## Visual regression

`npm run test:e2e:visual` — baseline TBD

## Writing new tests

Шаблон: [.cursor/templates/test.md](../../.cursor/templates/test.md)

## Pre-release

```bash
npm run audit
npm run publish:verify:pre-deploy
SMOKE_BASE_URL=https://www.goargentina.ru npm run production-smoke
```
