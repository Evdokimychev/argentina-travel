# Процесс подготовки и публикации

## Состояния

```text
draft → research → fact_check → editorial_review
      → legal_review (по риску)
      → media_review → ready → scheduled → published
published → stale → fact_check
published → archived
published → rollback_required → восстановленная ревизия
```

Состояния `research`, `fact_check`, `editorial_review`, `legal_review`, `media_review`, `ready`, `stale` пока отсутствуют в constraint `content_documents_status_check`. До добавочной миграции они являются проектным контрактом, а не реализованной функцией.

## Переходы

| Из | В | Кто | Обязательные доказательства |
|---|---|---|---|
| draft | research | автор | intent, canonical/duplicate check, список claims |
| research | fact_check | исследователь | SourceRecord для каждого изменяемого факта |
| fact_check | editorial_review | фактчекер | claim-source mapping, даты и срок следующей проверки |
| editorial_review | legal_review | редактор | требуется для critical/sensitive |
| editorial_review | media_review | редактор | если legal review не требуется |
| legal_review | media_review | reviewer | решение approve/reject с комментарием |
| media_review | ready | media editor | rights verified, alt, caption, usage, размеры |
| ready | scheduled/published | publisher | publication gate = pass, preview проверен |
| published | stale | система | наступил `next_review_at`/`expires_at` или изменился source hash |
| published | rollback_required | publisher/system | подтверждённая ошибка или нарушение прав |

## Gate перед публикацией

Проверка выполняется сервером в одной транзакции. Клиентская кнопка не является контролем.

1. Документ существует в нужной locale и не является machine draft.
2. Все critical/high claims имеют активный primary source и reviewer.
3. `next_review_at` находится в будущем.
4. Все source links прошли проверку; 404/5xx для обязательного источника блокирует выпуск.
5. Все media usages ссылаются на `rights_status=verified`.
6. DynamicFact не просрочен; fallback промаркирован и не выглядит live.
7. Нет unresolved conflict, duplicate slug или orphan relation.
8. Создан immutable revision snapshot и audit event.
9. Search reindex ставится в outbox; сбой не должен теряться молча.

Текущий `syncSearchAfterCmsDocumentChange` проглатывает ошибку, поэтому публикация может закончиться без обновлённого индекса. Целевой процесс записывает retryable outbox event и показывает состояние `published_search_pending`.

## Просроченный контент

- critical claim: снять конкретный ответ/сумму, показать ссылку на официальный источник; материал переводится в `stale`;
- high dynamic fact: не показывать точное значение после `expires_at`;
- medium/low: оставить доступным только при явной маркировке даты, поставить в очередь;
- изменение source content hash: создать задачу даже до плановой даты.

## Rollback

1. Publisher выбирает опубликованную ревизию, видит diff и причину возврата.
2. Система создаёт новую ревизию из старой; старые записи не меняются.
3. Восстанавливаются title/body/seo, claims, source links, media usages, review decisions и dynamic fact references.
4. Для emergency rollback допустимо сразу опубликовать восстановленную ревизию, но причина обязательна.
5. Search reindex и cache invalidation записываются в outbox.

Текущая реализация `restoreCmsDocumentFromRevision` восстанавливает title/body/seo и статус, но не способна восстановить отсутствующие в модели источники, claims, права и review decisions. Поэтому её нельзя считать полным редакционным rollback.

## Проверки перед включением gate

- unit: вычисление риска, freshness, expiry, source validity;
- integration: sensitive without source/reviewer blocked, media without rights blocked, stale fact blocked;
- integration: scheduled publish повторно запускает тот же gate;
- integration: rollback восстанавливает relations и создаёт новую ревизию;
- E2E: редактор видит точную причину блокировки и не может обойти её прямым API;
- RLS: actor без `content.publish` не публикует и не подтверждает review.
