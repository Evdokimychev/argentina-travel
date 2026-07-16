# Final release report — повторный аудит

Дата: 2026-07-15. Исходный commit: `543ead8ac198d8e45e73b840221a460fb43cdb7b`.

## Executive summary

Release candidate собран и проходит локальную production-сборку, TypeScript, lint, 1023 unit-теста и HTTP smoke. Закрыты найденные P0/P1 в cron auth, ролях, RLS сообщений, подборе, партнёрской идемпотентности, письмах, privacy deletion, модерации авторских статей, SEO 404/locale и достоверности контента.

Главная уменьшена примерно с 4,0 МБ до 409 КБ HTML. Холодная проверка карточки Tripster-тура ускорилась с 13,4 до 3,5 секунды, повторная — до 0,54 секунды. Несуществующие тур и экскурсия отвечают оформленным `404` за 16–22 мс.

## Verdict

**NOT READY к production deploy.** Код кандидата готов к staging, но production БД отстаёт: live `/api/health` сообщает `20260715032401_secure_auth_role_bootstrap`, кандидат — `20260715132000_email_delivery_outbox`. Новые миграции не были применены и не прошли staging rehearsal. Коммита, push и deploy не выполнялось.

## Что исправлено

- Cron принимает только точный Bearer `CRON_SECRET`.
- Пользователь не может сам назначить organizer/admin; admin preset учитывается в effective RBAC.
- Conversations создаются сервером после ownership checks; прямые insert/update закрываются миграцией.
- Подбор строго соблюдает бюджет 2000/2001, размер группы, capacity и единицу цены.
- Tripster `is_bookable=false` и общий capability resolver управляют CTA.
- Партнёрская операция записывается до внешнего API; retry использует один UUID и replay результата.
- Письма проходят через service-role-only outbox, Resend idempotency и пять ограниченных попыток.
- Privacy deletion fail-closed очищает персональные таблицы и обезличивает bookings/partner/shop/waitlist; admin account требует ручной передачи полномочий.
- Авторская модерация публикует закреплённую ревизию и требует `content.publish`.
- JSON-LD экранирован, missing details дают настоящий оформленный 404, sitemap содержит 705 RU URL и 0 EN/ES fallback URL.
- Неподтверждённые рейтинги и отсутствующие KB-ссылки скрыты.
- Локальная production-сборка изолирована от IDE `next dev` каталогом `.next-production`.

## Проверки

- `npm run audit:quick`: pass, 195 test files / 1023 tests.
- `npm run preview:production -- -p 3100`: pass, 964/964 static pages, demo auth markers absent.
- Локальный `production-smoke`: pass.
- Production `https://www.goargentina.ru` smoke: pass на текущем старом deployment.
- `tripster:verify`: каталог и token ok; External Orders **403 forbidden**.
- `youtravel:verify`: каталог/offers ok; booking endpoints **405**.
- `npm audit --omit=dev`: 0 critical/high, 2 moderate в вложенном PostCSS Next.js; автоматический fix предлагает небезопасный downgrade и не применялся.
- `supabase:verify`: fail на `fetch failed`; live migration readiness не подтверждена.

## Оставшиеся блокеры

1. Сделать backup и прогнать миграции `20260715123000`–`20260715132000` на staging-копии с RBAC/RLS/idempotency/outbox/privacy fixtures.
2. Повторить `supabase:verify`, authenticated owner/admin/organizer journeys и убедиться, что основной аккаунт не потерял права.
3. Не включать внутренний partner booking: Tripster External Orders запрещён, YouTravel create endpoint отсутствует. Product truth — внешний checkout.
4. Выполнить Chromium/Firefox/WebKit, 320/390/768/1440, keyboard/axe и реальные auth/reset email проверки. In-app browser отклонил localhost, поэтому эти результаты не выдумывались.
5. Повторить Lighthouse после deployment. First Load JS остаётся высоким: home 837 КБ, многие контентные страницы 650–920 КБ, preview редактора около 1,2 МБ.

## Порядок релиза

Backup → staging migration rehearsal → authenticated role/privacy/outbox tests → deploy preview → cross-browser/axe/Lighthouse → production migrations → deploy application → production smoke → 60 минут наблюдения. При любой ошибке использовать forward-fix/rollback из `rollback-plan.md`; старое приложение не должно работать поверх непроверенной несовместимой схемы.
