import Navbar from '@/components/Navbar';
import HeroVideoScroll from '@/components/HeroVideoScroll';
import FeatureGrid from '@/components/FeatureGrid';
import TestimonialCarousel from '@/components/TestimonialCarousel';
import PricingSection from '@/components/PricingSection';
import FAQSection from '@/components/FAQSection';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="bg-navy-900 min-h-screen text-white w-full overflow-x-hidden selection:bg-cyan-400 selection:text-navy-900">
      <Navbar />
      
      {/* Hero section with looping background video */}
      <HeroVideoScroll />
      
      {/* Standard scroll content sections follow the canvas section */}
      <div className="relative z-20 bg-navy-900 flex flex-col pt-10">
        <FeatureGrid />
        <TestimonialCarousel />
        <PricingSection />
        <FAQSection />
        <CTASection />
        <Footer />
      </div>
    </main>
  );
}
