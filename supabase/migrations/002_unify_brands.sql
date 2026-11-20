-- Unifie les marques écrites différemment (Samsung / SAMSUNG / samsung).
-- À exécuter UNE fois dans Supabase -> SQL Editor. Sans danger si relancé.
with counted as (
  select lower(trim(brand)) as k, brand, count(*) as c
  from products
  group by 1, 2
),
canon as (
  select distinct on (k) k, brand
  from counted
  order by k, c desc, (brand = upper(brand)), brand
)
update products p
set brand = canon.brand
from canon
where lower(trim(p.brand)) = canon.k
  and p.brand <> canon.brand;
