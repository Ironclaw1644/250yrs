import { ProductForm } from "@/components/admin/product-form";
import { adminCategories } from "@/lib/admin-queries";

export default async function NewProductPage() {
  const categories = await adminCategories();
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Products</p>
        <h1 className="font-display text-4xl text-brand-cream">New product</h1>
      </div>
      <ProductForm product={null} categories={categories} />
    </div>
  );
}
