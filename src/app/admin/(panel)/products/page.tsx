import Image from "next/image";
import Link from "next/link";
import { adminProducts } from "@/lib/admin-queries";
import { formatCents } from "@/lib/store-config";

export default async function AdminProductsPage() {
  const products = await adminProducts();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Products</p>
          <h1 className="font-display text-4xl text-brand-cream">Catalog</h1>
        </div>
        <Link href="/admin/products/new" className="button-primary">
          New product
        </Link>
      </div>

      <ul className="grid gap-3">
        {products.map((p) => {
          const img = p.images.find((i) => i.is_primary) ?? p.images[0];
          return (
            <li key={p.id}>
              <Link
                href={`/admin/products/${p.id}`}
                className="flex items-center gap-4 rounded-2xl border border-white/8 bg-white/5 p-4 transition hover:border-brand-gold/40"
              >
                <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-black/30">
                  {img && <Image src={img.public_url} alt="" fill sizes="56px" className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-brand-cream">{p.name}</p>
                  <p className="text-sm text-white/50">
                    {p.sku} · {p.sizes.length} sizes · {p.images.length} images
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {p.featured && (
                    <span className="rounded-full bg-brand-gold/15 px-2.5 py-0.5 text-[11px] uppercase tracking-wide text-brand-gold">
                      featured
                    </span>
                  )}
                  {p.hidden && (
                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] uppercase tracking-wide text-white/60">
                      hidden
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] uppercase tracking-wide ${
                      p.status === "active"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : p.status === "sold"
                          ? "bg-brand-rust/20 text-brand-rust"
                          : "bg-white/10 text-white/60"
                    }`}
                  >
                    {p.status}
                  </span>
                  <span className="text-brand-cream">{formatCents(p.price_cents)}</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
