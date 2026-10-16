import { Suspense } from "react";
import { AboutSection } from "@/components/home/about-section";
import { ContactSection } from "@/components/home/contact-section";
import { FaqSection } from "@/components/home/faq-section";
import { FeaturedEvents } from "@/components/home/featured-events";
import { HeroSection } from "@/components/home/hero-section";
import { HomeEnterEffects } from "@/components/home/home-enter-effects";
import { PricingSection } from "@/components/home/pricing-section";
import { Footer } from "@/components/layout/footer";
import { GuestActions, NavAuthActions } from "@/components/layout/nav-auth-actions";
import { Navbar } from "@/components/layout/navbar";
import { PageTransition } from "@/components/ui/page-transition";

export default function HomePage() {
  return (
    <>
      <Navbar
        actions={
          // The page itself is static; only the login state streams in.
          <Suspense fallback={<GuestActions />}>
            <NavAuthActions />
          </Suspense>
        }
      />
      <HomeEnterEffects />
      <PageTransition>
        <main className="flex-1">
          <HeroSection />
          <FeaturedEvents />
          <AboutSection />
          <PricingSection />
          <FaqSection />
          <ContactSection />
        </main>
      </PageTransition>
      <Footer />
    </>
  );
}
