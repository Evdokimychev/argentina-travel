# Итог реализации контентной платформы

Дата: 2026-07-15
Ветка: `content/knowledge-base-editorial-system`

## Что изменено

1. Создан воспроизводимый inventory для 1 131 записи из 18 слоёв.
2. Сформированы gap map, quality score, action plan, duplicate/thin/orphan отчёты.
3. Созданы taxonomy, географический и терминологический словари.
4. Созданы реестры sources, claims, sensitive claims, dynamic facts, media rights и widgets.
5. Статический publication gate усилен первичным источником, reviewer, review due и media rights.
6. Критичные материалы исключаются из публичной KB, поиска, карты и sitemap через общий loader.
7. База знаний включена в глобальный поисковый индекс.
8. Поиск получил единую нормализацию русского/испанского написания, диакритики и опечаток.
9. Исправлен static fallback для places и добавлены регрессионные тесты.
10. Нулевое состояние поиска предлагает сброс фильтра и полезные разделы.
11. Пять ссылок `/guide` на карантинные KB-страницы заменены рабочими guide routes.
12. Удалены три пустых widget anchors на денежном гиде.
13. Неподтверждённые рейтинги places и 13 legacy rich-rating блоков скрыты.
14. Related helper больше не добавляет статьи с нулевой релевантностью.
15. Редакционная заглушка destination empty state заменена честным объяснением.
16. Валютный виджет переведён на официальный BCRA API.
17. Убраны DolarAPI/blue-rate данные из самого виджета; добавлены source, rate type, timestamp и disclaimer.
18. Fallback общих валютных курсов больше не получает текущую дату для статичных значений.
19. Добавлена additive Supabase-модель sources, claims, dynamic facts, relations, widgets и media usages.
20. Добавлены RLS, explicit grants, feature flag, server-only RPC и database trigger публикации.
21. Добавлен обратимый rollback с явным предупреждением о backup.
22. CMS получила workflow/risk/reviewer/review dates.
23. CMS получила source и claim editor с audit log.
24. Медиатека CMS получила проверку license, creator, source page, alt, attribution и focal point.
25. Content health dashboard показывает карантин KB и причины.

## Что нельзя считать завершённым автоматически

Фактическая переработка сотен исторических текстов не подменена массовым автозаполнением. На дату снимка:

- 172 исторических source records требуют ручной проверки; отдельно подтверждён официальный BCRA API;
- 132 sensitive claims требуют reviewer/inline scope и повторной проверки;
- 14 cohorts media rights не имеют достаточных доказательств; 199 media slots отсутствуют;
- 465 записей требуют расширения, 156 — глубокой редакторской переработки, 143 — legal review;
- runtime Supabase и production crawl зависят от окружения и проверяются перед deploy отдельно.

Эти ограничения — не скрытые долги: они доступны в CSV, `var/ops/content-governance-audit.json`, content health и блокируют небезопасную публикацию.

## Эксплуатация

Редактор назначает риск и этап, добавляет официальный источник, связывает проверяемые утверждения, задаёт reviewer и срок повторной проверки, затем переводит материал в `ready`. Для использованных CMS-медиа отдельно подтверждаются автор, лицензия, source page, alt и rights status. Только после зелёного gate разрешены publish/schedule.

Feature flag `content_governance_v1` создаётся выключенным. Это позволяет применить схему, проверить редактор и данные, а затем включать rollout осознанно. Сам publication trigger при этом остаётся защитой целостности и не полагается на UI.
