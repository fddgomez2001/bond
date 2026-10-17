import { Reveal } from "@/components/ui/reveal";
import { faqs } from "@/lib/data/home-content";

/**
 * Accordion from the design. Native <details name="faq"> keeps only one
 * answer open at a time, works without JavaScript and is keyboard friendly.
 */
export function FaqSection() {
  return (
    <section id="faq" className="bg-bond-night-glow py-16 sm:py-24 lg:py-28">
      <div className="mx-auto grid grid-cols-1 max-w-7xl gap-12 px-4 sm:px-8 lg:grid-cols-12 lg:gap-16 lg:px-10">
        <Reveal className="lg:col-span-5">
          <h2 className="font-heading text-4xl leading-[1.05] font-bold text-white sm:text-[3.4rem]">
            Frequently Asked Questions
          </h2>
          <p className="mt-6 max-w-md font-heading text-lg leading-relaxed font-medium tracking-[-0.02em] text-white/85">
            Quick answers about accounts, vendors, and what&apos;s coming next on BOND.
          </p>
        </Reveal>

        <div className="space-y-4 lg:col-span-7">
          {faqs.map((faq, index) => (
            <Reveal key={faq.question} delay={index * 90}>
            <details
              name="faq"
              open={index === 0}
              className="faq-item group rounded-3xl bg-white px-5 py-5 transition-shadow duration-500 ease-smooth hover:shadow-[0_20px_50px_-25px_rgba(247,204,21,0.55)] sm:px-10 sm:py-8"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-xl [&::-webkit-details-marker]:hidden">
                <h3 className="text-lg font-bold text-bond-ink transition-colors duration-300 group-hover:text-bond-slate sm:text-2xl sm:leading-snug">
                  {faq.question}
                </h3>
                <span aria-hidden className="relative block size-5 shrink-0">
                  <span className="absolute top-1/2 left-0 h-1 w-5 -translate-y-1/2 rounded bg-bond-ink" />
                  <span className="absolute top-1/2 left-0 h-1 w-5 -translate-y-1/2 rotate-90 rounded bg-bond-ink transition-transform duration-500 ease-spring group-open:rotate-0" />
                </span>
              </summary>
              <p className="faq-answer pt-4 text-base leading-relaxed text-bond-ink/87 sm:text-justify">{faq.answer}</p>
            </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
