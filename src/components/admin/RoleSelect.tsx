"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setUserRole } from "@/lib/actions/admin";
import { Select } from "./Select";
import { useToast } from "./Toast";

const ROLES = ["customer", "business_owner", "admin"] as const;

export function RoleSelect({ userId, role }: { userId: string; role: string }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  return (
    <Select
      defaultValue={role}
      disabled={pending}
      aria-label="User role"
      onChange={(e) =>
        start(async () => {
          const value = e.target.value as (typeof ROLES)[number];
          const res = await setUserRole(userId, value);
          if (res.ok) toast("success", `Role set to ${value.replace("_", " ")}.`);
          else toast("error", res.error ?? "Failed to update role.");
          router.refresh();
        })
      }
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {r.replace("_", " ")}
        </option>
      ))}
    </Select>
  );
}
