import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug } from "@/lib/products";
import AddToCartPanel from "@/components/AddToCartPanel";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return {};

  const title = `${product.name} — ${product.price.toLocaleString("fr-DZ")} DA`;
  const description =
    product.description ??
    `${product.name} par ${product.brand}, disponible sur Phone House Maghnia. Livraison partout en Algérie, paiement à la livraison.`;
  const image = product.images?.[0];

  return {
    title,
    description,
    alternates: { canonical: `/produit/${product.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      images: image ? [{ url: image, width: 800, height: 800, alt: product.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    brand: { "@type": "Brand", name: product.brand },
    description: product.description ?? undefined,
    image: product.images ?? undefined,
    sku: product.id,
    offers: {
      "@type": "Offer",
      priceCurrency: "DZD",
      price: product.price,
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-5 pt-12 pb-28 md:pb-12">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <div className="grid gap-10 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-2xl border border-carbon-700 bg-carbon-900">
          {product.images?.[0] && (
            <div className="relative h-full w-full">
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-contain p-10"
              />
            </div>
          )}
        </div>
        <AddToCartPanel product={product} />
      </div>

      {product.specs && (
        <div className="mt-16">
          <h2 className="font-display text-xl font-600">Caractéristiques</h2>
          <dl className="mt-4 divide-y divide-carbon-700 rounded-xl border border-carbon-700">
            {Object.entries(product.specs).map(([k, v]) => (
              <div key={k} className="flex justify-between px-4 py-3 text-sm">
                <dt className="text-steel-400">{k}</dt>
                <dd className="font-mono">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {product.description && (
        <div className="mt-10 max-w-2xl text-sm leading-relaxed text-steel-300">
          {product.description}
        </div>
      )}
    </div>
  );
}