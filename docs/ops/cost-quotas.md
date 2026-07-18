# Контроль стоимости и квот

## Владельцы и бюджеты

| Область | Владелец | Месячный бюджет |
|---|---|---|
| Supabase | `SUPABASE_COST_OWNER_TBD` | `SUPABASE_MONTHLY_BUDGET_TBD` |
| Vercel | `VERCEL_COST_OWNER_TBD` | `VERCEL_MONTHLY_BUDGET_TBD` |
| Media CDN/storage | `MEDIA_COST_OWNER_TBD` | `MEDIA_MONTHLY_BUDGET_TBD` |
| Partner APIs | `PARTNER_COST_OWNER_TBD` | `PARTNER_MONTHLY_BUDGET_TBD` |

Пока значения и владельцы не заполнены, финансовые alerts считаются внешним блокером, а не реализованной защитой.

## Общие пороги

- 60% месячного бюджета или квоты — информационное предупреждение.
- 80% — warning владельцу и прогноз до конца месяца.
- 90% — high alert, ежедневный контроль и план снижения.
- 95% — critical alert incident commander; остановить необязательные batch/import/media операции.
- Прогноз >110% бюджета при текущем темпе — high alert независимо от текущего процента.
- Рост суточной стоимости >50% к медиане предыдущих 14 сопоставимых дней — anomaly alert.

Нельзя автоматически отключать booking, auth, payment webhooks или обязательные security-функции только из-за стоимости.

## Supabase

| Метрика | Warning | Critical | Действие |
|---|---:|---:|---|
| Database size | 70% лимита | 85% | Проверить рост таблиц, индексов и retention |
| Storage | 70% | 90% | Найти orphan/duplicate media, не удалять без manifest |
| Egress | 80% | 95% | Проверить крупные ответы, media и повторные запросы |
| Connection pool | 70% устойчиво 15 мин | 90% 5 мин | Проверить serverless fan-out и долгие запросы |
| Function/DB errors | ≥2% за 10 мин | ≥5% за 5 мин | Открыть incident, проверить quota/throttling |

Еженедельно проверять growth database/storage, top egress consumers, медленные запросы и прогноз конца месяца.

## Vercel

| Метрика | Warning | Critical | Действие |
|---|---:|---:|---|
| Bandwidth | 80% | 95% | Проверить изображения, ботов, cache headers и hotlinking |
| Function invocations | 80% | 95% | Найти polling, retry loops и лишние dynamic routes |
| Function duration/compute | 80% | 95% | Проверить cron, sync, health и timeout |
| Image optimization | 70% | 90% | Проверить размеры, variants, CDN и повторную оптимизацию |
| Build minutes | 80% | 95% | Исключить дублирующие сборки, сохранить release gates |

При превышении image quota сохранять доступность уже подготовленных изображений; не включать глобально неограниченный внешний proxy.

## Media CDN и proxy

- Warning при 70% storage/transfer quota, critical при 90%.
- Alert при росте proxy requests в 2 раза к 14-дневной медиане в течение часа.
- Alert при origin error rate ≥2% за 10 минут или cache hit ratio <80% за час.
- Ограничить допустимые host, размер ответа, timeout и тип контента.
- Перед удалением медиа сверять CMS, публичные страницы, manifest и backup.

## Процедура alert

1. Зафиксировать provider, metric, текущее значение, лимит, forecast, environment и время UTC.
2. Исключить ошибку измерения и тестовый/staging трафик.
3. Найти top consumer по route, function, bucket или media host.
4. Применить обратимую меру: cache, уменьшение batch, остановка необязательного import/reindex, rate limit подозрительного трафика.
5. Не менять тариф и не создавать платное обязательство без согласования владельца.
6. После исправления подтвердить снижение минимум на двух последовательных интервалах.
7. Записать причину и действие в ежемесячный cost review.

## Ритм контроля

- Автоматические alerts — непрерывно.
- Операционный обзор — еженедельно.
- Budget/forecast review — в первый рабочий день месяца и при достижении 80%.
- Пересмотр порогов — ежеквартально или после любого cost incident.

## Внешние блокеры

- `EXTERNAL_BLOCKER`: бюджеты, тарифы и владельцы не заполнены.
- `EXTERNAL_BLOCKER`: требуется доступ к Supabase usage/billing и настройка alerts.
- `EXTERNAL_BLOCKER`: требуется доступ к Vercel usage/billing; часть alerts и drains зависит от тарифа.
- `EXTERNAL_BLOCKER`: нужны usage API/dashboard и лимиты конкретного media CDN.
- `EXTERNAL_BLOCKER`: без production baseline прогноз и anomaly thresholds нельзя считать подтверждёнными.

