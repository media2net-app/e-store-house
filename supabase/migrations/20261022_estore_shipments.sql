-- Apply only when Supabase is the configured order store. Redis needs no migration.
create table if not exists public.estore_shipments (
  order_id text primary key references public.estore_orders(id),
  payload jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.estore_shipments enable row level security;
revoke all on public.estore_shipments from anon, authenticated;
grant all on public.estore_shipments to service_role;
