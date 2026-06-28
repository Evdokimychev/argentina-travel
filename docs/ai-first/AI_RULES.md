# AI RULES

Правила для Cursor AI в этом проекте.

## Источники (приоритет)

1. `AGENTS.md` — главные инструкции
2. `.cursor/rules/*.mdc` — автоматически применяемые правила
3. `docs/ai-first/` — контекст проекта
4. `docs/integrations/` — партнёрские API

## Workflow (обязательный)

```
Анализ → План → Код → Проверки → Документация
```

### 1. Анализ

- Прочитать связанные файлы и тесты
- Для partner/booking — `docs/integrations/tripster.md`
- Оценить влияние на туриста, организатора, CRM

### 2. План

Для задач >3 файлов:

- Подход и почему он выбран
- Список файлов
- Риски и обратная совместимость

### 3. Код

- Минимальный diff
- Существующие паттерны (mappers, hooks, lib)
- Русский пользовательский текст по editorial-standard
- Не менять i18n keys без необходимости

### 4. Проверки

```bash
npm run audit:quick          # минимум
npm run tripster:verify      # при правках Tripster
npm run supabase:verify      # при миграциях
npm run publish:verify:pre-deploy  # перед релизом
```

### 5. Документация

- Обновить типы и тесты
- Partner changes → `docs/integrations/`
- ADR в `DECISIONS.md` для архитектурных решений

## Запреты

- Коммиты без явной просьбы
- Секреты в коде
- Force push на main
- Удаление миграций/данных без объяснения
- Prettier / mass reformat

## UX/UI checklist (для UI задач)

- [ ] Mobile + desktop
- [ ] Loading / skeleton
- [ ] Empty state
- [ ] Error state
- [ ] Keyboard navigation
- [ ] Конtrast (WCAG AA где возможно)

## Объяснение решений

После значимых изменений AI должен кратко объяснить **почему** выбран подход.
