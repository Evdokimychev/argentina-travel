# Auth email — брендированные шаблоны Supabase

Письма подтверждения, восстановления пароля и смены email отправляет **Supabase Auth** (не Resend). Транзакционные письма заявок — через Resend (`docs/email-e73.md`).

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

1. **Project Settings → Authentication → SMTP Settings**
   - Включите Custom SMTP (Resend, SendGrid, Mailgun и т.д.)
   - **Sender name:** `Пора в Аргентину`
   - **Sender email:** `noreply@goargentina.ru` (верифицированный домен)
   - Без Custom SMTP письма идут с `noreply@mail.app.supabase.io` — не для production

2. **Authentication → URL Configuration**
   - Site URL: `https://www.goargentina.ru`
   - Redirect URLs: `https://www.goargentina.ru/auth/callback`, `http://localhost:3000/auth/callback`

3. **Authentication → Email Templates**
   - Для каждого типа скопируйте HTML из `supabase/templates/*.html`
   - Subject — как в `supabase/config.toml` (`[auth.email.template.*].subject`)

4. **Authentication → Providers → Email**
   - Confirm email: **включено**
   - После регистрации интерфейс показывает отдельное состояние «Подтвердите почту»

5. **Authentication → Email → Security notifications**
   - Password changed — вставьте `password_changed_notification.html`

## Локальная разработка

`supabase/config.toml` уже ссылается на шаблоны через `content_path`. После `supabase start` письма попадают в Inbucket: http://localhost:54324

## Переменные Go-шаблона Supabase

- `{{ .ConfirmationURL }}` — ссылка подтверждения / восстановления
- `{{ .SiteURL }}` — Site URL из настроек
- `{{ .Email }}` — адрес получателя
- `{{ .Token }}` — OTP (если включён)

## Проверка

1. «Забыли пароль?» → письмо с темой «Восстановление пароля — Пора в Аргентину»
2. Ссылка ведёт на `/auth/callback?next=/auth/reset-password`
3. Форма «Новый пароль» сохраняет пароль и перенаправляет в `/profile`

## Телефонный вход

SMS-OTP **не реализован**. Вход по телефону — lookup email в `profiles` + `signInWithPassword`. UI не обещает SMS-код.
