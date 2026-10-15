import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/legal-page";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <p>
        These terms will describe the rules for using BOND as a customer or a vendor. The official terms
        have not been published yet.
      </p>
      <h2>Accounts</h2>
      <p>
        You are responsible for keeping your login details secure and for the information you provide
        when registering.
      </p>
      <h2>Vendor applications</h2>
      <p>
        Vendor accounts are subject to a review of the submitted documents. Registering does not
        guarantee approval.
      </p>
      <h2>Contact</h2>
      <p>Questions about these terms can be sent to {siteConfig.contact.email}.</p>
    </LegalPage>
  );
}
