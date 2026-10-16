/**
 * Site-wide copy and links. Everything marked PLACEHOLDER is provisional
 * content waiting for the official BOND details — edit it here and every
 * page picks it up.
 */

function resolveSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  // Vercel sets this automatically for production deployments.
  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProd) return `https://${vercelProd}`;
  return "http://localhost:3000";
}

export const siteConfig = {
  name: "BOND",
  tagline: "Bring people together",
  description:
    "BOND brings customers, vendors, and event communities together through a simple and accessible digital experience.",
  url: resolveSiteUrl(),

  // PLACEHOLDER contact details — replace before launch.
  contact: {
    email: "hello@bond.example",
    phone: "+00 000 000 0000",
    address: "Office address to be announced",
  },

  // PLACEHOLDER social profiles. Leave href empty to hide an icon.
  social: {
    facebook: "",
    twitter: "",
    instagram: "",
    linkedin: "",
  },

  phonePlaceholder: "e.g. +63 912 345 6789",

  /** All prices are shown in Philippine pesos. */
  currency: { code: "PHP", locale: "en-PH" },
} as const;

/** Homepage links. Items with a `section` scroll to it; the rest are separate pages. */
export const homeNav: { label: string; href: string; section?: string }[] = [
  { label: "Home", href: "/#home", section: "home" },
  { label: "Shops", href: "/shops" },
  { label: "Events", href: "/#events", section: "events" },
  { label: "About", href: "/#about", section: "about" },
  { label: "Pricing", href: "/#pricing", section: "pricing" },
  { label: "FAQ", href: "/#faq", section: "faq" },
  { label: "Contact", href: "/#contact", section: "contact" },
];
