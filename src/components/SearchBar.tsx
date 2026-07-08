"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "./Icon";

export function SearchBar({
  size = "md",
  placeholder = "Find food, hair, tires near you",
}: {
  size?: "md" | "lg";
  placeholder?: string;
}) {
  const [q, setQ] = useState("");
  const router = useRouter();
  const lg = size === "lg";
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(q.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : "/us");
      }}
      className={`flex w-full items-center gap-2 rounded-full border-2 border-navy/15 bg-paper-raised pl-4 pr-1.5 shadow-card focus-within:border-gold ${
        lg ? "h-14" : "h-11"
      }`}
    >
      <Icon name="magnifying-glass" className="text-stone" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        aria-label="Search local businesses"
        className={`min-w-0 flex-1 bg-transparent font-sans text-navy placeholder:text-stone/70 focus:outline-none ${
          lg ? "text-lead" : "text-body"
        }`}
      />
      <button
        type="submit"
        className={`btn btn-primary shrink-0 rounded-full ${lg ? "!min-h-11 px-5" : "!min-h-8 px-4 text-small"}`}
      >
        <Icon name="magnifying-glass" />
        <span className={lg ? "" : "hidden sm:inline"}>Search</span>
      </button>
    </form>
  );
}
