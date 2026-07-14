# Auth email — брендированные шаблоны Supabase

Письма подтверждения, восстановления пароля и смены email отправляет **Supabase Auth через SMTP Resend**. Транзакционные письма заявок также отправляются через Resend (`docs/email-e73.md`).

## Файлы шаблонов

| Файл | Тип в Dashboard | Когда отправляется |
|------|-----------------|-------------------|
| `supabase/templates/confirmation.html` | Confirm signup | Подтверждение регистрации (если включено) |
| `supabase/templates/recovery.html` | Reset password | Восстановление пароля |
| `supabase/templates/email_change.html` | Change email address | Смена email в профиле |
| `supabase/templates/magic_link.html` | Magic link | Вход без пароля (не используется в UI) |
| `supabase/templates/invite.html` | Invite user | Приглашение администратором |
| `supabase/templates/reauthentication.html` | Reauthentication | Код для подтверждения важного действия |
| `supabase/templates/password_changed_notification.html` | — | Уведомление о смене пароля (Security notifications в Dashboard) |

Стиль совпадает с транзакционными письмами E73: шапка «Пора в Аргентину», цвет `#0f766e`, русский текст.

## Production (Supabase Dashboard)

Production сайта фактически использует проект `uooxrypocahomoqzdvzy` (это подтверждают URL, ключи и `supabase/config.toml`). Проект `wugdzhbqkvjxodbfdysq`, указанный в одной из передач, содержит другую предметную область и не должен подставляться в переменные GoArgentina.

1. **Project Settings → Authentication → SMTP Settings**
   - Включите Custom SMTP (Resend, SendGrid, Mailgun и т.д.)
   - **Sender name:** `Пора в Аргентину`
   - **Sender email:** `no-reply@goargentina.ru` (верифицированный домен)
   - Без Custom SMTP письма идут с `noreply@mail.app.supabase.io` — не для production

2. **Authentication → URL Configuration**
   - Site URL: `https://www.goargentina.ru`
   - Redirect URLs: `https://www.goargentina.ru/auth/confirm`, `https://www.goargentina.ru/auth/callback`, `https://www.goargentina.ru/account/update-password`, `https://www.goargentina.ru/**`, `https://goargentina.ru/**`
   - Localhost добавляется отдельным development redirect URL и не используется как Site URL.

3. **Authentication → Email Templates**
   - Для каждого типа скопируйте HTML из `supabase/templates/*.html`
   - Subject — как в `supabase/config.toml` (`[auth.email.template.*].subject`).
   - Recovery subject: `Изменение пароля — Пора в Аргентину`.

4. **Authentication → Providers → Email**
   - Confirm email: **включено**
   - После регистрации интерфейс показывает отдельное состояние «Подтвердите почту»

5. **Authentication → Email → Security notifications**
   - Password changed — вставьте `password_changed_notification.html`

## Локальная разработка

`supabase/config.toml` уже ссылается на шаблоны через `content_path`. После `supabase start` письма попадают в Inbucket: http://localhost:54324

## Переменные Go-шаблона Supabase

- `{{ .TokenHash }}` — хеш для SSR-подтверждения через `/auth/confirm`
- `{{ .SiteURL }}` — Site URL из настроек
- `{{ .Email }}` — адрес получателя
- `{{ .Token }}` — OTP (если включён)

## Проверка

1. «Забыли пароль?» → письмо с темой «Изменение пароля — Пора в Аргентину».
2. Ссылка ведёт только на `https://www.goargentina.ru/auth/confirm?...&type=recovery&next=/account/update-password`.
3. `/auth/confirm` проверяет одноразовый token hash, записывает сессию и удаляет токен из адресной строки.
4. Форма `/account/update-password` меняет пароль только при действующей recovery-сессии.
5. После успешной смены пользователь входит новым паролем и открывает `/profile`.

## Состояние production на 14 июля 2026

- Project ref: `uooxrypocahomoqzdvzy` (`ACTIVE_HEALTHY`).
- Site URL и redirect allow list настроены на production-домен.
- Custom SMTP подключён к Resend, отправитель: `Пора в Аргентину <no-reply@goargentina.ru>`.
- Все шаблоны из `supabase/templates/` синхронизированы, уведомление о смене пароля включено.
- DNS-записи опубликованы на `vip221.hosting.reg.ru`, запрос верификации Resend запущен; текущий статус во время распространения DNS — `pending`.

Обязательные DNS-записи в REG.RU:

| Тип | Имя | Значение | Приоритет |
|-----|-----|----------|-----------|
| TXT | `resend._domainkey` | DKIM public key из карточки домена Resend | — |
| MX | `send` | `feedback-smtp.us-east-1.amazonses.com` | `10` |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | — |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:hello@goargentina.ru;` | — |

До статуса `verified` восстановление пароля может получать отказ SMTP и production нельзя считать полностью готовым. После верификации домена нужно пройти реальный сценарий: запрос письма → переход → новый пароль → новый вход → `/profile`.

## Телефонный вход

SMS-OTP **не реализован**. Вход по телефону — lookup email в `profiles` + `signInWithPassword`. UI не обещает SMS-код.
