# Подготовка к живой проверке контента — 2026-07-25

Цель: быстро пройти контент и коммерческие пути на production после выката recovery-ветки.

## Что смотреть завтра (турист)

| Путь | Ожидание | Заметки |
|------|----------|---------|
| `/` | Каталог/поиск туров без пустых Shop/Forum в меню | Локали: только `ru` |
| `/tours` | Argentina-first каталог, без «чистой Бразилии» в дефолте | Расписание: `/api/partner-tours/{slug}/schedule` |
| `/tours/{slug}` | Карточка → даты → handoff Tripster | При REST outage — soft unavailable, не ложный 404 |
| `/excursions` + detail | Расписание `HH:MM`, booking-request → `fallbackUrl` | Основной живой коммерческий путь |
| `/flights` | Виджет Travelpayouts | Партнёрский поиск |
| `/services` | Без ссылок на `/transfers` и `/car-rental` | Заявки на апартаменты → `/contacts` |
| `/blog`, `/guide`, `/baza-znaniy`, `/immigration` | Читаемые материалы | Иммиграция скрыта из меню, прямой URL открыт для проверки |
| `/shop`, `/forum` | 404 / не в навигации | Пустые оболочки не рекламируем |

## Что смотреть (админ)

1. `/admin` — сессия. Если Supabase REST `dependency_unavailable` (egress/billing), CMS UI может не открыться.
2. **Fallback без CMS:** правки в `src/data/blog*.ts`, `content/knowledge-base/**`, `src/data/guide*`, `src/data/immigration*` → деплой.
3. Site globals: `showShop` / `showForum` / `showImmigration` = off; transfers/car-rental disabled.
4. Funnels: partner handoff (информационно, не revenue). Search Visibility: SEO cluster coverage.

## Человеческие гейты (не чинятся кодом)

1. Supabase egress/billing на `uooxrypocahomoqzdvzy` — иначе Auth/CMS/native booking хрупкие.
2. Vercel Production promote после merge в `main` + проверка `/api/health` → `gitSha` = SHA merge.
3. Env: GTM/GA4/Metrika/Clarity/GSC — для аналитики; бронирование Tripster работает и без них.

## Smoke после promote

```bash
curl -sS https://www.goargentina.ru/api/health | jq '{status,gitSha,db:.checks.database.ok,pg:.checks.postgresDirect}'
npm run crawl:public-tour-details -- --base https://www.goargentina.ru
SMOKE_BASE_URL=https://www.goargentina.ru npm run production-smoke
```

Критерий GO для контент-сессии: `gitSha` свежий, экскурсии/туры открываются, handoff Tripster отдаёт `fallbackUrl`, меню без пустых модулей.
