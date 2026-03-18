"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Users, CalendarCheck, IndianRupee, MessageCircle, LayoutGrid, Shield } from 'lucide-react';
import { features } from '../data/siteContent';

const IconMap: Record<string, React.FC<any>> = {
  Users,
  CalendarCheck,
  IndianRupee,
  MessageCircle,
  LayoutGrid,
  Shield,
};

export default function FeatureGrid() {
  return (
    <section id="features" className="py-24 md:py-32 bg-navy-900 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 md:mb-24">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-white relative inline-block"
          >
            Everything you need
            <span className="w-2 h-2 rounded-full bg-cyan-400 absolute bottom-2 -right-4"></span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-white/60 mt-6 text-lg max-w-2xl mx-auto"
          >
            A completely integrated digital experience tailored for the modern coaching institute.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => {
            const Icon = IconMap[feature.icon] || Users;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:shadow-[0_0_30px_rgba(0,212,255,0.1)] transition-all group"
              >
                <div className="h-12 w-12 rounded-xl bg-cyan-400/10 flex items-center justify-center border border-cyan-400/20 mb-6 group-hover:scale-110 transition-transform">
                  <Icon className="text-cyan-400 w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-wide">
                  {feature.title}
                </h3>
                <p className="text-white/60 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
