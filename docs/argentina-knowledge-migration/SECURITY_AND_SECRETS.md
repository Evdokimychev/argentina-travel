# Security and Secrets

| Старый ключ | Назначение | Используется | Новый способ хранения | Мигрирован | Проверен |
|---|---|---|---|---|---|
| `API_ID` | Telegram MTProto app id | да | server env via credential reference | BLOCKED EXTERNALLY | TODO |
| `API_HASH` | Telegram MTProto secret | да | server env, never database/frontend | BLOCKED EXTERNALLY | TODO |
| Telegram session | user authorization | да | encrypted deployment secret/env | BLOCKED EXTERNALLY | TODO |
| `OPENAI_API_KEY` | optional AI processing | Travel existing | existing server env | no move required | TODO |
| `ARGENTINA_TRAVEL_API_KEY` | temporary M2M bridge | transitional only | revoke after cutover | TODO | TODO |

Operational tables are service-role only with RLS enabled and no browser grants. Admin routes enforce backend capabilities. Source configs store only credential reference names; secret values are masked and never returned or audited.
