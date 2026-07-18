# План production-выкладки 2026-07

Дата актуализации: 2026-07-15. Целевая платформа: GitHub Actions → Vercel → Supabase. План рассчитан на один заранее утверждённый commit SHA.

## Роли и каналы

| Роль | Ответственность |
|---|---|
| Release coordinator | GO/NO-GO, журнал событий, координация окна, завершение релиза |
| Application owner | Vercel deployment, env, smoke, быстрый откат приложения |
| Database owner | Backup, review и применение Supabase migrations, проверка RLS, forward-fix |
| QA owner | Матрица тестов, ручные journeys, браузеры, сбор доказательств |
| Security owner | Закрытие P0/P1, adversarial auth/RBAC/privacy проверки |

Открыть единый канал релиза. В первой записи указать SHA, staging URL, production URL, предыдущий стабильный Vercel deployment ID, текущий и ожидаемый migration ID, участников и начало окна. Секреты в журнал не помещать.

## 1. Условия входа

- [ ] Все P0/P1 из `security-checklist.md` закрыты и перепроверены; решение изменено с NO-GO на GO.
- [ ] Рабочее дерево релизного SHA воспроизводимо; CI `Mandatory release gate` зелёный.
- [ ] Один и тот же SHA прошёл staging по `test-matrix.md`.
- [ ] Vercel Production env сверены по именам, включая `DEPLOY_ENV=production`, `NEXT_PUBLIC_APP_MODE=production`, `NEXT_PUBLIC_ENABLE_DEMO_SEED=false`, Supabase, `DATABASE_URL`, `CRON_SECRET` и email/payment secrets по фактически включённым функциям.
- [ ] Зафиксирован предыдущий стабильный Vercel deployment ID и подтверждено, что его можно Promote.
- [ ] Миграции прошли review на backward compatibility; подготовлен forward-fix и выполнена staging-репетиция повторного запуска.
- [ ] Сделаны свежий `npm run backup:schema` и отдельный Supabase backup данных; проверены время, проект и доступность восстановления.
- [ ] На время окна нет параллельных изменений CMS, ролей, оплат и схемы.

Если любой пункт не выполнен, релиз не начинается.

## 2. Подготовка кандидата

1. Зафиксировать SHA: `git rev-parse HEAD`.
2. На чистой установке Node 22 выполнить `npm ci` и `npm run release:gate`.
3. Выполнить `npm run publish:verify:pre-deploy`.
4. Убедиться, что GitHub Actions для того же SHA завершён успешно; скачать `release-gate-<sha>` и visual artifacts.
5. Проверить, что Vercel build использует тот же SHA. Полный gate выполняется обязательным GitHub CI, а Vercel `buildCommand` запускает только `npm run build`, чтобы не дублировать сетевые и браузерные проверки внутри упаковщика.

## 3. Staging-репетиция

1. Использовать отдельный staging Supabase и staging Vercel environment.
2. Сохранить staging backup и применить migration delta через журналируемый runner: `MIGRATION_TARGET_ENVIRONMENT=staging DATABASE_URL=<staging> npm run supabase:migrate`. Повторный запуск обязан дать `pending=0`; checksum drift или существующая схема без канонического журнала блокируют репетицию.
3. Выполнить `npm run supabase:verify`, `npm run rls-audit`, `npm run auth:readiness` и security negative tests.
4. Развернуть релизный SHA на staging и прогнать все staging-строки `test-matrix.md`.
5. Проверить вручную auth, роли, бронирование/оплату в sandbox, consent, CMS, cron endpoints и критичные браузеры.
6. Зафиксировать staging deployment ID, migration ID, результаты и длительность. Любое исправление создаёт новый SHA и требует повторения репетиции.

## 4. Production cutover

### T-15 минут: снимок состояния

1. Записать предыдущий production deployment ID и ответ `GET https://www.goargentina.ru/api/health`.
2. Сохранить текущие `gitSha`, `migrationVersion`, `deployEnv` и состояние Postgres.
3. Проверить наличие schema и data backups и доступ Database owner.
4. При миграции, несовместимой со старой версией приложения, включить предусмотренный maintenance/feature-disable механизм до изменений БД. Если такого механизма нет, релиз блокируется.

### T0: база данных

1. Database owner повторно подтверждает, что `DATABASE_URL` относится к production, не выводя значение в журнал.
2. Применить только проверенный migration delta того же SHA. Production-runner разрешён лишь после backup/restore и staging acceptance; существующая схема без доказанного журнала останавливается до SQL.
3. Немедленно выполнить `npm run supabase:verify` и `npm run rls-audit`.
4. Выполнить read-only контроль затронутых таблиц, RLS и ролей. Не продолжать при частичном применении или расхождении.

### T+5: приложение

1. Promote проверенный Vercel deployment того же SHA или дождаться auto-deploy из `main`.
2. Не менять `NEXT_PUBLIC_*` после build. Если переменная изменена, нужен новый deployment и повторная проверка SHA.
3. Дождаться статуса Ready и проверить, что production domain привязан к новому deployment.
4. Выполнить:

```bash
EXPECTED_GIT_SHA=<sha7> \
SMOKE_BASE_URL=https://www.goargentina.ru \
npm run production-smoke

PLAYWRIGHT_BASE_URL=https://www.goargentina.ru \
npm run test:e2e:smoke

npm run publish:verify
```

5. Сверить `/api/health`: `ok=true`, `deployEnv=production`, SHA и migration ID совпадают с планом, direct Postgres check успешен.

### T+15: функциональная приёмка

1. QA выполняет короткий production-набор: главная, поиск, каталог, карточка, auth/reset password, аккаунт, booking/partner redirect, consent и admin health.
2. Для оплаты использовать безопасный test/sandbox сценарий либо минимальную контролируемую транзакцию с заранее согласованным возвратом.
3. Проверить два Vercel cron из `vercel.json`: `/api/cron/affiliate-sync` и `/api/cron/platform-maintenance`; ручной вызов только с production `CRON_SECRET` и пониманием side effects.
4. Проверить Vercel function logs: нет всплеска 5xx, auth/DB timeouts, webhook failures и новых client exceptions.

## 5. Наблюдение и расширение трафика

| Интервал | Проверки | Решение |
|---|---|---|
| 0–15 минут | Health каждую 1–2 минуты, smoke, 5xx, DB/auth, webhook | Любой P0 или устойчивый 5xx → немедленный rollback |
| 15–60 минут | Ключевые journeys каждые 15 минут, Vercel logs, партнёры, latency, cron | Регрессия checkout/auth/RBAC/privacy → rollback или feature disable |
| 1–4 часа | Ошибки, conversion-path availability, email delivery, sync jobs | Закрыть окно только после стабильного часа |
| 24 часа | Error/latency trend, cron results, оплаты/брони, SEO/analytics sanity | Подтвердить завершение релиза и удалить временные ограничения |

Если используется постепенное переключение, сначала допускаются внутренние пользователи/ограниченный процент, затем 25%, 50% и 100%. Переход между ступенями возможен только после чистого интервала наблюдения; при отсутствии технического механизма Vercel traffic split применяется схема Preview → Promote с готовым мгновенным откатом.

## 6. Критерии завершения

- Все блокирующие production-проверки из `test-matrix.md` пройдены на нужном SHA.
- Нет новых P0/P1, всплеска 5xx, auth/RBAC/privacy или payment дефектов.
- Health показывает ожидаемые SHA и migration ID.
- Два cron и критичные интеграции работают штатно.
- `final-release-report.md` содержит deployment IDs, тестовые артефакты, исключения, фактическую хронологию и итоговое решение.

До выполнения этих условий релиз остаётся открытым; при превышении окна без доказанной стабильности применяется `rollback-plan.md`.
