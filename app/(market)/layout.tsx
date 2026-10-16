import type { ReactNode } from "react";
import { AppHeader, MarketFooter } from "@/components/marketplace/app-header";

/** Shops (public) and the customer's ordering pages share this header. */
export default function MarketLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-bond-paper">
      <AppHeader />
      {children}
      <MarketFooter />
    </div>
  );
}
