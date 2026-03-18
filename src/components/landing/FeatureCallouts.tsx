"use client";

import { motion, MotionValue, useTransform, useReducedMotion } from "framer-motion";
import { MessageSquare, Calendar, CreditCard, Users, LucideIcon } from "lucide-react";
import { landingContent } from "@/data/landingContent";

interface FeatureCalloutsProps {
    scrollYProgress: MotionValue<number>;
}

const IconMap: Record<string, LucideIcon> = {
    MessageSquare,
    Calendar,
    CreditCard,
    Users,
};

export function FeatureCallouts({ scrollYProgress }: FeatureCalloutsProps) {
    const shouldReduceMotion = useReducedMotion();

    // Create individual fade-in/fade-out ranges for each of the 4 features
    const f1Opacity = useTransform(scrollYProgress, [0.42, 0.46, 0.54, 0.58], [0, 1, 1, 0]);
    const f1Y = useTransform(scrollYProgress, [0.42, 0.46, 0.54, 0.58], [20, 0, 0, -20]);

    const f2Opacity = useTransform(scrollYProgress, [0.52, 0.56, 0.64, 0.68], [0, 1, 1, 0]);
    const f2Y = useTransform(scrollYProgress, [0.52, 0.56, 0.64, 0.68], [20, 0, 0, -20]);

    const f3Opacity = useTransform(scrollYProgress, [0.62, 0.66, 0.74, 0.78], [0, 1, 1, 0]);
    const f3Y = useTransform(scrollYProgress, [0.62, 0.66, 0.74, 0.78], [20, 0, 0, -20]);

    const f4Opacity = useTransform(scrollYProgress, [0.72, 0.76, 0.84, 0.88], [0, 1, 1, 0]);
    const f4Y = useTransform(scrollYProgress, [0.72, 0.76, 0.84, 0.88], [20, 0, 0, -20]);

    const featureTransforms = [
        { opacity: f1Opacity, y: f1Y },
        { opacity: f2Opacity, y: f2Y },
        { opacity: f3Opacity, y: f3Y },
        { opacity: f4Opacity, y: f4Y },
    ];

    if (shouldReduceMotion) {
        return (
            <div className="w-full py-16 px-4 bg-white dark:bg-slate-950" id="features">
                <h2 className="text-3xl font-heading font-bold text-center text-text-primary dark:text-white mb-12">Everything you need to run your institute</h2>
                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {landingContent.features.map((feature, idx) => {
                        const Icon = IconMap[feature.iconName] || Users;
                        return (
                            <div key={idx} className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center">
                                <div className="bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 p-4 rounded-full mb-4">
                                    <Icon className="w-8 h-8" />
                                </div>
                                <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">{feature.description}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 pointer-events-none z-20 flex flex-col items-center justify-end pb-32 lg:pb-12 lg:justify-center">
            <div className="relative w-full max-w-7xl mx-auto h-48 lg:h-full px-4 lg:px-0 lg:flex lg:items-center">
                {landingContent.features.map((feature, idx) => {
                    const Icon = IconMap[feature.iconName] || Users;
                    const transforms = featureTransforms[idx];

                    return (
                        <motion.div
                            key={idx}
                            className="absolute bottom-10 left-0 right-0 mx-auto w-[90%] md:w-[60%] lg:w-[400px] lg:mx-0 lg:left-8 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md p-6 lg:p-8 rounded-2xl shadow-2xl border border-blue-100 dark:border-slate-700"
                            style={{
                                opacity: transforms.opacity,
                                y: transforms.y,
                            }}
                        >
                            <div className="flex items-start gap-4">
                                <div className="bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 p-3 rounded-xl shadow-inner my-1">
                                    <Icon className="w-8 h-8 lg:w-10 lg:h-10" />
                                </div>
                                <div>
                                    <h3 className="font-heading font-bold text-xl lg:text-2xl text-slate-900 dark:text-white mb-2 leading-tight">
                                        {feature.title}
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm lg:text-base leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
