-- Existing paid/card orders remain unchanged. Redis requires no migration.
alter table public.estore_orders drop constraint if exists estore_orders_status_check;
alter table public.estore_orders add constraint estore_orders_status_check
  check (status in ('pending_payment', 'payment_failed', 'paid_review', 'pending_cod'));
