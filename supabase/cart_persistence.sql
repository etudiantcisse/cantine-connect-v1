-- Cart persistence for Cantine Connectée
-- Apply in Supabase SQL Editor (Database > SQL) as an admin.

-- 1) Tables
create table if not exists public.carts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  updated_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create index if not exists cart_items_user_id_idx on public.cart_items(user_id);

-- 2) updated_at triggers
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists carts_set_updated_at on public.carts;
create trigger carts_set_updated_at
before update on public.carts
for each row execute function public.set_updated_at();

drop trigger if exists cart_items_set_updated_at on public.cart_items;
create trigger cart_items_set_updated_at
before update on public.cart_items
for each row execute function public.set_updated_at();

-- 3) Enable RLS
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;

-- 4) Policies (owner only)
drop policy if exists "carts_select_own" on public.carts;
create policy "carts_select_own"
on public.carts for select
using (auth.uid() = user_id);

drop policy if exists "carts_insert_own" on public.carts;
create policy "carts_insert_own"
on public.carts for insert
with check (auth.uid() = user_id);

drop policy if exists "carts_update_own" on public.carts;
create policy "carts_update_own"
on public.carts for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "cart_items_select_own" on public.cart_items;
create policy "cart_items_select_own"
on public.cart_items for select
using (auth.uid() = user_id);

drop policy if exists "cart_items_insert_own" on public.cart_items;
create policy "cart_items_insert_own"
on public.cart_items for insert
with check (auth.uid() = user_id);

drop policy if exists "cart_items_update_own" on public.cart_items;
create policy "cart_items_update_own"
on public.cart_items for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "cart_items_delete_own" on public.cart_items;
create policy "cart_items_delete_own"
on public.cart_items for delete
using (auth.uid() = user_id);

-- 5) RPC: upsert single item
create or replace function public.cart_upsert_item(p_product_id uuid, p_quantity integer)
returns void
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantity must be > 0';
  end if;

  insert into public.carts(user_id) values (v_user_id)
  on conflict (user_id) do update set updated_at = now();

  insert into public.cart_items(user_id, product_id, quantity)
  values (v_user_id, p_product_id, p_quantity)
  on conflict (user_id, product_id)
  do update set quantity = excluded.quantity, updated_at = now();
end;
$$;

-- 6) RPC: remove item
create or replace function public.cart_remove_item(p_product_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;
  delete from public.cart_items
  where user_id = v_user_id and product_id = p_product_id;
  update public.carts set updated_at = now() where user_id = v_user_id;
end;
$$;

-- 7) RPC: clear cart
create or replace function public.cart_clear()
returns void
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;
  delete from public.cart_items where user_id = v_user_id;
  update public.carts set updated_at = now() where user_id = v_user_id;
end;
$$;

-- 8) RPC: get cart items with product info
create or replace function public.cart_get_items()
returns table (
  product_id uuid,
  quantity integer,
  product jsonb
)
language sql
security definer
as $$
  select
    ci.product_id,
    ci.quantity,
    to_jsonb(p) as product
  from public.cart_items ci
  join public.products p on p.id = ci.product_id
  where ci.user_id = auth.uid()
  order by ci.updated_at desc;
$$;

