-- author_article doc type for organizer/expert articles (visual page builder)

comment on column public.content_documents.doc_type is
  'legal | blog | guide | destination | place | author_article';

-- Extend content_freshness doc_type check if table exists
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'content_freshness'
  ) then
    alter table public.content_freshness drop constraint if exists content_freshness_doc_type_check;
    alter table public.content_freshness
      add constraint content_freshness_doc_type_check check (
        doc_type in ('legal', 'blog', 'guide', 'destination', 'place', 'author_article')
      );
  end if;
end $$;

create index if not exists content_documents_author_article_idx
  on public.content_documents (created_by, status)
  where doc_type = 'author_article';
