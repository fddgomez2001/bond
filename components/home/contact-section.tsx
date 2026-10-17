import { siteConfig } from "@/lib/config/site";
import { Reveal } from "@/components/ui/reveal";
import { ContactForm } from "./contact-form";

export function ContactSection() {
  return (
    <section id="contact" className="border-t border-white/5 bg-black py-16 sm:py-24 lg:py-28">
      <div className="mx-auto grid grid-cols-1 max-w-7xl gap-12 px-4 sm:px-8 lg:grid-cols-12 lg:gap-16 lg:px-10">
        <Reveal className="lg:col-span-6">
          <span className="inline-flex rounded-xl border border-white/25 bg-white/5 px-5 py-1.5 font-heading text-sm font-medium text-white/80">
            Contacts
          </span>
          <h2 className="mt-6 font-heading text-4xl leading-tight font-bold text-white sm:text-[2.75rem]">
            Ask whatever you have in your mind
          </h2>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-white/80">
            Whether you have questions or are ready to discuss your business, we&apos;re here to help.
            Reach out today.
          </p>
          <dl className="mt-8 space-y-2 text-sm text-white/65">
            <div>
              <dt className="inline font-semibold text-white/85">Email: </dt>
              <dd className="inline">{siteConfig.contact.email}</dd>
            </div>
            <div>
              <dt className="inline font-semibold text-white/85">Phone: </dt>
              <dd className="inline">{siteConfig.contact.phone}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-white/40">Contact details are placeholders until launch.</p>
        </Reveal>
        <Reveal className="lg:col-span-6" delay={140}>
          <ContactForm />
        </Reveal>
      </div>
    </section>
  );
}
