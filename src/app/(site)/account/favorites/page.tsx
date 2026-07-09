import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { businessPath } from "@/lib/seo";
import type { BusinessFull } from "@/lib/queries";
import { BusinessCard } from "@/components/BusinessCard";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = { title: "Saved places", robots: { index: false } };

export default async function FavoritesPage() {
  const user = await requireUser("/account/favorites");
  const { data } = await db()
    .from("favorites")
    .select(
      "id, business:businesses(*, city:cities(*, state:states(*, country:countries(*))), category:categories(*), photos:business_photos(url,alt_text,is_primary,sort_order))",
    )
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  const favorites = ((data as unknown as { id: string; business: BusinessFull & { photos?: { url: string; alt_text: string | null; is_primary: boolean; sort_order: number }[] } }[]) ?? [])
    .map((f) => f.business)
    .filter(Boolean);

  return (
    <div className="container-shell py-8">
      <Link href="/account" className="text-small text-stone hover:text-barn">
        ← Your account
      </Link>
      <h1 className="mt-2 font-heading text-h1 text-navy">Saved places</h1>

      {favorites.length === 0 ? (
        <div className="card mt-6 flex flex-col items-center gap-4 px-6 py-14 text-center">
          <span className="pin-badge h-16 w-16">
            <Icon name="heart" className="text-2xl" />
          </span>
          <p className="max-w-md text-stone">
            You haven&apos;t saved any shops yet — tap the heart on any business
            to keep it here.
          </p>
          <Link href="/us" className="btn btn-primary">
            <Icon name="magnifying-glass" /> Start exploring
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((b) => {
            const photos = b.photos ?? [];
            const primary =
              photos.find((p) => p.is_primary) ??
              [...photos].sort((a, z) => a.sort_order - z.sort_order)[0];
            const region = b.city?.state?.code ?? b.city?.state?.name ?? "";
            return (
              <BusinessCard
                key={b.id}
                business={b}
                categorySlug={b.category?.slug ?? "local-shops"}
                href={businessPath(b)}
                photoUrl={primary?.url}
                photoAlt={primary?.alt_text}
                cityLabel={b.city ? `${b.city.name}, ${region}` : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
