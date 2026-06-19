# E52: Accessibility WCAG 2.1 AA polish

High-impact accessibility improvements for keyboard navigation, focus visibility, form semantics, and color contrast.

## Checklist

### Global

- [x] **Skip to content** — `SkipToContentLink` in `SiteChrome`, visible on `focus-visible`
- [x] **Focus ring** — base `:focus-visible` outline in `globals.css` (`--color-sky`); UI controls use `focus-visible:ring-sky/40`
- [x] **Reduced motion** — existing `prefers-reduced-motion` rules in `globals.css`

### Site chrome

- [x] **Header** — icon buttons (`CircleButton`) have `aria-label`; menu trigger has `aria-expanded` / `aria-controls`
- [x] **Profile menu** — login and profile toggle have descriptive `aria-label`; menu has `role="menu"`
- [x] **Notifications bell** — `aria-label` (with unread count), `aria-expanded`, `aria-haspopup`
- [x] **Site search** — trigger `aria-label`; combobox `aria-label`, `aria-autocomplete`, `aria-activedescendant`; filter chips `aria-pressed`; result rows `aria-label`; ↑↓ navigation; Enter to open; Esc closes (Radix Dialog)
- [x] **Mobile nav overlay** — `role="dialog"`, `aria-modal`, focus trap on Tab, Escape closes, return focus to trigger

### Modals

- [x] **Dialog (Radix)** — focus trap and `aria-modal` by default; close button `aria-label="Закрыть"`
- [x] **Search dialog** — `onOpenAutoFocus` focuses query input instead of close control

### Forms

- [x] **`FormField`** (`src/components/ui/form-field.tsx`) — label association, required indicator (`*` + sr-only), `aria-describedby` for hint/error, `aria-invalid` on error
- [x] **`Input` / `Textarea` / `NativeSelect`** — `aria-invalid` styles, `focus-visible` rings, placeholder contrast (`text-slate/70`)
- [x] **`PhoneCountryInput`** — forwards `aria-describedby`, `aria-invalid`, `aria-required` to national input
- [x] **Pilot forms** — Join page contact form, organizer booking edit modal (`FormField`)

### Color contrast

- [x] Replace low-contrast `text-gray-400` on white/light surfaces with `text-slate/70` (UI inputs, marketplace search, nav drawer indices, date pickers)
- [x] Semantic muted text uses `--color-slate` (`#4a5568`) — ≥4.5:1 on white for normal text

### Manual QA (recommended)

- [ ] Tab through header → all interactive elements receive visible focus
- [ ] ⌘K / mobile search → arrow keys move highlight; Enter opens result; Esc closes
- [ ] Open mobile menu → Tab cycles inside panel; Esc closes; focus returns to menu button
- [ ] Screen reader: notifications bell announces unread count
- [ ] Join form: required fields announced; error messages linked when validation added
- [ ] axe DevTools / Lighthouse accessibility on homepage, tour detail, organizer cabinet

## Out of scope (future)

- Full-site form audit (every organizer editor field)
- Automated CI axe/playwright accessibility suite
- High-contrast theme toggle
- Live region for global toast / notification stream
- Captioning / transcripts for video content

## Developer notes

- Prefer `FormField` + `Input` for new forms; pass `error` string for `aria-describedby` + `role="alert"`
- Icon-only buttons must have `aria-label` (or visible text)
- Use `focus-visible`, not `focus`, for keyboard-only rings on custom controls
- Placeholder text: `placeholder:text-slate/70`, not `gray-400`
