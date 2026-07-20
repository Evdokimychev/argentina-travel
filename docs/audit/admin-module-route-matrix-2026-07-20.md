# Матрица модулей и маршрутов — 20 июля 2026

## Назначение

Матрица фиксирует связь между публичным сайтом, административной панелью и единым контуром `site_settings`. Она не меняет и не оценивает содержание статей базы знаний.

Состояния разделены:

- код доступен — маршрут и инфраструктура существуют;
- модуль активирован — владелец разрешил работу функции;
- страница опубликована — публичный URL может отвечать;
- пункт виден в меню — ссылка показывается пользователю;
- поиск и sitemap — независимые каналы обнаружения страницы.

## Критические находки до исправления

| Проблема | Причина | Решение |
|---|---|---|
| `/immigration` отвечал 404 при видимой ссылке | В существующем `page.tsx` безусловно вызывался `notFound()` | Восстановлен готовый `ImmigrationHubView`; доступность теперь контролируется общим контуром модулей |
| Все `/immigration/[slug]` отвечали 404 | `generateStaticParams()` возвращал пустой массив, экран безусловно вызывал `notFound()` | Восстановлена статическая генерация семи тем и `ImmigrationPillarView` |
| Один переключатель навигации одновременно скрывал URL, меню, поиск и sitemap | `site.navigation` использовался как общий kill switch | Публикация перенесена в `site.modules.publicModules`, видимость меню осталась в `site.navigation` |
| Старые адреса раздела не были закреплены | В `next.config.ts` отсутствовали редиректы | Добавлены постоянные редиректы `/migration`, `/migration/:path*`, `/migratsiya`, `/migraciya`, `/pereezd` |
| Владелец не видел фактическое состояние разделов | Не было единого экрана модулей | Добавлен `/admin/modules` со статусами URL, меню, поиска, sitemap и зависимостей |

## Матрица

| Модуль | ID | Административный URL | Публичный URL | Источник состояния | Меню | Поиск | Sitemap | Зависимости | Решение / примечание |
|---|---|---|---|---|---|---|---|---|---|
| Главная | `home` | `/admin/system/settings?tab=appearance` | `/` | системный | всегда | да | да | — | Обязательный модуль |
| Туры | `tours` | `/admin/marketplace/tours` | `/tours` | `site.modules` + `site.navigation` | управляется | управляется | управляется | — | Подбор `/podbor` зависит от модуля |
| Экскурсии | `excursions` | `/admin/marketplace/excursions` | `/excursions` | `site.modules` + `site.navigation` | управляется | управляется | управляется | партнёрские API | Бронирование остаётся честно партнёрским |
| География | `geography` | `/admin/content/map` | `/destinations` | `site.modules` + `site.navigation` | управляется | управляется | управляется | — | Родитель направлений и мест |
| Направления и регионы | `destinations` | `/admin/content/documents` | `/destinations` | `site.modules` + `site.navigation` | управляется | управляется | управляется | `geography` | Дочерние slug проверяются резолвером |
| Города и достопримечательности | `places` | `/admin/content/map` | `/places` | `site.modules` + `site.navigation` | управляется | управляется | управляется | `geography` | Также коллекции, маршруты и карта |
| Путеводитель | `guide` | `/admin/content/documents` | `/guide` | `site.modules` + `site.navigation` | управляется | управляется | управляется | — | CMS/TS cutover остаётся отдельной настройкой |
| Галерея | `gallery` | `/admin/media` | `/gallery` | `site.modules` + `site.navigation` | управляется | управляется | управляется | медиатека | Скрывается без удаления медиа |
| Переезд и иммиграция | `immigration` | `/admin/modules` | `/immigration` | `site.modules` + `site.navigation` | управляется | управляется | управляется | 7 статических тем | Восстановлен после системной 404 |
| База знаний | `knowledgeBase` | `/admin/content/knowledge` | `/baza-znaniy` | `site.modules` + `site.navigation` | управляется | управляется | управляется | редакционный процесс | Контент и URL статей не изменялись |
| Журнал | `journal` | `/admin/content/documents` | `/blog` | `site.modules` + `site.navigation` | управляется | управляется | управляется | CMS | Комментарии серверно проверяют состояние модуля |
| Форум | `forum` | `/admin/content/forum` | `/forum` | `site.modules` + `site.navigation` | управляется | управляется | управляется | Supabase Auth | Запись серверно блокируется при отключении |
| Магазин | `shop` | `/admin/content/shop` | `/shop` | `site.modules` + `site.navigation` | управляется | управляется | управляется | каталог | Страницы и API заказов используют общий статус |
| Сервисы | `services` | `/admin/system/settings?tab=commerce` | `/services` | `site.modules` + `site.navigation` | управляется | управляется | управляется | вертикали услуг | Состав карточек зависит от реальных режимов |
| О проекте | `about` | `/admin/system/settings?tab=marketing` | `/about` | `site.modules` + `site.navigation` | управляется | управляется | управляется | — | Старые `/about-us`, `/o-nas` перенаправляются |
| Подбор маршрута | `routeBuilder` | `/admin/marketplace/tours` | `/podbor` | зависимость | вместе с турами | вместе с турами | вместе с турами | `tours` | Не может быть публичен при закрытых турах |
| Контакты и формы | `contacts` | `/admin/system/settings?tab=marketing` | `/contacts` | системный + `site.forms` | статический | да | да | почта/CAPTCHA | `/contact` перенаправляется |
| Поиск заявки | `bookingLookup` | `/admin/operations/bookings` | `/booking/find` | системный | служебная ссылка | нет | нет | безопасный lookup | Не индексируется как контент |
| Личный кабинет | `account` | `/admin/users` | `/profile` | Auth | профиль | нет | нет | Supabase Auth | Проверка прав на сервере |
| Избранное | `favorites` | `/admin/users` | `/profile/favorites` | Auth | профиль | нет | нет | `account` | Персональные данные |
| Бронирования | `bookings` | `/admin/operations/bookings` | `/profile/bookings` | Auth | профиль | нет | нет | `account` | Персональные данные и серверные права |
| Апартаменты | `apartments` | `/admin/marketplace/apartments` | `/apartments` | `site.modules.apartmentsMode` | по режиму | по режиму | по режиму | каталог/заявка | Публичный каталог только в `native_request` |
| Аренда авто | `carRental` | `/admin/marketplace/mobility` | `/car-rental` | `site.modules.carRentalMode` | по режиму | по режиму | по режиму | партнёр | `disabled` закрывает URL |
| Трансферы | `transfers` | `/admin/marketplace/mobility` | `/transfers` | `site.modules.transfersMode` | по режиму | по режиму | по режиму | партнёр/заявка | `disabled` закрывает URL |
| Отели | `hotels` | `/admin/modules` | — | `site.modules.hotelsMode` | нет | нет | нет | отсутствующий маршрут | Честно помечен как недоступный, без публичной ссылки |
| Интеграции | `integrations` | `/admin/system/settings?tab=marketing` | — | переменные окружения + health checks | админка | — | — | внешние API | Секреты не выводятся |

## Автоматические проверки

- `src/lib/modules/route-consistency.test.ts` сопоставляет все внутренние ссылки главного меню и footer с реальными App Router страницами.
- Тот же тест проверяет публичные и административные URL реестра модулей.
- Regression-проверка подтверждает восстановленный hub, статическую генерацию тем и старый редирект `/migration`.
- `src/lib/public-module-visibility.test.ts` проверяет независимые состояния публикации, меню, поиска и sitemap.
- `src/lib/admin/settings-control.test.ts` проверяет обязательное подтверждение отключения публичного модуля.
