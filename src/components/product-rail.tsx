import Image from "next/image";
import Link from "next/link";
import { formatCents } from "@/lib/store-config";
import { primaryImage, type StoreProduct } from "@/lib/store-types";

/** "You may also like" — compact 3-up row used at the bottom of the PDP. */
export function ProductRail({ products }: { products: StoreProduct[] }) {
  return (
    <section className="mt-14">
      <p className="eyebrow">You may also like</p>
      <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => {
          const img = primaryImage(p);
          return (
            <Link
              key={p.id}
              href={`/shop/${p.slug}`}
              className="product-card group block overflow-hidden"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.4rem] bg-black/30">
                {img && (
                  <Image
                    src={img.public_url}
                    alt={img.alt ?? p.name}
                    fill
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                    className="object-cover transition duration-500 group-hover:scale-[1.04]"
                  />
                )}
              </div>
              <div className="flex items-center justify-between gap-3 px-1 pt-4">
                <p className="truncate font-medium text-brand-cream group-hover:text-brand-gold">
                  {p.name}
                </p>
                <p className="shrink-0 text-brand-cream/80">{formatCents(p.price_cents)}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
