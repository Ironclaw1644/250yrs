import type { Metadata } from "next";
import { legalHtml, legalUpdated } from "@/content/legal";

export const metadata: Metadata = {
  title: "Policies & Legal",
  description:
    "Terms of Service, Privacy Policy, Cookie Policy, Advertiser Terms, Marketplace & Payments Terms, Refunds, and more for True American Where.",
  alternates: { canonical: "/legal" },
};

export default function LegalPage() {
  return (
    <div className="container-shell py-10">
      <p className="eyebrow">Legal</p>
      <h1 className="font-heading text-h1 text-navy">Policies &amp; Legal</h1>
      <p className="mt-2 max-w-2xl text-stone">
        Last updated {legalUpdated}. These are working templates provided for
        convenience — have a licensed attorney review them before relying on
        them for your business.
      </p>
      <article
        className="legal-prose mt-8 max-w-3xl"
        dangerouslySetInnerHTML={{ __html: legalHtml }}
      />
    </div>
  );
}
