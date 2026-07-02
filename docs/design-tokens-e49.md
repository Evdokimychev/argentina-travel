# E49 — Design tokens v2

Единый слой дизайн-токенов для волн UX E49–E65. Источник правды — `src/styles/tokens.css`; Tailwind-утилиты генерируются через `@theme` в `src/app/globals.css`.

## Структура

| Слой | Файл | Назначение |
|------|------|------------|
| Примитивы | `src/styles/tokens.css` | CSS-переменные `--token-*` на `:root` |
| Tailwind | `src/app/globals.css` `@theme` | Маппинг в `bg-sky`, `shadow-card`, `rounded-card` и т.д. |
| Хелперы | `src/lib/design-tokens.ts` | Готовые строки классов для поверхностей и хрома |

## Палитра

Основа — **sky / charcoal / sand**:

- **sky** — фирменный светло-голубой для акцентов, фонов бейджей, фокуса (`bg-sky/10`, `border-sky/25`, `ring-sky/40`)
- **sky-ink** (`#35699f`) — доступный тёмно-голубой для **текста и кнопок**: ссылки, метки, primary-кнопки (`text-sky-ink`, `bg-sky-ink`). Контраст ≥5.3:1 на белом, sky-50 и sky/10 (WCAG AA). Светлый `text-sky` на белом даёт 2.4:1 — для текста не использовать
- **charcoal** — основной текст (`text-charcoal`, `text-foreground`)
- **sand** — фон и нейтральные поверхности (`bg-pampas`, `bg-surface-muted`)

Семантические цвета: `foreground`, `muted`, `surface-elevated`, `border-subtle`, `success`, `warning`, `error`.

## Типографика

Шкала в токенах: `--token-text-2xs` … `--token-text-4xl`. В Tailwind — `text-2xs`, `text-sm`, `text-lg` и т.д.

Шрифты без изменений: `font-display` (Unbounded), `font-heading` / `font-body` (системный sans).

## Отступы

Шкала `--token-space-*` (база 4px). Для новых компонентов предпочтительны стандартные Tailwind `p-4`, `gap-3` — они совпадают с токенами. При необходимости сырые значения: `var(--token-space-4)`.

## Скругления

| Токен / класс | Использование |
|---------------|---------------|
| `rounded-button` | кнопки |
| `rounded-card` | карточки, блоки |
| `rounded-panel` | крупные панели (кабинеты, шапка) |
| `rounded-pill` | бейджи, круглые кнопки |

Старые `rounded-xl`, `rounded-2xl`, `rounded-3xl` продолжают работать.

## Тени

| Класс | Назначение |
|-------|------------|
| `shadow-card` | карточки по умолчанию |
| `shadow-elevated` | hover / приподнятые блоки |
| `shadow-modal` | модальные окна |
| `shadow-header-bar` | внутренняя панель шапки |

## Z-index

`z-dropdown` (40) → `z-header` / `z-sticky` (50) → `z-overlay` (60) → `z-modal` (70) → `z-toast` (80).

## Как подключать в компонентах

**Вариант 1 — хелперы (рекомендуется для новых экранов):**

```tsx
import { tokenCardSurfaceClass, tokenFocusRingClass } from "@/lib/design-tokens";

<div className={cn(tokenCardSurfaceClass, "p-5")} />
```

**Вариант 2 — Tailwind-утилиты из темы:**

```tsx
<button className="rounded-button bg-sky text-white shadow-sm focus-visible:ring-sky/40" />
```

**Вариант 3 — сырой CSS:**

```css
.my-block {
  border-radius: var(--token-radius-card);
  box-shadow: var(--token-shadow-card);
}
```

## Обратная совместимость

Все прежние имена (`bg-sky`, `text-charcoal`, `shadow-card`, `border-gray-100`, `rounded-2xl`) сохранены. Миграция поэтапная: E49 обновил `Header`, `Button`, `Card` (через `ui-surfaces`), `TourCard` / `tour-card-shell` как эталон.

## Тёмная тема (E62)

Семантические токены переопределяются в `html.dark` в `globals.css` через `--token-color-*` и `--token-shadow-*`.

## Следующие волны (E50+)

- `cabinet-ui.ts`, `tour-detail-ui.ts` — заменить хардкод на `tokenCardSurfaceClass` / семантические радиусы
- Формы, модалки — `z-modal`, `shadow-modal`
- Тосты — `z-toast`
