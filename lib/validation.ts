// lib/validation.ts
// Schémas Zod partagés (navigateur ET serveur) : checkout + formulaires admin.
// Règle d'or : le serveur re-valide TOUJOURS ce que le navigateur envoie.

import { z, ZodError } from "zod";

/* ------------------------------------------------------------------ */
/* Téléphone algérien                                                  */
/* ------------------------------------------------------------------ */

export const PHONE_ERROR =
  "Numéro invalide : 10 chiffres commençant par 05, 06 ou 07 (ex. 0555 12 34 56).";

/**
 * Normalise un numéro mobile algérien vers le format national 0XXXXXXXXX.
 * Accepte : "0555 12 34 56", "0555-12-34-56", "+213555123456", "00213555123456".
 * Refuse les fixes (02x) : un livreur COD doit pouvoir joindre le client sur mobile.
 * Retourne null si le numéro est invalide.
 */
export function normalizeDzPhone(input: string): string | null {
  let p = input.replace(/[\s.\-()]/g, "");
  if (p.startsWith("+213")) p = "0" + p.slice(4);
  else if (p.startsWith("00213")) p = "0" + p.slice(5);
  else if (p.startsWith("213") && p.length === 12) p = "0" + p.slice(3);
  return /^0[567]\d{8}$/.test(p) ? p : null;
}

export const phoneSchema = z
  .string({ required_error: "Téléphone requis" })
  .trim()
  .transform((value, ctx) => {
    const normalized = normalizeDzPhone(value);
    if (!normalized) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: PHONE_ERROR });
      return z.NEVER;
    }
    return normalized;
  });

/* ------------------------------------------------------------------ */
/* Checkout                                                            */
/* ------------------------------------------------------------------ */

/**
 * Une ligne de panier telle qu'acceptée par le serveur.
 * Volontairement SANS prix ni nom : le serveur les relit en base.
 * (Zod retire les clés inconnues, donc un prix envoyé par le client est ignoré.)
 */
export const orderItemSchema = z.object({
  productId: z.string().uuid("Produit invalide dans le panier."),
  color: z.string().trim().max(50).optional(),
  storage: z.string().trim().max(50).optional(),
  qty: z
    .number({ invalid_type_error: "Quantité invalide." })
    .int("Quantité invalide.")
    .min(1, "Quantité minimale : 1.")
    .max(10, "Quantité maximale par article : 10."),
});

export const checkoutSchema = z.object({
  full_name: z
    .string({ required_error: "Nom complet requis." })
    .trim()
    .min(3, "Nom complet trop court.")
    .max(80, "Nom complet trop long."),
  phone: phoneSchema,
  wilaya_id: z
    .number({ invalid_type_error: "Choisis ta wilaya." })
    .int()
    .min(1, "Choisis ta wilaya.")
    .max(100),
  commune_id: z
    .number({ invalid_type_error: "Choisis ta commune." })
    .int()
    .positive("Choisis ta commune."),
  address: z
    .string({ required_error: "Adresse requise." })
    .trim()
    .min(5, "Adresse trop courte (rue, repère...).")
    .max(300, "Adresse trop longue."),
  delivery_type: z.enum(["home", "stopdesk"], {
    errorMap: () => ({ message: "Type de livraison invalide." }),
  }),
  items: z
    .array(orderItemSchema)
    .min(1, "Ton panier est vide.")
    .max(20, "Panier trop volumineux."),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const shippingEstimateSchema = z.object({
  wilaya_id: z.coerce.number().int().min(1).max(100),
  commune_id: z.coerce.number().int().positive().optional(),
  delivery_type: z.enum(["home", "stopdesk"]),
});

/* ------------------------------------------------------------------ */
/* Produits (admin)                                                    */
/* ------------------------------------------------------------------ */

export const PRODUCT_CATEGORIES = ["telephones", "pc", "audio", "accessoires"] as const;

const int = (label: string, min = 0, max = 100_000_000) =>
  z
    .number({
      required_error: `${label} requis`,
      invalid_type_error: `${label} : nombre requis`,
    })
    .int(`${label} : nombre entier requis`)
    .min(min, `${label} : minimum ${min}`)
    .max(max, `${label} : valeur trop grande`);

const stringList = (max: number) =>
  z.array(z.string().trim().min(1).max(60)).max(max);

const productBase = z.object({
  name: z.string().trim().min(2, "Nom trop court.").max(120, "Nom trop long."),
  slug: z
    .string()
    .trim()
    .min(2, "Slug requis.")
    .max(140)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug invalide : minuscules, chiffres et tirets uniquement (ex. iphone-15-128go)."
    ),
  brand: z.string().trim().min(1, "Marque requise.").max(60),
  category: z.enum(PRODUCT_CATEGORIES, {
    errorMap: () => ({ message: "Catégorie invalide." }),
  }),
  price: int("Prix"),
  compare_at_price: int("Prix barré").nullable().optional(),
  stock: int("Stock", 0, 100_000),
  images: z
    .array(z.string().url("URL d'image invalide.").max(600))
    .min(1, "Ajoute au moins une image.")
    .max(10, "10 images maximum."),
  colors: stringList(20).default([]),
  storage_options: stringList(20).default([]),
  specs: z.record(z.string().max(60), z.string().max(200)).default({}),
  description: z.string().trim().max(5000).nullable().optional(),
  is_featured: z.boolean().default(false),
});

function comparePriceCheck(
  p: { price?: number; compare_at_price?: number | null },
  ctx: z.RefinementCtx
) {
  if (
    p.compare_at_price != null &&
    p.price !== undefined &&
    p.compare_at_price <= p.price
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["compare_at_price"],
      message: "Le prix barré doit être supérieur au prix.",
    });
  }
}

export const productSchema = productBase.superRefine(comparePriceCheck);
export const productPatchSchema = productBase.partial().superRefine(comparePriceCheck);

/** Renvoie le premier message d'erreur lisible d'une validation Zod. */
export function formatZodError(err: ZodError): string {
  return err.issues[0]?.message ?? "Données invalides.";
}

/* ------------------------------------------------------------------ */
/* Suivi de commande (page publique /suivi)                            */
/* ------------------------------------------------------------------ */

/**
 * Le téléphone SEUL ne suffit pas : il faut aussi le numéro de commande (ou de suivi Yalidine).
 * 6 caractères minimum : empêche de "deviner" une commande en essayant 1 ou 2 caractères.
 */
export const trackingLookupSchema = z.object({
  phone: phoneSchema,
  ref: z
    .string({ required_error: "Numéro de commande requis." })
    .trim()
    .transform((v) => v.replace(/^#/, "").toLowerCase())
    .pipe(
      z
        .string()
        .min(6, "Numéro de commande trop court (6 caractères minimum).")
        .max(60, "Numéro de commande trop long.")
    ),
});
