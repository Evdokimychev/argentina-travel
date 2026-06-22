# Спринт 5 — чеклист deploy и analytics

**Цель:** выкатить стабилизацию (спринты 1–4) + trust gate (спринт 5) на production.

## Перед deploy

```bash
npm test
npm run build
npm run publish:verify
npm run page-image-audit
```

## Deploy (Vercel)

1. Merge / push в `main`.
2. Проверить env на Vercel:
   - `NEXT_PUBLIC_SITE_URL=https://www.goargentina.ru`
   - `NEXT_PUBLIC_GTM_ID=GTM-…` (если контейнер готов)
3. Дождаться успешного build.

## После deploy

```bash
SMOKE_BASE_URL=https://www.goargentina.ru npm run production-smoke
PLAYWRIGHT_BASE_URL=https://www.goargentina.ru npm run test:e2e:smoke
npm run sync-content-plan-redirects
```

Ожидаемый smoke: **12/12 OK**, redirect `/map` → `/mapa-argentina`.

## GTM + GSC (manual)

См. [i2-analytics-gsc-runbook.md](./i2-analytics-gsc-runbook.md):

- [ ] GTM container опубликован
- [ ] `NEXT_PUBLIC_GTM_ID` на Vercel
- [ ] GSC property: sitemap `https://www.goargentina.ru/sitemap.xml`
- [ ] `ANALYTICS_BASE_URL=https://www.goargentina.ru npm run analytics-readiness` → 0 fail

## Trust QA (ручной, 10 мин)

| Проверка | URL |
|----------|-----|
| Счётчики туров на главной = about | `/`, `/about` |
| Карточка patagonia — «Новый», не 187 отзывов | `/tours/patagonia-glaciers` |
| Tripster badge «Партнёр Tripster» | `/tours` |
| Нет Brazil tour на главной в «Рекомендуем» | `/` |
| Блог: count indexable согласован | `/blog` |
| Immigration grazhdanstvo — DNM 366/2025 | `/immigration/grazhdanstvo` |

## Rollback

Vercel → предыдущий deployment → Promote to Production.
