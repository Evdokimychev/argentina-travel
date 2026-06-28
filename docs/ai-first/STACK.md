# STACK

## Runtime

| Tool | Version / note |
|------|----------------|
| Node.js | 22 (CI), локально ≥18.18 |
| npm | lockfile `package-lock.json` |
| Next.js | 15 App Router |
| React | 19 |
| TypeScript | strict |
| Tailwind CSS | 4 |

## Backend & data

| Tool | Использование |
|------|---------------|
| Supabase | Postgres, Auth, Storage, RLS, Realtime |
| Prisma | schema sync, seed, некоторые queries |
| PostgreSQL | primary database |

## Hosting & CI

| Tool | Использование |
|------|---------------|
| Vercel | production + preview |
| GitHub Actions | `.github/workflows/ci.yml` |
| GitHub CLI | `gh` для PR/issues |

## Testing

| Tool | Команда |
|------|---------|
| Vitest | `npm test` |
| Playwright | `npm run test:e2e` |
| Lighthouse | `npm run lighthouse:blog:ci` |

## Lint & quality

| Tool | Статус |
|------|--------|
| ESLint | `npm run lint` (Next.js config) |
| Prettier | **не настроен** — не добавлять без решения |
| Husky / lint-staged | опционально: `npm run setup:git-hooks` |

## Partner SDKs / APIs

- Tripster Experience API
- Travelpayouts
- YouTravel
- Sputnik8

## Cursor AI

| Capability | Расположение |
|------------|--------------|
| Project rules | `.cursor/rules/*.mdc` |
| Agent instructions | `AGENTS.md` |
| Ignore indexing | `.cursorignore` |
| Templates | `.cursor/templates/` |
| MCP Supabase | plugin-supabase |
| MCP Browser | cursor-ide-browser |

## CLI (рекомендуется установить)

```bash
# Supabase
brew install supabase/tap/supabase

# Vercel
npm i -g vercel

# GitHub
brew install gh
```

## Environment

- `.env.local` — локальные секреты (не коммитить)
- `.env.example` — шаблон переменных
- Vercel env — production/preview
