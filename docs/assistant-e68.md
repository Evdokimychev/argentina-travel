# E68 — Помощник по материалам сайта (guide Q&A)

ИИ-помощник отвечает на вопросы туристов по материалам путеводителя, блога и раздела об иммиграции. Контекст берётся из индекса `search_documents` (E38) — топ‑5 фрагментов через Postgres FTS (или Meilisearch, E45, если настроен).

## Архитектура

| Компонент | Назначение |
|-----------|------------|
| `src/lib/ai/guide-assistant.ts` | RAG, системный промпт, вызов OpenAI/Anthropic через `fetch` |
| `POST /api/assistant/ask` | Rate limit, логирование, JSON-ответ |
| `GuideAssistantWidget` | Плавающая кнопка на `/guide/*`, `/immigration/*`, `/faq` |
| `analytics_events.event_type = assistant_ask` | Продуктовая аналитика (E47) |

## Переменные окружения

```env
OPENAI_API_KEY=          # один из двух провайдеров
OPENAI_MODEL=gpt-4o-mini
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-3-5-haiku-20241022
GUIDE_ASSISTANT_PROVIDER=openai   # или anthropic
```

Если ключи **не заданы**, API возвращает **200** с режимом `search_fallback`: подборка статей из поиска без генерации текста. Жёсткой зависимости от OpenAI нет.

При ошибке провайдера — тот же fallback, без 503.

## API

### `POST /api/assistant/ask`

```json
{
  "question": "Нужна ли виза россиянам?",
  "pageUrl": "https://www.goargentina.ru/guide/...",
  "sessionId": "uuid-from-localStorage"
}
```

Ответ:

```json
{
  "answer": "…",
  "sources": [{ "id": "…", "title": "…", "url": "/guide/…", "kind": "guide", "snippet": "…" }],
  "mode": "ai",
  "aiConfigured": true
}
```

- Rate limit: **8 запросов / мин / IP**
- Максимальная длина вопроса: **500** символов

### `GET /api/assistant/ask`

Health/metadata: `aiConfigured`, описание endpoint.

## Системный промпт

- Литературный русский, фактологичность, ссылки на источники
- По визам и правовым темам — фраза «уточняйте перед поездкой»
- Без выдуманных фактов вне переданных фрагментов

## Миграция Supabase

```bash
npm run supabase:migrate
```

Файл: `supabase/migrations/20250625000000_assistant_analytics.sql` — добавляет `assistant_ask` в RLS для `analytics_events`.

## UI

Виджет в правом нижнем углу (не перекрывает кнопку поиска слева). Чат — bottom sheet на мобильных, панель на desktop. Источники — кликабельные карточки с URL guide/blog.

## Проверка локально

1. Без ключей: задайте вопрос на `/guide` — должен прийти fallback с источниками.
2. С `OPENAI_API_KEY`: ответ в режиме `ai`.
3. DevTools → Network: заголовок `Retry-After` при 429.
4. Supabase: строка в `analytics_events` с `event_type = assistant_ask`.

## Будущие интеграции

- Админ-воронка: шаг «вопрос помощнику» рядом с `tour_view`
- Персонализация для авторизованных (контекст бронирований — отдельная задача)
- Стриминг ответа (SSE) при росте нагрузки
