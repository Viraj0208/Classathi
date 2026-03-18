"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";

const Counter = ({ from, to, duration, suffix = "" }: { from: number, to: number, duration: number, suffix?: string }) => {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(nodeRef, { once: true });
  const [count, setCount] = useState(from);

  useEffect(() => {
    if (!isInView) return;
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      setCount(Math.floor(progress * (to - from) + from));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [isInView, from, to, duration]);

  const displayCount = to >= 10000000 ? (count / 10000000).toFixed(0) : count.toLocaleString();
  
  let formatted = displayCount;
  if (to === 10000) formatted = "10,000";
  if (to === 50000) formatted = "50,000";
  if (to === 2) formatted = "2";

  return <span ref={nodeRef}>{to === 2 ? "₹" : ""}{formatted}{suffix}</span>;
};

export function SocialProof() {
  const cities = ["Mumbai", "Delhi", "Pune", "Hyderabad", "Chennai", "Bangalore", "Jaipur", "Lucknow", "Kolkata", "Ahmedabad"];
  const repeatedCities = [...cities, ...cities];

  return (
    <section className="bg-crimson-900 w-full py-16 md:py-24 overflow-hidden">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-10">
          Trusted by 500+ Coaching Institutes Across India
        </h2>
      </div>

      <div className="w-full relative mb-12">
        <div className="flex w-max animate-ticker">
          {repeatedCities.map((city, i) => (
            <div key={i} className="flex items-center">
              <span className="text-white/50 text-lg mx-8 whitespace-nowrap">{city}</span>
              <span className="text-gold-400 text-sm">•</span>
            </div>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 mt-12 flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16">
        <div className="text-center">
          <div className="text-4xl md:text-5xl font-bold text-gold-300">
            <Counter from={0} to={10000} duration={2} suffix="+" />
          </div>
          <p className="text-white/60 text-sm mt-2">Students Managed</p>
        </div>
        <div className="text-center">
          <div className="text-4xl md:text-5xl font-bold text-gold-300">
            <Counter from={0} to={50000} duration={2} suffix="+" />
          </div>
          <p className="text-white/60 text-sm mt-2">WhatsApp Messages Sent</p>
        </div>
        <div className="text-center">
          <div className="text-4xl md:text-5xl font-bold text-gold-300">
            <Counter from={0} to={2} duration={2} suffix="Cr+" />
          </div>
          <p className="text-white/60 text-sm mt-2">Fees Collected</p>
        </div>
      </div>
    </section>
  );
}
