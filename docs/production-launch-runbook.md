# Публикация сайта под ключ

Единый runbook для выкладки **www.goargentina.ru** в production: код, CMS, миграции, smoke, аналитика.

**Автопроверка:**

```bash
npm run publish:verify
npm run publish:verify:full    # + локальный next build
npm run publish:verify:pre-deploy   # code-ready: build + stale /map на prod → warn
```

Отчёт: `var/ops/publish-turnkey-last.json`

---

## Статус готовности (21 июня 2026)

| Блок | Статус |
|------|--------|
| Спринты 5–11 (код) | ✓ 195 unit-тестов, build OK |
| CMS cutover (blog/guide/destination/place) | ✓ 100%, CMS-only |
| Контент cornerstone + rich parks | ✓ опубликован |
| Редиректы content-plan | ✓ static + Supabase `url_redirects` |
| Blog heroes | ✓ 49/49 indexable |
| Production build (`next build`) | ✓ |
| Локальный production-smoke (в т.ч. `/map` → `/mapa-argentina`) | ✓ |
| **Production deploy Phase 2** | ⚠ на prod gitSha `59f7ab3…` — нужен merge + redeploy |
| **Live `/map` redirect** | ⚠ 200 на prod до redeploy (в коде 301 + `app/map`) |
| **GTM + GSC verification** | ⚠ Vercel env + ручная настройка |
| **DEPLOY_ENV=production** | ✓ на live health |

---

## 1. Vercel Production — обязательные переменные

Скопируйте из `.env.example`. **Без значений в этом документе — только имена.**

### Критичные (без них сайт не работает)

| Переменная | Значение |
|------------|----------|
| `NEXT_PUBLIC_SITE_URL` | `https://www.goargentina.ru` |
| `NEXT_PUBLIC_SUPABASE_URL` | Production Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (только server) |
| `DATABASE_URL` | Postgres connection string |
| `DEPLOY_ENV` | `production` |
| `CRON_SECRET` | Случайная строка ≥32 символов |
| `NEXT_PUBLIC_ENABLE_DEMO_SEED` | `false` |

### Рекомендуемые

| Переменная | Назначение |
|------------|------------|
| `GIT_SHA` | Vercel подставляет `VERCEL_GIT_COMMIT_SHA` автоматически |
| `NEXT_PUBLIC_GTM_ID` | `GTM-XXXXXXX` |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | GSC HTML tag |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | Bing Webmaster |
| `NEXT_PUBLIC_AHREFS_SITE_VERIFICATION` | Ahrefs |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | Мониторинг ошибок |
| `RESEND_API_KEY` + `LEADS_NOTIFY_EMAIL` | Email-уведомления |

Партнёрские интеграции (по необходимости): Tripster, Sputnik8, Travelpayouts, Mercado Pago.

---

## 2. Supabase Production

```bash
# 1. Убедиться что DATABASE_URL → production
npm run supabase:migrate

# 2. Импорт CMS (идемпотентно)
npm run supabase:seed-cms

# 3. Cutover (если ещё не включён)
npm run cms:cutover-enable -- --seed-first

# 4. Редиректы в БД
npm run sync-content-plan-redirects

# 5. Архив legacy slug в CMS
npm run cms:archive-orphan-blog-slugs

# 6. Readiness
npm run cms:readiness -- --strict

# 7. Legacy media cleanup (переименованные slug)
npm run prune-legacy-blog-media

# 8. CMS media → manifest (после upload в Admin)
npm run sync-cms-media-manifest
npm run cms-media:deploy-check
```

Резервная копия схемы перед миграциями:

```bash
npm run backup:schema
```

---

## 2.1 CMS Media (обязательно после upload)

На Vercel `autoSyncCmsMediaManifest` **пропускается** — manifest коммитится в репозиторий.

```bash
# После загрузки файлов в Admin → Media:
npm run sync-cms-media-manifest
npm run cms-media:deploy-check -- --strict
git add src/data/media-library/manifest.json
# deploy
```

Проверка legacy slug в manifest:

```bash
npm run prune-legacy-blog-media:check
```

---

1. Merge в `main` → Vercel auto-deploy **или** Promote staging deployment.
2. Убедиться, что env заданы для **Production** (не только Preview).
3. После смены `NEXT_PUBLIC_*` — **Redeploy** (значения вшиваются на build).

Локальная проверка сборки:

```bash
npm run build
```

---

## 4. Smoke после деплоя

```bash
SMOKE_BASE_URL=https://www.goargentina.ru npm run production-smoke
PLAYWRIGHT_BASE_URL=https://www.goargentina.ru npm run test:e2e:smoke
npm run publish:verify
```

Ожидаемый `/api/health`:

- `ok: true`
- `environment.deployEnv`: `production`
- `migrationVersion`: `20250627000011_author_article_doc_type` (или новее)
- `gitSha`: commit SHA

---

## 5. Аналитика и SEO (I2)

Подробно: [`i2-analytics-gsc-runbook.md`](./i2-analytics-gsc-runbook.md)

1. Задать `NEXT_PUBLIC_GTM_ID` → Redeploy
2. Настроить теги в GTM → **Publish** контейнер ([`analytics-gtm-setup.md`](./analytics-gtm-setup.md))
3. GSC: верификация → Sitemap `https://www.goargentina.ru/sitemap.xml`
4. Проверка:

```bash
ANALYTICS_BASE_URL=https://www.goargentina.ru npm run analytics-readiness
```

---

## 6. Cron (Vercel)

В `vercel.json` настроены:

- `0 4 * * *` → `/api/cron/affiliate-sync`
- `0 3 * * *` → `/api/cron/platform-maintenance`

Ручная проверка:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://www.goargentina.ru/api/cron/platform-maintenance
```

---

## 7. Критерии «готово к публикации»

**Код (до merge):**

```bash
npm run publish:verify:pre-deploy
SMOKE_BASE_URL=http://127.0.0.1:3001 npm run production-smoke   # после npm run build && npm run start
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 npm run test:e2e:smoke
```

- [x] `npm run publish:verify:pre-deploy` — без blocking `fail` (stale `/map` на prod → warn)
- [x] `npm run build` — успешно
- [x] `npm run cms:readiness -- --strict` — 4/4 lane 100%
- [x] Локальный production-smoke + e2e smoke — pass

**После deploy на production:**

- [ ] `npm run publish:verify` — без `fail` (в т.ч. live `/map`)
- [ ] Production smoke + e2e smoke на `https://www.goargentina.ru`
- [ ] Vercel env checklist (раздел 1) заполнен
- [ ] GTM опубликован (можно после go-live, но до маркетинга)
- [ ] GSC sitemap отправлен

---

## 8. Откат

См. [`production-cutover-e81.md`](./production-cutover-e81.md) — уровни A/B/C.

Быстрый откат приложения: Vercel → Promote previous deployment.

---

## Команды одной строкой (релизное окно)

```bash
npm run publish:verify:pre-deploy && \
git push origin main && \
npm run sync-content-plan-redirects && \
SMOKE_BASE_URL=https://www.goargentina.ru npm run production-smoke && \
PLAYWRIGHT_BASE_URL=https://www.goargentina.ru npm run test:e2e:smoke
```

*После merge и redeploy на Vercel.*
