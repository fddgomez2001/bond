import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { PageTransition } from "@/components/ui/page-transition";
import { ShopForm } from "@/components/vendor/shop-form";
import { WorkspaceContent, WorkspaceHeader } from "@/components/workspace/page-header";
import { mediaUrl } from "@/lib/marketplace/media";
import { getMyShop, requireApprovedVendor } from "@/lib/marketplace/vendor-data";

export const metadata: Metadata = { title: "Shop settings" };

export default async function VendorShopPage() {
  await requireApprovedVendor();
  const shop = await getMyShop();

  return (
    <PageTransition>
      <main className="flex flex-1 flex-col">
        <WorkspaceHeader
          eyebrow="Vendor · Shop"
          title={shop ? "Shop settings" : "Set up your shop"}
          description={
            shop
              ? "This is what customers see on your shop page and shop card."
              : "Customers browse shops, then pick from each shop's gifts, surprises and services."
          }
          actions={
            shop ? (
              <Link href={`/shops/${shop.slug}`} transitionTypes={["nav-forward"]} className={buttonClasses({ variant: "primary" })}>
                View my shop
                <ExternalLink className="size-3.5 opacity-70" aria-hidden />
              </Link>
            ) : null
          }
        />
        <WorkspaceContent>
          <ShopForm shop={shop} logoUrl={mediaUrl(shop?.logo_path)} />
        </WorkspaceContent>
      </main>
    </PageTransition>
  );
}
