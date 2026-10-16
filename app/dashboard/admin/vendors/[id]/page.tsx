import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { VendorReview } from "@/components/admin/vendor-review";
import { PageTransition } from "@/components/ui/page-transition";
import { getVendorApplication } from "@/lib/admin/vendor-applications";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Review vendor application" };

export default async function VendorApplicationPage({ params }: PageProps<"/dashboard/admin/vendors/[id]">) {
  const [, { id }] = await Promise.all([requireRole("admin"), params]);
  if (!z.uuid().safeParse(id).success) notFound();

  const application = await getVendorApplication(id);
  if (!application) notFound();

  return (
    <PageTransition>
      <VendorReview application={application} />
    </PageTransition>
  );
}
