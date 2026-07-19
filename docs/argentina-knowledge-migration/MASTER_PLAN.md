# Argentina Knowledge Migration Master Plan

## Цель

Argentina Travel становится единственной рабочей системой реестра источников, сбора, обработки, модерации и передачи материала в CMS. Python Collector после cutover не участвует в runtime и сохраняется только как read-only Git/filesystem archive на время rollback window.

## Выполненная реализация

1. Зафиксирован baseline двух репозиториев и полная инвентаризация.
2. Создана закрытая Supabase-модель источников, запусков, raw/normalized документов, кандидатов, дублей, шагов, prompt-версий, update proposals и migration ledger.
3. Реализованы адаптеры Telegram MTProto, HTML, RSS/Atom, sitemap, JSON API, YouTube и ручного текста.
4. Реализованы SSRF/robots/path/timeout/size/rate-limit ограничения, private raw storage, checkpoints и блокировка параллельных запусков.
5. Перенесены нормализация, география, категории, fingerprint, near-duplicate и объяснимая редакционная оценка.
6. Добавлен версионированный OpenAI Responses API analysis с structured output, переводом, fallback-моделью, latency/token telemetry и запретом автопубликации.
7. Добавлены retry/backoff/dead-letter, cancellation, stuck-job detection и Vercel cron.
8. Добавлен верхнеуровневый раздел админки: состояние, источники, карточка/preview, запуски, модерация/дубли и prompts.
9. Добавлены granular backend capabilities, audit events и интеграция с существующими CMS, source governance и search workflow.
10. Подготовлен идемпотентный migration pipeline; dry-run сверил 3 источника, 22 raw objects, 2 содержательных кандидата и 20 media files.

## Оставшийся controlled cutover

Production-действия выполняются только после отдельного staging: применить миграцию, запустить перенос, провести минимум два shadow cycles, сверить checkpoints/counts/errors, создать backup и лишь затем назначить Argentina Travel primary. Текущий `.env.local` указывает на production project, поэтому запись из локальной задачи запрещена.
