"use client";

import { useRef, useEffect, useState } from "react";
import { useScroll, useTransform, motion } from "framer-motion";

export function HeroSection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
    const [reducedMotion, setReducedMotion] = useState(false);

    useEffect(() => {
        const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        setReducedMotion(prefersReducedMotion);
    }, []);

    // Phase 1: Background scale (0% → 20%)
    const bgScaleRaw = useTransform(scrollYProgress, [0, 0.2], [1.05, 1.0]);
    
    // Phase 2: Hero mascot (20% → 45%)
    const heroOpacityRaw = useTransform(scrollYProgress, [0.18, 0.35], [0, 1]);
    const heroScaleRaw = useTransform(scrollYProgress, [0.18, 0.40], [0.7, 1.0]);
    const heroYRaw = useTransform(scrollYProgress, [0.18, 0.40], [60, 0]);
    
    // Vignette intensification during Phase 2
    const vignetteOpacityRaw = useTransform(scrollYProgress, [0.15, 0.45], [0.3, 0.8]);
    
    // Phase 3: Text reveal (45% → 65%)
    const titleOpacityRaw = useTransform(scrollYProgress, [0.43, 0.52], [0, 1]);
    const titleYRaw = useTransform(scrollYProgress, [0.43, 0.52], [30, 0]);
    const taglineOpacityRaw = useTransform(scrollYProgress, [0.50, 0.60], [0, 1]);
    const taglineYRaw = useTransform(scrollYProgress, [0.50, 0.60], [20, 0]);
    
    // Phase 4: Feature pills (65% → 85%)
    const pill1OpacityRaw = useTransform(scrollYProgress, [0.63, 0.72], [0, 1]);
    const pill1XRaw = useTransform(scrollYProgress, [0.63, 0.72], [-80, 0]);
    const pill2OpacityRaw = useTransform(scrollYProgress, [0.67, 0.76], [0, 1]);
    const pill2YRaw = useTransform(scrollYProgress, [0.67, 0.76], [60, 0]);
    const pill3OpacityRaw = useTransform(scrollYProgress, [0.71, 0.80], [0, 1]);
    const pill3XRaw = useTransform(scrollYProgress, [0.71, 0.80], [80, 0]);
    
    // Phase 5: CTA button (85% → 100%)
    const ctaOpacityRaw = useTransform(scrollYProgress, [0.83, 0.92], [0, 1]);
    const ctaScaleRaw = useTransform(scrollYProgress, [0.83, 0.92], [0.8, 1.0]);

    // Apply reduced motion check
    const bgScale = reducedMotion ? 1.0 : bgScaleRaw;
    const heroOpacity = reducedMotion ? 1 : heroOpacityRaw;
    const heroScale = reducedMotion ? 1.0 : heroScaleRaw;
    const heroY = reducedMotion ? 0 : heroYRaw;
    const vignetteOpacity = reducedMotion ? 0.8 : vignetteOpacityRaw;
    const titleOpacity = reducedMotion ? 1 : titleOpacityRaw;
    const titleY = reducedMotion ? 0 : titleYRaw;
    const taglineOpacity = reducedMotion ? 1 : taglineOpacityRaw;
    const taglineY = reducedMotion ? 0 : taglineYRaw;
    const pill1Opacity = reducedMotion ? 1 : pill1OpacityRaw;
    const pill1X = reducedMotion ? 0 : pill1XRaw;
    const pill2Opacity = reducedMotion ? 1 : pill2OpacityRaw;
    const pill2Y = reducedMotion ? 0 : pill2YRaw;
    const pill3Opacity = reducedMotion ? 1 : pill3OpacityRaw;
    const pill3X = reducedMotion ? 0 : pill3XRaw;
    const ctaOpacity = reducedMotion ? 1 : ctaOpacityRaw;
    const ctaScale = reducedMotion ? 1.0 : ctaScaleRaw;

    const renderParticles = () => {
        const particles = [];
        for (let i = 0; i < 20; i++) {
            const size = Math.random() * 2 + 2;
            const top = Math.random() * 100;
            const left = Math.random() * 100;
            const duration = Math.random() * 4 + 4;
            const delay = Math.random() * 2;
            particles.push(
                <div 
                    key={i} 
                    className="absolute rounded-full animate-float pointer-events-none"
                    style={{
                        width: `${size}px`,
                        height: `${size}px`,
                        top: `${top}%`,
                        left: `${left}%`,
                        backgroundColor: 'rgba(243,156,18,0.3)',
                        animationDuration: `${duration}s`,
                        animationDelay: `${delay}s`
                    }}
                />
            );
        }
        return particles;
    };

    return (
        <div ref={containerRef} className="h-[400vh] relative w-full bg-crimson-900">
            <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col items-center justify-center">
                
                {/* z-0 Background layer */}
                <motion.img 
                    src="/background.png" 
                    alt="Background" 
                    className="absolute inset-0 w-full h-full object-cover z-0 will-change-transform"
                    style={{ scale: bgScale }}
                    loading="eager"
                />

                {/* z-10 Particle overlay */}
                <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
                    {renderParticles()}
                </div>

                {/* z-20 Vignette overlay */}
                <motion.div 
                    className="absolute inset-0 z-20 vignette pointer-events-none"
                    style={{ opacity: vignetteOpacity }}
                />

                {/* z-30 Hero mascot */}
                <motion.img 
                    src="/hero.png" 
                    alt="Classaathi Mascot" 
                    className="absolute z-30 w-full max-w-[85vw] md:max-w-[550px] drop-shadow-[0_20px_60px_rgba(0,0,0,0.5)] will-change-transform"
                    style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
                    loading="eager"
                />

                {/* z-40 Text layer */}
                <div className="absolute z-40 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center w-full mt-[-20vh] md:mt-[-25vh]">
                    <motion.h1 
                        className="text-5xl md:text-7xl font-bold text-white text-gold-glow mb-2 text-center will-change-transform px-4"
                        style={{ opacity: titleOpacity, y: titleY }}
                    >
                        Classaathi
                    </motion.h1>
                    <motion.p 
                        className="text-xl md:text-2xl text-white/80 font-light text-center will-change-transform px-4 max-w-2xl"
                        style={{ opacity: taglineOpacity, y: taglineY }}
                    >
                        Your Coaching Institute, Simplified.
                    </motion.p>
                </div>

                {/* z-40 Feature pills */}
                <div className="absolute z-40 top-1/2 translate-y-1/2 flex flex-col md:flex-row gap-3 md:gap-4 mt-[15vh] md:mt-[20vh] px-4 w-full md:w-auto items-center justify-center">
                    <motion.div 
                        className="glass-card px-6 py-4 flex items-center gap-2 will-change-transform w-full md:w-auto min-w-max"
                        style={{ opacity: pill1Opacity, x: pill1X }}
                    >
                        <span className="text-xl">📋</span>
                        <span className="text-white font-medium text-sm md:text-base">Student & Batch Management</span>
                    </motion.div>
                    
                    <motion.div 
                        className="glass-card px-6 py-4 flex items-center gap-2 will-change-transform w-full md:w-auto min-w-max"
                        style={{ opacity: pill2Opacity, y: pill2Y }}
                    >
                        <span className="text-xl">💬</span>
                        <span className="text-white font-medium text-sm md:text-base">WhatsApp Parent Updates</span>
                    </motion.div>
                    
                    <motion.div 
                        className="glass-card px-6 py-4 flex items-center gap-2 will-change-transform w-full md:w-auto min-w-max"
                        style={{ opacity: pill3Opacity, x: pill3X }}
                    >
                        <span className="text-xl">💰</span>
                        <span className="text-white font-medium text-sm md:text-base">Automated Fee Collection</span>
                    </motion.div>
                </div>

                {/* z-50 CTA layer */}
                <motion.div 
                    className="absolute z-50 bottom-[5vh] md:bottom-[10vh] flex flex-col items-center gap-4 will-change-transform px-4"
                    style={{ opacity: ctaOpacity, scale: ctaScale }}
                >
                    <a href="/signup" className="block text-center bg-gold-400 hover:bg-gold-300 text-crimson-800 font-bold px-8 py-4 rounded-full text-lg animate-pulse-glow transition-colors">
                        Start Free Trial
                    </a>
                    <a href="#how-it-works" className="text-white/60 hover:text-white text-sm transition-colors">
                        See How It Works →
                    </a>
                </motion.div>
            </div>
        </div>
    );
}
