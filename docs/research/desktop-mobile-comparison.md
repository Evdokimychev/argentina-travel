# Desktop → mobile: сравнение паттернов

| Зона | Desktop | Mobile у референсов | Решение проекта |
|---|---|---|---|
| Header | Полная навигация и сервисные действия | Логотип, меню, вход/поиск | Компактный header, menu drawer, поиск |
| Hero поиска | Одна горизонтальная форма | Две большие строки, вторичные параметры скрыты | Направление + даты, одна CTA |
| Фильтры | Основные inline, вторичные в panel/popover | Bottom sheet/drawer, reset + count CTA | Draft dialog, «Сбросить» и «Показать · N» |
| Quick filters | Ряд chips | Горизонтальная прокрутка | Горизонтальная строка без overflow страницы |
| Сортировка | Select/pills рядом со счётчиком | Компактные tabs/popup | Scrollable pills, view toggle скрыт на телефоне |
| Карточки | 3 колонки или широкий list | 1 крупная карточка YouTravel / 2 компактные у «Клуба Гидов» | 1 компактный столбец: читаемость + плотность |
| Карточка | Описание и дополнительные характеристики | Изображение, автор, рейтинг, название, цена, дата | Описание и вторичные chips скрываются до `sm` |
| Галерея тура | Bento/grid | Swipe carousel + «Все фото» | Mobile carousel, thumbnails и lightbox |
| Заголовок тура | 36–44 px | 22–28 px, минимум breadcrumbs | 28 px, compact breadcrumb trail, описание 2 строки |
| Booking | Sticky sidebar | Fixed bottom bar / ранняя карточка | Sticky desktop panel + expandable mobile bar |
| Программа | Timeline/accordion | Accordion, один день открыт | Первый день открыт, остальные по запросу |
| Organiser | Расширенная trust-card | Фото, опыт, ответ, CTA | Профиль, проверка, туры, отзывы, связь |
| Article | TOC aside и колонка текста | TOC/reading flow в одной колонке | Responsive TOC, related tours и inline CTA |

Контроль ширины выполняется на 1440, 1280, 1024, 768, 390 и 360 px. Горизонтальная прокрутка допускается только внутри явно обозначенных рядов chips, миниатюр и section navigation.
