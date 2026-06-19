# E98 — онбординг организатора: заявка → проверка → первый тур

## Что реализовано

1. **Новая таблица `organizer_applications`**
   - Поля: `user_id`, `company_name`, `description`, `status`, `reviewed_at`.
   - Статусы: `pending`, `approved`, `rejected`.
   - Добавлены служебные поля: `reviewed_by`, `review_note`, `created_at`, `updated_at`.
   - Индексы на очередь и ограничение: одна активная (`pending`) заявка на пользователя.
   - Миграция: `supabase/migrations/20250626000014_organizer_onboarding_e98.sql`.

2. **Публичный поток `/join`**
   - Анкета организатора отправляется через `POST /api/organizer-applications`.
   - Для отправки нужен вход в аккаунт.
   - Поля анкеты: название проекта/компании и описание опыта/формата туров.
   - Если уже есть заявка в статусе `pending`, повторная отправка блокируется.

3. **Админ-очередь `/admin/marketplace/organizers`**
   - Отдельный экран для проверки анкет организаторов.
   - Действия: `Одобрить` / `Отклонить`.
   - Источник данных: `GET /api/admin/organizer-applications`.
   - Решение по заявке: `PATCH /api/admin/organizer-applications/[id]`.

4. **Действия при одобрении**
   - Пользователю добавляется роль `organizer` и активируется `active_role = organizer`.
   - Заполняется `profiles.organizer_verified_at`.
   - Отправляется приветственное письмо с первым шагом чек-листа: **«Создайте первый тур»**.
   - Создаётся in-app уведомление с ссылкой на `/organizer/tours?welcome=1`.

5. **Пустое состояние дашборда организатора**
   - Если у организатора нет туров и бронирований, в `/organizer` показывается направляющий блок:
     1) заполнить профиль,
     2) создать первый тур,
     3) опубликовать тур.
   - Добавлены быстрые ссылки в мастер и настройки.

## Изменённые ключевые файлы

- `src/app/api/organizer-applications/route.ts`
- `src/app/api/admin/organizer-applications/route.ts`
- `src/app/api/admin/organizer-applications/[id]/route.ts`
- `src/components/join/JoinPageView.tsx`
- `src/components/admin/views/MarketplaceOrganizersView.tsx`
- `src/app/admin/marketplace/organizers/page.tsx`
- `src/components/organizer/OrganizerDashboardView.tsx`
- `src/lib/admin/organizer-applications-server.ts`
- `src/lib/admin/moderation-notify.ts`
- `src/lib/admin/nav-config.ts`
- `src/types/admin.ts`
- `src/types/database.ts`

## Поведение после релиза

- Пользователь сначала отправляет анкету, а доступ к кабинету организатора открывается только после одобрения.
- Администратор обрабатывает заявки в отдельной очереди без смешивания с модерацией туров и отзывов.
- После одобрения пользователь сразу получает понятный первый шаг в кабинете.
