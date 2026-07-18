# Performance budgets: public mobile routes

## Контрольный набор

- `/`
- `/tours`
- `/blog`
- `/destinations/patagonia`

Каждый маршрут проверяется тремя отдельными холодными mobile-запусками Lighthouse. Отчёт содержит release SHA, признак dirty working tree, устройство, способ throttling и URL. Сравнивать before/after можно только при одинаковых SHA, URL, устройстве и сетевом профиле.

## Блокирующие бюджеты

| Метрика | Бюджет |
|---|---:|
| Median Lighthouse Performance | ≥75 |
| LCP, каждый запуск | ≤4 000 мс; следующий целевой этап ≤2 500 мс |
| CLS, каждый запуск | ≤0,10 |
| TBT, каждый запуск | ≤300 мс |
| Transfer `/` | ≤2 500 000 bytes |
| Transfer content route | ≤1 500 000 bytes |
| Script transfer | ≤350 000 bytes |
| Accessibility | ≥95 |
| SEO | ≥95 |

CI останавливает проверку при превышении любого бюджета и сохраняет JSON каждого запуска вместе с итоговым отчётом. Ослаблять порог под текущий результат нельзя: исключение оформляется как ограниченное по времени решение с владельцем и задачей на устранение.

## Baseline до Sprint 3

Локальный отчёт от 2026-07-15:

| Маршрут | Performance | LCP |
|---|---:|---:|
| `/` | 47 | 59,5 с |
| `/tours` | 56 | 10,1 с |
| `/blog` | 45 | 9,7 с |
| `/destinations/patagonia` | 56 | 11,4 с |

Baseline показывает инженерную проблему доставки, а не только вариативность Lighthouse: глобально отключалась оптимизация изображений, hero дублировался через CDN и local fallback, а общий layout включал крупные контентные данные и заранее монтировал поиск/карту.

## Правила LCP и медиа

- На странице только один `priority`-кандидат, соответствующий фактическому hero.
- Один hero не запрашивается одновременно с CDN и локального origin.
- Внешний media CDN сам по себе не отключает responsive Next Image.
- AVIF/WebP и корректный `sizes` обязательны для растровых публичных изображений.
- Изображения ниже первого экрана загружаются лениво.
- Partner proxy может быть `unoptimized` только точечно, если оптимизацию уже выполняет сам proxy.

## Проверка перед релизом

1. Использовать стабильную production-сборку одного SHA.
2. Запустить `node scripts/lighthouse-phase2-ci.mjs`.
3. Проверить итоговый JSON и все raw Lighthouse artifacts.
4. Убедиться, что CI не помечает performance job как `continue-on-error`.
5. Для visual regression проверить mobile 390 px и desktop: hero, поиск, карта, fallback изображений, alt и отсутствие layout shift.

