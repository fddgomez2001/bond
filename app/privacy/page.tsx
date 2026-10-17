import type { Metadata } from "next";
import { LegalBody, privacyPolicy } from "@/components/legal/legal-content";
import { LegalPage } from "@/components/layout/legal-page";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage title={privacyPolicy.title}>
      <LegalBody doc={privacyPolicy} />
    </LegalPage>
  );
}
