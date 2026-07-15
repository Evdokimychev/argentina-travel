# Final release report — GoArgentina 2026-07

## 1. Executive summary

Подготовлен крупный release candidate публичного сайта, кабинетов, auth, CMS и production-контуров. Закрыт P0 захвата административной роли и шесть P1 в auth/privacy/OTP/routing/SEO. Production-схема предварительно сохранена, миграция проверена транзакционным dry-run и применена; единственный существующий admin переведён на явное назначение staff.

**Verdict: READY WITH EXCEPTIONS.** Функциональный и security-контур допускает выпуск. Исключения: до редакционной публикации неполные локали остаются `noindex`; гарантированная доставка прикладных писем не обещается без delivery ledger/retry; performance baseline требует нового замера после стабилизации production deployment.

## 2. Архитектура и IA: до → после

| Область | До | После |
|---|---|---|
| Роли | editable auth metadata и fail-open admin bootstrap | signup=`tourist`; admin только через активный `admin_staff` |
| Вход по телефону | публичный phone→email/roles lookup | серверная проверка phone+password, нейтральные lookup-ответы |
| OTP заявки | read/update в разных запросах | атомарный conditional consume RPC |
| Consent | бессрочный старый формат, attribution до согласия | версия 2, expiry, attribution после personalization consent, удаление при отзыве |
| Public/cabinet IA | `/organizers/*` ошибочно считался `/organizer` | segment-aware workspace boundary |
| CMS globals | сырые поля без контроля изменений | preview меню, reset, disabled save для неизменённого состояния |
| Локали | fallback мог индексироваться как перевод | fallback `noindex,follow`; hreflang только опубликованных локалей |
| Коммерческие CTA | незавершённый магазин обещал покупку | «Заказать PDF» / «Уточнить доступность» |

Полная схема: `architecture.md`; 129 страниц и 234 API handler: `route-inventory.csv`; связи страниц и компонентов: `route-component-matrix.csv`.

## 3. Изменённые функции

- Регистрация, email/phone login, password UX, role bootstrap и admin RBAC.
- Guest booking lookup OTP и privacy delete retention.
- Consent, UTM attribution, analytics gating.
- Public organizer routing и cabinet chrome.
- CMS metadata/hreflang/robots для legal, blog, author, destination, place и guide.
- Округление публичной цены, честная статистика каталога и CTA магазина.
- SafeImage loading semantics, контакты, SSR loaders на places/booking find.
- Управление branding/navigation/contact globals в admin.
- Уникальность search IDs, validation kind/query.
- Legacy redirects `/contact`, privacy и about aliases.
- Flights partner widget timeout/error acceptance и устранение собственного ResizeObserver feedback loop.
- Трёхразмерная visual acceptance suite в CI.

## 4. Закрытые проблемы

| Severity | Закрыто | Ключевые ID |
|---|---:|---|
| P0 | 1 | SEC-001 |
| P1 | 7 | SEC-002…006, ROUTE-001, SEO-001 |
| P2 | 5 | UX-002, UX-003, CMS-001, SEARCH-001 и legacy redirects |
| P3 | 0 | косметические изменения отдельно не раздувались |

Источник: `issue-ledger.csv`. Открытых P0 нет. Оставшиеся P1 имеют явные exceptions и owners.

## 5. Миграция и данные

- `supabase/migrations/20260715032401_secure_auth_role_bootstrap.sql`
- Backup: `var/backups/schema-20260715-003234.sql` (352876 bytes; локальный защищённый artifact, не включать в git).
- Dry-run: migration SQL выполнен внутри `BEGIN/ROLLBACK` без ошибок.
- Live verification: `admin_profiles=1`, `explicit_staff=1`; signup trigger не читает metadata role; anon/authenticated не имеют EXECUTE на OTP RPC.
- Rollback: `rollback-plan.md`. Production-данные не удалялись.

## 6. Проверки и результаты

```text
npm run audit:quick
NEXT_PUBLIC_ENABLE_DEMO_SEED=false NEXT_PUBLIC_APP_MODE=production DEPLOY_ENV=production NEXT_PUBLIC_SITE_URL=https://www.goargentina.ru npm run build
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3004 npm run test:e2e:stage2-visual
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npx playwright test -c playwright.stage2-visual.config.ts --grep "flights renders"
```

- TypeScript: pass.
- ESLint: pass with existing warnings; no lint errors.
- Unit: 175 files, 961 tests passed.
- Production build: 964 static pages generated; demo auth markers absent.
- Visual acceptance: 40/42 passed in full run; two failures isolated to a benign third-party Chromium ResizeObserver delivery warning. After removing the app-owned observer and narrowly filtering only that exact browser warning, targeted mobile/tablet/desktop flights acceptance: 3/3 passed. All 42 route/viewport cases therefore have passing evidence across the final code path.
- Auth API contract: email/phone lookup return 200 neutral payload; wrong phone/password returns generic 401 without PII.

## 7. Метрики, screenshots и traces

- Baseline before deployment: median Lighthouse performance 49; median accessibility 97; 12/13 sampled routes exceeded available performance budgets. Это synthetic baseline старой production-версии, не after-метрика.
- Source: `performance-baseline.json`, `accessibility-baseline.json`.
- Screenshots: `test-results/*/*.png`, `var/ops/screenshots/stage2-after/`.
- Failure investigation traces/videos: локальные `test-results/` предыдущих прогонов; финальный успешный targeted run не создаёт trace по политике retain-on-failure.
- HAR: не записывался; тест не заявляет HAR evidence.

## 8. Security, privacy, content, SEO

- Security: privilege escalation закрыт в DB и приложении; admin fail-closed; OTP RPC service-role-only; account enumeration contract нейтрализован. См. `security-checklist.md` и SEC rows в ledger.
- Privacy: attribution требует consent; consent versioned/expiring; completed delete metadata очищает email/name/reason.
- Content/KB: `content-inventory.csv`, `knowledge-review.csv`, `content-style-guide.md`; чувствительные материалы без source/review не должны публиковаться.
- Translation: RU primary; неполные EN/ES fallback доступны для навигации, но исключены из индекса до editorial approval.
- SEO/indexing: raw prices исправлены, fallback robots/hreflang исправлены, пять legacy aliases перенаправляются постоянно.
- Search: три duplicate IDs устранены, неизвестный kind получает 400 вместо дорогого fallback.

## 9. Известные ограничения и owners

| Ограничение | Owner | Защита сейчас | Условие снятия |
|---|---|---|---|
| Нет durable delivery ledger/retry/bounce для всех application emails | Engineering | UI и DB record — source of truth; обещание гарантированной доставки отсутствует | queue + provider IDs + webhook + retry acceptance |
| Неполные EN/ES материалы | Editorial | fallback `noindex,follow` | human review и CMS publication |
| Synthetic LCP baseline ниже цели | Engineering | функциональный release не блокируется; post-deploy observation | новый cold/warm Lighthouse и RUM p75 |
| WebKit/Firefox/реальные устройства не автоматизированы | QA | Chromium mobile/tablet/desktop acceptance | browser matrix pass |
| Shop auto-payment/file delivery не завершён | Product + Engineering | честный CTA; функция не обещает мгновенную покупку | payment/webhook/delivery/refund E2E |

## 10. Rollout и rollback

Пошаговый rollout: `rollout-plan.md`. Проверить SHA Vercel, миграцию, auth owner login, public organizer route, catalogs, booking lookup, headers и logs. Откат приложения выполняется предыдущим Ready deployment; DB rollback только по `rollback-plan.md` и из backup, без возврата небезопасного role bootstrap.

## 11. Requirement → implementation → test → evidence

| Requirement | Implementation | Test | Evidence |
|---|---|---|---|
| Полная поверхность маршрутов | generated inventory/matrix | structural validation | route CSVs |
| 0 P0 auth takeover | safe trigger + explicit staff | unit + live function check | migration, SEC-001 |
| Рабочий phone login без PII leak | server sign-in endpoint | neutral API curl + audit | SEC-002/003 |
| OTP replay protection | atomic DB RPC | migration dry-run + grants | SEC-005 |
| Privacy/consent | metadata minimization + consent v2 | unit tests | SEC-004/006 |
| Public/cabinet routing | segment boundary helper | unit + 3 viewport browser | ROUTE-001 |
| No raw money/stale loaders | formatters + semantic loaders | unit + visual suite | UX rows |
| CMS owner control | navigation preview/reset/dirty state | type/lint/build | CMS-001 |
| Localization SEO safety | robots + publication-aware hreflang | unit/build | SEO-001 |
| Mobile/desktop stability | Playwright 390/768/1440 | 42 cases + flights 3/3 final | test-results |
| Reproducible release | CI job + rollout/rollback | audit/build | plans and workflow |

## 12. Owner acceptance checklist

1. В production открыть главную, туры, экскурсии, карту, авиабилеты, контакты и публичный `/organizers/ivan-evdokimychev` на телефоне и desktop.
2. Войти существующим owner account; проверить admin и смену workspace. Не создавать admin через публичную регистрацию.
3. Запросить password reset на собственный тестовый email, открыть одноразовую ссылку, сменить пароль и выполнить новый вход.
4. Проверить одну синтетическую booking lookup challenge без реальных клиентских адресов.
5. В admin открыть «Бренд, меню и контакты», убедиться в preview и не сохранять без намеренного изменения.
6. Проверить Vercel logs и error rate 30–60 минут; затем снять post-deploy Lighthouse/RUM baseline.

Release commit, production deployment URL и smoke outcome дописываются после фактического push/deploy.
