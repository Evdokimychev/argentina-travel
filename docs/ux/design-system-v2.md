# Design System V2

## Принципы

- Один визуальный язык для public, transactional и workspace surfaces.
- Компактные заголовки; hero-scale type только для настоящего hero.
- Радиус cards не больше 8 px для новых operational surfaces; существующие marketing cards мигрируют постепенно.
- Иконки Lucide для знакомых действий, tooltip для неочевидных icon-only controls.
- Один primary action на task surface.
- Минимальная интерактивная высота 44 px.

## Layout tokens

| Token | Назначение |
| --- | --- |
| `siteContainerClass` | публичный контент |
| `cabinetShellClass` | рабочее пространство |
| `PageIntro` | компактный intro hub-страницы |
| `PageSection` | вертикальный ритм раздела |
| `MobileActionBar` | важное действие над safe area |

## Состояния и доступность

- Focus ring видим на каждом интерактивном элементе.
- Dialog возвращает focus и закрывается Escape.
- Bottom sheet используется для фильтров и краткого выбора на mobile.
- Ошибки не передаются только цветом.
- Loading не меняет размеры layout после появления данных.
- `prefers-reduced-motion` отключает декоративное движение.

## Route shells

Public shell содержит site header/footer. Workspace shell содержит рабочую навигацию и не должен загружать публичные тяжёлые widgets. Embed и maintenance остаются изолированными.
