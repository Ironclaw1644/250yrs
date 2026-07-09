import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
import { ContactForm } from "@/components/ContactForm";
import { getSetting } from "@/lib/content";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Questions about a listing, advertising, or your account? Get in touch with the True American Where team.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const email = await getSetting("site.contact_email", brand.email);
  const phone = await getSetting("site.contact_phone", "");

  return (
    <div className="container-shell max-w-4xl py-10">
      <p className="eyebrow">Contact</p>
      <h1 className="font-heading text-h1 text-navy">Talk to a real person</h1>
      <p className="mt-2 max-w-2xl text-lead text-stone">
        Questions about a listing, advertising your business, or your account?
        Send us a note.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <ContactForm />
        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="flex items-center gap-2 font-heading text-h3 text-navy">
              <Icon name="envelope" className="text-gold" /> Email
            </h2>
            <a href={`mailto:${email}`} className="mt-2 block text-barn underline">
              {email}
            </a>
          </div>
          {phone && (
            <div className="card p-6">
              <h2 className="flex items-center gap-2 font-heading text-h3 text-navy">
                <Icon name="phone" className="text-gold" /> Phone
              </h2>
              <a href={`tel:${phone.replace(/[^0-9+]/g, "")}`} className="tabular mt-2 block text-navy">
                {phone}
              </a>
            </div>
          )}
          <div className="card p-6">
            <h2 className="flex items-center gap-2 font-heading text-h3 text-navy">
              <Icon name="bullhorn" className="text-gold" /> Business owners
            </h2>
            <p className="mt-2 text-small text-stone">
              Want your shop listed?{" "}
              <a href="/advertise" className="font-semibold text-barn underline">
                Start here
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
