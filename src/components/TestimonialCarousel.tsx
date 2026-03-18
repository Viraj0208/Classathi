"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { testimonials } from '../data/siteContent';

export default function TestimonialCarousel() {
  return (
    <section className="py-24 md:py-32 bg-navy-900 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 md:mb-24">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-white relative inline-block"
          >
            Loved by educators
            <span className="w-2 h-2 rounded-full bg-cyan-400 absolute bottom-2 -right-4"></span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="bg-navy-800/50 backdrop-blur-md border border-white/5 rounded-3xl p-8 relative isolate"
            >
              <div className="absolute -top-4 -left-2 text-[120px] font-sans text-white/5 leading-none z-[-1] pointer-events-none">
                "
              </div>
              <div className="flex gap-1 mb-6">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-lg text-white/90 mb-8 leading-relaxed">
                "{testimonial.quote}"
              </p>
              <div>
                <div className="font-bold text-white">{testimonial.name}</div>
                <div className="text-sm text-white/50">{testimonial.role}</div>
                <div className="text-xs text-white/40 mt-1">{testimonial.location}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
