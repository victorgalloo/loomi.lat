import { Navbar } from '@/components/loomi/Navbar';
import { Hero } from '@/components/loomi/Hero';
import { Stats } from '@/components/loomi/stats';
import { HowItWorks } from '@/components/loomi/how-it-works';
import { InteractiveDemo } from '@/components/loomi/interactive-demo';
import { MetaLoop } from '@/components/loomi/meta-loop';
import { Pricing } from '@/components/loomi/Pricing';
import { Testimonials } from '@/components/loomi/Testimonials';
import { CTA } from '@/components/loomi/cta';
import { Footer } from '@/components/loomi/Footer';
import { LoadingScreen } from '@/components/ui/loading-screen';

export default function HomePage() {
  return (
    <>
      <LoadingScreen />
      <main className="min-h-screen bg-background">
        <Navbar />
        <Hero />
        <Stats />
        <HowItWorks />
        <InteractiveDemo />
        <MetaLoop />
        <Pricing />
        <Testimonials />
        <CTA />
        <Footer />
      </main>
    </>
  );
}
