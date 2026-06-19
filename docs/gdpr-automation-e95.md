# E95: GDPR automation — soft delete pipeline

Автоматизация обработки запросов на удаление персональных данных после подтверждения администратором.

## Что реализовано

1. **Миграция данных**
   - `profiles.deleted_at`, `profiles.anonymized_at`
   - новый workflow `privacy_requests.status`:
     - `pending` → `approved` → `processing` → `completed`
     - `pending`/`approved`/`processing` → `rejected`
     - `processing` → `failed` при ошибке
2. **Cron-обработка**
   - `POST/GET /api/cron/privacy/process`
   - обрабатывает `approved`-запросы пакетно (по умолчанию `limit=20`)
3. **Админка**
   - `/admin/operations/privacy-requests`
   - действия: подтвердить / отклонить
   - журнал действий из `admin_audit_log`
4. **Email пользователю**
   - после `completed` отправляется письмо о завершении обработки
5. **Юридическая безопасность**
   - бронирования и платежные следы не удаляются
   - персональные поля в профиле и бронированиях обезличиваются

## Подробный workflow

### 1) Пользователь

`POST /api/privacy/delete-request` создаёт запись в `privacy_requests` со статусом `pending`.

### 2) Администратор

`PATCH /api/admin/privacy-requests` с действием:

- `approve` — переводит заявку в `approved` (готова к cron)
- `reject` — переводит в `rejected`

Каждое действие пишется в `admin_audit_log`.

### 3) Cron `/api/cron/privacy/process`

Для каждой заявки:

1. Перевод в `processing`
2. Блокировка Auth-пользователя (`ban_duration`)
3. Ревокация refresh-сессий (`delete from auth.sessions where user_id = ...`)
4. Обезличивание `profiles`
5. Обезличивание связанных `bookings`:
   - `user_id`, `guest_user_id` → `null`
   - `contact_name`, `contact_email`, `contact_phone` → обезличенные значения
   - `payload` очищается от персональных данных, финансовые поля сохраняются
6. Перевод в `completed` + запись метаданных обработки
7. Email пользователю о завершении

При ошибке заявка переводится в `failed`, ошибка сохраняется в `notes` и `metadata.lastError`.

## Что именно обезличивается

### `profiles`

- `first_name`, `last_name` → нейтральные значения
- `phone`, `email`, `avatar_url`, `date_of_birth` → `null`
- `is_blocked` → `true`
- `deleted_at`, `anonymized_at` → timestamp обработки

### `bookings`

Сохраняются финансово значимые данные (`total_price_usd`, `payment_status`, инвойсы и платёжные агрегаты в payload), но удаляются персональные маркеры контакта и идентификаторы пользователя.

## Маршруты и файлы

- Миграция: `supabase/migrations/20250626000013_gdpr_automation_soft_delete.sql`
- Cron: `src/app/api/cron/privacy/process/route.ts`
- Процессор: `src/lib/privacy/delete-automation.ts`
- Админ API: `src/app/api/admin/privacy-requests/route.ts`
- Админ UI: `src/components/admin/views/PrivacyRequestsView.tsx`
- Email шаблон: `src/lib/notifications/email-templates/privacy-delete-completed.ts`

## Ручной запуск cron

```bash
curl -X POST "$NEXT_PUBLIC_SITE_URL/api/cron/privacy/process" \
  -H "Authorization: Bearer $CRON_SECRET"
```

Опционально можно передать размер пакета:

```bash
curl -X POST "$NEXT_PUBLIC_SITE_URL/api/cron/privacy/process?limit=50" \
  -H "Authorization: Bearer $CRON_SECRET"
```
