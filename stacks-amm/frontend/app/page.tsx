import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { CTASection } from "@/components/landing/cta-section";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col w-full">
      <Navbar />
      <main className=" w-full">
        <HeroSection />
        <section id="features" className="w-full">
          <FeaturesSection />
        </section>
        <section id="about" className="w-full">
          <CTASection />
        </section>
      </main>
      <Footer />
    </div>
  );
}
