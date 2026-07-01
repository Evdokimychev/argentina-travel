-- Phase 9: place favorites in user_favorites

alter table public.user_favorites
  drop constraint if exists user_favorites_item_type_check;

alter table public.user_favorites
  add constraint user_favorites_item_type_check
  check (item_type in ('tour', 'excursion', 'place'));

comment on table public.user_favorites is
  'Избранное пользователя (туры, экскурсии и места), синхронизируемое между устройствами.';
