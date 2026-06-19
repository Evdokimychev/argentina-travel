# E50: Аудит библиотеки UI-компонентов

Документ описывает унифицированные варианты `src/components/ui/*` и связанные токены в `src/lib/ui-surfaces.ts`.

## Button (`button.tsx`)

| Вариант | Назначение | Визуал |
|---------|------------|--------|
| `primary` | Основное действие (CTA) | `bg-sky`, белый текст, тень |
| `secondary` | Второстепенное действие | Рамка `gray-200`, белый фон |
| `ghost` | Третичное / в строке таблицы | Без рамки, hover `gray-100` |
| `destructive` | Удаление, отмена с риском | `bg-error` |
| `link` | Текстовая ссылка в потоке | Подчёркивание, `text-sky` |

**Алиасы (обратная совместимость):** `default` = `primary`, `outline` = `secondary`.

| Размер | Высота | Дополнительно |
|--------|--------|---------------|
| `default` | 44px (`h-11`) | `px-5`, `rounded-xl` |
| `sm` | 36px (`h-9`) | `rounded-lg`, `text-xs` |
| `lg` | 48px (`h-12`) | `text-base` |
| `icon` | 40×40 | Квадрат, `rounded-xl` |

Дополнительно: `loading`, `loadingLabel` — спиннер и опциональная подпись при загрузке.

## Card (`card.tsx`)

Варианты через `variant` (токены из `ui-surfaces.ts`):

| Вариант | Контекст | Радиус |
|---------|----------|--------|
| `public` | Каталог, лендинг, публичные формы | `rounded-2xl` |
| `cabinet` | Кабинет туриста / организатора | `rounded-3xl` |
| `admin` | Админ-панель | `rounded-3xl` |
| `hero` | Герой-блок в кабинете | `rounded-3xl` + градиент |
| `stat` | KPI-плитка | `rounded-3xl` + hover elevation |

Подкомпоненты: `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `StatCard`.

**Legacy:** строки `cabinetCardClass`, `cabinetPanelClass`, `cabinetHeroClass` в `cabinet-ui.ts` собраны из тех же токенов.

## FormField (`form-field.tsx`)

Единая обёртка поля:

- Подпись: `text-xs font-medium`, обязательное поле — `*` в `text-sky`
- Подсказка: `text-[11px] text-slate`
- Ошибка: `text-[11px] text-error`, `role="alert"` (подсказка скрывается при ошибке)

## Dialog (`dialog.tsx`)

| Часть | Отступы |
|-------|---------|
| `DialogHeader` | `px-5 py-4 sm:px-6`, нижняя граница |
| `DialogBody` | `px-5 py-4 sm:px-6` |
| `DialogFooter` | `px-5 py-4 sm:px-6`, верхняя граница, кнопки справа на sm+ |

Пропсы `DialogContent`: `bottomSheet` (мобильный sheet), `showClose`.

## Table (`table.tsx`)

| Компонент | Описание |
|-----------|----------|
| `TableWrap` | Обёртка с `variant`: `public` / `cabinet` / `admin` |
| `CabinetTableWrap` | Алиас `variant="cabinet"` |
| `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` | Базовая таблица без внешнего overflow (overflow на wrap) |

**Legacy:** `cabinetTableWrapClass`, `cabinetTableHeaderClass` в `cabinet-ui.ts` = экспорт из `ui-surfaces.ts`.

## Остальные компоненты (`src/components/ui/`)

| Файл | Варианты / заметки |
|------|-------------------|
| `input.tsx` | `h-11`, `rounded-xl`, focus ring sky |
| `textarea.tsx` | Аналогично input |
| `native-select.tsx` | Chevron, `pr-10` |
| `checkbox.tsx` | Radix, круглый, brand при checked |
| `switch.tsx` | `Switch`, `SwitchRow`, `SwitchField` |
| `badge.tsx` | `default`, `hot`, `new`, `hit`, `family`, `expedition`, `outline` |
| `empty-state.tsx` | `primary` / `secondary` для действий |
| `popover.tsx` | Radix popover |
| `skeleton.tsx` | Плейсхолдер загрузки |
| `slider.tsx` | Range input |
| `star-rating.tsx` / `star-rating-input.tsx` | Отображение и ввод звёзд |
| `single-date-picker.tsx` / `calendar-month-grid.tsx` | Выбор даты |
| `safe-image.tsx` / `image-placeholder.tsx` | Медиа |
| `FavoriteHeartIcon.tsx` | Иконка избранного |

## Миграция

1. Кнопки: предпочитать `primary` / `secondary` вместо `default` / `outline`.
2. Карточки кабинета: `<Card variant="cabinet">` вместо `className={cabinetCardClass}`.
3. Таблицы в кабинете: `<CabinetTableWrap><Table>…</Table></CabinetTableWrap>`.
4. Формы: `<FormField label="…" hint="…" error="…">` вместо локальных обёрток.
5. Диалоги: контент между header и footer — в `<DialogBody>`.

## Обновлённые call sites (E50)

- `BookingOrganizerEditModal` — `FormField`
- `TourGroupDatesAddModal` — `FormField`
- `OrganizerFinanceView` — `Card`, `Button`, `CabinetTableWrap`
- `BookingsView` — `CabinetTableWrap`, `Button secondary`
- `AdminPayoutsView` — `CabinetTableWrap`
- `DesignSystemShowcase` — демо всех вариантов
