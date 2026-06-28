# PROMPTS — готовые промпты для Cursor

Копируй и адаптируй под задачу.

## Новая функция

```
Реализуй [описание].

Сначала:
1. Прочитай AGENTS.md и релевантные .cursor/rules/
2. Покажи «Влияние изменений на проект»
3. План: файлы, подход, риски

Затем реализуй минимальный diff.
После — npm run audit:quick и «Синхронизация проекта».
```

## Исправление бага

```
Баг: [описание]
Шаги воспроизведения: [шаги]
Ожидание: [ожидание]
Факт: [факт]

Найди root cause, исправь, добавь/regression test если уместно.
Не коммить без моей просьбы.
```

## Partner integration

```
Перед правками прочитай docs/integrations/[partner].md и .cursor/rules/partner-apis.mdc.

Задача: [описание]

Проверь checkout URL, mappers, тесты в src/lib/[partner]/.
Обнови docs/integrations/ если меняется контракт.
```

## UI / UX

```
Улучши [компонент/страницу].

Проверь: responsive, loading, empty, error, keyboard, mobile UX.
Следуй editorial-standard для русского текста.
Используй существующие tokens из responsive-ui.ts.
```

## Supabase / миграция

```
Добавь [таблицу/поле].

Создай migration в supabase/migrations/, RLS policies, обнови типы.
Запусти npm run supabase:verify и npm run rls-audit.
```

## Релиз

```
Подготовь к релизу:
npm run publish:verify:pre-deploy
npm run production-smoke (SMOKE_BASE_URL=https://www.goargentina.ru)

Покажи блокеры и что требует ручной проверки.
```

## Code review

```
Проведи review изменений в [файлы/ветка].
Проверь: безопасность, UX, performance, тесты, документация.
Формат: critical / suggestion / nit
```

## Refactor

```
Рефакторинг [область] без изменения поведения.

Сохрани обратную совместимость.
Добавь/обнови тесты.
npm run audit:quick после изменений.
```
