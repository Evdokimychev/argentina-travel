# Staging acceptance: безопасный контур Sprint 0A

Контур предназначен для воспроизводимой проверки 25 сценариев из раздела 3.16 отчёта о готовности. Сейчас реализован фундамент: запрет production, безопасный fingerprint, реестр сценариев, Playwright-конфигурация, отчёт и ручной GitHub workflow. Сами write-journeys ещё нельзя считать L4 до появления отдельного staging Supabase, тестовых ролей и cleanup/TTL-janitor.

## Почему текущий environment нельзя использовать

Production Supabase имеет project ref `uooxrypocahomoqzdvzy`. Acceptance-контур никогда не использует общие `SUPABASE_URL` или `SUPABASE_PROJECT_REF` как fallback: staging target задаётся отдельными переменными. Совпадение project ref или production origin немедленно останавливает запуск до браузера, API и БД.

## Обязательные переменные

| Переменная | Требование |
|---|---|
| `STAGING_ACCEPTANCE_ENABLED` | строго `true` |
| `STAGING_ACCEPTANCE_BASE_URL` | HTTPS URL отдельного preview/staging, не `goargentina.ru` |
| `STAGING_ACCEPTANCE_SUPABASE_URL` | API URL отдельного Supabase project/branch |
| `STAGING_ACCEPTANCE_SUPABASE_PROJECT_REF` | совпадает с ref в staging URL и отличается от production |
| `STAGING_ACCEPTANCE_RUN_ID` | уникальный namespace будущих fixtures |
| `STAGING_ACCEPTANCE_DEPLOYMENT_ID` | неизменяемый ID Vercel deployment, который обслуживает указанный staging URL |
| `STAGING_ACCEPTANCE_MIGRATION_ID` | последняя миграция, отдельно подтверждённая на staging-БД |
| `STAGING_ACCEPTANCE_MAILBOX_MODE` | строго `disposable` |
| `STAGING_ACCEPTANCE_MAILBOX_TOKEN` | задан; значение никогда не попадает в fingerprint |
| `PAYMENT_SANDBOX_MODE` | строго `true` |
| `STAGING_ACCEPTANCE_PARTNER_WRITES` | строго `false` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ключ только staging-проекта |
| `SUPABASE_SERVICE_ROLE_KEY` | серверный ключ только staging-проекта |

Ключи и токены не входят в fingerprint и не выводятся в отчёт. Партнёрские сценарии проверяют только redirect/attribution до handoff; реальный заказ Tripster/YouTravel/Sputnik8 запрещён.

## Запуск

1. Создать persistent staging branch/project Supabase. По официальной модели Supabase branch имеет отдельные БД, Auth, Storage, API endpoint и credentials; новый branch не копирует production data.
2. Создать GitHub Environment `staging-acceptance`, добавить staging variables/secrets, disposable mailbox и sandbox credentials.
3. До запуска сверить `/api/health`: `gitSha` должен совпадать с запускаемым commit, `deployEnv` должен быть `staging`, а `migrationVersion` — с подтверждённой последней миграцией staging-БД.
4. Вручную запустить workflow `Staging acceptance`, указав deployment URL, уникальный run ID, неизменяемый deployment ID и подтверждённый migration ID.
5. Preflight можно выполнить отдельно командой `npm run staging:acceptance:preflight`. Полный scaffold запускается `npm run test:e2e:staging-acceptance`.

Прямой вызов Playwright не обходит защиту: `playwright.staging-acceptance.config.ts` повторно проверяет environment при загрузке.

Перед любыми будущими write-journeys тест также читает `/api/acceptance/environment`. Маршрут доступен только при явном staging opt-in и подтверждает, что сам deployment собран с тем же отдельным Supabase ref, sandbox payments, disposable mailbox и отключёнными partner writes. Это защищает от ситуации, когда workflow настроен на staging, а preview-приложение по ошибке продолжает писать в production.

## Отчёт и честный статус

Один и тот же JSON создаётся в двух местах:

- `test-results/staging-acceptance/report.json` — рядом с browser trace, видео и скриншотами;
- `var/ops/staging-acceptance-last.json` — канонический вход для `readiness:90`.

Отчёт всегда содержит ровно 25 записей и безопасную привязку к candidate tree, deployment ID, хешу Supabase project ref и migration ID. Ключи Supabase, mailbox token и другие секреты в отчёт не попадают. Journey без теста получает `not_implemented`, а не ложный `passed` или скрытый `skip`. L4 можно присвоить только когда тест сохраняет доказательства browser → request/response → DB/RLS → видимость другой ролью → cleanup.

Тест каждого journey обязан использовать тег `[J01]`…`[J25]`, пройти в проектах `chromium` и `webkit` и приложить пять именованных evidence attachments: `browser`, `request`, `database`, `roleVisibility`, `cleanup`. Reporter объединяет результаты обоих браузеров и переводит journey в `failed`, если отсутствует браузер или хотя бы один слой доказательств. В машинном отчёте эти пять границ записываются отдельными булевыми полями, поэтому незаполненный массив путей не может ошибочно считаться доказательством.

## Cleanup manifest

После всех сценариев cleanup/TTL-janitor обязан создать фиксированный файл
`test-results/staging-acceptance/cleanup-manifest.json`:

```json
{
  "schemaVersion": 1,
  "runId": "acceptance-20260717-001",
  "status": "passed",
  "orphanFixtures": 0
}
```

Reporter не читает произвольный путь из environment. Он принимает manifest только для текущего `runId`, только со статусом `passed` и только с `orphanFixtures: 0`. Отсутствующий, повреждённый или чужой manifest, а также любое ненулевое число оставшихся fixtures блокируют итог.

Итоговый `runStatus` становится `failed`, если:

- число journeys не равно 25;
- есть `failed`, `skipped` или `not_implemented`;
- cleanup не выполнен или оставил fixtures;
- candidate tree изменился во время запуска;
- не подтверждены deployment ID или migration ID.

`foundation-health.spec.ts` выполняет read-only проверку `/api/health`, SHA и staging binding. J01–J03 реализованы отдельным публичным read-only пакетом: каждый сценарий проходит реальную страницу в Chromium и WebKit, сохраняет screenshot и same-origin response log и подтверждает анонимную видимость.

Для J01–J03 поле `database` имеет честный уровень `health-and-environment-probe`: оно подтверждает live-связность и привязку deployment к отдельной staging-БД через `/api/health` и `/api/acceptance/environment`, но не утверждает чтение конкретной строки, mutation или проверку RLS. Пакет проваливается при любом same-origin `POST`/`PUT`/`PATCH`/`DELETE`. `cleanup` имеет уровень `no-fixtures-created`: пакет не создаёт пользователей, заявки или заказы и атомарно добавляет завершённые journey/browser в namespaced manifest с `fixtureCount: 0` и `orphanFixtures: 0`.

J03 выбирает доступную партнёрскую дату и открывает только локальный экран подтверждения. Кнопка `Подтвердить и забронировать` не нажимается, внешний сайт не открывается, а любой POST к Tripster/YouTravel booking endpoint или `external_orders` немедленно проваливает тест.

## Следующий безопасный этап

- расширить namespaced fixture manifest на write-journeys и cleanup в `finally`;
- создать туриста, кандидата/организатора, limited/full admin, native tour/excursion, slot и guest booking только в staging;
- реализовать J04–J25 с обязательными attachments; J01–J03 уже покрыты read-only пакетом;
- добавить TTL-janitor и доказательство `0 orphan fixtures`;
- повторить booking/moderation конкурентно в Chromium и WebKit;
- блокировать итог, если есть failed, skipped, not_implemented или orphan fixtures.

Официальный контекст: [Supabase Branching](https://supabase.com/docs/guides/deployment/branching) рекомендует persistent branches для staging/QA; branches изолируют database, Auth, Storage и credentials. В [local development workflow](https://supabase.com/docs/guides/local-development/cli-workflows) указано, что CLI-команды следует запускать с явным `--local`/`--linked`, поскольку defaults различаются. Перед реализацией проверен актуальный [Supabase changelog с breaking changes](https://supabase.com/changelog?tags=breaking-change); применимых breaking changes для read-only guard/scaffold не найдено.
