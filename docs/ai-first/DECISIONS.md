# DECISIONS — Architecture Decision Records

Формат: статус, контекст, решение, последствия.

---

## ADR-001: AI-first development environment

**Статус:** Accepted (2026-06-27)

**Контекст:** Владелец — UX/UI дизайнер, основной инструмент разработки — Cursor AI. Нужна воспроизводимая среда и правила качества.

**Решение:**

- `AGENTS.md` + `.cursor/rules/` для workflow
- `docs/ai-first/` как документационный хаб
- `npm run audit*` для локальных проверок
- Без Prettier (ESLint only) — избежать mass reformat

**Последствия:** Новые фичи документируются; AI следует quality gates.

---

## ADR-002: Supabase + Prisma dual data layer

**Статус:** Accepted (legacy)

**Контекст:** Проект мигрировал на Supabase; Prisma остаётся для seed и части sync.

**Решение:** Supabase — source of truth для prod; Prisma schema синхронизируется; миграции в `supabase/migrations/`.

**Последствия:** При schema change — оба слоя + `write-migration-meta.mjs`.

---

## ADR-003: Tripster checkout URL — trust server fallbackUrl

**Статус:** Accepted (2026-06)

**Контекст:** Клиент пересобирал URL и ломал affiliate params.

**Решение:** Если сервер вернул `fallbackUrl` с date+time — использовать as-is; иначе rebuild с `HH:MM` (не seconds).

**Последствия:** См. `docs/integrations/tripster.md`, `checkout-url.ts`.

---

## ADR-004: Partner contact form archived

**Статус:** Accepted (2026-06)

**Контекст:** Tripster MFE не читает contact fields из URL для anonymous users.

**Решение:** `ENABLE_PARTNER_CONTACT_FORM = false`; booking через partner checkout only.

---

## ADR-005: Editorial standard — Russian-first content

**Статус:** Accepted

**Контекст:** Аудитория — русскоязычные туристы.

**Решение:** `.cursor/rules/editorial-standard.mdc` — литературный русский, факт-checking, минимум англицизмов в UI.

---

## ADR-006: Source-backed knowledge governance

**Статус:** Accepted (2026-07-15)

**Контекст:** В статической базе знаний и CMS смешивались проверенные и чувствительные материалы без единого контракта источников, reviewer, сроков проверки и прав на медиа. Публикация по одному полю `status` позволяла обходить редакционные требования.

**Решение:**

- публикационный шлюз работает fail-closed в приложении и PostgreSQL;
- `content_sources`, `knowledge_claims`, `dynamic_facts`, relations, widget/media usages хранят проверяемые связи;
- высокий и критический риск требует reviewer и актуальные verified claims;
- медиа с неподтверждёнными правами блокирует публикацию связанного CMS-документа;
- статическая база знаний применяет такой же принцип карантина через manifest;
- динамические значения не получают вымышленную дату fallback.

**Последствия:** Старые материалы не объявляются проверенными автоматически. Они остаются доступны редакции, но исключаются из публичного индекса до устранения критических нарушений. Миграция additive, feature flag по умолчанию выключен; rollback удаляет только новые governance-сущности после резервной копии.

---

## Шаблон нового ADR

```markdown
## ADR-NNN: Title

**Статус:** Proposed | Accepted | Deprecated

**Контекст:** ...

**Решение:** ...

**Последствия:** ...
```

Дополнительные решения см. в `docs/*-e*.md` (epic specs).
