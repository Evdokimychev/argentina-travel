# Карта источников данных

- Tour → Supabase/CMS; статический repository является переходным fallback.
- Organizer, Booking → Supabase.
- Payment → ledger и провайдер.
- Region → `src/data/geography-canonical.ts`.
- Knowledge article → Markdown/editorial repository.
- Search, map, sitemap → производные индексы, не источник истины.
- Media → media manifest.

LocalStorage не является допустимым источником production-бизнес-данных.
