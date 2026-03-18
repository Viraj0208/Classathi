"use client";

import { motion, MotionValue, useTransform, useReducedMotion } from "framer-motion";
import { BookOpen, Calculator, Coffee, FileSpreadsheet, MessageCircle, Phone } from "lucide-react";
import { landingContent } from "@/data/landingContent";

interface ChaosSceneProps {
    scrollYProgress: MotionValue<number>;
}

export function ChaosScene({ scrollYProgress }: ChaosSceneProps) {
    const shouldReduceMotion = useReducedMotion();

    // Background transform: chaos-yellow (0%) -> white (20%) -> accent-blue-light (40%)
    // Dark mode uses slate tones instead
    const bgColorLight = useTransform(
        scrollYProgress,
        [0, 0.2, 0.4],
        ["#FEF3C7", "#FFFFFF", "#DBEAFE"]
    );

    const bgColorDark = useTransform(
        scrollYProgress,
        [0, 0.2, 0.4],
        ["#1e293b", "#0f172a", "#1e293b"]
    );

    // Global opacity for the chaos elements (fade out by 35%)
    const elementsOpacity = useTransform(scrollYProgress, [0.15, 0.35], [1, 0]);

    // Tagline 1: The Chaos (fade out by 15%)
    const tagline1Opacity = useTransform(scrollYProgress, [0, 0.1, 0.15], [1, 1, 0]);
    const tagline1Y = useTransform(scrollYProgress, [0, 0.15], [0, -30]);

    // Tagline 2: The Dissolve (fade in at 15%, fade out at 35%)
    const tagline2Opacity = useTransform(scrollYProgress, [0.15, 0.2, 0.3, 0.35], [0, 1, 1, 0]);
    const tagline2Y = useTransform(scrollYProgress, [0.15, 0.2, 0.3, 0.35], [30, 0, 0, -30]);

    // Parallax / float definitions for individual items
    const floatUpSlow = useTransform(scrollYProgress, [0, 0.35], [0, -100]);
    const floatUpMedium = useTransform(scrollYProgress, [0, 0.35], [0, -150]);
    const floatUpFast = useTransform(scrollYProgress, [0, 0.35], [0, -200]);

    const rotateLeft = useTransform(scrollYProgress, [0, 0.35], [0, -20]);
    const rotateRight = useTransform(scrollYProgress, [0, 0.35], [0, 20]);

    // Gentle up-down bob animation using keyframes
    const getBobProps = (delay: number) => {
        if (shouldReduceMotion) return {};
        return {
            animate: { y: [0, -12, 0] },
            transition: {
                duration: 4,
                ease: "easeInOut" as const,
                repeat: Infinity,
                delay
            }
        };
    };

    const noisePattern = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;

    // Use a wrapper to handle dark/light bg via CSS instead of pure motion
    return (
        <>
            {/* Light mode background */}
            <motion.div
                className="absolute inset-0 w-full h-full dark:hidden"
                style={{ backgroundColor: bgColorLight }}
            />
            {/* Dark mode background */}
            <motion.div
                className="absolute inset-0 w-full h-full hidden dark:block"
                style={{ backgroundColor: bgColorDark }}
            />
            <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply" style={{ backgroundImage: noisePattern }} />

                {/* Central Taglines */}
                <div className="absolute inset-0 z-10 w-full px-4 md:px-8 flex flex-col items-center justify-center pointer-events-none">
                    <div className="relative w-full max-w-5xl mx-auto flex flex-col items-center justify-center">
                        <motion.h1
                            className="text-4xl md:text-7xl font-heading font-black text-slate-900 dark:text-white text-center leading-[1.1] tracking-tight"
                            style={{
                                opacity: tagline1Opacity,
                                y: tagline1Y,
                                textShadow: "0 2px 20px rgba(0,0,0,0.08)"
                            }}
                        >
                            {landingContent.hero.taglinePhase1}
                        </motion.h1>
                        <motion.h2
                            className="absolute inset-0 flex items-center justify-center text-3xl md:text-6xl lg:text-7xl font-heading font-bold text-slate-900 dark:text-white text-center leading-[1.1]"
                            style={{
                                opacity: tagline2Opacity,
                                y: tagline2Y,
                                textShadow: "0 2px 20px rgba(0,0,0,0.08)"
                            }}
                        >
                            {landingContent.hero.taglinePhase2}
                        </motion.h2>
                    </div>
                </div>

                {/* The Messy Desk Elements */}
                <motion.div
                    className="absolute inset-0 pointer-events-none z-0"
                    style={{ opacity: elementsOpacity }}
                >
                    <div className="w-full h-full max-w-7xl mx-auto px-4 py-8 md:p-12 relative flex flex-col justify-between md:block">

                        {/* TOP ROW MOBILE */}
                        <div className="flex justify-between w-full md:contents">
                            {/* Register Book (Top Left) */}
                            <motion.div
                                className="md:absolute md:top-[12%] md:left-[8%] shrink-0"
                                style={{ y: floatUpSlow, rotate: rotateLeft }}
                            >
                                <motion.div {...getBobProps(0)} className="w-[140px] h-[180px] md:w-[260px] md:h-[340px] bg-[#fdf2f8] dark:bg-slate-800 rounded-r-2xl shadow-2xl border-l-[12px] md:border-l-[16px] border-pink-700 dark:border-pink-500 flex flex-col pt-4 md:pt-6 transform rotate-6 origin-bottom-left relative overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
                                    {/* Red Margin Line */}
                                    <div className="absolute top-0 bottom-0 left-[20px] md:left-[40px] w-[2px] bg-red-400 opacity-60 z-0" />
                                    <div className="relative z-10 w-full h-full flex flex-col px-3 md:px-6">
                                        <div className="bg-white dark:bg-slate-700 border-2 border-pink-200 dark:border-pink-500/30 text-center py-1 md:py-2 rounded shadow-sm mb-3 md:mb-6">
                                            <div className="text-[10px] md:text-sm font-bold text-pink-800 dark:text-pink-300 tracking-widest uppercase font-heading">Attendance</div>
                                            <div className="text-[8px] md:text-xs text-pink-600 dark:text-pink-400 font-medium">REGISTER 2024</div>
                                        </div>
                                        <div className="flex flex-col flex-1 pl-4 md:pl-8">
                                            {[...Array(6)].map((_, i) => (
                                                <div key={i} className="flex-1 border-b border-blue-300 dark:border-blue-500/30 w-full" />
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>

                            {/* Buzzing Phone (Top Right) */}
                            <motion.div
                                className="md:absolute md:top-[8%] md:right-[10%] shrink-0"
                                style={{ y: floatUpFast, rotate: rotateRight }}
                            >
                                <motion.div {...getBobProps(0.8)} className="w-[130px] h-[260px] md:w-[220px] md:h-[440px] bg-slate-900 rounded-[2rem] md:rounded-[3rem] shadow-2xl shadow-green-900/20 border-[6px] md:border-[10px] border-slate-800 dark:border-slate-700 p-1 md:p-2 ring-4 ring-black/10 dark:ring-white/5 relative overflow-hidden transform -rotate-[8deg]">
                                    {/* Screen Glow */}
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.15)_0%,transparent_100%)] z-0" />
                                    <div className="w-full h-full bg-slate-950 rounded-[1.5rem] md:rounded-[2.2rem] relative overflow-hidden flex flex-col z-10">
                                        {/* Notch */}
                                        <div className="absolute top-0 inset-x-0 h-4 md:h-6 bg-slate-900 flex justify-center rounded-t-xl z-20">
                                            <div className="w-8 md:w-16 h-2 md:h-3 bg-black rounded-b-xl" />
                                        </div>
                                        {/* Notifications */}
                                        <div className="mt-8 md:mt-12 px-2 md:px-3 flex-1 flex flex-col gap-2 md:gap-3 z-10">
                                            <div className="bg-slate-800/90 backdrop-blur border border-slate-700/80 p-2 md:p-3 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                                                <div className="flex gap-1.5 md:gap-2 items-center mb-1 max-w-full">
                                                    <div className="bg-green-500 w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center shrink-0">
                                                        <MessageCircle className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                                                    </div>
                                                    <span className="text-[9px] md:text-[11px] font-semibold text-slate-300">WhatsApp</span>
                                                </div>
                                                <div className="text-[10px] md:text-sm font-bold text-white leading-tight">47 unread messages</div>
                                            </div>
                                            {[...Array(3)].map((_, i) => (
                                                <div key={i} className="bg-slate-800/50 p-1.5 md:p-2.5 rounded-lg border border-slate-700/50 flex gap-2 items-start">
                                                    <div className="bg-green-500/20 w-4 h-4 md:w-5 md:h-5 rounded-full flex-shrink-0" />
                                                    <div className="flex-1 space-y-1.5 py-0.5">
                                                        <div className="h-1 md:h-1.5 bg-slate-600 rounded-full w-3/4" />
                                                        <div className="h-1 md:h-1.5 bg-slate-700 rounded-full w-1/2" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        </div>

                        {/* Chai Cup (Top Center) */}
                        <motion.div
                            className="hidden md:flex absolute top-[12%] left-1/2 -translate-x-1/2 shrink-0"
                            style={{ y: floatUpSlow }}
                        >
                            <motion.div {...getBobProps(1.5)}>
                                <Coffee className="w-8 h-8 md:w-12 md:h-12 text-yellow-800 dark:text-yellow-500 drop-shadow-xl opacity-70" strokeWidth={2} />
                            </motion.div>
                        </motion.div>

                        {/* BOTTOM ROW MOBILE */}
                        <div className="flex justify-between items-end w-full md:contents mt-auto pb-4">
                            {/* Calculator (Bottom Left) */}
                            <motion.div
                                className="md:absolute md:bottom-[15%] md:left-[10%] shrink-0"
                                style={{ y: floatUpSlow, rotate: rotateLeft }}
                            >
                                <motion.div {...getBobProps(0.5)} className="w-[120px] md:w-[200px] bg-[#eef0f2] dark:bg-slate-800 p-2.5 md:p-4 rounded-xl md:rounded-2xl shadow-2xl border border-slate-300 dark:border-slate-600 transform rotate-2">
                                    <div className="bg-[#a3b1a1] dark:bg-slate-600 p-2 md:p-3 rounded-md md:rounded-lg mb-3 md:mb-4 shadow-inner border-2 border-slate-400 dark:border-slate-500">
                                        <div className="text-right font-mono text-xl md:text-3xl font-medium text-slate-900 dark:text-white tracking-wider">4,500</div>
                                    </div>
                                    <div className="grid grid-cols-4 gap-1.5 md:gap-2">
                                        {[...Array(16)].map((_, i) => (
                                            <div key={i} className={`h-5 md:h-8 rounded md:rounded-md shadow-sm border border-slate-300/50 dark:border-slate-600/50 ${i === 15 ? 'bg-orange-500 border-orange-600' : 'bg-white dark:bg-slate-700'}`} />
                                        ))}
                                    </div>
                                </motion.div>
                            </motion.div>

                            {/* Invoice Slips (Bottom Right) */}
                            <motion.div
                                className="md:absolute md:bottom-[18%] md:right-[15%] shrink-0"
                                style={{ y: floatUpMedium, rotate: rotateRight }}
                            >
                                <motion.div {...getBobProps(1.2)} className="relative w-[130px] md:w-[200px] h-[160px] md:h-[240px]">
                                    {/* Third slip */}
                                    <div className="absolute inset-x-0 bottom-0 h-full bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 transform rotate-[18deg] origin-bottom-right p-3 md:p-4 font-mono flex flex-col">
                                        <div className="border-b-2 border-dashed border-slate-300 dark:border-slate-600 pb-1.5 md:pb-2 mb-2 text-center text-[9px] md:text-xs font-bold text-slate-500 dark:text-slate-400">RECEIPT 04</div>
                                        <div className="flex-1 flex items-center justify-center text-lg md:text-3xl font-bold text-slate-800 dark:text-white">₹3,500</div>
                                    </div>
                                    {/* Second slip */}
                                    <div className="absolute inset-x-0 bottom-0 h-full bg-slate-50 dark:bg-slate-800/80 shadow-xl border border-slate-200 dark:border-slate-700 transform rotate-[8deg] origin-bottom-right p-3 md:p-4 font-mono flex flex-col">
                                        <div className="border-b-2 border-dashed border-slate-300 dark:border-slate-600 pb-1.5 md:pb-2 mb-2 text-center text-[9px] md:text-xs font-bold text-slate-500 dark:text-slate-400">RECEIPT 05</div>
                                        <div className="flex-1 flex items-center justify-center text-lg md:text-3xl font-bold text-slate-800 dark:text-white">₹1,500</div>
                                    </div>
                                    {/* Top slip */}
                                    <div className="absolute inset-x-0 bottom-0 h-[105%] bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 transform -rotate-3 origin-bottom-left p-3 md:p-4 font-mono flex flex-col">
                                        <div className="border-b-2 border-dashed border-slate-300 dark:border-slate-600 pb-1.5 md:pb-2 mb-1 md:mb-2 text-center text-[9px] md:text-xs font-bold text-slate-500 dark:text-slate-400">RECEIPT 06</div>
                                        <div className="flex-1 flex flex-col items-center justify-center">
                                            <div className="text-xl md:text-4xl font-bold text-slate-800 dark:text-white">₹2,000</div>
                                            <div className="text-[7px] md:text-[10px] text-slate-400 mt-1 md:mt-2">PAID VIA CASH</div>
                                        </div>
                                        <div className="border-t-2 border-dashed border-slate-300 dark:border-slate-600 pt-1.5 md:pt-2 mt-auto text-[8px] md:text-[10px] text-slate-400 text-center uppercase tracking-widest font-bold">Thank You</div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        </div>

                    </div>
                </motion.div>
            </div>
        </>
    );
}
