# E71 — Плановые задачи (Cron)

Защищённые API-маршруты для планового запуска фоновых задач на Vercel Cron или вручную.

## Авторизация

`src/lib/cron/authorize-cron.ts` принимает:

1. **Vercel Cron** — заголовок `x-vercel-cron: 1` или `x-vercel-cron-auth-token`
2. **Ручной вызов** — `Authorization: Bearer <CRON_SECRET>`

Переменная `CRON_SECRET` (минимум 16 символов) задаётся в Vercel → Settings → Environment Variables. Vercel автоматически подставляет её в `Authorization` при вызове cron.

## Маршруты

| Путь | Расписание (UTC) | Назначение |
|------|------------------|------------|
| `POST/GET /api/cron/notifications/digest` | `0 8 * * *` | Ежедневная email-сводка (E46) |
| `POST/GET /api/cron/messaging/cleanup-typing` | `*/5 * * * *` | Удаление `typing_presence` старше 15 мин (E67) |
| `POST/GET /api/cron/ops/backup-hint` | `0 3 * * 0` | Дамп схемы Postgres + метаданные в `var/ops/` (E48) |

Vercel Cron вызывает маршруты через **GET**; для ручного запуска предпочтителен **POST**.

## vercel.json (Hobby: максимум 2 cron)

На плане **Hobby** Vercel разрешает только **2** cron-задачи. Используются оркестраторы:

| Путь | Расписание (UTC) | Что запускает |
|------|------------------|---------------|
| `/api/cron/affiliate-sync` | `0 4 * * *` | Tripster + Sputnik8 |
| `/api/cron/platform-maintenance` | `*/5 * * * *` | typing cleanup; digest в 08:00; backup по воскресеньям 03:00 |

Отдельные маршруты (`/api/cron/notifications/digest`, `/api/cron/messaging/cleanup-typing`, `/api/cron/ops/backup-hint`, `/api/cron/tripster-sync`, `/api/cron/sputnik8-sync`) остаются для **ручного** POST/GET с `CRON_SECRET`.

Legacy sync-маршруты (`tripster-sync`, `sputnik8-sync`) используют `authorizeCronRequest` — Vercel Cron и Bearer `CRON_SECRET`.

```json
{
  "crons": [
    { "path": "/api/cron/affiliate-sync", "schedule": "0 4 * * *" },
    { "path": "/api/cron/platform-maintenance", "schedule": "*/5 * * * *" }
  ]
}
```

## Ручной запуск (локально / staging)

```bash
export CRON_SECRET=your-secret

curl -X POST "$NEXT_PUBLIC_SITE_URL/api/cron/notifications/digest" \
  -H "Authorization: Bearer $CRON_SECRET"

curl -X POST "$NEXT_PUBLIC_SITE_URL/api/cron/messaging/cleanup-typing" \
  -H "Authorization: Bearer $CRON_SECRET"

curl -X POST "$NEXT_PUBLIC_SITE_URL/api/cron/ops/backup-hint" \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Статус в админке

Последние запуски пишутся в `var/ops/cron-last.json` и отображаются в **Настройки → Эксплуатация**.

## Зависимости

| Задача | Переменные | Поведение без ключей |
|--------|------------|----------------------|
| digest | `RESEND_API_KEY`, `LEADS_NOTIFY_EMAIL` | Пропуск без отправки, лог на русском |
| cleanup-typing | Supabase service role | Ошибка 500 при недоступности БД |
| backup-hint | `DATABASE_URL`, `pg_dump` в PATH | Пропуск или 500 с сообщением |

## Лимиты Vercel

На Hobby-плане — до 2 cron-задач; на Pro — больше. При превышении лимита оставьте в `vercel.json` только критичные задачи (например, `cleanup-typing` и `digest`), остальные запускайте через внешний scheduler (GitHub Actions, cron на VPS).
