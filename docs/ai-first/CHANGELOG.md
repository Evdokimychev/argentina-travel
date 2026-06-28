# CHANGELOG — AI-first development environment

Формат based on Keep a Changelog. Только изменения **инфраструктуры разработки**, не продуктовые фичи.

## [2026-06-27] — AI-first setup

### Added

- `AGENTS.md` — инструкции для AI-агентов
- `.cursorignore` — оптимизация индексации Cursor
- `.cursor/rules/ai-development-workflow.mdc`
- `.cursor/rules/quality-gates.mdc`
- `.cursor/rules/supabase-development.mdc`
- `docs/ai-first/` — документационный хаб (PROJECT, ARCHITECTURE, STACK, …)
- `.cursor/templates/` — шаблоны для новых файлов
- `scripts/audit.mjs` + npm scripts `audit`, `audit:quick`, `audit:*`
- `scripts/setup-git-hooks.mjs` — опциональные git hooks
- `.vscode/settings.json`, `.vscode/extensions.json`

### Existing (не изменено)

- ESLint via Next.js (Prettier не добавлен)
- CI: GitHub Actions full pipeline
- Husky не установлен — hooks через setup script

### Requires manual action

- [ ] `npm run setup:git-hooks` локально
- [ ] GitHub branch protection on `main`
- [ ] `npx playwright install` для local e2e
