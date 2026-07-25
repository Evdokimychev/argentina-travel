# Редакционная дизайн-система статей Go Argentina

**Статус:** Phase 1 (registry + adapters + pilot migration)  
**Связанный аудит:** [article-system-audit.md](./article-system-audit.md)

## Философия

Статьи собираются из **готовых блоков**, а не из уникальной вёрстки на каждый slug.

- Один визуальный язык для туристических, миграционных, бытовых и гастрономических материалов.
- Russian-first, но locale-ready (`ru` / `es` / `en` для UI-лейблов).
- Progressive enrichment: prose parser → typed `blocks` → slug overrides → CMS.
- Старые статьи не ломаются: legacy API сохраняется, новые типы добавляются через registry и adapters.

## Архитектура

```
src/editorial/
  registry/     — метаданные всех блоков
  schemas/      — валидация (Zod-ready helpers)
  adapters/     — BlogBodyBlock ↔ BlogRichBlock / legacy
  renderers/    — безопасный рендер + fallback
  blocks/       — новые редакционные компоненты
  media/        — фотосистема
  layouts/      — density и композиция
  utilities/    — rhythm + audit
  i18n/         — UI labels / dates / numbers
  preview/      — samples для каталога
```

Публичный рендер по-прежнему идёт через `BlogSectionBody` → `renderEditorialBlock` → legacy switch.

## Когда использовать / не использовать

| Блок | Использовать | Не использовать |
|------|--------------|-----------------|
| Lead | Один вводный абзац | Несколько лидов подряд |
| ArticleSummary | 3–7 ключевых тезисов | Как замена всему тексту |
| Photo | Одно смысловое фото | Текст на картинке вместо HTML |
| Gallery | 2–12 кадров одной темы | Хаотичная Pinterest-лента |
| Callout | Редкие важные замечания | Десятки разноцветных плашек |
| ComparisonTable | Сравнение 2–5 вариантов | Маленькие таблицы из 2 строк с сортировкой |
| OptionSelector | Выбор отруба/региона/документа | Если нужен просто список |
| Phrasebook | Живые фразы с переводом | Испанский текст картинкой |
| CountryTip | Русскоязычный контекст | Автоматически в каждую статью |
| Sources | Официальные ссылки | Пустые «источники» без URL |
| CTA | 1 основной (+1 доп.) | После каждого раздела |

## Правила изображений

- `alt` обязателен и описывает содержание, не SEO-запрос.
- `caption` не повторяет `alt`.
- `next/image`, lazy по умолчанию, priority только для LCP.
- Не инвертировать фотографии в dark mode.
- Дубликаты `src` в одной статье — предупреждение audit.

## Правила SEO

- Один H1 на странице (hero/title), в теле — H2/H3.
- Полезный текст должен быть в HTML, не только в JS state.
- FAQ: ответы в initial HTML; JSON-LD синхронизирован с видимыми вопросами.
- Sources и author остаются в разметке.

## Правила mobile

- Контрольные ширины: 320 / 375 / 390 / 430 / 768 / 1024+.
- Comparison: `mobileLayout` = `cards` | `stacked` | `tabs` | `scroll` (scroll — крайний случай).
- OptionSelector / Story deck: горизонтальный свайп + все варианты в DOM.
- Touch targets ≥ 44px.
- Не допускать горизонтальный overflow страницы.

## Правила источников и CTA

- У каждого source: title + url (+ publisher/accessedAt по возможности).
- Не фиксировать устаревающие цены без даты проверки.
- Не конвертировать валюты без явного курса.
- CTA не должен подменять смысл статьи партнёрским блоком.

## Правила авторства

- `author-card` для личного/экспертного блока.
- Не выдавать AI-summary за личный опыт.
- Не подменять личный аватар редакционным шаблоном.

## Anti-patterns

1. Карточки внутри карточек внутри карточек.
2. Пять одинаковых блоков подряд.
3. Бесконечная лента белых card surfaces.
4. Chip-wall TOC на mobile.
5. Уникальный one-off компонент только для одного slug (выносите данные на универсальный блок).

## Preview

Каталог: `/admin/editorial-components`

Показывает registry, samples, density, light/dark, mobile/tablet/desktop ширины.

## Миграция

1. Registry + wrappers (готово)
2. Adapters + schemas + renderer (готово)
3. Пилоты: `argentinian-steak-guide`, `best-time-to-visit-argentina`, `dni-cuil-argentina`
4. Удаление deprecated только после `editorial:audit` без usages

Команда: `npm run editorial:audit`
