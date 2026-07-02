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

- [ ] **P0: Supabase egress quota** — проект заблокирован (`exceed_egress_quota`), БД недоступна в production: каталог пуст, CMS отдаёт 402. Поднять тариф или снять spend cap в панели Supabase
- [ ] **YouTravel обложки** — Vercel Image Optimizer получает пустое тело от cf.youtravel.me (`OPTIMIZED_EXTERNAL_IMAGE_RESPONSE_BODY_EMPTY`). Варианты: кешировать обложки в Supabase Storage при sync или собственный proxy-роут
- [ ] Досведение контраста: второстепенные поверхности с `bg-sky text-white` (кабинеты организатора/админа, section-nav, badge `new`) → `bg-sky-ink` по аналогии с primary-кнопкой
- [ ] Home performance: bootup JS ~3s в лаборатории, TTI высокий — code-splitting нижних секций главной
- [ ] Dev-only React warning «unique key prop» в `<MarketplaceHome>` — найти источник
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
