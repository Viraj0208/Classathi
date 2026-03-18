"use client";

import { motion } from "framer-motion";

export function FeaturesGrid() {
  const features = [
    {
      icon: "👨‍🎓",
      title: "Student Profiles & Multi-Batch Assignment",
      desc: "Manage student details, assign them to multiple batches, track each one individually."
    },
    {
      icon: "✅",
      title: "Smart Attendance with Auto Fee Tracking",
      desc: "Mark attendance per batch session. Fees auto-calculate based on attendance."
    },
    {
      icon: "📒",
      title: "Per-Teacher Fee Ledger",
      desc: "Each teacher manages their own independent fee ledger per student per month."
    },
    {
      icon: "💬",
      title: "WhatsApp Alerts to Parents",
      desc: "Automated attendance updates, fee reminders, and custom messages via WhatsApp."
    },
    {
      icon: "👥",
      title: "Multi-Teacher Institute Management",
      desc: "Invite teachers, assign batches, each teacher gets their own dashboard."
    },
    {
      icon: "📊",
      title: "Owner & Teacher Dashboards",
      desc: "Beautiful dashboards showing revenue, attendance trends, and student metrics."
    }
  ];

  return (
    <section className="bg-crimson-800 w-full py-16 md:py-24">
      <div className="container mx-auto px-6 max-w-6xl">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
          Everything Your Institute Needs
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="glass-card-warm p-6"
            >
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
