# Migration plan

Production health на 2026-07-15: `20260715032401_secure_auth_role_bootstrap`. Кандидат содержит 66 migration files, latest `20260715132000_email_delivery_outbox`.

## Новые миграции

1. `20260715123000_fix_admin_preset_capabilities.sql` — preset + explicit RBAC overrides.
2. `20260715124500_lock_profile_roles.sql` — запрет self organizer/admin.
3. `20260715130000_lock_conversation_participants.sql` — direct participant writes закрыты.
4. `20260715131500_partner_booking_idempotency.sql` — durable partner operation ledger.
5. `20260715132000_email_delivery_outbox.sql` — service-role-only transactional email queue.

## Безопасный порядок

1. Schema и data backup, подтверждение точки восстановления.
2. Применить все пять миграций на production-like staging в одной контролируемой серии.
3. Проверить owner admin, support/content presets, отрицательный self-role upgrade и direct conversation insert.
4. Проверить конкурентный повтор одного partner operation key и replay сохранённого ответа без реального платного заказа.
5. Проверить email success/failure/retry/dead state на тестовом получателе.
6. Прогнать privacy fixture со строками во всех таблицах реестра; completed допустим только при нулевой ошибке.
7. `supabase:verify`, `rls-audit`, `audit:quick`, затем preview deploy.
8. Production apply только в согласованное окно; сверить `/api/health.migrationVersion` и 60 минут логов.

Уже опубликованный SQL не редактировать. Откат схемы выполняется новой forward migration; небезопасные self-role/direct conversation policies не восстанавливать.
