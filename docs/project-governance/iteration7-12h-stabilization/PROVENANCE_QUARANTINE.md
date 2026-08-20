# I7 — Knowledge provenance quarantine (honest, no fake dates)

Generated: 2026-08-20

## Problem

`verify-release` / `content:knowledge-provenance` failed:

> Строгая claim-level проверка не пройдена: готово **64/90** чувствительных кандидатов публикации

Root class (calendar drift past 30-day `stale_after_days` / `expires_at`):

- `stale_sensitive_claim` × 26
- `stale_source_url_check` × 26
- `expired_source` × 14

Claim `verified_at` / source `checked_at` were last set **2026-07-20**; by **2026-08-20** the strict window elapsed.

## Decision (honest)

**Do not bump `verified_at` / `checked_at` / `expires_at` without fact-check.**  
Sensitive topics (визы, медицина, деньги, безопасность, ВНЖ) require source re-verification against official pages.

Intentional quarantine per SCHEMA / `is_release_candidate_sensitive`:

- set `site_ready: false` on all 26 failing candidates
- record `editorial_hold_reason` (Russian) explaining I7 hold
- regenerate KB indexes (`build_manifest.py`)
- leave claims/sources dates untouched

Result: **64/64** strict-ready release candidates → `--strict-provenance` **PASS**.

## Quarantined ids (26)

`banki-i-perevody`, `bezopasno-li-odnoj-zhenshchine`, `bezopasno-li-v-argentine`, `byudzhet-poezdki`, `chto-takoe-mep`, `gid-po-dengam`, `gid-po-medicine`, `kak-oplatit-tur-i-zhilyo-zaranee`, `kak-platit-esli-karta-rf-ne-rabotaet`, `kakie-rajony-ba-izbegat`, `kakoj-dohod-nuzhen-dlya-rantye`, `medicina-i-strahovka`, `mozhno-li-otkryt-schet-nerezidentu`, `nuzhna-li-strahovka-dlya-vezda`, `otkrytie-biznesa`, `pereezd-s-minimalnym-byudzhetom`, `pokupka-nedvizhimosti`, `rabota-i-poisk-raboty`, `skam-s-falshivoj-policiej`, `skolko-stoit-oformit-vnzh`, `stoimost-zhizni-ba`, `stoimost-zhizni-semya-i-para`, `udalyonnaya-rabota-i-oplata`, `viza-cifrovogo-kochevnika-chto-daet`, `viza-v-braziliyu-dlya-iguasu`, `zashchita-nakoplenij-ot-inflyacii`

## Owner follow-up (editorial)

Re-verify each quarantined article against primary official sources, then restore `site_ready: true` only after claim-level freshness passes.

## Related CI blockers (same run)

| Check | Status | Class |
|-------|--------|-------|
| `verify-release` knowledge-provenance | fixed in candidate | editorial calendar debt |
| `verify-contracts` inventory:check | fixed via `inventory:generate` | stale digest after I7 API edits |
| Vercel – argentina-travel | **BLOCKED_EXTERNAL** | Account is blocked (`why-is-my-account-deployment-blocked`) |
