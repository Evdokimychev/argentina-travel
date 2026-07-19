# Карта источников исследования

Дата исследования: 18 июля 2026. Для каждого URL инструмент сохраняет `meta.json`, `source.html`, `dom.html`, `structure.json`, `computed-styles.json`, `assets.json`, ARIA snapshot (если поддерживается), `above-the-fold.png` и `full-page.png`.

Шаблон пути: `research/third-party/{site}/{id}/{viewport}/`.

Viewports: `desktop-wide` 1440×1100, `desktop` 1280×900, `tablet` 768×1024, `mobile` 390×844, `small-mobile` 360×800.

## YouTravel

| ID | Тип | URL | Пример снимка |
|---|---|---|---|
| home | Главная | https://youtravel.me/ | `youtravel/home/mobile/above-the-fold.png` |
| tours | Каталог | https://youtravel.me/tours/ | `youtravel/tours/desktop/above-the-fold.png` |
| argentina | Каталог страны | https://youtravel.me/tours/country/аргентина | `youtravel/argentina/mobile/above-the-fold.png` |
| last-minute | Спецкаталог | https://youtravel.me/tours/specials/goryashchie-tury | `youtravel/last-minute/desktop/above-the-fold.png` |
| one-day | Однодневные | https://youtravel.me/tours/days-1 | `youtravel/one-day/mobile/above-the-fold.png` |
| patagonia-tour | Тур | https://youtravel.me/tours/52537/… | `youtravel/patagonia-tour/mobile/above-the-fold.png` |
| expert-nikolay | Организатор | https://youtravel.me/expert/105276/николай | `youtravel/expert-nikolay/mobile/above-the-fold.png` |
| reviews | Отзывы | https://youtravel.me/reviews/ | `youtravel/reviews/desktop/above-the-fold.png` |
| blog | Журнал | https://youtravel.me/blog/ | `youtravel/blog/mobile/above-the-fold.png` |
| buenos-aires-article | Статья | https://youtravel.me/blog/planiruem-puteshestvie/dostoprimechatelnosti-buehnos-ajresa | `youtravel/buenos-aires-article/mobile/above-the-fold.png` |
| argentina-places-article | Статья | https://youtravel.me/blog/strany/6-best-places-to-visit-in-argentina | `youtravel/argentina-places-article/desktop/above-the-fold.png` |
| iguazu-article | Статья | https://youtravel.me/blog/strany/vodopady-iguasu | `youtravel/iguazu-article/mobile/above-the-fold.png` |

## «Клуб Гидов»

| ID | Тип | URL | Пример снимка |
|---|---|---|---|
| home | Главная | https://klubgidov.ru/ | `klubgidov/home/mobile/above-the-fold.png` |
| tours | Каталог | https://klubgidov.ru/tours | `klubgidov/tours/desktop/above-the-fold.png` |
| argentina | Каталог страны | https://klubgidov.ru/argentina | `klubgidov/argentina/mobile/above-the-fold.png` |
| patagonia-tour | Тур | https://klubgidov.ru/argentina/odisseya-po-patagonii-s-pereletami-386784 | `klubgidov/patagonia-tour/mobile/above-the-fold.png` |
| providers | Организаторы | https://klubgidov.ru/tour-providers | `klubgidov/providers/desktop/above-the-fold.png` |
| provider-2458 | Организатор | https://klubgidov.ru/tour-provider/2458 | `klubgidov/provider-2458/mobile/above-the-fold.png` |
| journal | Журнал | https://klubgidov.ru/journal | `klubgidov/journal/mobile/above-the-fold.png` |

Материалы локальные и исключены из Git. Redirect, HTTP status, title и фактический URL находятся в каждом `meta.json`.
