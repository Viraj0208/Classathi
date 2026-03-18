"use client";

import { motion } from "framer-motion";

export function HowItWorks() {
  const steps = [
    {
      title: "Set Up Your Institute",
      desc: "Create your account, add your institute name and details. Takes under 2 minutes."
    },
    {
      title: "Add Students & Batches",
      desc: "Import or add students, create batches, assign teachers. Organize everything your way."
    },
    {
      title: "Go on Autopilot",
      desc: "Attendance tracking, fee collection, and WhatsApp parent updates — all automated."
    }
  ];

  return (
    <section id="how-it-works" className="bg-crimson-900 w-full py-16 md:py-24">
      <div className="container mx-auto px-6 max-w-4xl">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-16">
          Get Started in 3 Simple Steps
        </h2>
        
        <div className="flex flex-col md:flex-row justify-center items-start gap-8 md:gap-0">
          {steps.map((step, i) => (
            <div key={i} className="flex-1 flex flex-col items-center text-center relative w-full">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="w-12 h-12 rounded-full bg-gold-400 text-crimson-800 font-bold text-xl flex items-center justify-center relative z-10"
              >
                {i + 1}
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 + 0.2, duration: 0.5 }}
              >
                <h3 className="text-lg font-semibold text-white mt-6">{step.title}</h3>
                <p className="text-white/60 text-sm mt-3 max-w-xs mx-auto leading-relaxed">{step.desc}</p>
              </motion.div>

              {/* Connecting line for desktop */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-[24px] left-[50%] w-full border-t-2 border-dashed border-gold-400/30 z-0 translate-x-[24px]" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
