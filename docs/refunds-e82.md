# E82: безопасные возвраты Stripe и Mercado Pago

Возвраты работают по принципу «четырёх глаз»: один сотрудник или организатор
подготавливает запрос, другой финансовый сотрудник его утверждает. Создание
запроса **никогда не вызывает API платёжного провайдера**.

## Состояния и ответственность

1. `pending` — сумма атомарно зарезервирована по конкретному завершённому
   списанию (`source_transaction_id`).
2. `processing` — другой сотрудник атомарно забрал запрос на исполнение;
   повторный вызов провайдера заблокирован.
3. `completed` — провайдер подтвердил возврат или финансовый контролёр завершил
   ручной возврат.
4. `failed` / `rejected` — возврат завершился ошибкой или был отклонён.

Сумма всех `pending` + `processing` + `completed` возвратов не может превысить
сумму исходного списания. Для повторов используется клиентский UUID
`operationId`; одинаковый ключ возвращает исходный запрос, а не создаёт новый.

## API

### Подготовка

- `POST /api/admin/payments/refund` — capability
  `finance.refunds.prepare`, только личная сессия сотрудника.
- `POST /api/organizer/payments/refund-request` — организатор и только его
  бронирование.
- `POST /api/bookings/[id]/payment/refund` — турист и только доступное ему
  бронирование.

Обязательное поле: `operationId` (UUID). Админский запрос дополнительно передаёт
`sourceTransactionId`, когда возврат создаётся из строки исходного списания.
Ответ содержит `nextStep: "approval_required"`.

### Утверждение и отклонение

- `POST /api/admin/payments/refunds/[id]/approve` — capability
  `finance.refunds.approve`; создатель запроса не может его утвердить.
- `POST /api/admin/payments/refunds/[id]/reject` — тот же отдельный контроль.

Перед обращением к Stripe или Mercado Pago база атомарно переводит запись из
`pending` в `processing`. Provider idempotency key стабилен и зависит от операции
возврата. При неопределённом сетевом результате запись остаётся `processing` для
сверки — система не повторяет списание вслепую.

### Read-only сверка `processing`

`GET /api/admin/payments/transactions/[id]?live=1` для refund-строки читает
список возвратов именно исходного provider payment, а не использует refund ID
как PaymentIntent/payment ID. Результат классифицируется как `exact_match`,
`candidate`, `ambiguous`, `not_found` или `unavailable` и всегда возвращает
`safeToMutate: false`.

- Stripe lookup использует `GET /v1/refunds?payment_intent=…` или `charge=…`.
  Новые refund POST записывают `metadata[goargentinaRefundId]`, поэтому после
  потери ответа возможна точная read-only корреляция с локальной транзакцией.
- Mercado Pago lookup использует `GET /v1/payments/{id}/refunds`. Endpoint
  создания возврата не принимает отдельную metadata локальной операции, поэтому
  совпадение только по сумме остаётся неподтверждённым кандидатом.
- Известный `external_id` или Stripe metadata могут дать точное совпадение, но
  даже оно не разрешает finalize без атомарного recovery lease/CAS.
- Пустой provider list не доказывает, что предыдущий запрос не выполняется, и не
  разрешает повторный POST.

Автоматическое восстановление остаётся закрытым: до него нужно подтвердить live
migration journal, добавить lease token/expiry и обязать finalize проверять токен.

## Настройка провайдеров

- Stripe: `STRIPE_SECRET_KEY`.
- Mercado Pago: `MERCADOPAGO_ACCESS_TOKEN` и
  `MERCADOPAGO_REFUNDS_ENABLED=true`.

Если провайдер не настроен, утверждение возвращает явную ошибку до атомарного
захвата запроса. Реального тестового возврата без явной конфигурации не происходит.

## Данные и аудит

Миграция `20260717031000_finance_atomic_controls.sql` добавляет:

- уникальный `request_idempotency_key`;
- ссылку на точное исходное списание;
- поля атомарного захвата и отдельных исполнителей;
- транзакционные RPC с доступом только для `service_role`;
- записи `admin_audit_log` в той же транзакции, что и финансовое изменение.

WP-015A не меняет схему и не вызывает provider mutation: это операторская
диагностика и подготовка устойчивой корреляции для будущего recovery.
