# Социальная лента — конфигурация

Единый конфиг для курируемых Instagram-лент:

| Файл | Назначение |
|------|------------|
| `src/data/social-feed/config.json` | Seed: источники, публикации, размещения (fallback без Supabase) |
| `config.json` (здесь) | Копия seed для справки; runtime читает `src/data/...` |
| `topics.json` | **Устарело** — заменено placements в `config.json` |
| `sources.json` | **Устарело** — перенесено в `config.json` |
| `manifest.json` | **Устарело** — не используется |

## Production

Конфиг редактируется в админке `/admin/content/social-feed` и сохраняется в Supabase `site_settings` → ключ `site.social_feed`.

## Использование на страницах

```tsx
<SocialFeed placement="home" />
<SocialFeed placement={`destination:${destination.id}`} />
<SocialFeed sources={['iv-evd', 'visit-argentina']} title="..." layout="carousel" />
```

## Архитектура

```
Admin UI → site.social_feed (Supabase) → config.json (fallback)
              ↓
    ManualCuratedProvider (сейчас)
    InstagramApiProvider (будущее)
              ↓
         <SocialFeed /> → SocialFeedBlock (UI)
```

Документация: `docs/integrations/instagram.md`
