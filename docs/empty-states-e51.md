# E51: Скелетоны и пустые состояния

Единая система загрузки и пустых экранов для каталога, кабинетов и админки.

## Компоненты

| Файл | Назначение |
|------|------------|
| `src/components/ui/skeleton.tsx` | Базовый `Skeleton` и варианты по зонам |
| `src/components/ui/empty-state.tsx` | `EmptyState` с `variant` и CTA-кнопками |
| `src/components/admin/AdminTableState.tsx` | Обёртка «скелетон / пусто» для `<tbody>` |

## Варианты `EmptyState`

### `catalog` — публичный каталог

**Когда:** страницы `/tours`, `/excursions`, результаты поиска и фильтров.

- Крупнее отступы и иконка
- Основной CTA — сброс фильтров или переход в соседний каталог
- Вторичный CTA — альтернативный маршрут (экскурсии ↔ туры)

**Пример:**

```tsx
<EmptyState
  variant="catalog"
  icon={MapPin}
  title="Туры не найдены"
  description="Попробуйте изменить фильтры или сбросить поиск."
  action={{ label: "Сбросить фильтры", onClick: resetFilters }}
  secondaryAction={{ label: "Смотреть экскурсии", href: "/excursions", variant: "outline" }}
/>
```

### `cabinet` — личный кабинет туриста и организатора

**Когда:** `/profile/*`, `/organizer/*`, колокольчик уведомлений.

- Средний размер, вписывается в `cabinetPanelClass`
- CTA ведут в смежные разделы кабинета или каталог
- `compact` — для поповеров (колокольчик)

**Пример:**

```tsx
<EmptyState
  variant="cabinet"
  icon={CalendarDays}
  title="Бронирований пока нет"
  action={{ label: "Выбрать тур", href: "/tours" }}
  secondaryAction={{ label: "Найти заявку по email", href: "/booking/find", variant: "outline" }}
/>
```

### `admin` — админ-панель

**Когда:** таблицы и списки в `/admin/*`.

- Компактнее, без лишнего воздуха в ячейках таблиц
- `bordered={false}` внутри `<td>` через `AdminTableState`
- CTA — сброс фильтра или ссылка на связанный раздел

**Пример:**

```tsx
<AdminTableState
  loading={loading}
  isEmpty={rows.length === 0}
  colSpan={6}
  emptyIcon={CalendarDays}
  emptyTitle="Заявок не найдено"
  emptyDescription="Измените фильтр статуса или поисковый запрос."
  emptyAction={{ label: "Все заявки", onClick: () => setStatusFilter("all"), variant: "outline" }}
/>
```

## Скелетоны по зонам

### Catalog

| Компонент | Где |
|-----------|-----|
| `CatalogLoadingFallback` | `loading.tsx` для `/tours`, `/excursions` |
| `CatalogCardSkeleton` | Сетка карточек каталога |

Скелетон повторяет: заголовок → строка поиска → сетка `sm:2 / xl:3` карточек с `aspect-[4/3]`.

### Cabinet

| Компонент | Где |
|-----------|-----|
| `CabinetLoadingFallback` | `profile/loading.tsx`, `organizer/loading.tsx` |
| `CabinetBookingListSkeleton` | `/profile/bookings` |
| `CabinetDashboardSkeleton` | обзор организатора |
| `CabinetInboxListSkeleton` | входящие, колокольчик уведомлений |

Скелетоны повторяют финальную вёрстку карточек бронирований (`aspect-[16/9]` + текстовый блок), inbox-строк и сетку дашборда.

### Admin

| Компонент | Где |
|-----------|-----|
| `AdminTableRowsSkeleton` | строки `<tbody>` при загрузке |
| `AdminTableSkeleton` | полная таблица с заголовками |
| `AdminListSkeleton` | списки `<ul>` (туры, модерация, заказы) |

## Правила

1. **Без layout shift** — скелетон должен совпадать по размерам с реальным контентом (карточка, строка таблицы, панель).
2. **Не смешивать** текст «Загрузка…» и скелетон на одном экране — только скелетон + `sr-only` для screen readers.
3. **Пустое ≠ ошибка** — для ошибок API оставлять `role="alert"` / красный текст отдельно.
4. **CTA обязателен** там, где пользователь может продолжить путь (каталог, кабинет, админ-фильтры).
5. **Русские формулировки** — без англицизмов в пользовательском тексте (см. редакционный стандарт).

## Где уже подключено (E51)

- Профиль: бронирования
- Организатор: дашборд, входящие
- Каталог: туры, экскурсии
- Уведомления: колокольчик
- Админка: бронирования, туры, платежи, журнал, выплаты, модерация, заказы, CMS-документы

## Добавление в новый экран

1. Определить зону: `catalog` | `cabinet` | `admin`.
2. Подобрать скелетон из `skeleton.tsx` или добавить новый по образцу существующего.
3. Для таблиц админки — `AdminTableState` в `<tbody>`.
4. Для списков — `AdminListSkeleton` / `CabinetInboxListSkeleton` + `EmptyState`.
5. Проверить отсутствие скачка вёрстки при смене `loading → data` и `data → empty`.
