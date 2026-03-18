"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { landingContent } from "@/data/landingContent";

export function CTASection() {
    const router = useRouter();
    const { pricing } = landingContent;

    return (
        <section className="py-24 bg-slate-50 dark:bg-slate-900 relative overflow-hidden" id="pricing">
            {/* Decorative background shapes */}
            <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[600px] h-[600px] bg-blue-100/50 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[600px] h-[600px] bg-yellow-100/40 dark:bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center max-w-3xl mx-auto mb-16"
                >
                    <h2 className="text-4xl lg:text-5xl font-heading font-bold text-text-primary dark:text-white mb-6">
                        Your coaching institute, simplified.
                    </h2>
                    <p className="text-xl text-text-muted dark:text-slate-400">
                        Join 500+ tutors across India who stopped chasing fees and started teaching.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
                    {pricing.map((tier, idx) => (
                        <motion.div
                            key={tier.name}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: idx * 0.15 }}
                            className={`relative bg-white dark:bg-slate-800 rounded-3xl p-8 sm:p-10 ${tier.isCustom
                                    ? "border-2 border-slate-100 dark:border-slate-700 shadow-xl"
                                    : "border-2 border-accent-blue shadow-2xl relative"
                                }`}
                        >
                            {!tier.isCustom && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent-blue text-white px-4 py-1 rounded-full text-sm font-bold tracking-wide uppercase">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-2xl font-heading font-bold text-text-primary dark:text-white mb-2">{tier.name}</h3>
                                <p className="text-slate-500 dark:text-slate-400 font-medium">{tier.subtitle}</p>
                            </div>

                            <div className="mb-8">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-heading font-bold text-slate-900 dark:text-white">{tier.price}</span>
                                </div>
                            </div>

                            <ul className="space-y-4 mb-10">
                                {tier.features.map((feature, fIdx) => (
                                    <li key={fIdx} className="flex items-start gap-3">
                                        <div className="flex-shrink-0 mt-1">
                                            <Check className={`w-5 h-5 ${tier.isCustom ? "text-slate-400" : "text-accent-blue"}`} />
                                        </div>
                                        <span className="text-slate-700 dark:text-slate-300 font-medium">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => router.push("/login")}
                                className={`w-full py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${tier.isCustom
                                        ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600"
                                        : "bg-accent-orange text-white hover:bg-[#d98906] shadow-lg hover:shadow-xl hover:-translate-y-1 transform animate-pulse hover:animate-none"
                                    }`}
                            >
                                {tier.buttonText}
                                {!tier.isCustom && <ArrowRight className="w-5 h-5" />}
                            </button>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="text-center text-sm font-medium text-slate-500 dark:text-slate-400"
                >
                    No credit card required &bull; 14-day free trial &bull; Cancel anytime
                </motion.div>
            </div>
        </section>
    );
}
