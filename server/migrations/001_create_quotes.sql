create extension if not exists pgcrypto;

create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  quote_number text unique not null,
  public_token text unique not null,
  status text not null default 'draft',
  customer_name text,
  customer_email text,
  customer_phone text,
  customer_address text,
  customer_postal_code text,
  customer_city text,
  customer_province text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(10,2) not null default 0,
  tax_rate numeric(5,2) not null default 21,
  tax_amount numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  valid_until date,
  notes text,
  pdf_url text,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quotes_status_idx on quotes (status);
create index if not exists quotes_created_at_idx on quotes (created_at desc);
