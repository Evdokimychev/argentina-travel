# DEPLOYMENT

## Production

- **Host:** Vercel
- **URL:** https://www.goargentina.ru
- **Branch:** `main` → auto deploy

## Pre-deploy checklist

```bash
npm run publish:verify:pre-deploy
```

Включает: tsc, lint, tests, build, migration meta, CMS checks.

## Post-deploy smoke

```bash
SMOKE_BASE_URL=https://www.goargentina.ru npm run production-smoke
```

## CI/CD

GitHub Actions: `.github/workflows/ci.yml`

| Step | Command |
|------|---------|
| Typecheck | `npx tsc --noEmit` |
| Lint | `npm run lint` |
| Unit tests | `npm test` |
| RLS audit | `node scripts/rls-audit.mjs` |
| Build | `npm run build` |
| Lighthouse | blog CWV sample |
| E2E UX audit | `npm run test:e2e:ux-audit` |

## Environment

- Vercel dashboard — production + preview env vars
- Локально: `.env.local` (gitignored)
- Шаблон: `.env.example`

## Rollback

1. Vercel → Deployments → previous deployment → Promote
2. Или revert commit on `main` and push

## Preview deployments

- Каждый PR / branch push → Vercel preview URL
- Использовать для UX review перед merge

## Detailed runbooks

- [DEPLOY.md](../DEPLOY.md)
- [production-launch-runbook.md](../production-launch-runbook.md)
- [production-cutover-e81.md](../production-cutover-e81.md)

## Monitoring (planned)

- Error tracking — см. [observability-e90.md](../observability-e90.md)
- Lighthouse CI on blog paths
- `npm run project:readiness` — readiness score
