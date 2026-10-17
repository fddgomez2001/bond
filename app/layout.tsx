import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Outfit, Poppins, Wix_Madefor_Display } from "next/font/google";
import { VisitTracker } from "@/components/analytics/visit-tracker";
import { Toaster } from "@/components/ui/toaster";
import { siteConfig } from "@/lib/config/site";
import "./globals.css";

// "Blauer Nue" from the design is a commercial font; Outfit is the closest
// free geometric match. Swap it here once you have a licence for Blauer Nue.
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const wix = Wix_Madefor_Display({
  variable: "--font-wix",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  appleWebApp: { title: siteConfig.name, statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#f0ce49",
  width: "device-width",
  initialScale: 1,
};

/**
 * Runs before first paint:
 *  - data-js lets scroll-reveal hide content only when JS can show it again;
 *  - data-hero-seen skips the hero entrance after the first visit in a tab.
 */
const bootScript = `(function(){var d=document.documentElement;d.setAttribute('data-js','');try{if(sessionStorage.getItem('bond-hero-seen'))d.setAttribute('data-hero-seen','')}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // Smooth scrolling stays for in-page links (#faq), but Next.js turns it
      // off while changing pages so a new page never visibly scrolls to the top.
      data-scroll-behavior="smooth"
      // The boot script adds attributes before React hydrates.
      suppressHydrationWarning
      className={`${outfit.variable} ${poppins.variable} ${wix.variable} h-full`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        {children}
        {/* usePathname() inside reads the URL, so it needs its own boundary. */}
        <Suspense fallback={null}>
          <Toaster />
          <VisitTracker />
        </Suspense>
      </body>
    </html>
  );
}
