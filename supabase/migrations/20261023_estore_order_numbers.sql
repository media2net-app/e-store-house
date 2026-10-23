-- Alternative Supabase storage only; production Redis allocates in one Lua operation.
-- No renumbering of existing orders. Counter rows never expire or reset.
create table if not exists public.estore_order_counters (
  scope text primary key,
  last_value bigint not null check (last_value > 0)
);
alter table public.estore_order_counters enable row level security;
revoke all on public.estore_order_counters from public, anon, authenticated;

create or replace function public.estore_assign_order_number()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  n bigint;
  is_test boolean := coalesce((new.payload->>'testOrder')::boolean, false);
  counter_scope text;
begin
  counter_scope := case when is_test then 'test' else 'orders' end;
  insert into public.estore_order_counters(scope, last_value) values (counter_scope, 1)
    on conflict (scope) do update set last_value = public.estore_order_counters.last_value + 1
    returning last_value into n;
  new.payload := jsonb_set(new.payload, '{orderNumber}', to_jsonb(
    (case when is_test then 'TEST-' else '' end) ||
    lpad(n::text, greatest(4, length(n::text)), '0')));
  return new;
end;
$$;
revoke all on function public.estore_assign_order_number() from public, anon, authenticated;
drop trigger if exists estore_order_number on public.estore_orders;
create trigger estore_order_number before insert on public.estore_orders
  for each row execute function public.estore_assign_order_number();
create unique index if not exists estore_orders_number_unique
  on public.estore_orders ((payload->>'orderNumber')) where payload ? 'orderNumber';
