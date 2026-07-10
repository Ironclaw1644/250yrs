import Link from "next/link";
import type { Metadata } from "next";
import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = { title: "Your Dashboard", robots: { index: false } };

type Row = {
  id: string;
  name: string;
  slug: string;
  status: string;
  tagline: string | null;
  category: { slug: string; name: string } | null;
  city: {
    slug: string;
    name: string;
    state: { slug: string; code: string | null; name: string; country: { slug: string } } | null;
  } | null;
};

const STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-gold/20 text-navy" },
  pending: { label: "In review", cls: "bg-gold/20 text-navy" },
  published: { label: "Live", cls: "bg-success/15 text-success" },
  suspended: { label: "Suspended", cls: "bg-barn/15 text-barn" },
  archived: { label: "Archived", cls: "bg-stone/15 text-stone" },
};

export default async function DashboardPage() {
  const profile = await requireOwner();
  const { data } = await db()
    .from("businesses")
    .select(
      "id,name,slug,status,tagline,category:categories(slug,name),city:cities(slug,name,state:states(slug,code,name,country:countries(slug)))",
    )
    .eq("owner_id", profile.id)
    .order("created_at", { ascending: false });
  const businesses = ((data as unknown as Row[]) ?? []).filter(Boolean);

  return (
    <div className="container-shell py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Business dashboard</p>
          <h1 className="font-heading text-h1 text-navy">
            {profile.full_name ? `Welcome, ${profile.full_name.split(" ")[0]}` : "Your listings"}
          </h1>
        </div>
        <Link href="/dashboard/new" className="btn btn-primary">
          <Icon name="store" /> Add a listing
        </Link>
      </div>

      {businesses.length === 0 ? (
        <div className="card flex flex-col items-center gap-4 px-6 py-14 text-center">
          <span className="pin-badge h-16 w-16">
            <Icon name="store" className="text-2xl" />
          </span>
          <h2 className="font-heading text-h3 text-navy">List your first business</h2>
          <p className="max-w-md text-stone">
            Add your shop so customers can find, call, and order from you.
          </p>
          <Link href="/dashboard/new" className="btn btn-gold">
            <Icon name="arrow-right" /> Add a listing
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {businesses.map((b) => {
            const s = STATUS[b.status] ?? STATUS.draft;
            const st = b.city?.state;
            const livePath =
              st?.country && st && b.city && b.category
                ? `/${st.country.slug}/${st.slug}/${b.city.slug}/${b.category.slug}/${b.slug}`
                : null;
            return (
              <li key={b.id} className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="font-heading text-h3 text-navy">{b.name}</h2>
                    <span className={`rounded-full px-2.5 py-0.5 font-sans text-xs font-bold ${s.cls}`}>
                      {s.label}
                    </span>
                  </div>
                  <p className="mt-1 text-small text-stone">
                    {b.category?.name}
                    {b.city ? ` · ${b.city.name}, ${st?.code ?? st?.name ?? ""}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {b.status === "published" && livePath && (
                    <Link href={livePath} className="btn btn-secondary !min-h-10 text-small">
                      <Icon name="arrow-right" /> View live
                    </Link>
                  )}
                  <Link
                    href={`/dashboard/${b.id}/advertise`}
                    className={`btn !min-h-10 text-small ${b.status === "published" ? "btn-secondary" : "btn-gold"}`}
                  >
                    <Icon name="bullhorn" />
                    {b.status === "published" ? "Manage ad" : "Advertise & publish"}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
