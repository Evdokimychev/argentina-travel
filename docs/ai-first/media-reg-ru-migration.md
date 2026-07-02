# Медia на Reg.ru (снижение Supabase Egress)

Цель: раздавать статические изображения с поддомена **media.goargentina.ru**, оставив **базу данных, Auth и API** в Supabase.

## Архитектура

```
Vercel (Next.js)              →  страницы, API, SSR
Supabase                      →  Postgres, Auth, RLS (без Storage egress)
Reg.ru VIP-1                  →  media.goargentina.ru — все фото
```

## Переменные окружения

Локально в `.env.local` и на **Vercel**:

```env
NEXT_PUBLIC_MEDIA_CDN_URL=https://media.goargentina.ru
MEDIA_STORAGE_BACKEND=reg-ru-ftp
MEDIA_FTP_HOST=media.goargentina.ru
MEDIA_FTP_PORT=21
MEDIA_FTP_USER=...
MEDIA_FTP_PASSWORD=...
MEDIA_FTP_SECURE=false
MEDIA_FTP_REMOTE_ROOT=/www/media.goargentina.ru
```

`MEDIA_FTP_*` — **только server-side** (не `NEXT_PUBLIC_`).

FTP-логин и пароль: ISPmanager → **FTP-пользователи** (для `media.goargentina.ru` или общий `u2070738`).

## Миграция

```bash
npm run media:migrate-reg-ru -- --dry-run
npm run media:migrate-reg-ru -- --upload --rewrite-db
```

## Проверка

После загрузки файл должен открываться:

`https://media.goargentina.ru/media/places/buenos-aires/hero.jpg`

## Деплой на Vercel

1. Добавьте все переменные выше в Vercel → Settings → Environment Variables
2. Redeploy production
3. Supabase Usage → Egress перестанет расти
