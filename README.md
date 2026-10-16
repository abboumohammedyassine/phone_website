# Phone House Maghnia

E-commerce tech (téléphones, PC, audio, accessoires) — Next.js 14, Supabase,
livraison Yalidine, **paiement 100% cash à la livraison** (pas de Stripe, pas
de carte bancaire).

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- React Three Fiber / drei — hero 3D
- Framer Motion — micro-interactions
- Zustand — panier (persisté en localStorage)
- Supabase — produits, commandes (Postgres + RLS)
- Yalidine Express API — wilayas/communes, frais de livraison, création de colis COD

## Démarrage

```bash
npm install
cp .env.example .env.local   # puis remplis les clés
npm run dev
```

## Configuration Supabase

1. Crée un projet sur supabase.com.
2. Dans l'éditeur SQL, exécute `supabase/schema.sql` (crée les tables
   `products`, `orders`, `wishlist`, + RLS, + 5 produits de démo).
3. Copie `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` et
   `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API) dans `.env.local`.

## Configuration Yalidine

1. Crée un compte pro sur yalidine.app (ou passe par leur support pour l'activation).
2. Dans ton espace Yalidine → **API**, génère `API-ID` et `API-TOKEN`.
3. Renseigne-les dans `.env.local` :
   ```
   YALIDINE_API_ID=...
   YALIDINE_API_TOKEN=...
   ```
4. Définis `STORE_WILAYA_ID` (l'id de la wilaya d'où tu expédies, ex: 16
   pour Alger) — utilisé pour calculer les frais de livraison.

### Comment le paiement fonctionne maintenant (au lieu de Stripe)

- Le checkout (`/checkout`) ne demande **aucune carte bancaire**. Il collecte
  nom, téléphone, wilaya, commune, adresse, et type de livraison
  (à domicile ou point relais).
- À la validation, `POST /api/orders` :
  1. recalcule les frais de livraison via `lib/yalidine.ts::getShippingFee`,
  2. enregistre la commande dans Supabase avec `payment_method = 'cod'`,
  3. crée un colis chez Yalidine via `createCodParcel`, avec le **montant
     total à encaisser en espèces** par le livreur (`price` = COD amount),
  4. renvoie le numéro de suivi Yalidine, affiché sur la page de confirmation.
- Si l'appel Yalidine échoue (ex: solde compte pro insuffisant), la commande
  reste enregistrée en statut `pending` — à traiter manuellement depuis
  `/admin`, plutôt que de bloquer le client.

Aucune dépendance Stripe n'est présente dans ce projet.

## Pages principales

| Route | Rôle |
|---|---|
| `/` | Accueil, hero 3D, produits en vedette |
| `/catalogue` | Grille produits + filtre catégorie |
| `/produit/[slug]` | Fiche produit, sélection couleur/stockage, ajout panier |
| `/panier` | Panier (Zustand, persisté) |
| `/checkout` | Formulaire livraison Yalidine + confirmation commande |
| `/checkout/confirmation` | Récap + numéro de suivi |
| `/admin` | Liste des commandes et statut Yalidine (⚠️ à protéger, voir plus bas) |

## Protection de `/admin`

`/admin` est protégé par Supabase Auth + une allowlist d'emails :

1. Dans Supabase → Authentication → Users, crée un utilisateur (ton email admin)
   avec un mot de passe.
2. Ajoute cet email dans `ADMIN_EMAILS` (`.env.local`), séparés par des
   virgules si plusieurs admins.
3. Va sur `/admin/login`, connecte-toi. `middleware.ts` bloque toute requête
   vers `/admin/*` si l'utilisateur n'est pas connecté ou pas dans la
   allowlist, et redirige vers `/admin/login`.

## À faire avant la mise en prod

- Brancher un vrai système d'images produits (Supabase Storage) plutôt que
  des URLs Unsplash de démo.
- Ajouter la pagination sur `/catalogue` si le catalogue dépasse ~100 produits.
- Webhook Yalidine (si disponible sur ton compte) pour mettre à jour
  automatiquement `orders.status` quand le colis est livré/retourné.
- Tests des endpoints `/api/yalidine/*` avec tes vraies clés avant le lancement
  (les noms de champs Yalidine peuvent légèrement varier selon la version
  d'API activée sur ton compte — vérifie `per_commune` dans la réponse
  `/fees` et ajuste `getShippingFee` si besoin).

## Design

Palette carbone (#0B0D10) + accent ambre (#F2A63A) + cyan tech (#4DE8E0).
Typo : Space Grotesk (titres) / Inter (texte) / JetBrains Mono (specs, prix).
Élément signature : le hero 3D montre un appareil flottant entouré d'un
anneau de nœuds connectés — une représentation littérale du réseau de
livraison Yalidine (58 wilayas) autour du produit.