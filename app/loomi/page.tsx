import { Navbar } from '@/components/loomi/Navbar';
import { Hero } from '@/components/loomi/Hero';
import { Stats } from '@/components/loomi/stats';
import { BentoFeatures } from '@/components/loomi/bento-features';
import { InteractiveDemo } from '@/components/loomi/interactive-demo';
import { HowItWorks } from '@/components/loomi/how-it-works';
import { Pricing } from '@/components/loomi/Pricing';
import { Testimonials } from '@/components/loomi/Testimonials';
import { CTA } from '@/components/loomi/cta';
import { Footer } from '@/components/loomi/Footer';
import { LoadingScreen } from '@/components/ui/loading-screen';

export default function LoomiPage() {
  return (
    <>
      <LoadingScreen />
      <main className="min-h-screen bg-background">
        <Navbar />
        <Hero />
        <HowItWorks />
        <Stats />
        <BentoFeatures />
        <InteractiveDemo />
        <Pricing />
        <Testimonials />
        <CTA />
        <Footer />
      </main>
    </>
  );
}
