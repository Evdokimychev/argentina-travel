-- F3: scheduled CMS publish + preview support

alter table public.content_documents
  add column if not exists scheduled_publish_at timestamptz;

alter table public.content_documents drop constraint if exists content_documents_status_check;

alter table public.content_documents
  add constraint content_documents_status_check check (
    status in ('draft', 'scheduled', 'published', 'archived')
  );

create index if not exists content_documents_scheduled_publish_idx
  on public.content_documents (scheduled_publish_at)
  where status = 'scheduled';

comment on column public.content_documents.scheduled_publish_at is
  'When status=scheduled, document auto-publishes at this time (UTC).';
