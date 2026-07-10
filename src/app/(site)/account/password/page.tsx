import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { UpdatePasswordForm } from "@/components/UpdatePasswordForm";

export const metadata: Metadata = { title: "Change password", robots: { index: false } };

export default async function ChangePasswordPage() {
  await requireUser("/account/password");
  return (
    <div className="container-shell max-w-md py-10">
      <Link href="/account" className="text-small text-stone hover:text-barn">
        ← Your account
      </Link>
      <h1 className="mt-2 font-heading text-h1 text-navy">Change password</h1>
      <p className="mb-6 mt-2 text-stone">
        Pick something only you know — at least 8 characters.
      </p>
      <UpdatePasswordForm />
    </div>
  );
}
