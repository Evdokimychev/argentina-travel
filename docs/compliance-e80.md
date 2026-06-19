# E80: Compliance — cookie consent и GDPR

Согласие на cookie по категориям, выгрузка персональных данных и очередь запросов на удаление.

## Cookie consent

Категории (русский UI):

| Категория | Ключ | По умолчанию |
|-----------|------|--------------|
| Необходимые | `necessary` | всегда включены |
| Аналитика | `analytics` | выключена до согласия |
| Персонализация | `personalization` | выключена до согласия |

Хранение: `localStorage` + cookie `site-cookie-consent` (JSON, max-age 365 дней).

Компоненты:

- `CookieConsentBanner` — баннер с «Принять всё», «Только необходимые», «Настроить»
- `SiteAnalytics` — Vercel Analytics / Speed Insights только при `analytics`
- `GuideAssistantWidget` — только при `personalization`

Политика: `/legal/cookies` (статический документ + CMS override).

## GDPR API

### Выгрузка данных

`POST /api/privacy/export` — авторизованный пользователь.

Ответ JSON: профиль, бронирования, отзывы, сообщения из переписок.

UI: раздел «Конфиденциальность» в `/profile/settings`.

### Запрос на удаление

`POST /api/privacy/delete-request`

Тело: `{ "reason"?: string }`

Создаёт запись в `privacy_requests` со статусом `pending`. Повторный активный запрос → **409**.

Начиная с E95, удаление обрабатывается через автоматический cron-пайплайн после подтверждения администратором (soft delete + обезличивание, без удаления финансовых записей).

## База данных

Миграции:

- `supabase/migrations/20250625000006_privacy_requests.sql`
- `supabase/migrations/20250626000013_gdpr_automation_soft_delete.sql`

Таблица `privacy_requests`:

- `request_type`: `delete`
- `status`: `pending` | `approved` | `processing` | `completed` | `rejected` | `failed`
- RLS: пользователь видит и создаёт только свои записи; service role — полный доступ

## Админка

`/admin/operations/privacy-requests` — `PrivacyRequestsView` (approve/reject + журнал действий)

Capability: `operations.leads`

API: `GET/PATCH /api/admin/privacy-requests`

## Журнал действий администраторов

Константа хранения записей `admin_audit_log`:

```ts
// src/lib/compliance/audit-retention.ts
export const ADMIN_AUDIT_RETENTION_DAYS = 90;
```

Записи старше 90 дней подлежат архивированию или удалению по регламенту (cron/ops — вне scope E80). Константа задаёт целевой срок хранения для документации и будущей автоматизации.

## Переменные окружения

Дополнительных переменных нет. Требуется Supabase Auth для privacy API.

## Проверка

1. Первый визит — баннер cookie; без согласия нет Analytics и помощника.
2. «Настроить» → включить только аналитику → Speed Insights появляется, помощник — нет.
3. Войти в аккаунт → Настройки → «Скачать мои данные» → JSON.
4. «Запросить удаление» → запись в админке «Запросы на удаление».
