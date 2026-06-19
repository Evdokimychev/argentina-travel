# E87 — Ограничение частоты запросов

Реализован скользящий лимитер запросов в `src/lib/rate-limit/index.ts` с двумя режимами:

- Upstash Redis через REST API (`fetch`, без зависимости на пакет Upstash).
- Резервный in-memory режим, если `UPSTASH_REDIS_REST_URL` не задан или Redis временно недоступен.

## Переменные окружения

Добавьте в окружение:

```bash
UPSTASH_REDIS_REST_URL=https://<your-upstash-endpoint>.upstash.io
UPSTASH_REDIS_REST_TOKEN=<your-upstash-rest-token>
```

Примечания:

- Если `UPSTASH_REDIS_REST_URL` отсутствует, автоматически используется in-memory limiter.
- `UPSTASH_REDIS_REST_TOKEN` рекомендуется всегда задавать для защищённого доступа.

## Где применено

- Публичный API E70 (`/api/v1/*`) через `handlePublicApiRequest`:
  - IP-лимит на входе.
  - Лимит по API-ключу (из `api_keys.rate_limit_per_minute`) в `resolvePublicApiKey`.
- `POST /api/bookings` через `withRateLimit(...)`.
- Чувствительные auth-маршруты (`/api/auth/*`):
  - `register`
  - `request-password-reset`
  - `lookup-phone`
  - `ensure-profile`
  - `login-email` (deprecated)
  - `login-by-phone` (deprecated)

## Формат ответа при превышении лимита

Для всех новых ограничений возвращается:

- HTTP `429 Too Many Requests`
- заголовок `Retry-After`
- JSON с русским сообщением об ошибке

## Обёртка маршрутов

Для маршрутов добавлена обёртка:

```ts
withRateLimit(handler, {
  limit: 10,
  window: 60_000,
  keyPrefix: "bookings:create",
  key: (request) => `ip:${getClientIp(request)}`,
  message: "Слишком много попыток бронирования. Повторите позже.",
});
```

`window` задаётся в миллисекундах.
