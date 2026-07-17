# Media rights readiness — 16 июля 2026

## Область проверки

Проверены только локальные медиа, до которых реально доходят публичные места, направления, туры, индексируемые статьи и публичные записи базы знаний, зарегистрированные страницы, галерея и включённые записи социальной ленты. Архивные и административные заготовки не включались.

## Итог

| Показатель | Значение |
| --- | ---: |
| Всего записей manifest | 2212 |
| Уникальных публичных media-путей | 619 |
| Публичных assets из manifest | 617 |
| Полный creator/source/license | 617 (100%) |
| Строк высокого риска | 0 |
| Уникальных assets высокого риска | 0 |
| Средний риск | 30 |
| Публичные пути вне manifest | 2 |
| Группы одинаковых файлов (SHA-256) | 85 |
| Конфликтующие права у одинаковых файлов | 0 |
| Публичные контексты с logo/«Нет фото» fallback | 1 |

## Что проверено

- наличие файла и возможность декодирования;
- фактические размеры изображения;
- alt и доступный caption/title;
- creator, source URL, license/rights;
- SHA-256 дубликаты и противоречия прав у идентичных байтов;
- публичные локальные пути вне manifest;
- возврат logo/«Нет фото» вместо контентного изображения.

## Проблемы по типам

| Код | Количество |
| --- | ---: |
| duplicate_within_entity | 17 |
| hero_resolution | 11 |
| unmanaged_asset | 2 |

## Блокеры и действия владельца

Высоких рисков не найдено.

Публичные файлы вне manifest требуют отдельного решения владельца:

- `media/places/el-chalten/gallery-2.jpg` — добавить подтверждённые creator/source/license metadata или убрать публичную ссылку; контекст: blog:patagonia-whale-watching:card, blog:patagonia-whale-watching:hero, blog:patagonia-за-5-дней:card, blog:patagonia-за-5-дней:hero.
- `media/placeholders/tour-card.jpg` — добавить подтверждённые creator/source/license metadata или убрать публичную ссылку; контекст: literal:src/lib/youtravel/partner-tour-repository.ts.

Контентный fallback logo/«Нет фото»: `blog:ischigualasto-valle-de-la-luna:rich-gallery`. Нужен подтверждённый asset либо скрытие пустого медиаблока.

## Исправлено в этом спринте

Три публичных файла зарегистрированы в manifest без догадок: metadata повторно зафиксированы только после полного совпадения SHA-256 с уже атрибутированным файлом.

- `media/blog/mendoza-wine-route/hero.jpg` — идентичен `blog-mendoza-vinnyj-gid`;
- `media/places/el-chalten/hero.jpg` — идентичен `place-fitz-roy-hero`;
- `media/places/purmamarca/hero.jpg` — идентичен `place-cerro-de-los-7-colores-hero`.

Повреждённых или отсутствующих файлов: 0; ошибок декодирования: 0; пустых alt: 0; заглушек в alt: 0.

## Значимые SHA-256 дубликаты

- `293e316c0622…` — blog-natsionalnyy-park-iguasu-hero, blog-rich-iguazu-national-park-gallery-1; повтор внутри blog:natsionalnyy-park-iguasu.
- `2ab4043da94b…` — blog-banado-la-estrella, blog-rich-banado-la-estrella-gallery-1; повтор внутри blog:banado-la-estrella.
- `4e747311204a…` — at-gualeguaychu-gallery-4, at-gualeguaychu-hero; повтор внутри place:gualeguaychu.
- `5270dc443c17…` — at-federacion-gallery-4, at-federacion-hero; повтор внутри place:federacion.
- `ae6eba5c1675…` — blog-natsionalnye-parki-argentiny, blog-rich-all-argentina-national-parks-gallery-1, blog-rich-iguazu-national-park-gallery-3; повтор внутри blog:natsionalnye-parki-argentiny.
- `b7f611b0a404…` — at-parana-gallery-4, at-parana-hero; повтор внутри kb:parana, place:parana.
- `d550fc8de2d1…` — dest-mendoza-gallery-2, destination-mendoza-section, place-mendoza-gallery-2, tour-mendoza-wine-gallery-2; повтор внутри destination:mendoza.

## Автоматический gate

`npm run media:rights:check` сравнивает manifest с `MEDIA_RIGHTS_BASE_REF`, базовой веткой GitHub или с `HEAD` локально и блокирует новые/изменённые assets с отсутствующим файлом, невалидными размерами, alt или неполными creator/source/license metadata. Полный аудит: `npm run media:rights:audit`.

## Ограничения

- Аудит подтверждает полноту записанных metadata, но не заменяет юридическую проверку условий каждой лицензии.
- Metadata не переносились между разными файлами. Допустимым доказательством считалось только полное совпадение SHA-256.
- Внешние партнёрские изображения, которые приходят динамически и не сохраняются в manifest, находятся вне этого локального аудита.
