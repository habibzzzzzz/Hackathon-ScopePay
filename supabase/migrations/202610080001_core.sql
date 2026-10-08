-- Baseline and analysis snapshots are embedded in data; generated columns enforce tenant and financial relationships.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), data jsonb not null,
  check (id = user_id and data->>'id' = id::text and data->>'userId' = user_id::text),
  check ((data->>'hourlyRateMinor')::bigint > 0),
  check (data->>'currency' in ('USD','EUR','GBP','IDR'))
);
create table public.clients (
  id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), data jsonb not null,
  unique(id,user_id), check (data->>'id' = id::text and data->>'userId' = user_id::text)
);
create table public.projects (
  id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), data jsonb not null,
  client_id uuid generated always as ((data->>'clientId')::uuid) stored,
  currency text generated always as (data->>'currency') stored,
  original_value_minor bigint generated always as ((data->>'originalValueMinor')::bigint) stored,
  unique(id,user_id), foreign key(client_id,user_id) references public.clients(id,user_id),
  check (data->>'id' = id::text and data->>'userId' = user_id::text),
  check (currency in ('USD','EUR','GBP','IDR') and original_value_minor > 0)
);
create table public.analyses (
  id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), data jsonb not null,
  project_id uuid generated always as ((data->>'projectId')::uuid) stored,
  unique(id,user_id), foreign key(project_id,user_id) references public.projects(id,user_id),
  check (data->>'id' = id::text and data->>'userId' = user_id::text)
);
create table public.change_orders (
  id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), data jsonb not null,
  project_id uuid generated always as ((data->>'projectId')::uuid) stored,
  analysis_id uuid generated always as ((data->>'analysisId')::uuid) stored,
  status text generated always as (data->>'status') stored,
  token_hash text generated always as (data->>'tokenHash') stored unique,
  amount_minor bigint generated always as ((data->>'amountMinor')::bigint) stored,
  currency text generated always as (data->>'currency') stored,
  unique(id,user_id), foreign key(project_id,user_id) references public.projects(id,user_id),
  foreign key(analysis_id,user_id) references public.analyses(id,user_id),
  check (data->>'id' = id::text and data->>'userId' = user_id::text),
  check (amount_minor > 0 and currency in ('USD','EUR','GBP','IDR')),
  check (status in ('DRAFT','SENT','VIEWED','APPROVED','REJECTED','INVOICED','PAID','CANCELLED'))
);
create table public.invoices (
  id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), data jsonb not null,
  project_id uuid generated always as ((data->>'projectId')::uuid) stored,
  change_order_id uuid generated always as ((data->>'changeOrderId')::uuid) stored unique,
  paypal_invoice_id text generated always as (data->>'paypalInvoiceId') stored unique,
  status text generated always as (data->>'status') stored,
  currency text generated always as (data->>'currency') stored,
  amount_minor bigint generated always as ((data->>'amountMinor')::bigint) stored,
  paid_minor bigint generated always as ((data->>'paidMinor')::bigint) stored,
  foreign key(project_id,user_id) references public.projects(id,user_id),
  foreign key(change_order_id,user_id) references public.change_orders(id,user_id),
  check (data->>'id' = id::text and data->>'userId' = user_id::text),
  check (status in ('DRAFT','SENT','UNPAID','PARTIALLY_PAID','PAID','REFUNDED','CANCELLED')),
  check (currency in ('USD','EUR','GBP','IDR') and amount_minor > 0 and paid_minor between 0 and amount_minor),
  check (status <> 'PAID' or amount_minor = paid_minor)
);
create table public.activity_logs (
  id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), data jsonb not null,
  project_id uuid generated always as ((data->>'projectId')::uuid) stored,
  foreign key(project_id,user_id) references public.projects(id,user_id),
  check (data->>'id' = id::text and data->>'userId' = user_id::text)
);
create table public.paypal_events (
  paypal_event_id text primary key, event_type text not null,
  resource_id text not null, processed_at timestamptz not null default now()
);
create table public.rate_limits (key text primary key, count integer not null, window_start timestamptz not null);

do $$ declare t text; begin
  foreach t in array array['profiles','clients','projects','analyses','change_orders','invoices','activity_logs'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('create policy owner_read on public.%I for select to authenticated using (auth.uid() = user_id)',t);
    execute format('create index %I on public.%I(user_id)',t || '_owner_idx',t);
  end loop;
  foreach t in array array['profiles','clients','projects'] loop
    execute format('create policy owner_insert on public.%I for insert to authenticated with check (auth.uid() = user_id)',t);
    execute format('create policy owner_update on public.%I for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)',t);
  end loop;
end $$;
create policy analysis_insert on public.analyses for insert to authenticated with check (auth.uid() = user_id);
create policy log_insert on public.activity_logs for insert to authenticated with check (auth.uid() = user_id);
create policy draft_insert on public.change_orders for insert to authenticated with check (auth.uid() = user_id and status = 'DRAFT' and token_hash is null);
create policy draft_update on public.change_orders for update to authenticated using (auth.uid() = user_id and status = 'DRAFT') with check (auth.uid() = user_id and status = 'DRAFT' and token_hash is null);
alter table public.paypal_events enable row level security;
alter table public.rate_limits enable row level security;
revoke all on public.paypal_events, public.rate_limits from anon, authenticated;
revoke all on public.profiles, public.clients, public.projects, public.analyses, public.change_orders, public.invoices, public.activity_logs from anon;
grant select on public.profiles, public.clients, public.projects, public.analyses, public.change_orders, public.invoices, public.activity_logs to authenticated;
grant insert, update on public.profiles, public.clients, public.projects, public.change_orders to authenticated;
grant insert on public.analyses, public.activity_logs to authenticated;
revoke update, delete on public.invoices, public.analyses, public.activity_logs from authenticated;
create index projects_client_idx on public.projects(client_id);
create index analyses_project_idx on public.analyses(project_id);
create index orders_project_status_idx on public.change_orders(project_id,status);
create index invoices_project_status_idx on public.invoices(project_id,status);

create function public.transition_order(p_order jsonb, p_previous_status text) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare current_order public.change_orders; next_status text := p_order->>'status'; event_id uuid := gen_random_uuid();
begin
  select * into current_order from public.change_orders where id = (p_order->>'id')::uuid and user_id = (p_order->>'userId')::uuid for update;
  if not found or current_order.status <> p_previous_status then raise exception 'Stale order'; end if;
  if (p_order - array['status','tokenHash','tokenExpiresAt','tokenRevokedAt','approvedAt']) <> (current_order.data - array['status','tokenHash','tokenExpiresAt','tokenRevokedAt','approvedAt']) then raise exception 'Immutable order data'; end if;
  if not (
    (current_order.status = 'DRAFT' and next_status in ('SENT','CANCELLED')) or
    (current_order.status = 'SENT' and next_status in ('VIEWED','APPROVED','REJECTED','CANCELLED')) or
    (current_order.status = 'VIEWED' and next_status in ('APPROVED','REJECTED','CANCELLED')) or
    (current_order.status = next_status and p_order->>'tokenRevokedAt' is not null)
  ) then raise exception 'Invalid order transition'; end if;
  update public.change_orders set data = p_order where id = current_order.id;
  insert into public.activity_logs(id,user_id,data) values(event_id,current_order.user_id,jsonb_build_object('id',event_id,'userId',current_order.user_id,'createdAt',now(),'projectId',current_order.project_id,'eventType','CHANGE_ORDER_' || next_status,'description',(p_order->>'number') || ': ' || lower(next_status) || '.'));
  return p_order;
end $$;

create function public.attach_invoice(p_order_id uuid, p_user_id uuid, p_invoice jsonb) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare current_order public.change_orders; existing public.invoices; event_id uuid := gen_random_uuid();
begin
  select * into current_order from public.change_orders where id = p_order_id and user_id = p_user_id for update;
  if not found or current_order.status not in ('APPROVED','INVOICED') then raise exception 'Order not approved'; end if;
  if (p_invoice->>'amountMinor')::bigint <> current_order.amount_minor or p_invoice->>'currency' <> current_order.currency or (p_invoice->>'projectId')::uuid <> current_order.project_id or (p_invoice->>'userId')::uuid <> p_user_id or (p_invoice->>'changeOrderId')::uuid <> p_order_id then raise exception 'Invoice mismatch'; end if;
  select * into existing from public.invoices where change_order_id = p_order_id for update;
  if found and existing.status <> 'DRAFT' then return existing.data; end if;
  if existing.id is not null then
    if existing.paypal_invoice_id <> p_invoice->>'paypalInvoiceId' then raise exception 'Invoice provider mismatch'; end if;
    p_invoice := jsonb_set(p_invoice,'{id}',to_jsonb(existing.id::text));
    update public.invoices set data = p_invoice where id = existing.id;
  else
    insert into public.invoices(id,user_id,created_at,data) values((p_invoice->>'id')::uuid,p_user_id,(p_invoice->>'createdAt')::timestamptz,p_invoice);
  end if;
  if p_invoice->>'status' = 'SENT' then
    update public.change_orders set data = jsonb_set(data,'{status}','"INVOICED"') where id = p_order_id;
    insert into public.activity_logs(id,user_id,data) values(event_id,p_user_id,jsonb_build_object('id',event_id,'userId',p_user_id,'createdAt',now(),'projectId',current_order.project_id,'eventType','PAYPAL_INVOICE_CREATED','description','Invoice sent.'));
  end if;
  return p_invoice;
end $$;

create function public.reconcile_payment(p_event jsonb) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare inv public.invoices; event_id uuid := gen_random_uuid(); next_status text := p_event->>'status'; next_paid bigint := (p_event->>'paidMinor')::bigint; inserted integer;
begin
  insert into public.paypal_events(paypal_event_id,event_type,resource_id) values(p_event->>'eventId',p_event->>'eventType',p_event->>'id') on conflict do nothing;
  get diagnostics inserted = row_count;
  if inserted = 0 then return; end if;
  select * into inv from public.invoices where paypal_invoice_id = p_event->>'id' for update;
  if not found then raise exception 'Invoice not persisted yet'; end if;
  if inv.currency <> p_event->>'currency' or inv.amount_minor <> (p_event->>'amountMinor')::bigint or next_paid < 0 or next_paid > inv.amount_minor then raise exception 'Payment mismatch'; end if;
  if next_status = 'PAID' and next_paid <> inv.amount_minor then raise exception 'Payment incomplete'; end if;
  if inv.status = 'REFUNDED' or (inv.status = 'PAID' and next_status <> 'REFUNDED') then return; end if;
  if next_status = 'REFUNDED' then next_paid := 0; end if;
  update public.invoices set data = data || jsonb_build_object('status',next_status,'paidMinor',next_paid,'paidAt',case when next_status = 'PAID' then p_event->>'occurredAt' else data->>'paidAt' end) where id = inv.id;
  if next_status = 'PAID' then
    update public.change_orders set data = jsonb_set(data,'{status}','"PAID"') where id = inv.change_order_id and status in ('INVOICED','PAID');
    if not found then raise exception 'Order must be invoiced'; end if;
  end if;
  insert into public.activity_logs(id,user_id,data) values(event_id,inv.user_id,jsonb_build_object('id',event_id,'userId',inv.user_id,'createdAt',p_event->>'occurredAt','projectId',inv.project_id,'eventType','INVOICE_' || next_status,'description',(inv.data->>'number') || ': ' || lower(next_status) || '.'));
end $$;

create function public.consume_rate_limit(p_key text, p_limit integer, p_seconds integer) returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
declare bucket public.rate_limits;
begin
  delete from public.rate_limits where window_start < now() - interval '1 day';
  insert into public.rate_limits(key,count,window_start) values(p_key,0,now()) on conflict do nothing;
  select * into bucket from public.rate_limits where key = p_key for update;
  if bucket.window_start + make_interval(secs => p_seconds) < now() then
    update public.rate_limits set count = 1, window_start = now() where key = p_key; return true;
  end if;
  if bucket.count >= p_limit then return false; end if;
  update public.rate_limits set count = count + 1 where key = p_key; return true;
end $$;
revoke all on function public.transition_order(jsonb,text), public.attach_invoice(uuid,uuid,jsonb), public.reconcile_payment(jsonb), public.consume_rate_limit(text,integer,integer) from public, anon, authenticated;
grant execute on function public.transition_order(jsonb,text), public.attach_invoice(uuid,uuid,jsonb), public.reconcile_payment(jsonb), public.consume_rate_limit(text,integer,integer) to service_role;
grant all on public.profiles, public.clients, public.projects, public.analyses, public.change_orders, public.invoices, public.activity_logs, public.paypal_events, public.rate_limits to service_role;
