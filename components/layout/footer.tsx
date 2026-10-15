import Link from "next/link";
import { cacheLife } from "next/cache";
import { Logo } from "@/components/brand/logo";
import { siteConfig } from "@/lib/config/site";
import { NewsletterForm } from "./newsletter-form";
import { FacebookIcon, InstagramIcon, LinkedInIcon, XIcon } from "./social-icons";

const columns = [
  {
    title: "Company",
    links: [
      { label: "About BOND", href: "/#about" },
      { label: "Events", href: "/#events" },
      { label: "Pricing", href: "/#pricing" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Contact Us", href: "/#contact" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Log in", href: "/login" },
      { label: "Join as a Customer", href: "/signup/customer" },
      { label: "Register as a Vendor", href: "/signup/vendor" },
    ],
  },
];

const socials = [
  { label: "Facebook", href: siteConfig.social.facebook, Icon: FacebookIcon },
  { label: "X (Twitter)", href: siteConfig.social.twitter, Icon: XIcon },
  { label: "Instagram", href: siteConfig.social.instagram, Icon: InstagramIcon },
  { label: "LinkedIn", href: siteConfig.social.linkedin, Icon: LinkedInIcon },
];

async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}

export function Footer() {
  return (
    <footer className="bg-bond-yellow text-bond-slate">
      <div className="mx-auto max-w-7xl px-4 pt-14 pb-8 sm:px-8 sm:pt-16 sm:pb-10 lg:px-10">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-12">
          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title} className="lg:col-span-2 xl:col-span-2">
              <p className="text-lg font-semibold capitalize">{column.title}</p>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="inline-block text-[0.95rem] text-bond-slate/70 transition-[color,transform] duration-300 ease-smooth hover:translate-x-0.5 hover:text-bond-slate sm:text-base"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="col-span-2 sm:col-span-3 lg:col-span-5 lg:col-start-8 xl:col-span-4 xl:col-start-9">
            <Logo tone="light" />
            <p className="mt-5 text-lg font-semibold">Subscribe to our Newsletter</p>
            <NewsletterForm />
            <p className="mt-4 text-sm text-bond-slate/70">
              {siteConfig.contact.email} · {siteConfig.contact.phone}
            </p>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center gap-5 sm:flex-row">
          <span aria-hidden className="hidden h-px flex-1 bg-[#888888] sm:block" />
          <p className="text-xs text-bond-slate/60">
            © Copyright {siteConfig.name} <CopyrightYear />. All rights reserved.
          </p>
          <ul className="flex items-center gap-5 text-bond-slate/60">
            {socials.map(({ label, href, Icon }) => (
              <li key={label}>
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="inline-block transition-[color,transform] duration-300 ease-smooth hover:-translate-y-0.5 hover:text-bond-slate"
                  >
                    <Icon className="size-5" />
                  </a>
                ) : (
                  <span title={`${label} — coming soon`}>
                    <Icon className="size-5" />
                    <span className="sr-only">{label} (coming soon)</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
          <span aria-hidden className="hidden h-px flex-1 bg-[#888888] sm:block" />
        </div>
      </div>
    </footer>
  );
}
