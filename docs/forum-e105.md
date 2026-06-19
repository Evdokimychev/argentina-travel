# E105 — Форум (часть обсуждений открыта)

## Что добавлено

- Таблицы Supabase:
  - `forum_categories` — разделы (`slug`, `title`, `description`, `public_read`, `sort_order`);
  - `forum_threads` — темы (`category_id`, `author_id`, `title`, `pinned`, `locked`, `last_post_at`);
  - `forum_posts` — сообщения (`thread_id`, `author_id`, `body`, `status`, `edited_at`);
  - `forum_post_reports` — жалобы на сообщения.
- RLS: гости читают разделы с `public_read = true`; постинг — только `authenticated`.
- Публичные страницы:
  - `/forum` — список разделов;
  - `/forum/[category]` — темы раздела;
  - `/forum/[category]/[threadId]` — тема и ответы.
- API (с rate limit):
  - `GET /api/forum/categories`;
  - `GET|POST /api/forum/categories/[slug]/threads`;
  - `GET /api/forum/threads/[threadId]?category=...`;
  - `POST /api/forum/threads/[threadId]/posts`;
  - `POST /api/forum/posts/[postId]/report`.
- Модерация: жалоба ставит запись в `moderation_queue` с `entity_type = forum_post`; разбор в `/admin/marketplace/moderation`.
- XSS: тело сообщения проходит через подмножество markdown (`src/lib/forum/forum-body.ts`, `src/lib/rich-text.ts`).

## Поведение доступа

| Роль | Открытые разделы | Закрытые разделы | Постинг |
|------|------------------|------------------|---------|
| Гость | Чтение | Нет доступа | Нет |
| Участник | Чтение | Чтение | Да (после 24 ч с регистрации) |
| Админ | Полный доступ | Полный доступ | Да |

SEO: индексируются только публичные разделы (`public_read = true`); закрытые — `noindex`.

## Seed

Четыре раздела: **Буэнос-Айрес**, **Иммиграция и документы**, **Туры и маршруты**, **Для участников** (закрытый). В каждом — демо-тема с первым сообщением.

## Спам-защита

- Rate limit по IP и user id на создание тем, ответов и жалоб.
- Минимальный «возраст» аккаунта 24 часа перед первым сообщением (мягкое ограничение, можно отключить правкой `forum-body.ts`).

## Миграция

`supabase/migrations/20250627000002_forum_e105.sql` — применить через `npm run supabase:migrate`.

## Примечание по правам

- RLS включён на всех таблицах форума.
- Публичное чтение — только для `public_read` категорий и опубликованных постов (`status = published`).
- Скрытие поста модератором: `status = hidden`.
