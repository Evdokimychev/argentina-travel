# E66: Stripe — полная интеграция оплаты

Интеграция Stripe Checkout с паритетом по capture-flow относительно Mercado Pago (E41).

## Переменные окружения

| Переменная | Назначение |
|------------|------------|
| `STRIPE_SECRET_KEY` | Серверный ключ для Checkout Session и live-fetch в админке |
| `STRIPE_WEBHOOK_SECRET` | Секрет подписи webhook (`whsec_…`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Публичный ключ — показ Stripe в UI выбора провайдера |
| `STRIPE_ENABLED` / `NEXT_PUBLIC_STRIPE_ENABLED` | Явное включение (по умолчанию — при наличии ключей) |

Без `STRIPE_SECRET_KEY` API сессии возвращает **503** — фиктивных списаний нет.

## API

### Создание сессии

`POST /api/bookings/[id]/payment/stripe/session`

Тело: `{ "paymentLinkToken": "…" }`

Ответ: `{ "sessionId", "checkoutUrl" }`

Повторный запрос для той же ссылки с `gateway=stripe` возвращает сохранённую сессию.

### Webhook

`POST /api/webhooks/payments/stripe`

Обрабатываемые события:

- `payment_intent.succeeded` — списание (captured → `paid`)
- `payment_intent.amount_capturable_updated` — авторизация (`authorized` → `pending`)
- `payment_intent.payment_failed` — отказ
- `charge.refunded` — возврат (`refunded`)

Цепочка та же, что у MP: verify signature → fetch объекта из Stripe API → `mapWebhookToBookingPaymentUpdate` → `applyPaymentWebhookPatch` → `persistWebhookChargeTransaction` с `receipt` в metadata.

## Маппинг статусов

| Stripe | Фаза capture | Статус бронирования |
|--------|--------------|---------------------|
| `requires_capture` | authorized | pending |
| `succeeded` | captured | paid |
| `processing`, `requires_*` | pending | pending |
| `canceled`, `failed` | failed | pending |
| charge.refunded (полный) | refunded | refunded |
| charge.refunded (частичный) | captured | partial |

## UI

- **BookingPaymentLinkView** — выбор Mercado Pago / Stripe, если оба провайдера доступны на клиенте (`NEXT_PUBLIC_*`).
- **AdminPaymentLedgerView** — drawer с live-данными Stripe (PaymentIntent или Charge).
- **BookingPaymentResultView** — без изменений; polling статуса через существующий API.

## Журнал транзакций

`payment_transactions.provider = 'stripe'`, `external_id` = PaymentIntent id, metadata:

```json
{
  "receipt": {
    "providerPaymentId": "pi_…",
    "providerStatus": "succeeded",
    "capturePhase": "captured",
    "dateCreated": "…",
    "dateApproved": "…"
  }
}
```

## Настройка Stripe Dashboard

1. Developers → Webhooks → Add endpoint: `https://<host>/api/webhooks/payments/stripe`
2. События: `payment_intent.succeeded`, `payment_intent.amount_capturable_updated`, `payment_intent.payment_failed`, `charge.refunded`
3. Скопировать signing secret в `STRIPE_WEBHOOK_SECRET`

## Связь с E41 (Mercado Pago)

| Аспект | Mercado Pago | Stripe |
|--------|--------------|--------|
| Checkout | Preference / init_point | Checkout Session / url |
| Webhook verify | HMAC x-signature | HMAC stripe-signature |
| Live admin fetch | GET /v1/payments/:id | GET /v1/payment_intents/:id |
| Capture phases | mapMercadoPagoCapturePhase | mapStripeCapturePhase |

## Будущие задачи

- Возвраты через Stripe Refunds API (аналог `MERCADOPAGO_REFUNDS_ENABLED`)
- Manual capture + отложенное списание
- Connect / split для выплат организаторам
