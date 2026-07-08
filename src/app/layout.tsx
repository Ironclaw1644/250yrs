import type { Metadata } from "next";
import { Alfa_Slab_One, Oswald, Public_Sans, Spline_Sans_Mono } from "next/font/google";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import "./globals.css";

import { brand, siteUrl } from "@/lib/brand";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

// We import the FA stylesheet ourselves; stop it auto-injecting a second copy.
config.autoAddCss = false;

const display = Alfa_Slab_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const heading = Oswald({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});
const body = Public_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
const mono = Spline_Sans_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${brand.name} — Find the Real Local Stores`,
    template: `%s | ${brand.name}`,
  },
  description: brand.shortPitch,
  alternates: { canonical: "/" },
  icons: { icon: "/brand/favicon.png", apple: "/brand/favicon.png" },
  openGraph: {
    title: brand.name,
    description: brand.shortPitch,
    url: siteUrl,
    siteName: brand.name,
    locale: "en_US",
    type: "website",
    images: [{ url: "/brand/logo.png", width: 1024, height: 1024, alt: brand.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: brand.name,
    description: brand.shortPitch,
    images: ["/brand/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${heading.variable} ${body.variable} ${mono.variable}`}
      >
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
