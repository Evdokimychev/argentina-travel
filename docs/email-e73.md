# E73 — Транзакционные email-шаблоны v2

Единая система HTML-писем с plain-text fallback, учётом `notification_preferences` и заголовком `List-Unsubscribe`.

## Архитектура

| Компонент | Назначение |
|-----------|------------|
| `src/lib/notifications/email-templates/` | Макет и шаблоны: booking_confirmed, booking_status_changed, payment_received, review_approved, digest_daily |
| `src/lib/notifications/email-delivery.ts` | Отправка через Resend, проверка preferences, plain-text, List-Unsubscribe |
| `src/lib/notifications/unsubscribe-token.ts` | HMAC-токены отписки по категории |
| `GET/POST /api/notifications/unsubscribe?token=` | Отключение email-категории в `notification_preferences` |
| `src/lib/bookings-notify.ts` | Точки входа для заявок и оплат |

## Шаблоны

| ID | Когда отправляется | Категория preferences |
|----|-------------------|------------------------|
| `booking_confirmed` | Создание заявки (`bookings-store`) | `booking` |
| `booking_status_changed` | Смена статуса (`bookings-notify`) | `booking` |
| `payment_received` | Webhook Stripe/MP, локальная оплата | `payment` |
| `review_approved` | Модерация отзыва (`reviews-server`) | `reviews` |
| `digest_daily` | Cron `POST /api/admin/notifications/digest` | `system` |

Каждый шаблон возвращает `{ subject, html, text }`. HTML оборачивается в общий layout с шапкой «Пора в Аргентину», CTA-кнопкой и ссылкой отписки.

## Переменные окружения

```env
RESEND_API_KEY=
LEADS_NOTIFY_FROM=noreply@goargentina.ru
LEADS_NOTIFY_EMAIL=          # копия admin-алертов и platform digest
NOTIFICATION_UNSUBSCRIBE_SECRET=   # опционально; иначе SUPABASE_SERVICE_ROLE_KEY
```

Без `RESEND_API_KEY` отправка пропускается (non-blocking).

## Отписка

1. В каждом письме зарегистрированному пользователю — ссылка «Отписаться от писем этой категории».
2. Заголовки Resend: `List-Unsubscribe`, `List-Unsubscribe-Post` (RFC 8058 stub).
3. `GET /api/notifications/unsubscribe?token=…` — HTML-страница подтверждения, отключает `email` для категории.
4. `POST` с тем же token — one-click для почтовых клиентов.

Токен: `base64url(JSON({ userId, category })).hmac-sha256`.

## Deliverability (SPF / DKIM)

Письма уходят через [Resend](https://resend.com/docs/dashboard/domains/introduction). Для домена отправителя (`LEADS_NOTIFY_FROM`, например `noreply@goargentina.ru`):

1. **Добавьте домен** в Resend Dashboard → Domains.
2. **SPF** — Resend выдаст TXT-запись `v=spf1 include:…` для вашего DNS. Убедитесь, что нет конфликтующих SPF-записей (допускается одна SPF на домен).
3. **DKIM** — добавьте CNAME/TXT, которые показывает Resend после верификации домена.
4. **DMARC** (рекомендуется): `v=DMARC1; p=none; rua=mailto:…` на `_dmarc.goargentina.ru`, затем ужесточайте политику после мониторинга.
5. **From-адрес** — используйте верифицированный домен; `onboarding@resend.dev` только для разработки.
6. **Plain-text** — все шаблоны E73 отправляют пару `html` + `text` (лучше для фильтров и клиентов без HTML).
7. **List-Unsubscribe** — снижает жалобы на спам для digest и маркетинговых категорий; транзакционные письма по заявкам тоже поддерживают отписку по категории.

Подробнее: [Resend — Domain Verification](https://resend.com/docs/dashboard/domains/introduction), [Google Postmaster](https://postmaster.google.com/).

## Проверка локально

1. Задайте `RESEND_API_KEY` и `LEADS_NOTIFY_FROM` (sandbox Resend).
2. Создайте заявку — должно прийти письмо «Заявка принята» (html + text).
3. Смените статус заявки — «Статус заявки» туристу и admin-копия на `LEADS_NOTIFY_EMAIL`.
4. `POST /api/admin/notifications/digest` (admin session) — сводка за 24 ч.
5. Одобрите отзыв в модерации — «Ваш отзыв опубликован».
6. Откройте ссылку отписки из письма — категория отключается в `/profile` → уведомления.

## Связанные задачи

- E46 — `notification_preferences`, hub in-app
- E66/E41 — webhooks оплат → `payment_received`
- E46 digest cron — `digest_daily`
