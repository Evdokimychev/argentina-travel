# Продуктовый и архитектурный аудит — 14 июля 2026

Baseline: `df839a6871c6697e7ed96aa0c45607629bd2e70f`. Проверено маршрутов: **354**, API: **225**, критичных: **66**.

## Подтверждённые корневые риски

1. Email-only поиск заявок раскрывал полные данные. Заменён на OTP и короткую lookup-сессию.
2. Создание заявки принимает готовый объект и клиентскую цену. Требует серверной команды и price snapshot.
3. В production-коде остаются localStorage/demo fallback. Требуется fail-closed конфигурация.

## Автоматически найденные классы

- `auth_contract_not_obvious`: 33
- `review_force_dynamic`: 4
- `client_supplied_booking_payload`: 1

Полная карта находится в `var/ops/product-audit-after.json`.
