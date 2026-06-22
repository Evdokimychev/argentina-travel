# Спринт 11 — финальный QA и launch readiness

**Цель:** закрыть фазу 2 кодом и автоматизацией; ручной visual/Lighthouse sign-off на production.

## Перед deploy (код)

```bash
npm run publish:verify:pre-deploy
npm run audit-blog-heroes -- --strict
```

Ожидаемый `sprint11-qa.test.ts`: все проверки pass (hero ≥ 95 %, fact-check N-01…N-04, gallery/collections).

**Статус 21.06.2026:** ✓ unit 195/195, build OK, `publish:verify:pre-deploy` — 0 fail (live `/map` → warn до redeploy).

## После build (локально, optional)

```bash
npm run lighthouse:phase2          # 8 URLs, perf + a11y median
npm run test:e2e:visual            # baseline screenshots (первый run: --update-snapshots)
npm run production-smoke           # 15 public pages
npm run test:e2e:smoke
```

## После deploy на production

```bash
SMOKE_BASE_URL=https://www.goargentina.ru npm run production-smoke
PLAYWRIGHT_BASE_URL=https://www.goargentina.ru npm run test:e2e:smoke
npm run lighthouse:phase2          # с LIGHTHOUSE_BASE_URL на prod URL (manual)
```

## Ручной чеклист (не автоматизирован)

| Проверка | URL / действие |
|----------|----------------|
| Visual sign-off hero главной | `/` — 375 / 768 / 1280 / 1440 |
| Gallery lightbox + регионы | `/gallery` |
| Collections hero + карточки | `/collections` |
| Patagonia — оговорка Чили в шапке | `/tours/patagonia-glaciers` |
| Immigration grazhdanstvo DNU 366/2025 | `/immigration/grazhdanstvo` |
| Lighthouse median Perf ≥ 90 (8 URLs) | `var/ops/lighthouse-phase2-sample-last.json` |
| Lighthouse median A11y ≥ 95 | то же |
| GTM + GSC | см. sprint5-deploy-checklist |
| etap-1 P0/P1 open | 0 открытых пунктов |

## Критерии приёмки фазы 2 (код)

- [x] Спринты 5–11 deliverables в коде (см. AUDIT_REPORT-PHASE2.md)
- [x] `npm run publish:verify:pre-deploy` — без blocking fail
- [x] Локальный production-smoke + e2e smoke (13/13)
- [ ] Production deploy S1–11 (merge + Vercel redeploy)
- [ ] Team visual sign-off
- [ ] Lighthouse lab median на production sample
