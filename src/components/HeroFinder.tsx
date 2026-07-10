"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";
import type { GeoTree } from "@/lib/queries";
import type { Category } from "@/lib/brand";

/**
 * The mockup's cascading finder: Country → State → City → Category → Search.
 * Geo data is preloaded (tiny today). Once cities exceed ~200, switch to
 * fetching cities per state from an /api/geo route instead.
 */
export function HeroFinder({
  geo,
  categories,
}: {
  geo: GeoTree;
  categories: Category[];
}) {
  const router = useRouter();
  // Default to the home market, not the first country alphabetically.
  const [countryId, setCountryId] = useState(
    (geo.countries.find((c) => c.slug === "us") ?? geo.countries[0])?.id ?? "",
  );
  const [stateId, setStateId] = useState("");
  const [cityId, setCityId] = useState("");
  const [category, setCategory] = useState("");

  const country = useMemo(
    () => geo.countries.find((c) => c.id === countryId) ?? null,
    [geo, countryId],
  );
  const state = useMemo(
    () => country?.states.find((s) => s.id === stateId) ?? null,
    [country, stateId],
  );
  const city = useMemo(
    () => state?.cities.find((ci) => ci.id === cityId) ?? null,
    [state, cityId],
  );

  function go() {
    const parts = [
      country?.slug,
      state?.slug,
      city && state ? city.slug : undefined,
      city && state && category ? category : undefined,
    ].filter(Boolean);
    if (parts.length === 0) {
      router.push(category ? `/categories/${category}` : "/us");
      return;
    }
    // Category without full geo → national category page
    if (!city && category) {
      router.push(`/categories/${category}`);
      return;
    }
    router.push("/" + parts.join("/"));
  }

  const selectCls =
    "h-12 w-full min-w-0 rounded-md border-[1.5px] border-navy/15 bg-paper-raised px-3 font-sans text-body text-navy focus:border-gold focus:outline-none focus:ring-4 focus:ring-gold/25 disabled:opacity-50";

  return (
    <div className="rounded-xl bg-paper/95 p-3 shadow-raised backdrop-blur sm:p-4">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
        <label className="block">
          <span className="mb-1 block text-left font-sans text-xs font-bold text-stone">
            Country
          </span>
          <select
            className={selectCls}
            value={countryId}
            onChange={(e) => {
              setCountryId(e.target.value);
              setStateId("");
              setCityId("");
            }}
          >
            {geo.countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-left font-sans text-xs font-bold text-stone">
            State
          </span>
          <select
            className={selectCls}
            value={stateId}
            disabled={!country}
            onChange={(e) => {
              setStateId(e.target.value);
              setCityId("");
            }}
          >
            <option value="">All states</option>
            {country?.states.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-left font-sans text-xs font-bold text-stone">
            City
          </span>
          <select
            className={selectCls}
            value={cityId}
            disabled={!state}
            onChange={(e) => setCityId(e.target.value)}
          >
            <option value="">All cities</option>
            {state?.cities.map((ci) => (
              <option key={ci.id} value={ci.id}>
                {ci.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-left font-sans text-xs font-bold text-stone">
            Category
          </span>
          <select
            className={selectCls}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={go}
          className="btn btn-gold self-end !min-h-12 w-full lg:w-auto"
        >
          <Icon name="magnifying-glass" /> Search
        </button>
      </div>
    </div>
  );
}
