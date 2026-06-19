# E104 — Умный подбор тура (AI v2)

## Что добавлено

- **`src/lib/ai/tour-matcher.ts`** — scoring туров по intent (регион, бюджет, длительность, состав группы, темп, нагрузка) и rule-based fallback без AI-ключа.
- **`POST /api/ai/tour-match`** — диалоговый подбор с session memory и карточками рекомендаций.
- **Таблицы Supabase:**
  - `ai_match_sessions` — история сообщений (`messages` jsonb), `user_id` nullable, `expires_at` (7 дней).
  - `ai_match_events` — анонимная аналитика запросов и выдачи для админки.
- **UI на `/podbor`:** чат-панель `PodborTourMatchChat` + карточки `PodborMatchedTourCard` с блоком «Почему этот тур».
- **Rate limit:** middleware, 10 запросов/мин на IP для `POST /api/ai/tour-match`.

## API

### `POST /api/ai/tour-match`

**Тело запроса:**

```json
{
  "query": "Семья с ребёнком, Патагония, до 2000 $, 8 дней",
  "filters": {
    "region": "patagonia",
    "budgetMaxUsd": 2000,
    "durationMinDays": 7,
    "durationMaxDays": 10,
    "audience": "family"
  },
  "sessionId": "uuid-optional"
}
```

**Ответ `200`:**

```json
{
  "explanation": "Краткое пояснение на русском…",
  "tours": [
    {
      "tour": {
        "id": "…",
        "slug": "…",
        "title": "…",
        "shortDescription": "…",
        "image": "…",
        "priceUsd": 1800,
        "durationDays": 8,
        "region": "Патагония",
        "destination": "…",
        "rating": 4.8,
        "reviewCount": 12,
        "priceOnRequest": false,
        "priceFromPrefix": false,
        "comfortLevel": "Комфорт",
        "difficultyLevel": "Умеренная",
        "activityType": "Пешие туры"
      },
      "score": 18.5,
      "explanation": "…",
      "reasons": ["подходит под регион «Патагония»", "укладывается в бюджет…"]
    }
  ],
  "sessionId": "uuid",
  "mode": "ai",
  "aiConfigured": true,
  "intent": {
    "region": "patagonia",
    "budgetMaxUsd": 2000,
    "durationMaxDays": 10,
    "audience": "family"
  }
}
```

**Ошибки:**

| Код | Причина |
|-----|---------|
| 400 | Пустой или слишком короткий `query`, некорректный JSON |
| 429 | Превышен rate limit (middleware) |

### `GET /api/ai/tour-match`

Мета-описание эндпоинта и флаг `aiConfigured`.

## Scoring и fallback

1. Из текста запроса извлекается intent: регион, бюджет, длительность, аудитория, темп, нагрузка.
2. Каждый тур каталога получает score по весам (регион, бюджет, длительность, audience/pace/fitness через поля карточки: `difficultyLevel`, `childrenAllowed`, `badges`, `comfortLevel`).
3. В ответ попадает до 6 туров; при наличии каталога — минимум 3 (если score > 0 недостаточно, берутся лучшие по общему рейтингу).
4. Без `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` — `mode: "rule_based"`, объяснения формируются из фактов карточки тура без выдуманных деталей.
5. С AI — краткий вводный абзац на русском; пояснения к карточкам остаются rule-based по данным каталога.

## Session memory

- Клиент хранит `sessionId` в `localStorage` (`podbor-tour-match-session-id`).
- Сервер upsert в `ai_match_sessions` через service role.
- Authenticated пользователь может читать свои сессии (`user_id = auth.uid()`).

## RLS

- `ai_match_sessions`: select для authenticated (свои), full access для `service_role`.
- `ai_match_events`: insert для `anon`/`authenticated` (`match_query`, `match_result`), select для `service_role`.

## Связь с редактором организатора

Matcher учитывает поля карточки тура, которые организатор задаёт в редакторе:

| Поле редактора | Влияние на matching |
|----------------|---------------------|
| `difficultyLevel` | fitness / pace |
| `childrenAllowed`, badge `family` | audience: family |
| `comfortLevel`, `activityType` | pace, ключевые слова |
| `region`, `destination`, `durationDays`, `priceUsd` | базовый scoring |

## Проверка

```bash
npm run build
npm run rls-audit
```
