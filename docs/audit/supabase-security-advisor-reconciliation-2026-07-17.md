# Supabase Security Advisor: сверка с репозиторием

Дата evidence: 17 июля 2026 года. Этот документ фиксирует только безопасный
repo-owned инкремент. Миграция не применялась к production и настройки проекта
через Dashboard не менялись.

## Исходный live evidence

Read-only повторная выгрузка Advisor для project ref
`wugdzhbqkvjxodbfdysq` показала 91 finding:

- 6 INFO `rls_enabled_no_policy`: `mercadopago_payment_observation_outcomes`,
  `mercadopago_payment_recovery_commands`,
  `mercadopago_unmatched_refund_observations`,
  `payment_reconciliation_case_actions`, `storefront_order_access_tokens`,
  `webhook_events`;
- 2 предупреждения `public_bucket_allows_listing`: `brand-assets` и
  `product-media`;
- 10 function-privilege findings `SECURITY DEFINER` для `anon`;
- 71 function-privilege findings `SECURITY DEFINER` для `authenticated`;
- отдельные рекомендации по leaked-password protection и MFA.

Anon-список: `audit_log_trigger`, `customer_owned`, `get_guest_order_journey`,
`handle_new_user`, `primary_storefront_org_id`, `rls_auto_enable`,
`storefront_org_ids`, `storefront_product_in_stock`, `user_is_org_owner`,
`user_org_ids`. Все они также входят в authenticated-список. Итого Advisor
показывает 71 уникальное имя функции и 81 role-specific function finding.

Сверка exact names с migrations и runtime usages дала только одно совпадение —
`public.handle_new_user()`. Остальные 70 функций, оба flagged bucket, их policies
и все 6 INFO-таблиц отсутствуют в текущем репозитории. Полного SQL-определения
этих live-only объектов в Advisor evidence нет, поэтому их нельзя безопасно
исправлять по одному имени.

## Подтверждённый repo-owned scope

Статический поиск миграций и всех runtime-вызовов приложения подтвердил четыре
repo-owned функции, которые используются только зарегистрированными триггерами
и не вызываются как RPC. Из них текущий live Advisor видит только
`handle_new_user`; остальные три закрываются проактивно до следующего deploy:

| Функция | Внутреннее назначение | Изменение |
|---|---|---|
| `public.handle_new_user()` | создаёт безопасный профиль после signup | direct execute закрыт для `PUBLIC`, `anon`, `authenticated`; разрешён `service_role` |
| `public.protect_profile_sensitive_fields()` | защищает роли профиля при update | то же |
| `public.touch_conversation_thread_on_message()` | обновляет время диалога после сообщения | то же |
| `public.touch_forum_thread_on_post()` | обновляет время темы после сообщения | то же |

Callable-функции бронирования, административных решений и RLS helper
`public.is_admin_with(text)` не изменялись: у них есть продуктовые потребители и
явные grants в собственных миграциях. Уже закрытые trigger-only функции
`public.enforce_profile_identity_controls()` и
`private.enqueue_blog_comment_report()` также не дублировались.

## Storage

Репозиторий не содержит создания, политик или runtime-использования бакетов
`brand-assets` и `product-media`. Любой DDL для них без capture фактических
policies, object paths и владельцев был бы небезопасным. Эти два finding остаются
release blocker класса **live schema drift**.

Вместо слепого изменения live-only бакетов сужены две подтверждённые repo-owned
политики:

- `cms-media`: object listing/metadata доступны только авторизованному
  администратору с `content.edit`;
- `organizer-products`: listing доступен владельцу UUID-префикса и такому
  администратору.

Оба бакета намеренно остаются public: публичные изображения сайта продолжают
отдаваться по существующим CDN/getPublicUrl адресам. Удаляется только возможность
анонимно перечислять object metadata. Это соответствует модели Supabase, где
публичная выдача файла не требует SELECT policy, а listing контролируется RLS.

## Неразрешённый live drift

70 Advisor function names отсутствуют в source migrations и не имеют
подтверждённых вызовов приложения. Они не изменялись. Полный exact-name inventory
сохранён ниже, чтобы следующий владелец не повторял discovery:

`apply_operations_attention_action`, `audit_log_trigger`,
`begin_order_payment_checkout`, `cancel_material_inventory_count`,
`cancel_purchase_order`, `commit_workshop_capacity_plan`,
`complete_crm_opportunity_activity`, `confirm_purchase_order`,
`convert_crm_quote_to_order`, `create_crm_opportunity`,
`create_purchase_order_with_items`, `create_sales_order_atomic`,
`create_sales_shipment_draft`, `customer_owned`, `deactivate_material_barcode`,
`dispatch_sales_shipment`, `finalize_order_payment_checkout`,
`get_customer_order_journey`, `get_guest_order_journey`,
`list_operations_attention_members`, `mark_crm_opportunity_lost`,
`mark_crm_opportunity_won`, `mark_supplier_return_credited`,
`mature_finished_stock`, `open_finished_good_quality_case`,
`open_sales_return_case`, `post_material_inventory_count`,
`primary_storefront_org_id`, `receive_purchase_order_items`,
`receive_sales_return`, `reconcile_material_inventory`,
`record_equipment_usage_atomic`, `record_manual_material_purchase`,
`record_manual_order_payment`, `record_manual_sales_refund`,
`record_mold_usage_atomic`, `record_production_defect`,
`record_purchase_order_supplier_followup`, `record_stock_movement_atomic`,
`record_unknown_material_scan`, `release_sales_order_stock`,
`replay_outbox_event`, `request_mercadopago_payment_refund`,
`reserve_sales_order_stock`, `resolve_finished_good_quality_case`,
`resolve_material_lot_quality`, `resolve_payment_reconciliation_case_safe`,
`resolve_sales_return`, `retry_mercadopago_payment_recovery`,
`retry_mercadopago_payment_refund`, `rls_auto_enable`,
`save_crm_quote_draft`, `save_material_barcode`,
`save_material_inventory_count_item`, `send_crm_quote`,
`set_crm_opportunity_next_activity`, `set_sales_order_status`,
`set_sales_shipment_status`, `ship_sales_order`,
`start_material_inventory_count`, `start_mto_order_production`,
`start_production_batch`, `storefront_org_ids`,
`storefront_product_in_stock`, `submit_batch_quality_check`,
`submit_finished_good_reinspection`, `transition_production_stage`,
`upsert_mrp_draft_order_atomic`, `user_is_org_owner`, `user_org_ids`.

До release нужно:

1. Экспортировать только read-only список `pg_proc`, owner, arguments,
   `prosecdef`, `proconfig` и `routine_privileges` для всех 81 function-privilege
   finding (одна функция может встречаться для нескольких ролей).
2. Сопоставить каждую функцию с PostgREST RPC, RLS policy, trigger или cron.
3. Для live-only объектов сначала создать baseline migration/schema ownership
   ledger, затем отдельную минимальную revoke/grant migration и rollback.
4. Повторно запустить Advisor и сохранить результат с project ref, timestamp и
   migration tree hash. До этого 91 исходный finding нельзя объявлять закрытым.

## Dashboard-only настройки

- **Leaked password protection:** включить в Auth → Password Security после
  проверки тарифа. Supabase использует Have I Been Pwned; настройка доступна на
  Pro и выше. Существующие пароли автоматически не заменяются.
- **MFA:** утвердить продуктовую политику enrolment/enforcement, recovery и
  поддержку пользователей; затем включить фактор и проверить `aal`-правила.

Эти настройки намеренно не менялись миграцией и не применялись внешне.

## Проверки и источники

- Контракт: `src/lib/security-advisor-repo-hardening.test.ts`.
- Контрактный тест: 3/3 PASS; targeted ESLint и `tsc --noEmit`: PASS.
- Изолированный PostgreSQL 17 smoke: PASS. Подтверждены отсутствие EXECUTE у
  `anon`/`authenticated`, сохранение trigger execution после revoke и RLS-матрица:
  `anon` — 0 объектов, owner — только собственный UUID-префикс, другой organizer —
  0 объектов, content staff — оба repo-owned media bucket.
- Production Supabase и Dashboard во время проверки не изменялись.
- [Supabase Database Functions: privileges и SECURITY DEFINER](https://supabase.com/docs/guides/database/functions)
- [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control)
- [Supabase public buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals)
- [Supabase password security](https://supabase.com/docs/guides/auth/password-security)
