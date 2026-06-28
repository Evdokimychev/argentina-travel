# AI-first хаб — «Пора в Аргентину»

Единая точка входа для разработки с Cursor AI.

## Документы

| Документ | Назначение |
|----------|------------|
| [PROJECT.md](./PROJECT.md) | О проекте, цели, аудитория |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Архитектура и слои |
| [STACK.md](./STACK.md) | Стек и инструменты |
| [ROADMAP.md](./ROADMAP.md) | Roadmap среды и продукта |
| [TASKS.md](./TASKS.md) | Текущие задачи |
| [AI_RULES.md](./AI_RULES.md) | Правила для AI |
| [PROMPTS.md](./PROMPTS.md) | Готовые промпты |
| [DECISIONS.md](./DECISIONS.md) | Архитектурные решения |
| [API.md](./API.md) | API и интеграции |
| [DATABASE.md](./DATABASE.md) | БД, миграции, RLS |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Деплой и CI/CD |
| [SECURITY.md](./SECURITY.md) | Безопасность |
| [TESTING.md](./TESTING.md) | Тестирование |
| [CHANGELOG.md](./CHANGELOG.md) | Журнал изменений среды |

## Быстрые команды

```bash
npm run audit:quick    # tsc + lint + unit tests
npm run audit          # полный локальный аудит
npm run audit:security # RLS + secrets scan
npm run audit:perf     # bundle + lighthouse (local)
```

## Связанная документация

- [AGENTS.md](../../AGENTS.md) — инструкции для агентов
- [docs/DEPLOY.md](../DEPLOY.md) — продакшен-деплой
- [docs/integrations/](../integrations/) — партнёрские API
- [.cursor/rules/](../../.cursor/rules/) — правила Cursor
