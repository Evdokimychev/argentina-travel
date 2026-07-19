# Current Architecture

## До миграции

### Argentina Knowledge

- Python 3.14, Telethon, requests, Trafilatura, feedparser, yt-dlp.
- CLI и локальные JSON/Markdown/raw/media; web UI, DB, scheduler, roles и deployment отсутствуют.
- Один реальный Telegram source `vista_argentina`; website и YouTube entries являются disabled placeholders.
- Локальные processors: summary, location/category/tag extraction, quality scoring, fingerprint/shingle deduplication и CMS package export.

### Argentina Travel

- Next.js 15 App Router, React 19, TypeScript, Supabase/Postgres, Prisma и Vercel.
- Нативные admin shell, capability authorization, audit log, cron authorization, CMS revisions/search outbox и content governance.
- Существующие partner imports и content sources не образовывали общего ingestion control plane.

## После кодовой миграции

Argentina Travel содержит один operational source registry и pipeline. `ingestion_sources` отвечает за получение, а существующий `content_sources` остаётся реестром цитирования. Raw data хранится в закрытых таблицах и private bucket `ingestion-raw`; редактор создаёт новый CMS draft либо update proposal к существующей странице. Runtime-вызовов старого Collector нет.

Тяжёлая работа ограничена небольшими batches в Vercel route; cron выбирает не более трёх due/retry sources за вызов. Unique partial index исключает два активных run одного source.
