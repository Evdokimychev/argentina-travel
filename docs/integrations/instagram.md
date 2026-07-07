# Instagram и социальная лента

> Обновлено: ручное курирование через админку + адаптер провайдера для будущего Graph API.

## Текущая модель (2026)

Полноценный авто-fetch ленты Instagram без **Graph API** невозможен легально. Поэтому:

1. **Админ** задаёт **источники** (handle, label, profileUrl).
2. **Админ** курирует **публикации** (изображение из медиатеки или URL, подпись, permalink).
3. **Админ** настраивает **размещения** (home, destination:ba, place:bariloche…).
4. Компонент `<SocialFeed />` рендерит нативные карточки со ссылкой на пост в Instagram.

```
/admin/content/social-feed
        ↓
site_settings.site.social_feed  (+ fallback data/social-feed/config.json)
        ↓
FeedDataProvider
  ├── ManualCuratedProvider   ← сейчас
  └── InstagramApiProvider    ← заглушка на будущее
        ↓
<SocialFeed placement="home" />
        ↓
SocialFeedBlock / Carousel / Masonry / Tile
```

## Использование на страницах

```tsx
import SocialFeed from "@/components/social-feed/SocialFeed";

// По размещению из конфига
<SocialFeed placement="home" />
<SocialFeed placement={`destination:${destination.id}`} compact />
<SocialFeed placement={`place:${slug}`} />
<SocialFeed placement={`kb:${entry.id}`} />
<SocialFeed placement={`itinerary:${slug}`} />

// Явные источники (приоритетнее placement)
<SocialFeed sources={["iv-evd", "visit-argentina"]} title="..." layout="carousel" />
```

**Порядок разрешения:** prop `sources` → placement из конфига → fallback `type:default` → `home`.  
Секция скрывается, если карточек меньше `minItems`.

## Конфиг (`site.social_feed`)

```typescript
{
  version: 1,
  sources: [{ id, handle, label, profileUrl, enabled, type: "instagram" }],
  posts: [{ id, sourceId, mediaAssetId?, imageUrl?, caption?, permalink, enabled }],
  placements: [{ id, label, sourceIds[], title?, layout?, limit?, minItems? }]
}
```

Seed: `data/social-feed/config.json`.

## Админка

- URL: `/admin/content/social-feed`
- API: `GET/PUT /api/admin/social-feed` (capability `content.edit`)
- Разделы: источники, публикации, размещения

## Публичный API

```
GET /api/social-feed?placement=home
GET /api/social-feed?sources=iv-evd,visit-argentina&limit=12
```

## Будущий Graph API

`InstagramApiProvider` (`src/lib/social-feed/providers/instagram-api.ts`) — заглушка с тем же контрактом `SocialFeedItem[]`. После подключения API достаточно переключить провайдер в `get-feed.ts`; UI и placements не меняются.

## Устарело

| Путь | Статус |
|------|--------|
| `data/social-feed/topics.json` | Deprecated — placements |
| `data/media-library/instagram-queue.json` + import-скрипты | Не используются на этом этапе |
| `resolve-context.ts` topic auto-resolution | Deprecated |
| `queryMediaFeed()` для SocialFeed | Отключено — только ManualCuratedProvider |

Медиатека (`manifest.json`) по-прежнему используется для **разрешения mediaAssetId** в курируемых постах.

## Env (будущее)

```env
# Только для InstagramApiProvider, когда будет реализован
META_APP_ID=
META_APP_SECRET=
INSTAGRAM_ACCESS_TOKEN=
```
