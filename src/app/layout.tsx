import type { Metadata } from "next";
import { Alfa_Slab_One, Oswald, Public_Sans, Spline_Sans_Mono } from "next/font/google";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import "./globals.css";

import { brand, siteUrl } from "@/lib/brand";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";

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
    images: [{ url: "/images/marketing/og.jpg", width: 1200, height: 630, alt: brand.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: brand.name,
    description: brand.shortPitch,
    images: ["/images/marketing/og.jpg"],
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
        {children}
      </body>
    </html>
  );
}
