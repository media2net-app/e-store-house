-- Apply only to the Supabase project linked to the e-store-house Vercel project.
-- Existing application tables are untouched. Both new tables hold private customer data.

create table if not exists public.estore_orders (
  id text primary key check (id ~ '^[a-f0-9]{24}$'),
  created_at timestamptz not null,
  status text not null check (status in ('pending_payment', 'payment_failed', 'paid_review')),
  payload jsonb not null,
  payment_id text,
  payment_email_sent boolean not null default false
);

create index if not exists estore_orders_created_at_idx
  on public.estore_orders (created_at desc);

create table if not exists public.estore_requests (
  id text primary key check (id ~ '^[a-f0-9]{24}$'),
  kind text not null check (kind in ('withdrawal', 'complaint')),
  submitted_at timestamptz not null,
  payload jsonb not null
);

create index if not exists estore_requests_kind_submitted_at_idx
  on public.estore_requests (kind, submitted_at desc);

alter table public.estore_orders enable row level security;
alter table public.estore_requests enable row level security;
revoke all on public.estore_orders, public.estore_requests from public, anon, authenticated;
grant select, insert, update on public.estore_orders to service_role;
grant select, insert on public.estore_requests to service_role;

-- Deliberately no anon/authenticated policies. Only the server-side service role
-- reaches these tables, after the storefront's own request validation.
