# E100 — Production hardening: smoke, CDN media, load scaffold

E100 добавляет минимальные, но обязательные эксплуатационные контуры перед production cutover:

1. E2E smoke через Playwright для критичных публичных сценариев.
2. Трансформацию изображений Supabase Storage под CDN (`width`/`quality`) для карточек и галереи.
3. Нагрузочный каркас для публичного API `/api/v1/tours`.

## 1) Playwright smoke

Добавлено:

- `playwright.config.ts`
- `tests/e2e/smoke.spec.ts`
- npm-скрипты:
  - `npm run test:e2e`
  - `npm run test:e2e:smoke`

Покрытие smoke-спеки:

- `/` (главная)
- `/tours` (каталог туров)
- `/booking/find` (поиск заявки)
- `/?auth=sign-in` (вход через модальное окно авторизации)
- `/api/health` (JSON-ответ health-check)

Локальный запуск:

```bash
npm run test:e2e:smoke
```

Запуск на staging/production URL:

```bash
PLAYWRIGHT_BASE_URL=https://www.goargentina.ru npm run test:e2e:smoke
```

## 2) Media CDN helper для Supabase

Добавлен helper:

- `src/lib/media/cdn-url.ts` → `buildSupabaseCdnUrl(url, { width, quality })`

Что делает helper:

- определяет Supabase Storage URL;
- переключает `object/public` и `object/sign` на `render/image/*` для CDN-рендера;
- добавляет параметры трансформации (`width`, `quality`) в URL;
- не меняет не-Supabase URL.

Интеграция:

- `src/components/tour-detail/TourDetailGallery.tsx`
- `src/components/marketplace/TourCardGallery.tsx`

Эффект: галерея тура и карточки экскурсий/туров запрашивают оптимизированные изображения, совместимые с `next/image`.

## 3) Load scaffold для `/api/v1/tours`

Добавлен скрипт:

- `scripts/load-test-public-api.mjs`

Назначение:

- выполнить простой контролируемый нагрузочный прогон по `GET /api/v1/tours`;
- собрать базовые метрики (успехи/ошибки, коды ответов, p50/p95/p99 latency).

Требования:

- API-ключ со scope `tours:read` (`LOAD_PUBLIC_API_KEY` или `PUBLIC_API_KEY`).

Пример запуска:

```bash
LOAD_BASE_URL=https://www.goargentina.ru \
LOAD_PUBLIC_API_KEY=<public_api_key> \
LOAD_DURATION_SEC=60 \
LOAD_RPS=10 \
node scripts/load-test-public-api.mjs
```

Ключевые переменные:

- `LOAD_BASE_URL` (по умолчанию `http://127.0.0.1:3000`)
- `LOAD_DURATION_SEC` (по умолчанию `30`)
- `LOAD_RPS` (по умолчанию `5`)
- `LOAD_PAGE_SIZE` (по умолчанию `24`)
- `LOAD_TIMEOUT_MS` (по умолчанию `15000`)
- `LOAD_FAIL_ON_ERROR` (`true|false`, по умолчанию `false`)

## 4) Критерии готовности E100

- `npm run test:e2e:smoke` проходит без падений на целевом окружении.
- Галерея тура и карточки экскурсий/туров отдают Supabase CDN URL с `width`/`quality`.
- `scripts/load-test-public-api.mjs` выполняется и возвращает стабильную статистику без системных 5xx.
