"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  deleteProductImage,
  saveProduct,
  saveSizes,
  setPrimaryImage,
  uploadProductImage,
} from "@/lib/actions/admin";
import type { AdminProduct } from "@/lib/admin-queries";
import type { CategoryRow } from "@/lib/store-types";
import { sizeLabel } from "@/lib/store-types";

const inputCls =
  "w-full rounded-xl border border-white/12 bg-black/30 px-4 py-2.5 text-brand-cream placeholder:text-white/35 focus:border-brand-gold/60 focus:outline-none";
const labelCls = "grid gap-1.5 text-sm text-white/65";

export function ProductForm({
  product,
  categories,
}: {
  product: AdminProduct | null;
  categories: CategoryRow[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [sizeRows, setSizeRows] = useState(
    product?.sizes.map((s) => ({ id: s.id as string | null, size: s.size, inv: s.inventory?.toString() ?? "" })) ?? [],
  );

  function submit(fd: FormData) {
    start(async () => {
      setMsg(null);
      const res = await saveProduct(product?.id ?? null, fd);
      if (!res.ok) return setMsg(res.error ?? "Save failed.");
      setMsg("Saved.");
      if (!product && res.id) router.replace(`/admin/products/${res.id}`);
      router.refresh();
    });
  }

  function submitSizes() {
    if (!product) return;
    start(async () => {
      const fd = new FormData();
      sizeRows.forEach((r, i) => {
        if (!r.size.trim()) return;
        fd.set(`size_${i}`, r.size.trim());
        fd.set(`inv_${i}`, r.inv);
      });
      const res = await saveSizes(product.id, fd);
      setMsg(res.ok ? "Sizes saved." : res.error ?? "Failed.");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr] xl:items-start">
      <form action={submit} className="space-y-4 rounded-2xl border border-white/8 bg-white/5 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelCls}>
            <span>Name</span>
            <input name="name" defaultValue={product?.name ?? ""} required className={inputCls} />
          </label>
          <label className={labelCls}>
            <span>Price (USD)</span>
            <input
              name="price"
              type="number"
              step="0.01"
              min="1"
              defaultValue={product ? (product.price_cents / 100).toString() : ""}
              required
              className={inputCls}
            />
          </label>
        </div>
        <label className={labelCls}>
          <span>Subtitle</span>
          <input name="subtitle" defaultValue={product?.subtitle ?? ""} className={inputCls} />
        </label>
        <label className={labelCls}>
          <span>Description</span>
          <textarea name="description" rows={4} defaultValue={product?.description ?? ""} className={inputCls} />
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className={labelCls}>
            <span>Status</span>
            <select name="status" defaultValue={product?.status ?? "active"} className={inputCls}>
              <option value="active">active</option>
              <option value="sold">sold</option>
              <option value="draft">draft</option>
            </select>
          </label>
          <label className={labelCls}>
            <span>Category</span>
            <select name="category_id" defaultValue={product?.category_id ?? ""} className={inputCls}>
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className={labelCls}>
            <span>Badge</span>
            <input name="badge" defaultValue={product?.badge ?? ""} className={inputCls} />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className={labelCls}>
            <span>Product inventory (blank = untracked)</span>
            <input name="inventory" type="number" min="0" defaultValue={product?.inventory?.toString() ?? ""} className={inputCls} />
          </label>
          <label className={labelCls}>
            <span>Sort order</span>
            <input name="sort_order" type="number" defaultValue={product?.sort_order ?? 0} className={inputCls} />
          </label>
          <label className={labelCls}>
            <span>Release note</span>
            <input name="release_note" defaultValue={product?.release_note ?? ""} className={inputCls} />
          </label>
        </div>
        <div className="flex flex-wrap gap-6 pt-1 text-sm text-white/70">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="featured" defaultChecked={product?.featured} className="h-4 w-4 accent-[#c7a46a]" />
            Featured
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="hidden" defaultChecked={product?.hidden} className="h-4 w-4 accent-[#c7a46a]" />
            Hidden
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="free_shipping" defaultChecked={product?.free_shipping} className="h-4 w-4 accent-[#c7a46a]" />
            Free shipping
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelCls}>
            <span>SEO title</span>
            <input name="seo_title" defaultValue={product?.seo_title ?? ""} className={inputCls} />
          </label>
          <label className={labelCls}>
            <span>SEO description</span>
            <input name="seo_description" defaultValue={product?.seo_description ?? ""} className={inputCls} />
          </label>
        </div>
        {msg && <p className="text-sm text-brand-gold">{msg}</p>}
        <button type="submit" disabled={pending} className="button-primary disabled:opacity-60">
          {pending ? "Saving…" : product ? "Save product" : "Create product"}
        </button>
      </form>

      {product && (
        <div className="space-y-6">
          {/* Images */}
          <div className="rounded-2xl border border-white/8 bg-white/5 p-5">
            <p className="eyebrow">Images</p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {product.images.map((img) => (
                <div key={img.id} className="group relative aspect-[4/5] overflow-hidden rounded-lg bg-black/30">
                  <Image src={img.public_url} alt="" fill sizes="120px" className="object-cover" />
                  {img.is_primary && (
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-brand-gold px-2 py-0.5 text-[10px] font-bold text-brand-obsidian">
                      primary
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/70 p-1.5 opacity-0 transition group-hover:opacity-100">
                    {!img.is_primary && (
                      <button
                        type="button"
                        className="text-[11px] text-brand-gold"
                        onClick={() =>
                          start(async () => {
                            await setPrimaryImage(product.id, img.id);
                            router.refresh();
                          })
                        }
                      >
                        Primary
                      </button>
                    )}
                    <button
                      type="button"
                      className="ml-auto text-[11px] text-brand-rust"
                      onClick={() =>
                        start(async () => {
                          await deleteProductImage(img.id);
                          router.refresh();
                        })
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const fd = new FormData();
                fd.set("file", f);
                start(async () => {
                  const res = await uploadProductImage(product.id, fd);
                  setMsg(res.ok ? "Image uploaded." : res.error ?? "Upload failed.");
                  router.refresh();
                });
                e.target.value = "";
              }}
            />
            <button
              type="button"
              disabled={pending}
              onClick={() => fileRef.current?.click()}
              className="button-secondary mt-4 w-full text-center disabled:opacity-60"
            >
              {pending ? "Working…" : "Upload image"}
            </button>
          </div>

          {/* Sizes + inventory */}
          <div className="rounded-2xl border border-white/8 bg-white/5 p-5">
            <p className="eyebrow">Sizes & inventory</p>
            <p className="mt-1 text-xs text-white/45">
              Blank inventory = untracked. Sets use prefixes: garment:M, shoe:us_10.
            </p>
            <div className="mt-4 space-y-2">
              {sizeRows.map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={r.size}
                    onChange={(e) =>
                      setSizeRows((rows) => rows.map((x, j) => (j === i ? { ...x, size: e.target.value } : x)))
                    }
                    placeholder="Size (e.g. M)"
                    className={`${inputCls} flex-1`}
                  />
                  <input
                    value={r.inv}
                    onChange={(e) =>
                      setSizeRows((rows) => rows.map((x, j) => (j === i ? { ...x, inv: e.target.value } : x)))
                    }
                    placeholder="Qty"
                    type="number"
                    min="0"
                    className={`${inputCls} w-24`}
                  />
                  <button
                    type="button"
                    onClick={() => setSizeRows((rows) => rows.filter((_, j) => j !== i))}
                    className="shrink-0 text-white/40 hover:text-brand-rust"
                    aria-label={`Remove ${sizeLabel(r.size)}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-3">
              <button
                type="button"
                onClick={() => setSizeRows((rows) => [...rows, { id: null, size: "", inv: "" }])}
                className="button-secondary flex-1 text-center"
              >
                Add size
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={submitSizes}
                className="button-primary flex-1 text-center disabled:opacity-60"
              >
                Save sizes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
