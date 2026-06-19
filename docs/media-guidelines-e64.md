# E64: Иллюстрации и фотографии — гайдлайны

Единые правила медиа для маркетплейса «Пора в Аргентину»: пропорции, alt-тексты, источники и плейсхолдеры бренда.

## Компоненты

| Компонент | Путь | Назначение |
|-----------|------|------------|
| `ImagePlaceholder` | `src/components/ui/image-placeholder.tsx` | Брендовый плейсхолдер (градиент неба + иконка) |
| `SafeImage` | `src/components/ui/safe-image.tsx` | `next/image` с blur-skeleton, fallback и обработкой ошибок |
| Alt-хелперы | `src/lib/media-alt-text.ts` | Русские шаблоны alt-текста |
| Blur | `src/lib/media-blur.ts` | `SKY_IMAGE_BLUR_DATA_URL` для `placeholder="blur"` |

### Варианты `ImagePlaceholder`

| Вариант | Иконка | Когда использовать |
|---------|--------|-------------------|
| `tour` | MapPin | Карточки туров, галерея тура |
| `excursion` | Compass | Карточки экскурсий |
| `destination` | Mountain | Герои направлений, галерея региона |
| `avatar` | UserRound | Аватары организатора, гида, профиля |
| `generic` | ImageIcon | Прочие изображения |

Проп `compact` — без подписи, для миниатюр (аватар 28×28 px).

## Соотношения сторон

| Контекст | Aspect ratio | CSS-класс | Примечание |
|----------|--------------|-----------|------------|
| Карточка тура / экскурсии | 4∶3 | `aspect-[4/3]` | Каталог, избранное, подбор |
| Карточка направления (сетка) | 4∶3 | `aspect-[4/3]` | Хаб «Регионы и места» |
| Карточка направления (featured) | ~21∶9 / 2.4∶1 | `aspect-[21/9] sm:aspect-[2.4/1]` | Крупная плитка |
| Герой направления | min-height | `min-h-[48vh]` | Full-bleed, `object-cover` |
| Герой места | 21∶9 | `aspect-[21/9]` | Place detail |
| Аватар профиля | 1∶1 | `rounded-full` + `object-cover` | Круглый кроп |
| Галерея направления | 4∶3 | `aspect-[4/3]` | Сетка 2 колонки |

**Правило:** в карточках всегда `object-cover` + `overflow-hidden` на контейнере. Не использовать `object-contain` в превью каталога.

## Alt-тексты (русский)

Использовать хелперы из `src/lib/media-alt-text.ts`:

```ts
tourCoverAlt(title)       // «Обложка тура «…»»
excursionCoverAlt(title)  // «Обложка экскурсии «…»»
destinationHeroAlt(name)  // «Панорама направления «…»»
destinationGalleryAlt(name, index, total?) // ««…» — фото N из M»
avatarAlt(name)           // «Аватар: …»
placeCoverAlt(name)       // «Обложка места «…»»
```

### Правила

1. **Содержательный alt** — описывает, что на фото, а не дублирует заголовок карточки без контекста.
2. **Кавычки «ёлочки»** для названий туров, экскурсий, направлений.
3. **Декоративные элементы** — `alt=""` и `aria-hidden` (виньетки, иконки, точки карусели).
4. **Галерея** — нумерация «фото N из M» при нескольких кадрах.
5. **Аватар** — «Аватар: Имя Ф.»; при отсутствии фото — инициалы с `aria-label`, без видимого alt на `<img>`.
6. **CMS / manifest** — при наличии поля `alt` в `media-library/manifest.json` оно имеет приоритет над шаблоном.

## Unsplash vs загрузка

| Источник | Когда | Требования |
|----------|-------|------------|
| **Локальная медиатека** (`public/media/`) | Направления, места, блог, климат — контент редакции | WebP/JPEG, alt в manifest, оптимальный размер ≤ 2400 px по длинной стороне |
| **Unsplash (hotlink)** | Только seed/dev или временные заглушки организатора | Не для production-обложек туров; при миграции — скачать и положить в Storage |
| **Загрузка организатора** | Обложка и галерея тура в редакторе | Supabase Storage, min 1200×900 (4∶3), max 5 MB, JPEG/WebP |
| **Партнёр (Tripster/Sputnik8)** | Экскурсии | URL партнёра as-is; fallback — `ImagePlaceholder variant="excursion"` |
| **Аватар пользователя** | Профиль, организатор | Квадрат ≥ 256 px, `object-cover` в круге |

**Production:** обложки туров и направлений — только собственные файлы или Storage. Unsplash-URL в seed-данных заменять при публикации.

## Загрузка (blur skeleton)

`SafeImage` по умолчанию:

- `placeholder="blur"` с брендовым `SKY_IMAGE_BLUR_DATA_URL`
- Пульсирующий `ImagePlaceholder` до события `onLoad`
- Плавное появление (`opacity` transition 300 ms)
- При ошибке — fallback-variant или `fallback` prop (аватар → инициалы)

Отключить blur: `blurPlaceholder={false}`.

## Чек-лист перед публикацией медиа

- [ ] Соотношение сторон соответствует контексту (см. таблицу)
- [ ] Alt заполнен по шаблону или из manifest
- [ ] Файл сжат (TinyPNG / Squoosh / next/image)
- [ ] Нет hotlink на Unsplash в production-турe
- [ ] Карточка проверена без изображения (плейсхолдер) и с битым URL (fallback)

## Связанные задачи

- E39 / E43 — i18n alt-текстов для es/en (будущее)
- Media manifest sync — `docs/media-sync-failures.json`
- Организатор: `OrganizerPhotoUpload` — валидация размеров при загрузке
