# Полномасштабный релизный аудит — 19.07.2026

## Итог

Проект собран в одну каноническую историю без потери прежней работы. Все именованные ветки и пять найденных detached-worktree включены в текущую релизную ветку; незакоммиченных пользовательских изменений в старых worktree не осталось. Релизный кандидат проходит TypeScript, lint, unit/integration/contract tests, контентные и SEO-проверки, production build и критические Playwright-сценарии.

Во время ручной мобильной проверки найден и исправлен P0: при включённом `cmsBlogCutover` массовый запрос 290 CMS-документов мог превысить общий лимит 1,5 секунды, после чего `/blog` показывал пустой каталог. Для bulk-cutover введён отдельный лимит и безопасный возврат к проверенному редакционному каталогу при недоступности CMS. Повторная проверка показала 69 публичных материалов, 14 категорий и 20 карточек в первом рендере.

## Сохранность Git и старой работы

- Исходное грязное состояние зафиксировано отдельным checkpoint-коммитом до интеграционных изменений.
- `origin/main`, readiness-ветка, контентная ветка и все найденные release-worktree включены в единую историю.
- Для старых worktree с generated evidence созданы отдельные коммиты; их данные сохранены, но более старые отчёты не заменили актуальное дерево.
- Stash пуст, неслитых именованных веток нет, старые worktree чистые.
- В восстановленном архиве обнаружены изображения/OCR со старыми секретами. Архив не добавлен в Git и перенесён в закрытый каталог `/Users/Study/.codex/private-archives/argentina-travel/recovered-seo-thread-2026-07-17` с правами `0700`. Если ключи когда-либо были активны, владелец должен отозвать их у провайдеров.

## Архитектура и frontend

- Next.js 15 / React 19 / TypeScript собираются в защищённом production-режиме; demo authentication и demo seed не попадают в клиентский bundle.
- Публичные каталоги используют статический редакционный слой как отказоустойчивый baseline и CMS как управляемый источник override/cutover.
- Проверены главная, блог, карточка тура и защищённый профиль на desktop и viewport `390×844`.
- На проверенных страницах нет Next.js overlay, горизонтального переполнения и ошибок консоли приложения. Единственная замеченная ошибка принадлежала стороннему Chrome-extension и к сайту не относится.
- Карточка тура содержит доступную галерею, sticky CTA, Product JSON-LD и понятную партнёрскую модель бронирования.
- Форма входа корректно открывается как мобильный bottom sheet; переход из loading-state к email/phone auth подтверждён.

## Backend, API и база данных

- Production health подтверждает доступность приложения, прямого Postgres и поиска.
- Перед DDL создана полная зашифрованная logical-копия schema+data с SHA-256: `/Users/Study/.codex/private-archives/argentina-travel/production-backup-before-governance-2026-07-19`. Дамп зашифрован `age`, identity хранится отдельно с правами `0600`.
- Миграция `20260715041742_content_knowledge_governance.sql` применена к каноническому production-проекту `uooxrypocahomoqzdvzy` одной транзакцией.
- Созданы 8 governance-таблиц, 7 полей управления документом, 17 полей media-rights, 2 publication-gate trigger и 2 security-invoker функции.
- Для всех 8 новых таблиц включён RLS. У `anon` нет DML; публичный `select` открыт только там, где он ограничен status/expiry policy. `authenticated` ограничен staff-policy, `service_role` имеет необходимые операции.
- Функции publication gate недоступны `anon/authenticated`, доступны только `service_role`; feature flag `content_governance_v1` оставлен выключенным.
- Статический RLS-аудит не нашёл критичных проблем.
- В проекте исторически отсутствует единый DB migration journal для уже существующей production-схемы. Скрипт правильно отказывается слепо replay-ить весь каталог. До следующей серии миграций следует отдельно зафиксировать доказанный production baseline, а не запускать все 97 файлов поверх живой базы.

## Дизайн, UX, mobile и accessibility

- Навигация, hero, каталоги, фильтры, cookie consent и нижняя мобильная навигация визуально согласованы.
- Главная не имеет горизонтального скролла; основной H1, CTA и поиск видимы без лишнего взаимодействия.
- Блог показывает реальное количество материалов и категорий, корректный поиск и редакционные изображения с alt.
- Карточка тура сохраняет читаемую иерархию, цену и CTA в первом viewport, не перекрывая основной контент.
- Критические Playwright-сценарии прошли на собранном production-кандидате. Существующие lint warnings не блокируют релиз; наиболее заметный a11y-warning относится к архивному модулю `src/archive/flights-native-search`.
- Последний сохранённый Lighthouse baseline: median performance 76, accessibility 99, URL ниже принятого бюджета нет. Это не P0, но bundle кабинетов/admin остаётся зоной последующей оптимизации.

## Контент, SEO и медиа

- Строгая provenance-проверка knowledge base проходит.
- Blog editorial readiness: 75/75 проверенных материалов; публичный runtime-каталог после CMS cutover содержит 69 индексируемых материалов и 14 категорий.
- Guide editorial readiness: 29/29.
- Knowledge base: 689 KB-материалов, из них 224 индексируемых и 465 в карантине; слабые, непереведённые и чувствительные материалы не публикуются.
- Media manifest: 2226 локальных assets, отсутствующих файлов нет. Критический mobile media budget и проверка прав изменённых assets проходят.
- Production SEO crawl прошёл для 558/558 URL: self-canonical, indexable, robots/sitemap/JSON-LD корректны. Осталось одно неблокирующее metadata/content предупреждение в JSON-отчёте.

## Кабинеты и админка

- Туристический профиль, кабинет организатора и админская платформа входят в общую production-сборку, а права разделены server-side проверками и RLS.
- Governance API/типы/тесты синхронизированы с новой схемой; feature выключена до отдельного операционного включения редакцией.
- Отдельный CMS cutover guard не позволяет включить неполный lane. Публичный блог теперь дополнительно не превращается в пустой экран при временном bulk-timeout.

## Интеграции и платежи

- Tripster catalog API, страна Аргентина, города и sample experiences отвечают. External Orders API возвращает `403 FORBIDDEN`; приложение сохраняет предусмотренный внешний checkout. Для native order creation нужен отдельный доступ Tripster.
- YouTravel catalog/detail/offers и партнёрские Affise-ссылки отвечают. Booking endpoints возвращают `405`, поэтому используется предусмотренный внешний партнёрский переход. Affise reporting API optional и не настроен.
- 42 проверки booking/payment state machine, idempotency, webhook и provider contracts проходят.
- `npm audit --omit=dev`: 0 известных уязвимостей.

## Аналитика

- В коде определены все 19 ожидаемых dataLayer events.
- В production не настроены GTM, Яндекс Метрика и verification tokens GSC/Bing/Ahrefs. Поэтому live GTM snippet, consent default/dataLayer initialization и Google verification отсутствуют.
- Это внешний операционный blocker: значения должны быть добавлены владельцем в Vercel/Admin, затем контейнер GTM — опубликован в интерфейсе провайдера. Секреты и `.env` в рамках аудита не изменялись.

## Проверки релизного кандидата

- TypeScript: pass.
- ESLint: pass с существующими warnings.
- Unit/integration/contracts: 1849 тестов прошли до финального P0-fix; 30 целевых CMS/blog/latency тестов после исправления прошли, добавлен новый regression contract.
- Production build: pass; 887 static/dynamic routes generated после восстановления blog catalog.
- Release gate: static, contracts, content, security, commerce, production и journeys — pass на интегрированном кандидате; точный финальный commit повторно проверяется перед push.
- Manual browser: desktop home, mobile home, mobile blog, mobile tour detail, auth modal — pass.

## Остаточные риски, не маскируемые кодом

1. Требуется отозвать/проверить старые ключи, найденные только в закрытом восстановленном архиве.
2. Restore rehearsal полной копии ещё требует отдельного disposable Supabase target. Production backup создан и каталог dump проверен, но наличие backup не заменяет фактическое восстановление.
3. Native Tripster External Orders и YouTravel booking API недоступны по текущим партнёрским правам; внешний checkout работает.
4. GTM/GA4/Метрика/Search Console требуют действий владельца в Vercel и кабинетах провайдеров.
5. Исторический migration journal production нужно формализовать отдельной baseline-процедурой до массового применения будущих миграций.

## Решение о релизе

Код, контент, публичные маршруты, база, RLS, бронирование и партнёрские fallback-сценарии готовы к единственному production deploy после зелёного финального release gate на точном commit. Внешние аналитические и партнёрские ограничения не скрыты и не требуют блокировать текущий контентный/UX-релиз.
