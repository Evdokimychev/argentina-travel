# TASKS

Актуальный список задач. Обновляй вручную или через AI после каждого спринта.

## In progress

- [ ] AI-first среда — финальный аудит и commit (если нужен)

## Backlog — среда

- [ ] `npm run setup:git-hooks` — установить локально
- [ ] GitHub branch protection для `main`
- [ ] Playwright install locally: `npx playwright install`
- [ ] Tripster External Orders — запросить доступ у Travelpayouts

## Backlog — продукт

- [ ] E2E: Tripster checkout URL invariants
- [ ] Visual regression baseline для tour/excursion detail
- [ ] Sentry / error tracking
- [ ] PWA polish (см. docs/pwa-e65.md)

## Done (recent)

- [x] Excursion booking UX (sticky sidebar, price, schedule grid)
- [x] Tripster checkout URL validation (date/time HH:MM)
- [x] Partner contact form archived
- [x] Places catalog map markers fix
- [x] CI green + production smoke

## Как добавлять задачи

```markdown
- [ ] **Название** — контекст, ссылка на issue/файл
```

Для крупных фич создавай файл в `docs/tasks/FEATURE-name.md`.
