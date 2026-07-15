# GoArgentina release 2026-07

Единый пакет доказательств предрелизной итерации. Состояние документов привязано к рабочей ветке `main`; итоговый SHA и production URL фиксируются в `final-release-report.md` после выкладки.

## Как читать пакет

- `issue-ledger.csv` — единый реестр дефектов, решений и проверок.
- `route-inventory.csv`, `route-component-matrix.csv`, `interaction-inventory.csv` — поверхность продукта.
- `capability-matrix.md`, `permission-matrix.md`, `architecture.md` — возможности и границы доступа.
- `security-checklist.md`, `performance-baseline.json`, `accessibility-baseline.json` — baseline и риски.
- `content-*`, `knowledge-review.csv`, `search-index-report.md` — контент, локали и поиск.
- `test-matrix.md`, `rollout-plan.md`, `rollback-plan.md` — проверка и выпуск.
- `decision-log.md` — принятые консервативные решения.
- `final-release-report.md` — фактический результат и честный verdict.

## Правило статусов

`closed` требует кода или конфигурации, теста и evidence. `open_exception` означает, что функция ограничена или не является основным production-путём, а риск, владелец и условие возврата зафиксированы. P0 не допускает exception.

## Безопасность данных

Перед миграцией `20260715032401_secure_auth_role_bootstrap.sql` создан schema-only backup в `var/backups/`. Секреты, адреса пользователей и содержимое production-записей в этот пакет не включаются.
