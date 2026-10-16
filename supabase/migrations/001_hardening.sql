-- Phone House Maghnia — migration 001 : stock atomique, contraintes, stockage d'images
-- À exécuter UNE FOIS dans Supabase → SQL Editor (après schema.sql). Idempotente.

-- ============ 1. STOCK ATOMIQUE (anti-survente) ============
-- Décrémente le stock seulement s'il y en a assez, en une seule instruction SQL :
-- deux clients qui commandent la dernière unité en même temps ne peuvent pas
-- passer tous les deux. Retourne true si la réservation a réussi.
create or replace function public.reserve_stock(p_product_id uuid, p_qty integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_qty is null or p_qty <= 0 then
    return false;
  end if;

  update products
     set stock = stock - p_qty
   where id = p_product_id
     and stock >= p_qty;

  return found;
end;
$$;

-- Remet des unités en stock (commande annulée ou enregistrement échoué).
create or replace function public.release_stock(p_product_id uuid, p_qty integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_qty is null or p_qty <= 0 then
    return;
  end if;

  update products
     set stock = stock + p_qty
   where id = p_product_id;
end;
$$;

-- Seul le serveur (clé service_role) peut les appeler : jamais le navigateur.
revoke all on function public.reserve_stock(uuid, integer) from public, anon, authenticated;
revoke all on function public.release_stock(uuid, integer) from public, anon, authenticated;
grant execute on function public.reserve_stock(uuid, integer) to service_role;
grant execute on function public.release_stock(uuid, integer) to service_role;

-- ============ 2. CONTRAINTES DE COHÉRENCE ============
alter table products drop constraint if exists products_stock_nonneg;
alter table products add constraint products_stock_nonneg check (stock >= 0);

alter table products drop constraint if exists products_price_nonneg;
alter table products add constraint products_price_nonneg check (price >= 0);

alter table orders drop constraint if exists orders_amounts_nonneg;
alter table orders add constraint orders_amounts_nonneg
  check (subtotal >= 0 and shipping_cost >= 0 and total >= 0);

-- Recherche d'une commande par téléphone (page de suivi client).
create index if not exists idx_orders_phone on orders(phone);

-- ============ 3. STOCKAGE DES IMAGES PRODUITS ============
-- Bucket public en lecture (les images s'affichent sur le site).
-- Aucune policy d'écriture pour anon : seules les routes admin (service_role)
-- pourront envoyer des fichiers. 5 Mo max, JPEG / PNG / WebP uniquement.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
