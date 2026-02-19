import { Navbar } from '@/components/loomi/Navbar';
import { Hero } from '@/components/loomi/Hero';
import { Stats } from '@/components/loomi/stats';
import { HowItWorks } from '@/components/loomi/how-it-works';
import { InteractiveDemo } from '@/components/loomi/interactive-demo';
import { DashboardPreview } from '@/components/loomi/dashboard-preview';
import { UseCases } from '@/components/loomi/use-cases';
import { MetaLoop } from '@/components/loomi/meta-loop';
import { Integrations } from '@/components/loomi/integrations';
import { Pricing } from '@/components/loomi/Pricing';
import { Testimonials } from '@/components/loomi/Testimonials';
import { CTA } from '@/components/loomi/cta';
import { Footer } from '@/components/loomi/Footer';
import { LoadingScreen } from '@/components/ui/loading-screen';

function SectionDivider() {
  return (
    <div className="max-w-5xl mx-auto px-4">
      <div className="border-t border-dashed border-border" />
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <LoadingScreen />
      <main className="min-h-screen bg-background">
        <Navbar />
        <Hero />
        <SectionDivider />
        <Stats />
        <SectionDivider />
        <HowItWorks />
        <SectionDivider />
        <InteractiveDemo />
        <SectionDivider />
        <DashboardPreview />
        <SectionDivider />
        <UseCases />
        <SectionDivider />
        <MetaLoop />
        <SectionDivider />
        <Integrations />
        <SectionDivider />
        <Pricing />
        <SectionDivider />
        <Testimonials />
        <SectionDivider />
        <CTA />
        <Footer />
      </main>
    </>
  );
}
