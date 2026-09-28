alter table quotes
  add column if not exists source_type text not null default 'manual',
  add column if not exists source_id text,
  add column if not exists terms text;
