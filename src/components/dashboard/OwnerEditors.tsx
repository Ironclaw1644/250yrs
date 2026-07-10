"use client";

/**
 * Owner-portal editors (client). Small form components that call the
 * owner-gated server actions in src/lib/actions/listing.ts and refresh.
 * Non-technical-friendly: labels always visible, dollars (never cents),
 * one clear primary action per card.
 */
import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Field } from "@/components/AuthShell";
import {
  updateListing,
  addPhoto,
  setPrimaryPhoto,
  deletePhoto,
  saveHours,
  addMenuSection,
  deleteMenuSection,
  addMenuItem,
  deleteMenuItem,
  addService,
  deleteService,
  addCoupon,
  toggleCoupon,
  deleteCoupon,
} from "@/lib/actions/listing";
import { centsToUSD, DAY_NAMES } from "@/lib/format";
import type {
  Business,
  BusinessHour,
  BusinessPhoto,
  MenuItem,
} from "@/lib/db-types";
import type { MenuSectionWithItems } from "@/lib/queries";

type Result = { ok: boolean; error?: string };

function useAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  function run(fn: () => Promise<Result>, okText = "Saved ✓") {
    start(async () => {
      const res = await fn();
      setMsg(res.ok ? { ok: true, text: okText } : { ok: false, text: res.error ?? "Failed" });
      router.refresh();
    });
  }
  return { pending, run, msg };
}

function Msg({ msg }: { msg: { ok: boolean; text: string } | null }) {
  if (!msg) return null;
  return (
    <p
      className={`mt-2 rounded-md px-3 py-2 text-small ${
        msg.ok ? "bg-success/10 text-success" : "bg-barn/10 text-barn"
      }`}
    >
      {msg.text}
    </p>
  );
}

/* ---------------- Basics ---------------- */
export function BasicsForm({ business }: { business: Business }) {
  const { pending, run, msg } = useAction();
  return (
    <form
      className="card max-w-2xl space-y-4 p-6"
      action={(fd) => run(() => updateListing(business.id, fd))}
    >
      <Field label="Business name" name="name" required defaultValue={business.name} />
      <Field label="Tagline" name="tagline" defaultValue={business.tagline ?? ""} placeholder="One short line customers see first" />
      <label className="block">
        <span className="mb-1 block font-sans text-small font-bold text-navy">
          Description
        </span>
        <textarea
          name="description"
          rows={4}
          defaultValue={business.description ?? ""}
          className="w-full rounded-md border-[1.5px] border-navy/15 bg-linen px-3 py-2 text-navy focus:border-success focus:outline-none focus:ring-4 focus:ring-gold/25"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Street address" name="address" defaultValue={business.address_line1 ?? ""} />
        <Field label="ZIP / postal code" name="postal_code" defaultValue={business.postal_code ?? ""} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone" name="phone" type="tel" defaultValue={business.phone ?? ""} />
        <Field label="Website (optional)" name="website_url" defaultValue={business.website_url ?? ""} placeholder="https://…" />
      </div>
      <button type="submit" disabled={pending} className="btn btn-primary">
        <Icon name="check" /> {pending ? "Saving…" : "Save details"}
      </button>
      <Msg msg={msg} />
    </form>
  );
}

/* ---------------- Photos ---------------- */
export function PhotoManager({
  businessId,
  photos,
}: {
  businessId: string;
  photos: BusinessPhoto[];
}) {
  const { pending, run, msg } = useAction();
  return (
    <div className="space-y-6">
      <form
        className="card flex flex-wrap items-end gap-3 p-5"
        action={(fd) => run(() => addPhoto(businessId, fd), "Photo added ✓")}
      >
        <label className="block">
          <span className="mb-1 block font-sans text-small font-bold text-navy">
            Add a photo
          </span>
          <input
            type="file"
            name="file"
            accept="image/*"
            required
            className="text-small text-stone file:mr-3 file:rounded-lg file:border-0 file:bg-navy file:px-3 file:py-2 file:font-sans file:text-small file:font-bold file:text-cream"
          />
        </label>
        <button type="submit" disabled={pending} className="btn btn-gold">
          <Icon name="upload" /> {pending ? "Uploading…" : "Upload"}
        </button>
        <p className="w-full text-small text-stone">
          Tip: your first photo becomes the cover. JPG or PNG up to 6MB.
        </p>
      </form>
      <Msg msg={msg} />
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((p) => (
          <li key={p.id} className="card overflow-hidden">
            <div className="relative aspect-[4/3]">
              <Image src={p.url} alt={p.alt_text ?? ""} fill sizes="300px" className="object-cover" />
              {p.is_primary && (
                <span className="absolute left-2 top-2 rounded-full bg-gold px-2 py-0.5 font-heading text-[10px] font-bold uppercase text-navy-deep">
                  Cover
                </span>
              )}
            </div>
            <div className="flex items-center justify-between p-2">
              {!p.is_primary ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => setPrimaryPhoto(businessId, p.id), "Cover updated ✓")}
                  className="font-sans text-xs font-bold text-navy hover:text-barn"
                >
                  Make cover
                </button>
              ) : (
                <span className="text-xs text-stone">Shown first</span>
              )}
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => deletePhoto(businessId, p.id), "Photo removed")}
                className="text-stone hover:text-barn"
                aria-label="Delete photo"
              >
                <Icon name="trash" />
              </button>
            </div>
          </li>
        ))}
        {!photos.length && (
          <li className="col-span-full rounded-lg border-2 border-dashed border-navy/20 p-8 text-center text-stone">
            No photos yet — listings with photos get far more calls.
          </li>
        )}
      </ul>
    </div>
  );
}

/* ---------------- Hours ---------------- */
export function HoursEditor({
  businessId,
  hours,
}: {
  businessId: string;
  hours: BusinessHour[];
}) {
  const { pending, run, msg } = useAction();
  const byDay = new Map(hours.map((h) => [h.day_of_week, h]));
  const order = [1, 2, 3, 4, 5, 6, 0];
  return (
    <form
      className="card max-w-2xl p-6"
      action={(fd) => run(() => saveHours(businessId, fd), "Hours saved ✓")}
    >
      <div className="space-y-3">
        {order.map((d) => {
          const h = byDay.get(d);
          const closed = h ? h.is_closed || !h.open_time : d === 0;
          return (
            <div key={d} className="grid grid-cols-[6rem_1fr_1fr_auto] items-center gap-3">
              <span className="font-sans text-small font-bold text-navy">
                {DAY_NAMES[d]}
              </span>
              <input
                type="time"
                name={`open_${d}`}
                defaultValue={h?.open_time?.slice(0, 5) ?? (closed ? "" : "09:00")}
                className="h-10 rounded-md border-[1.5px] border-navy/15 bg-linen px-2 text-navy"
              />
              <input
                type="time"
                name={`close_${d}`}
                defaultValue={h?.close_time?.slice(0, 5) ?? (closed ? "" : "17:00")}
                className="h-10 rounded-md border-[1.5px] border-navy/15 bg-linen px-2 text-navy"
              />
              <label className="flex items-center gap-1.5 text-small text-stone">
                <input type="checkbox" name={`closed_${d}`} defaultChecked={closed} className="h-4 w-4 accent-barn" />
                Closed
              </label>
            </div>
          );
        })}
      </div>
      <button type="submit" disabled={pending} className="btn btn-primary mt-5">
        <Icon name="check" /> {pending ? "Saving…" : "Save hours"}
      </button>
      <Msg msg={msg} />
    </form>
  );
}

/* ---------------- Menu ---------------- */
export function MenuManager({
  businessId,
  sections,
}: {
  businessId: string;
  sections: MenuSectionWithItems[];
}) {
  const { pending, run, msg } = useAction();
  return (
    <div className="max-w-3xl space-y-6">
      <form
        className="card flex flex-wrap items-end gap-3 p-5"
        action={(fd) => run(() => addMenuSection(businessId, fd), "Section added ✓")}
      >
        <div className="min-w-56 flex-1">
          <Field label="New menu section" name="name" placeholder='e.g. "Plates", "Sides", "Drinks"' required />
        </div>
        <button type="submit" disabled={pending} className="btn btn-gold">
          <Icon name="plus" /> Add section
        </button>
      </form>
      <Msg msg={msg} />
      {sections.map((s) => (
        <div key={s.id} className="card p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-h3 text-navy">{s.name}</h3>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => deleteMenuSection(businessId, s.id), "Section removed")}
              className="text-stone hover:text-barn"
              aria-label={`Delete ${s.name}`}
            >
              <Icon name="trash" />
            </button>
          </div>
          <ul className="mt-3 space-y-2">
            {s.items.map((it: MenuItem) => (
              <li key={it.id} className="flex items-center justify-between gap-3 rounded-md bg-linen/60 px-3 py-2">
                <span className="min-w-0">
                  <span className="font-semibold text-navy">{it.name}</span>
                  {it.description && (
                    <span className="block truncate text-small text-stone">{it.description}</span>
                  )}
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className="tabular font-semibold text-barn">
                    {centsToUSD(it.price_cents)}
                  </span>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => deleteMenuItem(businessId, it.id), "Item removed")}
                    className="text-stone hover:text-barn"
                    aria-label={`Delete ${it.name}`}
                  >
                    <Icon name="trash" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
          <form
            className="mt-3 grid gap-2 sm:grid-cols-[1fr_7rem_auto]"
            action={(fd) => run(() => addMenuItem(businessId, fd), "Item added ✓")}
          >
            <input type="hidden" name="section_id" value={s.id} />
            <input
              name="name"
              required
              placeholder="Item name (e.g. Catfish Plate)"
              className="h-11 rounded-md border-[1.5px] border-navy/15 bg-linen px-3 text-navy"
            />
            <input
              name="price"
              required
              inputMode="decimal"
              placeholder="$ 9.99"
              className="h-11 rounded-md border-[1.5px] border-navy/15 bg-linen px-3 text-navy"
            />
            <button type="submit" disabled={pending} className="btn btn-secondary !min-h-11">
              <Icon name="plus" /> Add
            </button>
          </form>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Services ---------------- */
export function ServicesManager({
  businessId,
  services,
}: {
  businessId: string;
  services: { id: string; name: string; description: string | null; price_cents: number; duration_minutes: number }[];
}) {
  const { pending, run, msg } = useAction();
  return (
    <div className="max-w-3xl space-y-6">
      <form
        className="card grid gap-3 p-5 sm:grid-cols-[1fr_7rem_7rem_auto]"
        action={(fd) => run(() => addService(businessId, fd), "Service added ✓")}
      >
        <input name="name" required placeholder='Service (e.g. "Men&apos;s Haircut")' className="h-11 rounded-md border-[1.5px] border-navy/15 bg-linen px-3 text-navy" />
        <input name="price" required inputMode="decimal" placeholder="$ 25" className="h-11 rounded-md border-[1.5px] border-navy/15 bg-linen px-3 text-navy" />
        <input name="duration" inputMode="numeric" placeholder="30 min" className="h-11 rounded-md border-[1.5px] border-navy/15 bg-linen px-3 text-navy" />
        <button type="submit" disabled={pending} className="btn btn-gold !min-h-11">
          <Icon name="plus" /> Add
        </button>
      </form>
      <Msg msg={msg} />
      <ul className="space-y-2">
        {services.map((s) => (
          <li key={s.id} className="card flex items-center justify-between gap-3 px-4 py-3">
            <span>
              <span className="font-semibold text-navy">{s.name}</span>
              <span className="ml-2 text-small text-stone">{s.duration_minutes} min</span>
            </span>
            <span className="flex items-center gap-3">
              <span className="tabular font-semibold text-barn">{centsToUSD(s.price_cents)}</span>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => deleteService(businessId, s.id), "Service removed")}
                className="text-stone hover:text-barn"
                aria-label={`Delete ${s.name}`}
              >
                <Icon name="trash" />
              </button>
            </span>
          </li>
        ))}
        {!services.length && (
          <li className="rounded-lg border-2 border-dashed border-navy/20 p-8 text-center text-stone">
            No services yet — add what you offer with prices.
          </li>
        )}
      </ul>
    </div>
  );
}

/* ---------------- Coupons ---------------- */
export function CouponsManager({
  businessId,
  coupons,
}: {
  businessId: string;
  coupons: {
    id: string;
    title: string;
    description: string | null;
    discount_type: "percent" | "amount";
    discount_value: number;
    is_active: boolean;
    ends_at: string | null;
  }[];
}) {
  const { pending, run, msg } = useAction();
  return (
    <div className="max-w-3xl space-y-6">
      <form
        className="card grid gap-3 p-5 sm:grid-cols-2"
        action={(fd) => run(() => addCoupon(businessId, fd), "Coupon added ✓")}
      >
        <div className="sm:col-span-2">
          <Field label="Coupon headline" name="title" required placeholder='e.g. "20% off any plate"' />
        </div>
        <label className="block">
          <span className="mb-1 block font-sans text-small font-bold text-navy">
            Type
          </span>
          <select name="discount_type" className="h-12 w-full rounded-md border-[1.5px] border-navy/15 bg-linen px-3 text-navy">
            <option value="percent">Percent off (%)</option>
            <option value="amount">Dollars off ($)</option>
          </select>
        </label>
        <Field label="Value" name="discount_value" required inputMode="decimal" placeholder="20" />
        <Field label="Ends (optional)" name="ends_at" type="date" />
        <div className="flex items-end">
          <button type="submit" disabled={pending} className="btn btn-gold w-full">
            <Icon name="tag" /> Create coupon
          </button>
        </div>
      </form>
      <Msg msg={msg} />
      <ul className="space-y-3">
        {coupons.map((c) => (
          <li key={c.id} className="card flex flex-wrap items-center justify-between gap-3 border-2 border-dashed border-barn/40 px-4 py-3">
            <span>
              <span className="font-heading text-h3 text-barn">
                {c.discount_type === "percent"
                  ? `${c.discount_value}% OFF`
                  : `${centsToUSD(c.discount_value)} OFF`}
              </span>
              <span className="ml-3 font-semibold text-navy">{c.title}</span>
              {c.ends_at && (
                <span className="ml-2 text-small text-stone">
                  ends {new Date(c.ends_at).toLocaleDateString("en-US")}
                </span>
              )}
            </span>
            <span className="flex items-center gap-3">
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => toggleCoupon(businessId, c.id, !c.is_active))}
                className={`rounded-full px-3 py-1 font-sans text-xs font-bold ${
                  c.is_active ? "bg-success/15 text-success" : "bg-stone/15 text-stone"
                }`}
              >
                {c.is_active ? "Active" : "Paused"}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => deleteCoupon(businessId, c.id), "Coupon removed")}
                className="text-stone hover:text-barn"
                aria-label={`Delete ${c.title}`}
              >
                <Icon name="trash" />
              </button>
            </span>
          </li>
        ))}
        {!coupons.length && (
          <li className="rounded-lg border-2 border-dashed border-navy/20 p-8 text-center text-stone">
            No coupons yet — a simple deal brings people through the door.
          </li>
        )}
      </ul>
    </div>
  );
}
