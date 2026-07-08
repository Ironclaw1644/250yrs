import Link from "next/link";
import type { Metadata } from "next";
import { requireUser, getProfile } from "@/lib/auth";
import { startBusiness } from "@/lib/actions/owner";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = { title: "Your Account", robots: { index: false } };

export default async function AccountPage() {
  await requireUser("/account");
  const profile = await getProfile();
  const isOwner = profile?.role === "business_owner" || profile?.role === "admin";

  return (
    <div className="container-shell max-w-2xl py-8">
      <p className="eyebrow">Your account</p>
      <h1 className="font-heading text-h1 text-navy">
        {profile?.full_name || "Welcome"}
      </h1>

      <div className="card mt-6 p-6">
        <dl className="grid grid-cols-[7rem_1fr] gap-y-2 text-body">
          <dt className="text-stone">Name</dt>
          <dd className="text-navy">{profile?.full_name || "—"}</dd>
          <dt className="text-stone">Email</dt>
          <dd className="text-navy">{profile?.email || "—"}</dd>
          <dt className="text-stone">Account</dt>
          <dd className="text-navy capitalize">{profile?.role?.replace("_", " ")}</dd>
        </dl>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="card p-6">
          <h2 className="flex items-center gap-2 font-heading text-h3 text-navy">
            <Icon name="heart" className="text-barn" /> Saved & activity
          </h2>
          <p className="mt-2 text-small text-stone">
            Favorites, reviews, orders, and bookings will show here.
          </p>
        </div>
        <div className="card flex flex-col p-6">
          <h2 className="flex items-center gap-2 font-heading text-h3 text-navy">
            <Icon name="bullhorn" className="text-gold" /> For business owners
          </h2>
          {isOwner ? (
            <>
              <p className="mt-2 text-small text-stone">Manage your listings and ads.</p>
              <Link href="/dashboard" className="btn btn-primary mt-4">
                <Icon name="arrow-right" /> Go to dashboard
              </Link>
            </>
          ) : (
            <>
              <p className="mt-2 text-small text-stone">
                Own a shop? List it and reach local customers.
              </p>
              <form action={startBusiness} className="mt-4">
                <button type="submit" className="btn btn-gold w-full">
                  <Icon name="store" /> List your business
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <form action="/auth/signout" method="post" className="mt-8">
        <button type="submit" className="btn btn-secondary">
          <Icon name="right-to-bracket" /> Sign out
        </button>
      </form>
    </div>
  );
}
