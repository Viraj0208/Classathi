"use client";

import React from 'react';
import { motion, MotionValue, useTransform } from 'framer-motion';

export const scrollSections = {
  section1: {
    title: "Classaathi.",
    subtitle: "Your teaching companion.",
    scrollRange: [0.03, 0.05, 0.13, 0.15],
  },
  section2: {
    title: "Intelligence, organized.",
    subtitle: "Track attendance, fees, and student progress — all connected, all automatic.",
    scrollRange: [0.2, 0.22, 0.35, 0.38],
  },
  section3: {
    title: "WhatsApp-powered updates.",
    subtitle: "Fee reminders, absence alerts, progress reports — delivered straight to parents.",
    scrollRange: [0.45, 0.47, 0.6, 0.63],
  },
  section4: {
    title: "Built for Indian coaching.",
    subtitle: "₹ currency. Hindi + English. Batch scheduling. Multi-teacher support. Software that finally gets it.",
    scrollRange: [0.7, 0.72, 0.85, 0.88],
  },
};

export default function ScrollTextOverlays({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  
  const opacities = [
    useTransform(scrollYProgress, scrollSections.section1.scrollRange, [0, 1, 1, 0]),
    useTransform(scrollYProgress, scrollSections.section2.scrollRange, [0, 1, 1, 0]),
    useTransform(scrollYProgress, scrollSections.section3.scrollRange, [0, 1, 1, 0]),
    useTransform(scrollYProgress, scrollSections.section4.scrollRange, [0, 1, 1, 0]),
  ];

  const sections = [
    scrollSections.section1,
    scrollSections.section2,
    scrollSections.section3,
    scrollSections.section4,
  ];

  return (
    <div className="w-full px-6 flex justify-center">
      {sections.map((section, idx) => (
        <motion.div
          key={idx}
          style={{ opacity: opacities[idx] }}
          className="absolute text-center max-w-4xl mx-auto"
        >
          <h2 className="text-5xl md:text-7xl font-extrabold text-white text-shadow mb-4">
            {section.title}
          </h2>
          <p className="text-lg md:text-2xl text-white/70 max-w-2xl mx-auto text-shadow">
            {section.subtitle}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
