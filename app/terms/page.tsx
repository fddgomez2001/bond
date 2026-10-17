import type { Metadata } from "next";
import { LegalBody, termsOfService } from "@/components/legal/legal-content";
import { LegalPage } from "@/components/layout/legal-page";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalPage title={termsOfService.title}>
      <LegalBody doc={termsOfService} />
    </LegalPage>
  );
}
