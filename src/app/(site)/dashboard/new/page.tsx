import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { createListing } from "@/lib/actions/owner";
import { CATEGORIES } from "@/lib/brand";
import { Field } from "@/components/AuthShell";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = { title: "Add a listing", robots: { index: false } };

export default async function NewListingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireUser("/dashboard/new");
  const { error } = await searchParams;

  return (
    <div className="container-shell max-w-2xl py-8">
      <p className="eyebrow">List your business</p>
      <h1 className="font-heading text-h1 text-navy">Tell us about your shop</h1>
      <p className="mt-2 text-stone">
        Add the basics now — you can add photos, hours, and a menu after. It only
        takes a minute.
      </p>

      {error && (
        <p className="mt-4 rounded-md bg-barn/10 px-3 py-2 text-small text-barn">
          {error === "missing"
            ? "Please fill in the business name, category, city, and state."
            : "Something went wrong saving your listing. Please try again."}
        </p>
      )}

      <form action={createListing} className="card mt-6 space-y-4 p-6 sm:p-8">
        <Field label="Business name" name="name" required placeholder="Big Al's Fish Fry" />

        <label className="block">
          <span className="mb-1 block font-sans text-small font-bold text-navy">
            Category
          </span>
          <select
            name="category"
            required
            defaultValue=""
            className="h-12 w-full rounded-md border-[1.5px] border-navy/15 bg-linen px-3 text-navy focus:border-success focus:outline-none focus:ring-4 focus:ring-gold/25"
          >
            <option value="" disabled>
              Choose a category…
            </option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <Field label="Tagline (one short line)" name="tagline" placeholder="Fresh-fried catfish & wings since 1998" />

        <label className="block">
          <span className="mb-1 block font-sans text-small font-bold text-navy">
            Description
          </span>
          <textarea
            name="description"
            rows={3}
            placeholder="Tell customers what makes your place special."
            className="w-full rounded-md border-[1.5px] border-navy/15 bg-linen px-3 py-2 text-navy focus:border-success focus:outline-none focus:ring-4 focus:ring-gold/25"
          />
        </label>

        <Field label="Street address" name="address" placeholder="412 Chestnut St" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City" name="city" required placeholder="Berea" />
          <Field label="State / region" name="state" required placeholder="Kentucky" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="State code (optional)" name="state_code" placeholder="KY" maxLength={4} />
          <Field label="Country" name="country" defaultValue="United States" />
        </div>
        <Field label="Phone" name="phone" type="tel" placeholder="(859) 555-0142" />

        <button type="submit" className="btn btn-primary w-full">
          <Icon name="circle-check" /> Create listing
        </button>
        <p className="text-center text-small text-stone">
          Your listing starts as a private draft. Publish it by starting an ad plan.
        </p>
      </form>
    </div>
  );
}
