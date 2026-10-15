/**
 * PROVISIONAL homepage copy. Questions follow the design file; answers only
 * describe what Phase 1 actually does. Update once the official business
 * details are confirmed.
 */

export const faqs = [
  {
    question: "How do I grow my business with BOND?",
    answer:
      "Register as a vendor and submit your selfie, government ID and proof of business. Once the BOND team reviews and approves your documents, vendor tools will become available to you.",
  },
  {
    question: "Can I cancel my subscription?",
    answer:
      "Paid plans aren't available yet — creating an account is free. When plans launch, their cancellation terms will be published here before you're asked to pay.",
  },
  {
    question: "How do I contact the support?",
    answer:
      "Use the contact form on this page or email the address listed in the footer. We'll get back to you as soon as we can.",
  },
  {
    question: "Is a credit card required?",
    answer: "No. Signing up for BOND doesn't require a credit card or any payment details.",
  },
] as const;

/** SAMPLE plans from the design file — pricing is not final. */
export const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    cta: { label: "Get started for free", href: "/signup/customer" },
    features: [
      "Create your BOND account",
      "Discover events and experiences",
      "Access to the stores for order (coming soon)",
    ],
    highlighted: false,
  },
  {
    name: "Plus",
    price: "TBA",
    period: "",
    cta: null,
    features: [
      "Calendar reminders for important events, sent by email",
      "Up to three scheduled email greetings to people you choose",
      "Access to the stores for order",
      "Free birthday gift",
      "Higher discounts from stores",
    ],
    highlighted: true,
  },
] as const;

/** PLACEHOLDER team members — replace with real names and photos. */
export const teamPlaceholders = [
  { initials: "B", tone: "bg-bond-slate text-white" },
  { initials: "O", tone: "bg-white text-bond-slate" },
  { initials: "N", tone: "bg-bond-amber text-white" },
  { initials: "D", tone: "bg-bond-slate-light text-white" },
] as const;
