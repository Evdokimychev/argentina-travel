# E106 — Центр подготовки к поездке (Trip Prep Hub)

## Что добавлено

- Таблицы Supabase:
  - `trip_prep_templates` — шаблоны чек-листов (тип тура: default / group / individual / partner).
  - `trip_prep_items` — пункты шаблона по категориям.
  - `trip_prep_progress` — отметки туриста (booking + user + item).
  - `trip_prep_reminders_sent` — дедупликация напоминаний 7/3/1 день.
- Seed: шаблон «Стандартная поездка в Аргентину» (12 пунктов на русском).
- API:
  - `GET /api/trip-prep?bookingId=` — чек-лист и прогресс.
  - `PATCH /api/trip-prep/progress` — toggle пункта.
  - `GET /api/organizer/bookings/[id]/trip-prep-summary` — % без PII.
  - `GET/PUT/DELETE /api/admin/trip-prep/templates` — CRUD шаблонов.
- UI:
  - `/profile/trip-prep` — хаб туриста.
  - `/trip-prep` — публичный preview + CTA входа.
  - блок в карточке заявки туриста и агрегат в CRM организатора.
- Cron: `/api/cron/trip-prep/reminders` (в оркестраторе `platform-maintenance`, каждый час).
- Email-шаблон `trip-prep-reminder` + in-app уведомления.

## Поведение без Supabase

Если bookings API недоступен, чек-лист работает из `src/data/trip-prep-defaults.ts`, прогресс — в `localStorage` (`argentina-travel-trip-prep-progress`).

## RLS

- `trip_prep_templates`, `trip_prep_items` — публичное чтение; запись через `service_role`.
- `trip_prep_progress` — только свой `user_id = auth.uid()`.
- `trip_prep_reminders_sent` — только `service_role` (таблица в `SERVICE_ROLE_ONLY_TABLES`).

## Напоминания

1. Cron ищет заявки со статусом `pending` или `confirmed` и `start_date` = сегодня + 7/3/1 день.
2. Перед отправкой проверяется `trip_prep_reminders_sent`.
3. Турист получает in-app + email со ссылкой на `/profile/trip-prep?bookingId=…`.

## Организатор

В карточке заявки показывается агрегат: «N% чек-листа выполнено» без детализации пунктов.

## Админ

CRUD шаблонов через `PUT /api/admin/trip-prep/templates` (capability `content.edit`). Можно задавать отдельные шаблоны для group / individual / partner; fallback — `is_default = true`.

## Связанные файлы

- Миграция: `supabase/migrations/20250627000002_trip_prep_e106.sql`
- Сервер: `src/lib/trip-prep-server.ts`
- Клиент API: `src/lib/trip-prep-api.ts` (без server-only импортов)
- UI: `src/components/trip-prep/*`
