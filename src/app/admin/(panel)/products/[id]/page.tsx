import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { adminCategories, adminProduct } from "@/lib/admin-queries";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([adminProduct(id), adminCategories()]);
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Products</p>
          <h1 className="font-display text-4xl text-brand-cream">{product.name}</h1>
          <p className="mt-1 text-sm text-white/45">{product.sku}</p>
        </div>
        <Link href={`/shop/${product.slug}`} target="_blank" className="button-secondary">
          View on store ↗
        </Link>
      </div>
      <ProductForm product={product} categories={categories} />
    </div>
  );
}
