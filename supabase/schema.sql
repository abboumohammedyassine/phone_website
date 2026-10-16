-- Phone House Maghnia — schéma Supabase
-- À exécuter dans l'éditeur SQL Supabase (ou via `supabase db push`)

create extension if not exists "uuid-ossp";

-- ============ PRODUCTS ============
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  brand text not null,
  category text not null check (category in ('telephones','pc','audio','accessoires')),
  price integer not null,              -- en DA (dinars), pas de centimes
  compare_at_price integer,
  images text[] not null default '{}',
  colors text[],
  storage_options text[],
  stock integer not null default 0,
  rating numeric(2,1),
  reviews_count integer default 0,
  specs jsonb default '{}',
  description text,
  is_featured boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_products_category on products(category);
create index if not exists idx_products_brand on products(brand);

alter table products enable row level security;

create policy "Products are publicly readable"
  on products for select
  using (true);

-- Écriture réservée au rôle service (admin / route handlers), pas au client anon.

-- ============ ORDERS ============
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  phone text not null,
  wilaya_id integer not null,
  commune_id integer not null,
  address text not null,
  delivery_type text not null check (delivery_type in ('home','stopdesk')),
  items jsonb not null,               -- snapshot du panier au moment de la commande
  subtotal integer not null,
  shipping_cost integer not null default 0,
  total integer not null,
  payment_method text not null default 'cod' check (payment_method = 'cod'),
  yalidine_tracking text,
  status text not null default 'pending'
    check (status in ('pending','confirmed','shipped','delivered','cancelled')),
  created_at timestamptz default now()
);

create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_created_at on orders(created_at desc);

alter table orders enable row level security;

-- Aucune policy select/insert pour le rôle anon : les commandes ne passent
-- que par /api/orders (service role côté serveur), jamais depuis le client
-- directement. Cela évite qu'un visiteur lise les commandes des autres.

-- ============ WISHLIST (optionnel, si comptes utilisateurs) ============
create table if not exists wishlist (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, product_id)
);

alter table wishlist enable row level security;

create policy "Users manage their own wishlist"
  on wishlist for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Les produits de démonstration sont dans supabase/seed.dev.sql (DEV UNIQUEMENT).
-- Ensuite, exécuter supabase/migrations/001_hardening.sql.
