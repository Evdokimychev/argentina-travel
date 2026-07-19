# Source Inventory

| Legacy ID | Тип | Endpoint | Legacy status | Язык | Limit | Trust | Новый credential ref | Новый status |
|---|---|---|---|---|---:|---:|---|---|
| `telegram:vista_argentina` | Telegram public channel | `https://t.me/vista_argentina` | active | ru | 20 | 70 | `ARGENTINA_TELEGRAM` | paused until connection test |
| `website:argentina_web_example` | website/RSS placeholder | example.com | disabled | ru/es | 10 | 70 | none | paused/archive candidate |
| `youtube:argentina_youtube_example` | YouTube placeholder | placeholder URL | disabled | ru/es/en | 10 | 65 | optional env ref | paused/archive candidate |

## Legacy data inventory

- 69 files under `raw/`, including duplicated legacy layouts and one HTML fixture.
- 22 canonical Telegram article JSON files; only 2 have at least 120 characters of publishable text.
- 20 canonical Telegram message JSON files.
- 20 media files, 4,338,870 bytes total.
- 24 Markdown files, including checks/test artifacts.
- 2 migration/run reports and 2 review candidates in the latest knowledge package.

All 22 canonical raw objects are retained. Empty album parts are marked `skipped` in the ledger and do not become empty CMS candidates. Media is uploaded only to private `ingestion-raw`; publication rights must be reviewed separately.
