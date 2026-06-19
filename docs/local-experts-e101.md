# E101 — Сообщество и локальные эксперты

## Что добавлено

- Таблицы Supabase:
  - `local_experts` — профили экспертов (slug, bio, city, categories, languages, status).
  - `expert_inquiries` — обращения туристов (CRM).
- Расширение `conversation_threads`:
  - nullable `booking_id`;
  - `expert_inquiry_id` для диалогов «турист ↔ эксперт» (messaging v2).
- Публичные страницы:
  - `/experts` — каталог с фильтрами город / категория / язык;
  - `/experts/[slug]` — профиль и форма «Написать эксперту».
- API:
  - `GET /api/experts`, `GET /api/experts/[slug]`;
  - `POST /api/experts/[slug]/inquiry`;
  - `POST /api/experts/apply` — заявка стать экспертом (статус `pending`);
  - `GET/PATCH /api/admin/experts` — модерация профилей и обращений.
- Админка: `/admin/marketplace/experts`.
- Seed: 6 опубликованных demo-экспертов в миграции.

## Категории экспертов

| Код | Подпись в UI |
|-----|--------------|
| `guide` | Гид |
| `relocation` | Переезд |
| `photo` | Фотограф |
| `family` | С семьёй |
| `nature` | Природа |
| `food` | Гастрономия |

## Поток обращения

1. Турист авторизован и отправляет форму на `/experts/[slug]`.
2. Создаётся запись `expert_inquiries` со статусом `open`.
3. Если у эксперта указан `user_id`, создаётся `conversation_threads` + первое сообщение.
4. Турист перенаправляется в `/profile/messages?thread=…`.
5. Уведомления — через `notifyConversationMessageCreated` (in-app, push, email).

Если у demo-эксперта нет `user_id`, обращение сохраняется в CRM; переписка создаётся после привязки аккаунта эксперта.

## RLS

- `local_experts`: публичное чтение только `published`; пользователь видит свой профиль; staff — полная модерация.
- `expert_inquiries`: insert/select для автора; select/update для эксперта-владельца; staff — полный доступ.
- `service_role` — полный доступ к обеим таблицам.

## Фолбэк без Supabase

При недоступной БД каталог читает `src/data/local-experts-seed.ts` (те же 6 профилей). Отправка обращений требует Supabase.

## Проверка

1. `npm run build`
2. `npm run rls-audit`
3. Открыть `/experts`, фильтры и карточки.
4. Отправить обращение авторизованным пользователем.
5. Админ: `/admin/marketplace/experts` — модерация заявок и обращений.
