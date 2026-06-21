# I2 — GTM, верификация поисковиков, sitemap в GSC

**Цель:** аналитика через GTM + подтверждение домена в GSC/Bing/Ahrefs + отправка sitemap.

**Код уже готов:** Consent Mode v2, dataLayer-события, meta verification в `layout.tsx`, динамические `/sitemap.xml` и `/robots.txt`.

---

## Текущий статус (проверка)

```bash
npm run analytics-readiness
# или против production:
ANALYTICS_BASE_URL=https://www.goargentina.ru npm run analytics-readiness
```

Отчёт: `var/ops/analytics-readiness-last.json`.

---

## 1. Переменные окружения (Vercel Production)

| Переменная | Обязательно | Где взять |
|------------|-------------|-----------|
| `NEXT_PUBLIC_GTM_ID` | **Да** | [tagmanager.google.com](https://tagmanager.google.com) → контейнер → `GTM-XXXXXXX` |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | Для тегов GTM | GA4 → Admin → Data streams → `G-…` |
| `NEXT_PUBLIC_YM_COUNTER_ID` | Для тегов GTM | Яндекс.Метрика → номер счётчика |
| `NEXT_PUBLIC_CLARITY_PROJECT_ID` | Для тегов GTM | clarity.microsoft.com → Settings |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | GSC | Search Console → HTML tag → значение `content=` |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | Bing | Bing Webmaster → Meta tag → `content=` |
| `NEXT_PUBLIC_AHREFS_SITE_VERIFICATION` | Ahrefs | Ahrefs Webmaster → Meta tag |
| `NEXT_PUBLIC_SITE_URL` | **Да** | `https://www.goargentina.ru` |

**Альтернатива env для верификации:** Admin → Настройки → SEO по умолчанию (`googleSiteVerification`, `bingSiteVerification`, `ahrefsSiteVerification` в `site.seo`).

После изменения env — **Redeploy Production** (Next.js встраивает `NEXT_PUBLIC_*` на build).

### Staging / Preview

- GTM: отдельный контейнер или тот же с триггером «hostname contains staging» — не смешивайте prod-счётчики с preview-трафиком.
- GSC/Bing/Ahrefs: верифицируйте **production** `www.goargentina.ru`, не preview URL Vercel.

---

## 2. Настройка и публикация GTM

Пошагово: [`docs/analytics-gtm-setup.md`](./analytics-gtm-setup.md).

Чек-лист:

- [ ] Контейнер создан, `NEXT_PUBLIC_GTM_ID` в Vercel
- [ ] GA4 Configuration + GA4 Event (custom events из dataLayer)
- [ ] Яндекс.Метрика (webvisor, clickmap) — consent `analytics_storage`
- [ ] Microsoft Clarity — consent `analytics_storage`
- [ ] **Submit + Publish** контейнера GTM
- [ ] Tag Assistant: consent denied → granted после cookie banner
- [ ] GA4 DebugView: `page_view`, `booking_submit` после согласия

---

## 3. Google Search Console

1. [search.google.com/search-console](https://search.google.com/search-console)
2. **Add property** → URL prefix: `https://www.goargentina.ru`
3. Метод: **HTML tag**
   - Скопируйте `content="…"` → `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` (или Admin → SEO)
   - Redeploy → **Verify**
4. **Sitemaps** → Add new sitemap:
   ```
   https://www.goargentina.ru/sitemap.xml
   ```
5. Через 1–3 дня: Coverage / Pages — без массовых ошибок 404 на blog/guide после CMS cutover.

Проверка robots:

```
curl -s https://www.goargentina.ru/robots.txt | rg Sitemap
# Sitemap: https://www.goargentina.ru/sitemap.xml
```

---

## 4. Bing Webmaster Tools

1. [bing.com/webmasters](https://www.bing.com/webmasters)
2. Add site → Import from GSC (быстро) **или** HTML meta tag
3. Токен → `NEXT_PUBLIC_BING_SITE_VERIFICATION` → redeploy → Verify
4. **Sitemaps** → Submit: `https://www.goargentina.ru/sitemap.xml`

---

## 5. Ahrefs Webmaster Tools

1. [ahrefs.com/webmaster-tools](https://ahrefs.com/webmaster-tools)
2. Add project → Meta tag verification
3. Токен → `NEXT_PUBLIC_AHREFS_SITE_VERIFICATION` → redeploy
4. После verify — Site Audit (опционально)

---

## 6. Контроль после деплоя

```bash
# Локально / CI (live checks)
ANALYTICS_BASE_URL=https://www.goargentina.ru npm run analytics-readiness

# SEO smoke (нужен running server для локали)
SEO_AUDIT_BASE_URL=https://www.goargentina.ru npm run seo-audit
```

Ручная проверка в браузере (View Source на `/`):

- `<meta name="google-site-verification" content="…">`
- `<meta name="msvalidate.01" content="…">`
- `<meta name="ahrefs-site-verification" content="…">`
- `googletagmanager.com/gtm.js?id=GTM-…` (после build с env)

---

## 7. Definition of Done (I2)

| Критерий | Проверка |
|----------|----------|
| GTM env на Production | `analytics-readiness` → `env:gtm` ok |
| GTM в HTML | `live:gtm` ok |
| Google verification meta | `live:google-verification` ok |
| Bing / Ahrefs meta | warn → ok после токенов |
| robots + sitemap | `live:robots-sitemap`, `live:sitemap` ok |
| Sitemap в GSC | Status «Success» в Search Console |
| GTM Published | Tag Assistant + GA4 realtime |

---

## Связанные документы

- [`analytics-gtm-setup.md`](./analytics-gtm-setup.md) — теги GTM
- [`analytics-setup-report.md`](./analytics-setup-report.md) — обзор интеграции
- [`cms-checkpoint-eg-analytics.md`](./cms-checkpoint-eg-analytics.md) — фаза I ops plan
