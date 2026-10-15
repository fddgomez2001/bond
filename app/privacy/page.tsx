import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/legal-page";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        This page will explain how BOND collects, uses, and protects personal information. The summary
        below describes how the current version of the platform handles data and will be replaced by the
        official policy.
      </p>
      <h2>Information we collect</h2>
      <p>
        When you register we collect your first and last name, birthdate, contact number, and email
        address. Vendors also upload a selfie, a valid government ID, and proof of business for review.
      </p>
      <h2>How documents are stored</h2>
      <p>
        Identity and business documents are kept in private storage. They are not publicly accessible and
        can only be viewed by you and authorized BOND reviewers.
      </p>
      <h2>Passwords</h2>
      <p>
        Passwords are handled by our authentication provider and are never stored in BOND&apos;s own
        database.
      </p>
      <h2>Contact</h2>
      <p>Questions about privacy can be sent to {siteConfig.contact.email}.</p>
    </LegalPage>
  );
}
