# AGENTS.md — «Пора в Аргентину»

Инструкции для AI-агентов (Cursor Agent, Background Agents, CLI).

## Точка входа (порядок чтения)

1. Конституция: `docs/project-governance/GOARGENTINA_MASTER_GOAL_V6_28.07.2026.md`
2. **Текущее состояние:** `docs/project-governance/CURRENT_STATE.md`
3. Модули: `docs/project-governance/module-lifecycle-registry.json` + `src/lib/modules/business-lifecycle.ts`
4. Команды: `docs/project-governance/GOLDEN_PATH.md`
5. Архитектура: `docs/ai-first/ARCHITECTURE.md` · `npm run architecture:check`
6. Доменные правила: `.cursor/rules/*`, `docs/integrations/*`

Исторический журнал: `docs/project-governance/PROJECT_STATE.md` (после баннера CURRENT).

## Постоянная конституция

Перед планированием или изменением продукта полностью прочитай
`docs/project-governance/GOARGENTINA_MASTER_GOAL_V6_28.07.2026.md`. Это главная
цель и конституция проекта. Актуальные факты — в `CURRENT_STATE.md`. Приоритеты и
риски: `MASTER_PLAN.md`, `ISSUE_LEDGER.csv`, `DECISION_LOG.md`, `RISK_REGISTER.md`,
`DEPENDENCY_GRAPH.md`.

## Профиль проекта

- **Продукт:** туристический портал + бронирование + контент (RU-first)
- **Стек:** Next.js 15, React 19, TypeScript, Tailwind 4, Supabase, Prisma (niche places), Vercel
- **Владелец:** UX/UI дизайнер — объясняй решения простым языком, без лишнего жаргона

## Обязательный порядок работы

1. **Анализ** — конституция → CURRENT_STATE → module lifecycle → связанные rules
2. **План** — сущности и кабинеты (см. `global-system-approach`)
3. **Реализация** — минимальный корректный diff
4. **Проверки** — `npm run audit:quick` или `npm run release:gate`
5. **Документация** — типы, тесты, `docs/integrations/` при смене партнёрских API

## Критичные правила (всегда)

| Файл | Тема |
|------|------|
| `.cursor/rules/global-system-approach.mdc` | Турист, организатор, CRM, оплата |
| `.cursor/rules/editorial-standard.mdc` | Русский контент, факт-checking |
| `.cursor/rules/partner-apis.mdc` | Tripster, Travelpayouts, YouTravel |
| `docs/integrations/tripster.md` | Checkout URL, prefilling, External Orders |

## Команды (golden path)

```bash
npm run dev
npm run audit:quick
npm run release:gate
npm run production-smoke
npm run architecture:check
npm run tripster:verify
npm run supabase:verify
```

Полный реестр: `docs/project-governance/COMMAND_REGISTRY.json` (`npm run commands:registry`).

## Не делать без явного запроса

- Коммиты и push
- Удаление файлов и миграций
- Изменение `.env` / секретов
- Force push на `main`
- Массовое форматирование

## Структура документации

- `docs/project-governance/CURRENT_STATE.md` — актуальные факты
- `docs/ai-first/` — хаб AI-first
- `docs/integrations/` — партнёрские API
- `docs/DEPLOY.md` — деплой
- `docs/audit/` — REFERENCE / HISTORICAL

## MCP и Skills

- **Supabase MCP** — схема, RLS, миграции
- **Browser MCP** — UI на localhost
- Skills: `supabase`, `supabase-postgres-best-practices`, `create-rule`, `review-bugbot`
