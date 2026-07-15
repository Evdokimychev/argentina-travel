# Матрица проверок production-релиза 2026-07

Дата актуализации: 2026-07-15. Цель документа — определить обязательные проверки одного и того же commit SHA на локальной машине, staging и production.

## Правила допуска

- Релиз имеет статус **NO-GO**, пока открыт хотя бы один P0/P1 из `security-checklist.md`, не пройдена staging-репетиция миграций или неуспешна обязательная проверка ниже.
- Все результаты привязываются к commit SHA, deployment URL, времени запуска и исполнителю.
- `release:gate` — блокирующий CI-шлюз. Lighthouse, UX audit и Stage 2 visual acceptance в текущем CI имеют `continue-on-error: true`; их зелёный или красный статус учитывается вручную и не заменяет решение release coordinator.
- Повторный запуск после исправления не скрывает первый результат: сохраняются оба отчёта и ссылка на исправление.

## Автоматические проверки

| Этап | Проверка | Команда | Среда | Блокирует | Критерий успеха / артефакт |
|---|---|---|---|---|---|
| До PR/merge | Быстрый аудит | `npm run audit:quick` | local | Да | Exit code 0: TypeScript, lint и unit tests |
| До PR/merge | Полный release gate | `npm run release:gate` | local production-like | Да | Exit code 0; `var/ops/release-gate-report.json` содержит `status=passed` для текущего SHA |
| CI | Полный release gate | GitHub Actions `Mandatory release gate` | CI, Node 22 | Да | Job `verify` зелёный; загружены `release-gate-<sha>` и логи |
| CI | Размер bundles | `npm run bundle:report` | CI | Условно | Нет необъяснённого роста критичных маршрутов; сейчас `continue-on-error`, решение фиксируется вручную |
| CI | Lighthouse blog | `node scripts/lighthouse-ci.mjs` | CI/local server | Условно | Нет регрессии согласованных performance/accessibility бюджетов; сейчас `continue-on-error` |
| CI | UX audit | `npm run test:e2e:ux-audit` | CI, Chromium mobile/desktop | Условно | Полный, не оборванный прогон; нет P0/P1 overflow, ошибок страницы и недоступных основных действий |
| CI | Stage 2 visual | `npm run test:e2e:stage2-visual` | CI, Chromium 390/768/1440 | Условно | Все сценарии пройдены; просмотрены gallery/screenshots, нет stale loaders, горизонтального overflow и ошибок console/page |
| Staging | Проверка Supabase | `npm run supabase:verify` | staging | Да | Подключён именно staging-проект; проверка завершена без ошибок |
| Staging | RLS | `npm run rls-audit` | staging | Да | Нет критичных пропусков политик; отчёт сохранён |
| Staging | Auth readiness | `npm run auth:readiness` | staging | Да | Нет `fail`; тестовые учётные записи и redirect URL относятся к staging |
| Staging | CMS | `npm run cms:readiness -- --strict` | staging | Да при изменении CMS | Все обязательные lane готовы |
| Staging | Интеграции | `npm run tripster:verify`, `npm run sputnik8:verify`, `npm run youtravel:verify` | staging | Да для затронутого партнёра | Нет ошибок контракта; sandbox/read-only режим, без реальных списаний |
| Staging | Production smoke | `SMOKE_BASE_URL=<staging-url> npm run production-smoke` | staging deployment | Да | Health и все публичные маршруты/ассеты/редиректы пройдены |
| Staging | Критичные journeys | `PLAYWRIGHT_BASE_URL=<staging-url> npm run test:e2e:smoke` | staging deployment | Да | Exit code 0; trace/video сохранены при ошибке |
| Staging | Полная визуальная приёмка | `PLAYWRIGHT_BASE_URL=<staging-url> npm run test:e2e:stage2-visual` | staging deployment | Да | 14 критичных маршрутов пройдены на 390/768/1440; галерея просмотрена человеком |
| Staging | UX audit | `PLAYWRIGHT_BASE_URL=<staging-url> npm run test:e2e:ux-audit` | staging deployment | Да | Полный итоговый отчёт, не частичный; нет release-blocking дефектов |
| Staging | Аналитика | `ANALYTICS_BASE_URL=<staging-url> npm run analytics-readiness` | staging | Да при изменении consent/analytics | До согласия нет необязательных cookies/events; после согласия события корректны; отзыв прекращает сбор |
| Pre-deploy | Публикационная готовность | `npm run publish:verify:pre-deploy` | local + live probes | Да | Нет blocking `fail`; отчёт `var/ops/publish-turnkey-last.json` относится к текущему SHA |
| Production | Health + SHA | `EXPECTED_GIT_SHA=<sha7> SMOKE_BASE_URL=https://www.goargentina.ru npm run production-smoke` | production | Да | `ok=true`, `deployEnv=production`, SHA совпадает, Postgres доступен, публичный smoke пройден |
| Production | Критичные journeys | `PLAYWRIGHT_BASE_URL=https://www.goargentina.ru npm run test:e2e:smoke` | production | Да | Exit code 0, нет системных 4xx/5xx и ошибок главных маршрутов |
| Production | Публикационная проверка | `npm run publish:verify` | production | Да | Нет `fail`, canonical/redirect/health соответствуют релизу |
| Production | Медиа | `npm run media:integrity:prod` | production | Да при изменении медиа/CMS | Нет потерянных обязательных изображений и битых manifest-ссылок |
| Production | Производительность | `npm run lighthouse:phase2:prod` | production | Условно | Нет существенной регрессии относительно `performance-baseline.json`; исключение письменно принято |

## Ручные сценарии перед GO

| Область | Сценарий | Минимальное покрытие | Критерий успеха |
|---|---|---|---|
| Анонимный турист | Главная → поиск → тур/экскурсия → бронирование/партнёрский checkout | Desktop + iOS Safari + Android Chrome | Цена и условия понятны, действие завершается ожидаемым подтверждением, возврат на сайт работает |
| Аккаунт | Регистрация, подтверждение email, вход, выход, неверный пароль, reset link, смена пароля | Новый email; просроченная и повторно открытая ссылка | Нейтральные сообщения не раскрывают наличие аккаунта; сессии и redirects корректны |
| Роли | Турист → заявка организатора → одобрение; прямой signup с `role=admin` | Два тестовых пользователя | До доверенного одобрения нет прав организатора; получить admin через metadata невозможно |
| Организатор | Создание/редактирование/отправка тура, статья на модерацию | Desktop + mobile | Черновики сохраняются; статусы и ошибки понятны; чужие данные недоступны |
| Администратор | Login, moderation, staff permissions, CMS navigation/settings | Минимальная и полная staff capability | Доступ определяется явной записью staff; отсутствие записи не даёт bootstrap-права |
| Заказ/оплата | Успех, отказ, отмена, повтор webhook, возврат из провайдера | Только sandbox/test mode | Нет двойного заказа/списания; статус идемпотентен; пользователь видит итог |
| Privacy | Новый браузер: до consent, accept, reject, revoke | Desktop + mobile | Attribution/analytics/marketing не записываются до согласия и прекращаются после отзыва |
| Контент/SEO | RU и fallback locale, canonical/hreflang/noindex, sitemap, старые URL | Репрезентативные legal/blog/place/destination | Непереведённая fallback-страница не индексируется как локализованная; редиректы без цепочек |
| Доступность | Клавиатура, focus, модальные окна, формы, zoom 200% | Главная, auth, каталог, карточка, checkout, admin | Нет ловушек фокуса/перекрытий; ошибки связаны с полями; основные действия доступны |
| Совместимость | Chrome, Safari/WebKit, Firefox; ширины 390/768/1440 | Критичные journeys | Нет браузерных блокеров; известные исключения занесены в `browser-compatibility.md` |

## Особые проверки Supabase

1. До production выполнить `npm run backup:schema` и отдельный backup данных средствами Supabase; schema backup из проекта не содержит пользовательские данные.
2. На staging применить ровно набор миграций релизного SHA командой `DATABASE_URL=<staging> npm run supabase:migrate`.
3. Учесть, что текущий runner читает и выполняет **все** `supabase/migrations/*.sql` по имени и не ведёт собственную таблицу применений. Все файлы должны быть повторно исполнимы либо запуск должен быть заменён контролируемым применением только проверенного delta.
4. После миграции повторить `supabase:verify`, `rls-audit`, auth/RBAC negative tests и сверить `/api/health.migrationVersion` с последним ожидаемым ID.

## Протокол результата

Release coordinator сохраняет в `final-release-report.md`: SHA, staging/production deployment IDs, ожидаемый migration ID, ссылки на CI и Vercel, отчёты обязательных проверок, список принятых исключений, решение GO/NO-GO и имена ответственных. На 2026-07-15 исходный статус остаётся **NO-GO** до закрытия блокеров из `security-checklist.md` и полного повторного прогона этой матрицы.
