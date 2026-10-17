import type { ReactNode } from "react";
import { siteConfig } from "@/lib/config/site";

/**
 * The Terms of Service and Privacy Policy text, shared by the full pages
 * (/terms, /privacy) and the pop-up on the registration forms, so both
 * always say the same thing. PLACEHOLDER — replace with the official text.
 */
export type LegalDoc = {
  href: "/terms" | "/privacy";
  title: string;
  intro: ReactNode;
  sections: { heading: string; body: ReactNode }[];
};

export const termsOfService: LegalDoc = {
  href: "/terms",
  title: "Terms of Service",
  intro: (
    <>
      These terms will describe the rules for using BOND as a customer or a vendor. The official terms have not been
      published yet.
    </>
  ),
  sections: [
    {
      heading: "Accounts",
      body: "You are responsible for keeping your login details secure and for the information you provide when registering.",
    },
    {
      heading: "Vendor applications",
      body: "Vendor accounts are subject to a review of the submitted documents. Registering does not guarantee approval.",
    },
    { heading: "Contact", body: <>Questions about these terms can be sent to {siteConfig.contact.email}.</> },
  ],
};

export const privacyPolicy: LegalDoc = {
  href: "/privacy",
  title: "Privacy Policy",
  intro: (
    <>
      This page will explain how BOND collects, uses, and protects personal information. The summary below describes
      how the current version of the platform handles data and will be replaced by the official policy.
    </>
  ),
  sections: [
    {
      heading: "Information we collect",
      body: "When you register we collect your first and last name, birthdate, contact number, and email address. Vendors also upload a selfie, a valid government ID, and proof of business for review.",
    },
    {
      heading: "How documents are stored",
      body: "Identity and business documents are kept in private storage. They are not publicly accessible and can only be viewed by you and authorized BOND reviewers.",
    },
    {
      heading: "Site visits",
      body: "When you browse BOND we record which pages you open, your device type and model (when your browser shares it), your browser and operating system, and an approximate location (city and country). A random visitor ID cookie lets us count repeat visits. Sign-in attempts are logged with the email entered and whether they succeeded, to help protect accounts. We don't store IP addresses. Only BOND admins can see this information, and it is deleted after 90 days.",
    },
    {
      heading: "Passwords",
      body: "Passwords are handled by our authentication provider and are never stored in BOND's own database.",
    },
    { heading: "Contact", body: <>Questions about privacy can be sent to {siteConfig.contact.email}.</> },
  ],
};

export const legalNotice = "Placeholder — not legal advice. Replace with your official document before launch.";

/** The document's text. Headings are h2 on the full page and h3 inside the pop-up (whose title is the h2). */
export function LegalBody({ doc, headingLevel = 2 }: { doc: LegalDoc; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <>
      <p>{doc.intro}</p>
      {doc.sections.map((section) => (
        <section key={section.heading} className="space-y-2">
          <Heading className="font-heading text-xl font-bold text-bond-ink">{section.heading}</Heading>
          <p>{section.body}</p>
        </section>
      ))}
    </>
  );
}
