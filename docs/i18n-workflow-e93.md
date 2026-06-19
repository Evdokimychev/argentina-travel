# E93: Workflow заполнения переводов (ES/EN)

## Цель

Сделать управляемый цикл подготовки переводов для CMS-контента (`legal`, `blog`, `guide`, `destination`, `place`) без «пустых» страниц на публичном сайте.

## Что реализовано

### 1) Админ-раздел переводов

- Новый экран: `/admin/content/translations`
- Новое API: `GET /api/admin/content/translations`
- Что видно редактору:
  - общий процент покрытия для ES и EN;
  - список документов, где перевод не готов;
  - статус по каждой локали и быстрый переход в редактор.

Статусы локали:

- `missing` — перевода нет;
- `draft` — черновик;
- `archived` — архив;
- `published_incomplete` — опубликовано, но контент неполный;
- `published_complete` — готово к публикации.

### 2) Метаданные статуса перевода в резолверах

В `src/lib/cms/content-resolver.ts` добавлены метаданные:

- `translationStatus.ru_complete`
- `translationStatus.es_status`
- `translationStatus.en_status`
- `showTranslationBanner` для публичных страниц

Эти метаданные прикрепляются в `resolveLegalDocument`, `resolveBlogPost`, `resolveGuidePage`, `resolveDestinationPage`, `resolvePlacePage`.

### 3) Seed для локалей из RU-источника

- Новый скрипт: `scripts/seed-cms-locales.mjs`
- Команда: `npm run supabase:seed-cms-locales`
- Поведение:
  - берёт приоритетные slug из E77 (`CMS_I18N_ROLLOUT_TOP_SLUGS`);
  - создаёт ES/EN документы как **draft**;
  - тело документа копируется из RU (как рабочая заготовка для переводчика).

Для повторного запуска с перезаписью существующих заготовок:

```bash
npm run supabase:seed-cms-locales -- --force
```

### 4) Публичные страницы без пустого контента

Если локаль ES/EN не имеет полноценного опубликованного контента:

- резолвер пропускает неполный перевод и использует RU fallback;
- на странице показывается предупреждение:
  - «Перевод на … язык готовится. Пока показываем русскую версию материала.»

Баннер добавлен для:

- `/blog/[slug]`
- `/guide/[slug]` (CMS-страницы)
- `/destinations/[slug]`
- `/places/[slug]`
- `/legal/[slug]`

## Операционный процесс для редакции

1. Запустить `npm run supabase:seed-cms-locales` для подготовки черновиков.
2. В `/admin/content/translations` выбрать документы с `missing`/`draft`.
3. Открыть карточку документа, доработать ES/EN перевод.
4. Опубликовать только после проверки полноты.
5. Убедиться, что статус стал `published_complete`.

## Примечание по качеству

`ru_complete` считается по фактической заполненности контента, а не только по факту наличия записи. Это позволяет заранее увидеть проблемные RU-основы до перевода.
