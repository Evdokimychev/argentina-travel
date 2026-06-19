# E86 — Pipeline актуальности контента (immigration/visa)

## Что реализовано

E86 вводит сквозной контроль «свежести» материалов по иммиграции/визам:

1. Храним метаданные проверки в `public.content_freshness`.
2. Показываем в админке список просроченных материалов (`> 90` дней).
3. На публичной странице иммиграции:
   - бейдж `Обновлено {дата}` для свежих материалов;
   - предупреждение для критически устаревших (`> 180` дней).
4. Cron отправляет email-отчёт администрации о просроченных документах.

---

## Схема данных

Миграция: `supabase/migrations/20250626000001_content_freshness.sql`

Таблица: `public.content_freshness`

- `doc_slug text` — slug материала
- `doc_type text` — тип документа (из CMS-типов: `legal|blog|guide|destination|place`)
- `last_verified_at timestamptz` — когда материал в последний раз сверяли
- `next_review_at timestamptz` — дедлайн следующей проверки
- `owner text` — ответственный редактор/роль
- служебные поля: `id`, `created_at`, `updated_at`
- уникальность: `(doc_slug, doc_type)`

RLS:

- публичный `SELECT` (для безопасного серверного рендера при anon-key),
- полный доступ `service_role`.

---

## Админка

- Страница: `/admin/content-freshness`
- API: `GET /api/admin/content-freshness`
- Capability: `content.edit`

Поведение:

- выводит только просроченные материалы (`ageDays > 90`);
- фильтр по `docType`;
- отдельный счётчик критичных (`ageDays > 180`);
- показывает дату последней проверки, следующий срок ревью и владельца.

---

## Публичный UX (иммиграционные страницы)

Файл рендера: `src/components/content/ContentPageView.tsx`  
Источник свежести: `src/lib/content-freshness-server.ts` + `content_freshness`.

Логика:

- `fresh` (`<= 90`) и в пределах нормального срока: зелёный бейдж `Обновлено {дата}`;
- `critical` (`> 180`): warning-баннер о риске устаревших данных;
- дата последней проверки выводится в шапке материала.

---

## Cron и email

- Новый маршрут: `GET/POST /api/cron/content-freshness`
- Встроен в оркестратор `GET /api/cron/platform-maintenance` (запуск около `07:00 UTC`)
- Статус выполнения пишется в `var/ops/cron-last.json` как `contentFreshness`

Email:

- Шаблон: `content-freshness-report`
- Отправка через `sendContentFreshnessReportEmail`
- Получатели:
  1. `CONTENT_FRESHNESS_NOTIFY_EMAILS` (comma-separated),
  2. fallback: `LEADS_NOTIFY_EMAIL`.

---

## Переменные окружения

Добавлено в `.env.example`:

```env
CONTENT_FRESHNESS_NOTIFY_EMAILS=
```

---

## Технические заметки

- Первичная инициализация строк в `content_freshness` делается автоматически из `src/data/immigration-content.ts` (без перезаписи существующих записей).
- Текущее покрытие E86 ориентировано на иммиграционные материалы (они мапятся в `doc_type = guide`), но таблица и API уже готовы к расширению на другие типы CMS.
