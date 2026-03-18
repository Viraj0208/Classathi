"use client";

import { HeroSection } from "@/components/landing/HeroSection";
import { SocialProof } from "@/components/landing/SocialProof";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Pricing } from "@/components/landing/Pricing";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

export function LandingPage() {
    return (
        <main className="bg-crimson-900 selection:bg-gold-400 selection:text-crimson-900">
            <HeroSection />
            <SocialProof />
            <FeaturesGrid />
            <HowItWorks />
            <Pricing />
            <FinalCTA />
            <Footer />
        </main>
    );
}
