# Добавочная модель источников, claims, медиа и динамических фактов

Это предложение, а не выполненная миграция. Существующие таблицы не удаляются и не переименовываются.

## Наблюдаемые ограничения текущей модели

- `content_documents` хранит body/seo и четыре статуса, но не risk, reviewer, fact-check dates или publication gate result.
- `content_revisions` не включает статус, review/source/media relations и причину rollback.
- `content_freshness` отделён от claims и использует единый срок.
- `cms_media_assets` не хранит права, creator/source/license URL, hash и usages.
- CMS body blocks не имеют типизированных `ClaimSource`, `PriceFact` и `SourceList` контрактов.
- `Place.rating`, `ticketPrice` и `popularity` допускают неподтверждённые значения без provenance.

## Добавочные таблицы

### `source_records`

`id uuid`, `title`, `authority`, `url`, `source_type`, `jurisdiction`, `language`, `published_at`, `updated_at`, `checked_at`, `accessed_at`, `content_hash`, `archive_reference`, `trust_level`, `status`, `notes`, timestamps. Unique для нормализованного URL; статус: `active`, `changed`, `broken`, `archived`, `review_required`.

### `knowledge_claims`

`id uuid`, `statement`, `locale`, `topic`, `risk_level`, `jurisdiction`, `effective_from/to`, `last_verified_at`, `next_review_at`, `verified_by`, `status`, `notes`, timestamps. Claim не содержит единственный `source_id`: одно утверждение может требовать несколько источников.

### `content_claims`

`document_id`, `claim_id`, `section_id`, `revision_id`, `display_mode`, `sort_order`. Unique по документу/ревизии/claim/section.

### `claim_sources`

`claim_id`, `source_id`, `support_type` (`primary`, `corroborating`, `context`, `contradicting`), `locator`, `quoted_hash`, `checked_at`. Это даёт many-to-many и фиксирует, что именно подтверждает источник.

### `content_reviews`

`id`, `document_id`, `revision_id`, `review_type`, `decision`, `reviewer_id`, `comment`, `created_at`. Решения неизменяемы; новое решение не перезаписывает старое.

### `media_assets_v2`

`id`, storage/original URLs, creator, creator profile, source platform/page, media hash, размеры, mime, capture date, location/coordinates, status, timestamps.

### `media_rights`

`asset_id`, `license`, `license_url`, `attribution_text`, `rights_basis`, `evidence_url`, `accessed_at`, `verified_at`, `verified_by`, `status`, `expires_at`, notes. Один asset может иметь историю rights records; публикуется только текущий verified.

### `media_usages`

`asset_id`, `document_id`, `revision_id`, `role`, `locale`, `caption`, `alt`, `focal_point`, `sort_order`. Устраняет копирование одного файла под разными source metadata.

### `dynamic_facts`

`id`, `kind`, `entity_id`, `label`, `value_json`, `currency`, `unit`, `source_id`, `observed_at`, `verified_at`, `expires_at`, `fetch_method`, `fallback_kind`, `status`, `confidence`, notes. Value хранится в исходной валюте/единице; производная конвертация не становится source fact.

### `publication_events` и `content_outbox`

Immutable audit событий publish/unpublish/rollback/gate failure и retryable события search reindex/cache invalidation. Это заменяет молчаливое проглатывание ошибок индексации.

## Добавочные поля существующих таблиц

`content_documents`: `workflow_status`, `risk_level`, `editor_id`, `reviewer_id`, `last_substantive_update_at`, `last_fact_checked_at`, `next_review_at`, `approved_revision_id`, `schema_version`.

`content_revisions`: snapshot workflow/risk/fact dates и `relations_snapshot jsonb` либо отдельные revision-scoped relations. Существующий `status` остаётся совместимым публичным статусом.

`cms_media_assets`: на переходе добавить `content_hash`, `rights_status`; затем читать права из `media_rights`.

## Publication function

Единственная security-definer/server функция `publish_content_revision(document_id, revision_id, actor_id)` проверяет роль и все gates, записывает publication event, обновляет approved revision и outbox в одной транзакции. Прямой update статуса для обычных staff запрещается RLS.

## Переход без разрушений

1. Создать таблицы/индексы/RLS без изменения текущего чтения.
2. Backfill источников из Markdown и claims со статусом `review_required`; не выдавать импорт за verification.
3. Backfill media assets по hash; конфликтующие provenance-группы оставить blocked.
4. Включить dual-write для CMS под feature flags `content_governance_v2`, `media_rights_gate`, `dynamic_facts_v2`.
5. Сначала показать health dashboard, затем warning-only gate, затем blocking gate для critical, после этого для high.
6. Перевести публичное чтение на approved revision; старый TS fallback отключать по типам, не одним переключателем.

## Rollback миграции и rollout

- при проблеме отключить feature flags и вернуть чтение к существующим `content_documents`/TS;
- новые таблицы сохранить: они добавочные и не мешают старому пути;
- dual-write можно остановить без потери старых колонок;
- approved revision не удаляет предыдущую опубликованную ревизию;
- destructive drop выполнять только отдельной миграцией после полного цикла экспорта и rehearsal;
- rollback данных: новая публикация старого полного revision snapshot, не UPDATE старой ревизии;
- перед включением blocking gate проверить RLS, backup schema, backfill counts, source/media conflicts, scheduled publish и search outbox.

## Риски реализации

- смешение CMS и TS может дать две версии одного slug;
- backfill article-level sources нельзя автоматически считать claim-level evidence;
- пересчёт hash обнаружит неверное происхождение, но не определит истинный source автоматически;
- расширение статусов затронет фильтры admin, scheduled job, типы и API;
- публичные fallback-значения Place (`rating`, `popularity`, `ticketPrice`) должны быть выведены из UI либо перенесены в проверенные relations/facts.
