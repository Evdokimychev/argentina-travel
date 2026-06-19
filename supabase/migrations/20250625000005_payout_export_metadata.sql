-- E74: Payout batch export metadata and extended status workflow
-- pending → approved → exported → completed (manual bank transfer outside system)

alter table public.payout_records
  add column if not exists exported_at timestamptz;

alter table public.payout_records
  add column if not exists export_file_hash text;

comment on column public.payout_records.exported_at is
  'When admin exported payout batch CSV for bank transfer';

comment on column public.payout_records.export_file_hash is
  'SHA-256 hash of exported CSV file for audit trail';

-- Extend status workflow; migrate legacy paid → completed
alter table public.payout_records drop constraint if exists payout_records_status_check;

update public.payout_records
  set status = 'completed'
  where status = 'paid';

alter table public.payout_records
  add constraint payout_records_status_check check (
    status in (
      'pending',
      'approved',
      'exported',
      'completed',
      'scheduled',
      'paid',
      'failed',
      'cancelled'
    )
  );
