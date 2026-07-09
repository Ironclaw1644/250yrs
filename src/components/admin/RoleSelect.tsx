"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setUserRole } from "@/lib/actions/admin";

const ROLES = ["customer", "business_owner", "admin"] as const;

export function RoleSelect({ userId, role }: { userId: string; role: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <select
      defaultValue={role}
      disabled={pending}
      onChange={(e) =>
        start(async () => {
          const res = await setUserRole(
            userId,
            e.target.value as (typeof ROLES)[number],
          );
          if (!res.ok) alert(res.error ?? "Failed");
          router.refresh();
        })
      }
      className="h-8 rounded-md border border-hairline bg-slate-2 px-2 text-xs uppercase text-cloud focus:border-gold focus:outline-none"
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {r.replace("_", " ")}
        </option>
      ))}
    </select>
  );
}
