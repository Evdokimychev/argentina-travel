-- E108: Site globals — branding, SEO, contact (Phase C)
-- Apply via: npm run supabase:migrate

insert into public.site_settings (key, value)
values
  (
    'site.branding',
    '{
      "siteName": "Пора в Аргентину",
      "tagline": "путешествия по Аргентине",
      "defaultTitle": "Пора в Аргентину — путешествия по Аргентине",
      "titleTemplate": "%s | Пора в Аргентину",
      "defaultOgImage": "/logo-light.svg",
      "themeColor": "#74acdf"
    }'::jsonb
  ),
  (
    'site.seo',
    '{
      "defaultDescription": "Авторские туры и экскурсии по Аргентине: Патагония, Буэнос-Айрес, Мендоса, Игуасу. Русскоязычные гиды и организаторы.",
      "allowIndexing": true
    }'::jsonb
  ),
  (
    'site.contact',
    '{
      "supportEmail": "hello@goargentina.ru"
    }'::jsonb
  )
on conflict (key) do nothing;

comment on table public.site_settings is 'CMS globals — legal, features, branding, seo, contact (Payload globals pattern)';
