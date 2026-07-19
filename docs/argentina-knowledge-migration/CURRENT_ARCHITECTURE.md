# Current Architecture

## Argentina Knowledge

- Python 3.14, Telethon, requests, Trafilatura, feedparser, yt-dlp.
- CLI без web UI, локальные JSON/Markdown/raw/media каталоги.
- Один активный Telegram-источник `vista_argentina`; примеры website и YouTube выключены.
- Инкрементальный Telegram checkpoint, редакционная оценка, fingerprint/near-duplicate, экспорт CMS-пакета.
- Нет отдельной БД, очереди, scheduler, worker deployment, AI provider, ролей или audit log.

Baseline 2026-07-19: 69 raw-файлов, 24 article JSON, 24 Markdown, 2 run reports.

## Argentina Travel

- Next.js 15 App Router, React 19, TypeScript, Supabase/Postgres, Prisma, Vercel.
- Нативные admin shell, capability authorization, audit log, cron authorization и operational status.
- CMS `content_documents`, revisions, search outbox, knowledge governance (`content_sources`, claims, facts, relations, media rights).
- Существующие партнёрские sync jobs и place-ingestion adapters.
- Baseline: TypeScript, lint и 1850 unit/integration tests проходят.

## Временная связка

API-пакет `argentina-travel-knowledge-v2` существовал как переходный механизм. В целевой архитектуре он остаётся только форматом одноразового импорта/rollback и не является runtime-зависимостью.
