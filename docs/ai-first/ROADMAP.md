# ROADMAP — среда разработки и продукт

## Фаза 1 — AI-first foundation ✅ (текущая)

- [x] `AGENTS.md`, `.cursor/rules/` (workflow, quality, supabase)
- [x] `docs/ai-first/` хаб
- [x] `.cursorignore` для индексации
- [x] `npm run audit*` команды
- [x] Шаблоны в `.cursor/templates/`
- [ ] Git hooks (опционально): `npm run setup:git-hooks`

## Фаза 2 — Git & CI hardening

- [ ] Branch protection на `main` (GitHub: require CI, no force push)
- [ ] Conventional Commits в CONTRIBUTING.md
- [ ] Pre-commit: tsc + lint на staged files (без Prettier)
- [ ] Dependabot / npm audit в CI

## Фаза 3 — Testing expansion

- [ ] Playwright browsers в CI (уже частично через ux-audit)
- [ ] Visual regression baseline
- [ ] a11y automated checks (axe в Playwright)
- [ ] Partner booking e2e (Tripster URL invariants)

## Фаза 4 — Observability

- [ ] Error tracking (Sentry или аналог)
- [ ] Structured logging на API routes
- [ ] Uptime monitoring production

## Фаза 5 — Supabase maturity

- [ ] Typed generated types sync
- [ ] Seed data для всех feature areas
- [ ] Policy documentation per table

## Продуктовый roadmap (ссылки)

- [BLOG_UX_ROADMAP.md](../BLOG_UX_ROADMAP.md)
- [blog-quality-roadmap.md](../blog-quality-roadmap.md)
- [youtravel-integration-sprints.md](../youtravel-integration-sprints.md)
- [production-launch-runbook.md](../production-launch-runbook.md)

## Приоритеты Q3 2026

1. Стабильность partner booking (Tripster date/time, YouTravel checkout)
2. Performance maps + gallery на mobile
3. CMS cutover и контент-план
4. Organizer cabinet polish
