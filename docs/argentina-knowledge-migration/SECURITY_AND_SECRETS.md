# Security and Secrets

| Старый ключ | Назначение | Новый способ хранения | Мигрирован | Проверен |
|---|---|---|---|---|
| `API_ID` | Telegram app ID | `${credential_ref}_API_ID` server env | mapping DONE | BLOCKED EXTERNALLY |
| `API_HASH` | Telegram app secret | `${credential_ref}_API_HASH` server env | mapping DONE | BLOCKED EXTERNALLY |
| `SESSION_NAME` / session file | Telegram user session | `${credential_ref}_SESSION` encrypted deployment secret | mapping DONE | BLOCKED EXTERNALLY |
| `DOWNLOAD_MEDIA` | media toggle | source config boolean, no secret | DONE | DONE |
| `ARGENTINA_TRAVEL_API_KEY` | legacy bridge | no runtime replacement; revoke after cutover | NOT APPLICABLE | BLOCKED EXTERNALLY |
| `ARGENTINA_TRAVEL_API_URL` | legacy bridge URL | removed from target runtime | NOT APPLICABLE | DONE |
| `OPENAI_API_KEY` | analysis/translation | existing server env | no move required | BLOCKED EXTERNALLY |

## Controls

- Operational tables have RLS enabled, browser roles have all grants revoked, service role is the only DB writer.
- Admin route authorization uses granular capabilities; hiding a UI action is never the security boundary.
- `connection_config` recursively rejects secret-like keys. It stores only a credential reference name.
- URLs reject credentials, non-HTTP protocols, localhost/private DNS, blocked paths, excessive redirects and responses over 5 MB.
- Telegram strings/tokens never enter API responses, audit payloads or source rows.
- Raw data/media is private. CMS receives processed content only after moderator action.
- Source activation requires a successful connection test no older than seven days.
- Secret rotation changes deployment variables behind the same credential reference and is audit-visible without values.
