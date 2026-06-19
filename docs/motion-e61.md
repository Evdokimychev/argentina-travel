# E61: Motion system

## Принципы

- **Сдержанность** — анимации едва заметны, как у Stripe: fade, лёгкий slide-up (8–12px), scale 0.96→1.
- **Функциональность** — motion подчёркивает появление слоя (модал, dropdown, toast), не отвлекает от контента.
- **Доступность** — при `prefers-reduced-motion: reduce` все enter/exit-анимации отключаются; кнопки не сжимаются при нажатии.

## Токены

Определены в `src/app/globals.css` (`@theme`) и дублируются в `src/lib/motion.ts`:

| Токен | Значение | Назначение |
|-------|----------|------------|
| `--motion-duration-fast` | 150ms | Dropdown, fade-out, press |
| `--motion-duration-base` | 200ms | Overlay, toast, scale-in |
| `--motion-duration-slow` | 280ms | Modal slide-up, scroll reveal |
| `--motion-ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | Enter |
| `--motion-ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Exit, toggles |

## CSS-классы

| Класс | Где использовать |
|-------|------------------|
| `motion-overlay` | Backdrop модалов (Radix `data-state`) |
| `motion-modal-content` | Панель Dialog — slide-up на mobile, scale-in на sm+ |
| `motion-dropdown` | Popover / выпадающие меню |
| `motion-toast` | SiteToastHost |
| `motion-reveal` | Scroll-reveal секций (+ `motion-reveal-delay-*`) |
| `motion-button-press` | Кнопки с `active:scale(0.98)` |
| `motion-enter-overlay` | Backdrop кастомных sheet без Radix |
| `motion-enter-sheet` | Bottom sheet (LocaleCurrencySwitcher mobile) |

Импорт констант: `import { motionClass, motionRevealClass } from "@/lib/motion"`.

## React-компоненты и хуки

- **`MotionReveal`** (`src/components/motion/MotionReveal.tsx`) — обёртка секции с IntersectionObserver.
- **`useRevealAnimation`** — низкоуровневый хук; уважает reduced motion через `prefersReducedMotion()`.
- **Framer Motion** (уже в проекте) — для сложных сценариев (podbor, wizard). Используйте `motionTransition()`, `fadeSlideUpVariants`, `scaleInVariants` из `motion.ts`.

## Где уже подключено

- `src/components/ui/dialog.tsx` — modal overlay + content
- `src/components/ui/popover.tsx` — dropdown (уведомления, фильтры)
- `src/components/ui/button.tsx` — press feedback
- `src/components/feedback/SiteToastHost.tsx` — toast enter
- Legacy `animate-fade-in-up` — переведён на motion-токены (обратная совместимость)

## Правила для новых экранов

1. **Не** добавляйте bounce, rotate, parallax или длинные (>300ms) анимации без явной задачи.
2. Максимум **один** stagger-delay на группу карточек (100–300ms).
3. Hover на карточках — только `shadow` / `border`, без translateY (см. design-tokens).
4. Для enter/exit Radix-слоёв — CSS-классы из таблицы, не inline `style`.
5. Проверяйте в DevTools → Rendering → **Emulate prefers-reduced-motion**.

## Framer Motion vs CSS

| Сценарий | Подход |
|----------|--------|
| Dialog, popover, toast, button | CSS + `motionClass` |
| Scroll reveal секций | `MotionReveal` / `useRevealAnimation` |
| Многошаговый wizard, списки с stagger | Framer Motion + `motion.ts` helpers |
| Числовые счётчики | `useAnimatedValue` (уже в `useRevealAnimation.ts`) |

## Out of scope (будущее)

- Page transition между маршрутами Next.js
- Lottie / SVG-иллюстрации с autoplay
- Кастомный курсор — уже отдельно в `CustomCursor.tsx` с reduced-motion guard
