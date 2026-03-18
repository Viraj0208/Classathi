"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { pricing } from '../data/siteContent';

export default function PricingSection() {
  const router = useRouter();
  return (
    <section id="pricing" className="py-24 md:py-32 bg-navy-800 px-6 border-t border-white/5 relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
      
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16 md:mb-24">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-white relative inline-block"
          >
            Simple, honest pricing
            <span className="w-2 h-2 rounded-full bg-cyan-400 absolute bottom-2 -right-4"></span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {pricing.map((tier, idx) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              whileInView={{ opacity: 1, scale: tier.highlighted ? 1.05 : 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              viewport={{ once: true }}
              className={`relative rounded-3xl p-8 backdrop-blur-xl flex flex-col ${
                tier.highlighted
                  ? 'bg-navy-700/80 border-2 border-cyan-400/50 shadow-[0_0_50px_rgba(0,212,255,0.15)] z-10'
                  : 'bg-white/5 border border-white/10 md:mt-6'
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-400 to-cyan-500 text-navy-900 text-xs font-bold uppercase tracking-widest py-1.5 px-4 rounded-full">
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                <p className="text-white/60 text-sm h-10">{tier.description}</p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-5xl font-extrabold text-white">{tier.price}</span>
                  <span className="text-white/50">{tier.period}</span>
                </div>
              </div>

              <div className="flex-grow space-y-4 mb-8">
                {tier.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <span className="text-white/80">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => router.push('/signup')}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                  tier.highlighted
                    ? 'bg-gradient-to-r from-gold-500 to-gold-400 text-navy-900 hover:shadow-[0_0_20px_rgba(255,183,77,0.4)]'
                    : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                }`}
              >
                {tier.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
