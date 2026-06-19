# E77: CMS i18n rollout (es/en public content)

Расширение пилота E43 на все CMS-типы контента и публичные страницы.

## Область

- Локали: `ru` (по умолчанию, без префикса), `es`, `en` (`/es/`, `/en/`)
- Типы документов: `legal`, `blog`, `guide`, `destination`, `place`
- Цепочка резолва: **запрошенная локаль → ru → TS-файл**

## Публичное разрешение контента

### Резолверы (`src/lib/cms/*-resolver.ts`)

- Страницы: `resolve*Page` / `resolveLegalDocument` через `resolveWithPublishedCmsOverride`
- Каталоги: `resolve*Catalog` через `fetchPublishedCmsDocumentsMergedByLocaleChain` — per-slug приоритет запрошенной локали над ru

### Страницы

| Маршрут | Локаль | hreflang |
|---------|--------|----------|
| `/blog`, `/blog/[slug]` | ✅ | ✅ |
| `/guide/[slug]` (CMS-статьи) | ✅ | ✅ |
| `/destinations`, `/destinations/[slug]` | ✅ | ✅ |
| `/places`, `/places/[slug]` | ✅ | ✅ |
| `/legal/[slug]` | ✅ | ✅ |

### hreflang

- `buildCmsContentHreflangAlternates(docType, slug)` — `src/lib/cms/cms-hreflang.ts`
- Использует slug из опубликованной CMS-записи per-locale; fallback на canonical slug
- Каталоги: `buildHreflangAlternates` для index-страниц

## Админка

### Покрытие переводов

- `/admin/content` → таблица «Покрытие переводов CMS (RU / ES / EN)»
- API: `GET /api/admin/content` → `translationCoverage[]`
- RU = 100% (TS fallback); ES/EN = % опубликованных CMS-версий

### Бейджи локалей

- Per-row RU/ES/EN badges (как в E43) сохранены

## Seed / импорт

### Top-10 priority slugs (es/en черновики-заготовки)

Список: `CMS_I18N_ROLLOUT_TOP_SLUGS` в `src/lib/cms/cms-i18n-rollout.ts`

```bash
npm run supabase:seed-cms -- --i18n-stubs
```

API:

```json
POST /api/admin/content/documents/bulk-import
{ "includeI18nStubs": true, "skipExisting": true }
```

Заготовки создаются как **draft** с пустым телом — для последующего перевода в редакторе.

### Pilot content (E43)

```json
{ "includeI18nPilot": true }
```

Полные es/en переводы для `legal/privacy` и `blog/best-time-to-visit-argentina`.

## Вне области

- Туры, поля организатора
- Immigration / guide pillars / guide topics (TS-only)
- Per-locale URL slug mapping (slug одинаковый across locales)

## Связанные файлы

- `src/lib/cms/content-resolver.ts` — locale chain, merged fetch, locale slugs
- `src/lib/cms/cms-hreflang.ts` — hreflang для CMS-страниц
- `src/lib/cms/cms-locale.ts` — coverage stats
- `src/lib/cms/cms-i18n-rollout.ts` — top-10 stubs
