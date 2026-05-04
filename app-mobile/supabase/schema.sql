-- Cantine Connectee - Schema Supabase

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  nom text not null,
  prenom text not null,
  telephone text,
  role text not null check (role in ('etudiant', 'vendeur')),
  created_at timestamptz not null default now()
);

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  nom_cantine text not null,
  localisation text not null,
  telephone text,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  nom text not null,
  description text not null,
  prix numeric(12,2) not null check (prix >= 0),
  category text not null check (category in ('plat', 'boisson', 'dessert', 'snack')),
  image_url text,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  total numeric(12,2) not null check (total >= 0),
  mode_paiement text not null default 'cash' check (mode_paiement in ('cash', 'wave', 'orange_money')),
  status text not null default 'en_attente' check (status in ('en_attente', 'en_preparation', 'prete', 'livree', 'annulee')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  payment_reference text,
  paid_at timestamptz,
  platform_fee numeric(12,2) not null default 0 check (platform_fee >= 0),
  vendor_amount numeric(12,2) not null default 0 check (vendor_amount >= 0),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantite integer not null check (quantite > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.vendor_wallets (
  vendor_id uuid primary key references public.vendors(id) on delete cascade,
  balance numeric(12,2) not null default 0 check (balance >= 0),
  currency text not null default 'XOF',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.vendor_wallet_ledger (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  entry_type text not null check (entry_type in ('credit_sale', 'debit_payout', 'adjustment')),
  amount numeric(12,2) not null,
  note text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  method text not null default 'manual' check (method in ('manual', 'wave', 'orange_money', 'bank')),
  account_ref text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'rejected')),
  external_reference text,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Backward-compatible migration for existing databases
alter table public.orders
  add column if not exists payment_status text not null default 'pending';

alter table public.orders
  add column if not exists payment_reference text;

alter table public.orders
  add column if not exists paid_at timestamptz;

alter table public.orders
  add column if not exists platform_fee numeric(12,2) not null default 0;

alter table public.orders
  add column if not exists vendor_amount numeric(12,2) not null default 0;

update public.orders
set payment_status = 'pending'
where payment_status is null;

update public.orders
set platform_fee = 0
where platform_fee is null;

update public.orders
set vendor_amount = coalesce(total, 0) - coalesce(platform_fee, 0)
where vendor_amount is null;

alter table public.orders
  alter column payment_status set default 'pending';

alter table public.orders
  alter column payment_status set not null;

alter table public.orders
  alter column platform_fee set default 0;

alter table public.orders
  alter column platform_fee set not null;

alter table public.orders
  alter column vendor_amount set default 0;

alter table public.orders
  alter column vendor_amount set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_payment_status_check'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_payment_status_check
      check (payment_status in ('pending', 'paid', 'failed', 'refunded'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_platform_fee_non_negative_check'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_platform_fee_non_negative_check
      check (platform_fee >= 0);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_vendor_amount_non_negative_check'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_vendor_amount_non_negative_check
      check (vendor_amount >= 0);
  end if;
end $$;

create index if not exists idx_products_vendor on public.products(vendor_id);
create index if not exists idx_orders_user on public.orders(user_id);
create index if not exists idx_orders_vendor on public.orders(vendor_id);
create index if not exists idx_orders_payment_status on public.orders(payment_status);
create index if not exists idx_order_items_order on public.order_items(order_id);
create unique index if not exists idx_vendors_profile_unique on public.vendors(profile_id);
create index if not exists idx_vendor_wallet_ledger_vendor on public.vendor_wallet_ledger(vendor_id);
create index if not exists idx_vendor_wallet_ledger_order on public.vendor_wallet_ledger(order_id);
create unique index if not exists idx_vendor_wallet_ledger_credit_order
  on public.vendor_wallet_ledger(order_id, entry_type)
  where entry_type = 'credit_sale';
create index if not exists idx_payouts_vendor on public.payouts(vendor_id);

alter table public.profiles enable row level security;
alter table public.vendors enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.vendor_wallets enable row level security;
alter table public.vendor_wallet_ledger enable row level security;
alter table public.payouts enable row level security;

-- Idempotent policy reset (safe for re-runs)
drop policy if exists "Profiles select own" on public.profiles;
drop policy if exists "Profiles insert own" on public.profiles;
drop policy if exists "Profiles update own" on public.profiles;
drop policy if exists "Vendors read all" on public.vendors;
drop policy if exists "Products read all" on public.products;
drop policy if exists "Vendors manage own" on public.vendors;
drop policy if exists "Products manage own" on public.products;
drop policy if exists "Orders read own" on public.orders;
drop policy if exists "Orders create own" on public.orders;
drop policy if exists "Orders cancel own waiting" on public.orders;
drop policy if exists "Orders vendor status update" on public.orders;
drop policy if exists "Orders read vendor orders" on public.orders;
drop policy if exists "Order items read owner or vendor" on public.order_items;
drop policy if exists "Order items insert by order owner" on public.order_items;
drop policy if exists "Vendor wallets read own" on public.vendor_wallets;
drop policy if exists "Vendor wallets update own" on public.vendor_wallets;
drop policy if exists "Vendor ledger read own" on public.vendor_wallet_ledger;
drop policy if exists "Payouts read own" on public.payouts;
drop policy if exists "Payouts create own" on public.payouts;

-- Profiles: each user can read/update only their profile
create policy "Profiles select own" on public.profiles
for select using (auth.uid() = id);

create policy "Profiles insert own" on public.profiles
for insert with check (auth.uid() = id);

create policy "Profiles update own" on public.profiles
for update using (auth.uid() = id);

-- Vendors/products are readable by everyone connected
create policy "Vendors read all" on public.vendors
for select using (auth.role() = 'authenticated');

create policy "Products read all" on public.products
for select using (auth.role() = 'authenticated');

-- Vendor management by owner
create policy "Vendors manage own" on public.vendors
for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "Products manage own" on public.products
for all using (
  vendor_id in (select id from public.vendors where profile_id = auth.uid())
)
with check (
  vendor_id in (select id from public.vendors where profile_id = auth.uid())
);

-- Orders: students see and create their own orders
create policy "Orders read own" on public.orders
for select using (user_id = auth.uid());

create policy "Orders create own" on public.orders
for insert with check (user_id = auth.uid());

create policy "Orders cancel own waiting" on public.orders
for update using (user_id = auth.uid() and status = 'en_attente')
with check (user_id = auth.uid());

create policy "Orders vendor status update" on public.orders
for update using (
  vendor_id in (select id from public.vendors where profile_id = auth.uid())
)
with check (
  vendor_id in (select id from public.vendors where profile_id = auth.uid())
);

-- Vendors can read orders related to their vendor entity
create policy "Orders read vendor orders" on public.orders
for select using (
  vendor_id in (select id from public.vendors where profile_id = auth.uid())
);

-- Order items: order owner or vendor owner can read
create policy "Order items read owner or vendor" on public.order_items
for select using (
  exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and (
        o.user_id = auth.uid()
        or o.vendor_id in (select id from public.vendors where profile_id = auth.uid())
      )
  )
);

create policy "Order items insert by order owner" on public.order_items
for insert with check (
  exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and o.user_id = auth.uid()
  )
);

create policy "Vendor wallets read own" on public.vendor_wallets
for select using (
  vendor_id in (select id from public.vendors where profile_id = auth.uid())
);

create policy "Vendor wallets update own" on public.vendor_wallets
for update using (
  vendor_id in (select id from public.vendors where profile_id = auth.uid())
)
with check (
  vendor_id in (select id from public.vendors where profile_id = auth.uid())
);

create policy "Vendor ledger read own" on public.vendor_wallet_ledger
for select using (
  vendor_id in (select id from public.vendors where profile_id = auth.uid())
);

create policy "Payouts read own" on public.payouts
for select using (
  vendor_id in (select id from public.vendors where profile_id = auth.uid())
);

create policy "Payouts create own" on public.payouts
for insert with check (
  vendor_id in (select id from public.vendors where profile_id = auth.uid())
);

create or replace function public.ensure_vendor_wallet(
  p_vendor_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.vendor_wallets (vendor_id)
  values (p_vendor_id)
  on conflict (vendor_id) do nothing;
end;
$$;

revoke all on function public.ensure_vendor_wallet(uuid) from public;
grant execute on function public.ensure_vendor_wallet(uuid) to authenticated;

create or replace function public.create_order_with_item(
  p_product_id uuid,
  p_quantite integer,
  p_mode_paiement text default 'cash'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_vendor_id uuid;
  v_prix numeric(12,2);
  v_total numeric(12,2);
  v_platform_fee numeric(12,2);
  v_vendor_amount numeric(12,2);
  v_payment_reference text;
begin
  if auth.uid() is null then
    raise exception 'Utilisateur non authentifie';
  end if;

  if p_quantite <= 0 then
    raise exception 'Quantite invalide';
  end if;

  select vendor_id, prix
  into v_vendor_id, v_prix
  from public.products
  where id = p_product_id
    and is_available = true;

  if v_vendor_id is null then
    raise exception 'Produit introuvable ou indisponible';
  end if;

  v_total := v_prix * p_quantite;
  v_platform_fee := round(v_total * 0.05, 2);
  v_vendor_amount := v_total - v_platform_fee;
  v_payment_reference := null;

  if p_mode_paiement in ('wave', 'orange_money') then
    v_payment_reference :=
      upper(p_mode_paiement)
      || '-'
      || to_char(now(), 'YYYYMMDDHH24MISS')
      || '-'
      || encode(gen_random_bytes(3), 'hex');
  end if;

  insert into public.orders (
    user_id,
    vendor_id,
    total,
    mode_paiement,
    status,
    payment_status,
    payment_reference,
    platform_fee,
    vendor_amount
  )
  values (
    auth.uid(),
    v_vendor_id,
    v_total,
    p_mode_paiement,
    'en_attente',
    'pending',
    v_payment_reference,
    v_platform_fee,
    v_vendor_amount
  )
  returning id into v_order_id;

  insert into public.order_items (order_id, product_id, quantite)
  values (v_order_id, p_product_id, p_quantite);

  return v_order_id;
end;
$$;

revoke all on function public.create_order_with_item(uuid, integer, text) from public;
grant execute on function public.create_order_with_item(uuid, integer, text) to authenticated;

create or replace function public.create_orders_from_cart(
  p_items jsonb,
  p_mode_paiement text default 'cash'
)
returns table (id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group jsonb;
  v_item jsonb;
  v_order_id uuid;
  v_vendor_id uuid;
  v_product_id uuid;
  v_quantite integer;
  v_prix numeric(12,2);
  v_total numeric(12,2);
  v_platform_fee numeric(12,2);
  v_vendor_amount numeric(12,2);
  v_payment_reference text;
begin
  if auth.uid() is null then
    raise exception 'Utilisateur non authentifie';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Panier vide';
  end if;

  for v_group in select * from jsonb_array_elements(p_items)
  loop
    v_vendor_id := (v_group ->> 'vendor_id')::uuid;
    v_total := 0;

    if v_vendor_id is null then
      raise exception 'Vendor manquant';
    end if;

    for v_item in select * from jsonb_array_elements(v_group -> 'items')
    loop
      v_product_id := (v_item ->> 'product_id')::uuid;
      v_quantite := coalesce((v_item ->> 'quantite')::integer, 0);

      if v_product_id is null or v_quantite <= 0 then
        raise exception 'Produit/quantite invalide';
      end if;

      select prix
      into v_prix
      from public.products
      where id = v_product_id
        and vendor_id = v_vendor_id
        and is_available = true;

      if v_prix is null then
        raise exception 'Produit introuvable ou indisponible';
      end if;

      v_total := v_total + (v_prix * v_quantite);
    end loop;

    v_platform_fee := round(v_total * 0.05, 2);
    v_vendor_amount := v_total - v_platform_fee;
    v_payment_reference := null;

    if p_mode_paiement in ('wave', 'orange_money') then
      v_payment_reference :=
        upper(p_mode_paiement)
        || '-'
        || to_char(now(), 'YYYYMMDDHH24MISS')
        || '-'
        || encode(gen_random_bytes(3), 'hex');
    end if;

    insert into public.orders (
      user_id,
      vendor_id,
      total,
      mode_paiement,
      status,
      payment_status,
      payment_reference,
      platform_fee,
      vendor_amount
    )
    values (
      auth.uid(),
      v_vendor_id,
      v_total,
      p_mode_paiement,
      'en_attente',
      'pending',
      v_payment_reference,
      v_platform_fee,
      v_vendor_amount
    )
    returning orders.id into v_order_id;

    for v_item in select * from jsonb_array_elements(v_group -> 'items')
    loop
      insert into public.order_items (order_id, product_id, quantite)
      values (
        v_order_id,
        (v_item ->> 'product_id')::uuid,
        (v_item ->> 'quantite')::integer
      );
    end loop;

    id := v_order_id;
    return next;
  end loop;

  return;
end;
$$;

revoke all on function public.create_orders_from_cart(jsonb, text) from public;
grant execute on function public.create_orders_from_cart(jsonb, text) to anon, authenticated;

create or replace function public.mark_order_paid(
  p_order_id uuid,
  p_payment_reference text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_credit numeric(12,2);
begin
  if auth.uid() is null then
    raise exception 'Utilisateur non authentifie';
  end if;

  select o.*, v.profile_id as vendor_owner_id
  into v_order
  from public.orders o
  join public.vendors v on v.id = o.vendor_id
  where o.id = p_order_id
  for update;

  if not found then
    raise exception 'Commande introuvable';
  end if;

  if auth.uid() <> v_order.vendor_owner_id then
    raise exception 'Operation non autorisee';
  end if;

  if v_order.payment_status = 'paid' then
    return p_order_id;
  end if;

  perform public.ensure_vendor_wallet(v_order.vendor_id);

  v_credit := coalesce(v_order.vendor_amount, v_order.total - coalesce(v_order.platform_fee, 0));

  update public.orders
  set payment_status = 'paid',
      paid_at = now(),
      payment_reference = coalesce(p_payment_reference, payment_reference),
      platform_fee = coalesce(platform_fee, 0),
      vendor_amount = coalesce(vendor_amount, v_credit)
  where id = p_order_id;

  with ledger_insert as (
    insert into public.vendor_wallet_ledger (vendor_id, order_id, entry_type, amount, note)
    values (v_order.vendor_id, p_order_id, 'credit_sale', v_credit, 'Credit vente commande')
    on conflict do nothing
    returning amount
  )
  update public.vendor_wallets
  set balance = balance + coalesce((select sum(amount) from ledger_insert), 0),
      updated_at = now()
  where vendor_id = v_order.vendor_id;

  return p_order_id;
end;
$$;

revoke all on function public.mark_order_paid(uuid, text) from public;
grant execute on function public.mark_order_paid(uuid, text) to authenticated;

create or replace function public.request_vendor_payout(
  p_amount numeric,
  p_method text default 'manual',
  p_account_ref text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vendor_id uuid;
  v_balance numeric(12,2);
  v_payout_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Utilisateur non authentifie';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Montant invalide';
  end if;

  select id into v_vendor_id
  from public.vendors
  where profile_id = auth.uid();

  if v_vendor_id is null then
    raise exception 'Aucun vendeur associe a cet utilisateur';
  end if;

  perform public.ensure_vendor_wallet(v_vendor_id);

  select balance into v_balance
  from public.vendor_wallets
  where vendor_id = v_vendor_id
  for update;

  if coalesce(v_balance, 0) < p_amount then
    raise exception 'Solde insuffisant';
  end if;

  insert into public.payouts (vendor_id, amount, method, account_ref, status)
  values (v_vendor_id, p_amount, p_method, p_account_ref, 'pending')
  returning id into v_payout_id;

  insert into public.vendor_wallet_ledger (vendor_id, entry_type, amount, note, meta)
  values (
    v_vendor_id,
    'debit_payout',
    -p_amount,
    'Demande de retrait en attente',
    jsonb_build_object('payout_id', v_payout_id)
  );

  update public.vendor_wallets
  set balance = balance - p_amount,
      updated_at = now()
  where vendor_id = v_vendor_id;

  return v_payout_id;
end;
$$;

revoke all on function public.request_vendor_payout(numeric, text, text) from public;
grant execute on function public.request_vendor_payout(numeric, text, text) to authenticated;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, nom, prenom, telephone, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'nom', 'Utilisateur'),
    coalesce(new.raw_user_meta_data ->> 'prenom', 'Nouveau'),
    new.raw_user_meta_data ->> 'telephone',
    coalesce(new.raw_user_meta_data ->> 'role', 'etudiant')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute procedure public.handle_new_user_profile();

-- Optional seed data
insert into public.vendors (id, profile_id, nom_cantine, localisation, telephone)
select
  gen_random_uuid(),
  p.id,
  'Cantine Demo',
  'Campus UCAD',
  '77 123 45 67'
from public.profiles p
where p.role = 'vendeur'
on conflict do nothing;
