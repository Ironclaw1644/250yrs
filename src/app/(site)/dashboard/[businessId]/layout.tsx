import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser, ownsBusiness } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { OwnerTabs } from "@/components/dashboard/OwnerTabs";

export default async function BusinessDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  await requireUser(`/dashboard/${businessId}`);
  if (!(await ownsBusiness(businessId))) redirect("/dashboard");

  const { data: biz } = await db()
    .from("businesses")
    .select("id,name,status")
    .eq("id", businessId)
    .maybeSingle();
  if (!biz) notFound();

  return (
    <div className="container-shell py-8">
      <Link href="/dashboard" className="text-small text-stone hover:text-barn">
        ← All listings
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="font-heading text-h1 text-navy">{biz.name}</h1>
        <span
          className={`rounded-full px-2.5 py-0.5 font-sans text-xs font-bold ${
            biz.status === "published"
              ? "bg-success/15 text-success"
              : biz.status === "suspended"
                ? "bg-barn/15 text-barn"
                : "bg-gold/20 text-navy"
          }`}
        >
          {biz.status === "published" ? "Live" : biz.status}
        </span>
      </div>
      <OwnerTabs businessId={businessId} />
      <div className="mt-6">{children}</div>
    </div>
  );
}
