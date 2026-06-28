# AGENTS.md — «Пора в Аргентину»

Инструкции для AI-агентов (Cursor Agent, Background Agents, CLI).

## Профиль проекта

- **Продукт:** туристический портал + бронирование + контент (RU-first)
- **Стек:** Next.js 15, React 19, TypeScript, Tailwind 4, Supabase, Prisma, Vercel
- **Владелец:** UX/UI дизайнер — объясняй решения простым языком, без лишнего жаргона

## Обязательный порядок работы

1. **Анализ** — прочитай связанные файлы, `docs/ai-first/`, правила `.cursor/rules/`
2. **План** — для нетривиальных задач: что меняется, какие сущности затронуты (см. `global-system-approach`)
3. **Реализация** — минимальный корректный diff, существующие паттерны
4. **Проверки** — `npm run audit:quick` или полный `npm run audit`
5. **Документация** — обнови типы, тесты, `docs/integrations/` при изменении API партнёров

## Критичные правила (всегда)

| Файл | Тема |
|------|------|
| `.cursor/rules/global-system-approach.mdc` | Системный подход: турист, организатор, CRM, оплата |
| `.cursor/rules/editorial-standard.mdc` | Русский контент, факт-checking |
| `.cursor/rules/partner-apis.mdc` | Tripster, Travelpayouts, YouTravel — **читать перед правками** |
| `docs/integrations/tripster.md` | Checkout URL, prefilling, External Orders |

## Команды

```bash
npm run dev:clean      # dev после сбоя HMR
npm run audit          # полный локальный аудит
npm run audit:quick    # tsc + lint + unit tests
npm run production-smoke  # SMOKE_BASE_URL=https://www.goargentina.ru ...
npm run tripster:verify
npm run supabase:verify
npm run publish:verify:pre-deploy
```

## Не делать без явного запроса

- Коммиты и push
- Удаление файлов и миграций
- Изменение `.env` / секретов
- Force push на `main`
- Массовое форматирование (Prettier не настроен)

## Структура документации

- `docs/ai-first/` — хаб AI-first разработки
- `docs/integrations/` — партнёрские API
- `docs/DEPLOY.md` — деплой
- `docs/audit/` — UX/UI аудиты

## MCP и Skills

- **Supabase MCP** — схема, RLS, миграции
- **Browser MCP** — проверка UI на localhost
- Skills: `supabase`, `supabase-postgres-best-practices`, `create-rule`, `review-bugbot`
