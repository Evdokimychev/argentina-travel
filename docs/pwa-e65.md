# E65 — PWA (мобильное приложение на сайте)

Задача добавляет манифест, метаданные Apple Web App, офлайн-оболочку и клиентские улучшения для мобильных устройств. Пакет `next-pwa` **не подключён** — service worker регистрируется вручную через `PwaShell` в production.

## Что уже в репозитории

| Файл | Назначение |
|------|------------|
| `public/manifest.json` | Имя «Пора в Аргентину», `theme_color` sky (`#74acdf`), иконки |
| `public/sw.js` | Минимальный SW: кэш `offline.html`, fallback при навигации без сети |
| `public/offline.html` | Офлайн-страница с safe-area |
| `public/icons/pwa-icon.svg` | Векторная иконка |
| `public/icons/icon-*.png` | PNG для install prompt (192 / 512) |
| `src/components/pwa/PwaShell.tsx` | Регистрация SW, pull-to-refresh guard, `InstallPrompt` |
| `src/app/layout.tsx` | `viewport-fit=cover`, `manifest`, `appleWebApp` |

## Ручная настройка (если SW не регистрируется)

1. Убедитесь, что сайт отдаётся по **HTTPS** (или `localhost` в dev).
2. В production `PwaShell` вызывает `navigator.serviceWorker.register('/sw.js')`.
3. Для отключения SW уберите регистрацию из `PwaShell` или не деплойте `public/sw.js`.
4. После изменения `sw.js` увеличьте версию кэша `pva-offline-v1` → `pva-offline-v2`.

### Проверка в Chrome DevTools

1. Application → Manifest — имя, иконки, `theme_color`.
2. Application → Service Workers — статус `/sw.js`.
3. Network → Offline — перезагрузка страницы должна показать `/offline.html`.

### iOS (Safari)

- `apple-mobile-web-app-capable` задаётся через `metadata.appleWebApp` в `layout.tsx`.
- Подсказка «На экран Домой» — компонент `InstallPrompt` (со 2-го визита).

### Иконки PNG

При смене бренда перегенерируйте:

```bash
node scripts/generate-pwa-icons.mjs
```

## Install prompt

- Показывается на **мобильных** со **2-го визита** (`localStorage: pwa-visit-count`).
- Скрывается по кнопке «Закрыть» (`pwa-install-dismissed`).
- Не показывается в режиме `standalone` (уже установлено).
- Android/Chrome: событие `beforeinstallprompt` + кнопка «Установить».
- iOS Safari: текстовая инструкция «Поделиться → На экран Домой».

## Жесты и safe-area

- `viewport-fit=cover` в `export const viewport`.
- `env(safe-area-inset-*)` на шапке, подвале и офлайн-странице.
- `PullToRefreshGuard` — `preventDefault` при свайпе вниз у `scrollY === 0`.
- В standalone: `overscroll-behavior-y: contain` на `html, body`.

## Альтернатива: next-pwa

Если понадобится автогенерация SW при сборке:

```bash
npm install next-pwa
```

Настройте обёртку в `next.config.ts` по документации пакета и удалите ручной `public/sw.js` + регистрацию в `PwaShell`, чтобы не дублировать workers.
