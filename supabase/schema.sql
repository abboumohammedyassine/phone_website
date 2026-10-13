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

-- ============ SEED DE DÉMO ============
insert into products (slug, name, brand, category, price, compare_at_price, images, colors, storage_options, stock, rating, reviews_count, specs, description, is_featured)
values
(
  'iphone-15-128go',
  'iPhone 15 128 Go',
  'Apple',
  'telephones',
  185000,
  205000,
  array['https://images.unsplash.com/photo-1592286927505-1def25115481?w=800'],
  array['Noir','Bleu','Rose'],
  array['128 Go','256 Go'],
  12,
  4.8,
  132,
  '{"Écran":"6.1\" OLED","Puce":"A16 Bionic","Batterie":"3349 mAh"}',
  'iPhone 15 reconditionné grade A, garantie 6 mois.',
  true
),
(
  'redmi-note-13-pro',
  'Redmi Note 13 Pro',
  'Xiaomi',
  'telephones',
  62000,
  null,
  array['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800'],
  array['Noir','Vert'],
  array['256 Go'],
  25,
  4.5,
  88,
  '{"Écran":"6.67\" AMOLED","Processeur":"Snapdragon 7s Gen 2","Batterie":"5100 mAh"}',
  'Excellent rapport qualité-prix, charge rapide 67W.',
  true
),
(
  'asus-rog-strix-g16',
  'ASUS ROG Strix G16',
  'Asus',
  'pc',
  310000,
  340000,
  array['https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800'],
  null,
  array['512 Go SSD','1 To SSD'],
  6,
  4.7,
  41,
  '{"Processeur":"Intel Core i7-13650HX","GPU":"RTX 4060","RAM":"16 Go"}',
  'PC portable gamer, écran 165Hz.',
  true
),
(
  'airpods-pro-2',
  'AirPods Pro 2',
  'Apple',
  'audio',
  38000,
  42000,
  array['https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800'],
  null,
  null,
  30,
  4.9,
  210,
  '{"Réduction de bruit":"Active","Autonomie":"6h + boîtier"}',
  'Réduction de bruit active et audio spatial.',
  true
),
(
  'anker-powerbank-20000',
  'Anker PowerCore 20000mAh',
  'Anker',
  'accessoires',
  9500,
  null,
  array['https://images.unsplash.com/photo-1609592806596-4d1b5e0f6f0a?w=800'],
  array['Noir'],
  null,
  50,
  4.6,
  76,
  '{"Capacité":"20000mAh","Charge rapide":"22.5W"}',
  'Batterie externe compacte, charge deux appareils à la fois.',
  false
);