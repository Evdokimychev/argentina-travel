# Security and Secrets

| Legacy secret | Target | Status |
|---|---|---|
| `API_ID` | `ARGENTINA_TELEGRAM_API_ID` in Vercel Production | DONE, encrypted |
| `API_HASH` | `ARGENTINA_TELEGRAM_API_HASH` in Vercel Production | DONE, encrypted |
| Telethon session DB | `ARGENTINA_TELEGRAM_SESSION` StringSession | DONE, live-tested |
| Collector sync API key | no replacement; no bridge exists | RETIRED |
| `CRON_SECRET` | Vercel plus GitHub Actions secret | DONE, rotated 2026-07-20 |
| OpenAI | Vercel OIDC / optional direct key | CONFIGURED; billing verification required for inference |

## Controls

- Browser roles have no direct ingestion-table grants; service role performs server writes.
- Raw bucket is private, capped at 50 MB per object, and verified by download checksum.
- External fetches reject private/local addresses and pin the validated DNS result during connection, preventing DNS rebinding.
- Source configs contain only credential references, never secret values.
- Uploads do not mutate a shared source config; manual items live only in the run checkpoint envelope.
- Publication uses optimistic claims; existing-page updates are one database transaction with CMS revision and audit evidence.
- The full legacy project and production DB backup are encrypted with a private `age` identity outside both repositories.
- Anonymous access to the ingestion admin API and cron endpoint returns `401`; the admin page redirects to authenticated admin sign-in.
- The active Telegram source uses only the Vercel StringSession and the GitHub dispatcher uses the same rotated `CRON_SECRET` contract.
