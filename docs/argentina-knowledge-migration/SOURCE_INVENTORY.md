# Source Inventory

| ID | Тип | Endpoint | Статус | Языки | Лимит | Trust | Credentials | Checkpoint | Назначение |
|---|---|---|---|---|---:|---:|---|---|---|
| `telegram:vista_argentina` | Telegram public channel | `https://t.me/vista_argentina` | active | ru | 20 | 70 | `TELEGRAM_COLLECTOR_*` env reference | отсутствует в текущем state | moderation queue |
| `website:argentina_web_example` | RSS/HTML example | example.com | disabled, placeholder | ru/es | 10 | 70 | none | none | configuration example only |
| `youtube:argentina_youtube_example` | YouTube example | placeholder channel | disabled, placeholder | ru/es/en | 10 | 65 | optional YouTube API key ref | none | configuration example only |

## Накопленные данные

- 69 файлов raw storage.
- 24 normalized article records.
- 24 Markdown-файла.
- 2 migration/run reports.
- 2 кандидата со статусом `review` в последнем CMS-пакете.

## Правовые настройки

Каждый новый источник обязан иметь `legal_notes`, trust level, allowed/blocked paths и режим атрибуции. Полный чужой текст сохраняется только как закрытый raw material; публикация возможна лишь после редакционной переработки и проверки источника.
