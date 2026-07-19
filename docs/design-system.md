# Дизайн-система «Пора в Аргентину»

Source of truth: `src/styles/tokens.css`; семантические class helpers: `src/lib/design-tokens.ts`.

## Основа

- Контейнер: `max-w-screen-2xl`, поля 16 px mobile, 24 px `sm`, 32 px `lg`.
- Grid: 1 колонка mobile, 2 `sm`, 3 `xl`; detail — контент + 360 px booking panel с `lg`.
- Breakpoints: Tailwind defaults; контрольные 360, 390, 768, 1024, 1280, 1440 px.
- Spacing: 4 px base; 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 px.

## Типографика

- UI scale: 11, 12, 14, 16, 18, 20, 24, 30, 36 px.
- Body line-height 1.5–1.625; headings 1.08–1.25.
- Длинный mobile tour h1: 28 px; desktop 36–38 px.
- Цена и числа используют tabular numerals, где сравнение значений важно.

## Цвет

- `charcoal #1a1a2e` — основной текст.
- `slate #4a5568` — вторичный текст.
- `sky #74acdf` — мягкий фирменный акцент.
- `sky-ink #35699f` — доступные текстовые ссылки и primary button.
- `brand #d4533b` — тёплый аргентинский/земляной акцент.
- `sand #f5f0e8`, `surface-muted #f7f8fa`, white — поверхности.
- Success/warning/error имеют отдельные семантические пары foreground/muted.

## Форма и глубина

- Button radius 12 px; card 16 px; panel 24 px; pill 9999 px.
- Card shadow — едва заметная; elevated — hover/popover; modal — только overlay dialogs.
- Border по умолчанию `#e5e7eb`; цвет не является единственным носителем состояния.

## Интеракция

- Минимальная touch-target 44×44 px.
- Focus: видимое кольцо 2 px `sky/40`, keyboard order следует DOM.
- Motion: 150/200/250 ms; header 300 ms. При `prefers-reduced-motion` scale и плавные переходы отключаются.
- Dialog: focus trap, Escape, явная кнопка закрытия. Lightbox дополнительно закрывается нажатием по свободному фону, но не по самому фото.
- Accordion: button + `aria-expanded`; gallery поддерживает стрелки клавиатуры.

## Responsive-поведение

- Desktop navigation становится menu drawer.
- Search stack меняется с горизонтального на вертикальный.
- Secondary filters уходят в dialog/bottom-sheet pattern.
- Длинные breadcrumb trails превращаются в одну скроллируемую строку; текущий длинный title визуально скрывается на mobile.
- Tour card скрывает description и вторичные chips до `sm`, но сохраняет автора, географию, рейтинг, цену, длительность и дату.
- Booking panel становится bottom bar с `env(safe-area-inset-bottom)` и учитывает cookie consent offset.
- Mobile booking bar держит цену и короткую primary CTA в одной строке; дата и число туристов раскрываются отдельной компактной строкой над ней.
- PWA install prompt не показывается в каталогах туров/экскурсий и их detail-сценариях.

## Z-index

Base 0, raised 10, dropdown 40, sticky/header 50, overlay 60, cookie 80, mega menu 90, lightbox 100, nav drawer 105, popover 110, dialog 115, partner modal/toast 120, progress 130.

Компонентный набор и его покрытие описаны в [component-matrix.md](./research/component-matrix.md).
