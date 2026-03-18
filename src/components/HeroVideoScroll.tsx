"use client";

import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function HeroVideoScroll() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onReady = () => setIsLoaded(true);
    video.addEventListener('canplaythrough', onReady);
    video.addEventListener('loadeddata', onReady);
    const timer = setTimeout(() => setIsLoaded(true), 3000);

    return () => {
      video.removeEventListener('canplaythrough', onReady);
      video.removeEventListener('loadeddata', onReady);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Loading screen */}
      {!isLoaded && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#0a0e1a]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
            <p className="text-white/50 text-sm">Loading experience...</p>
          </div>
        </div>
      )}

      {/* Looping background video */}
      <video
        ref={videoRef}
        src="/videos/hero.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/40 z-[1]" />

      {/* Hero text */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-5xl md:text-7xl font-extrabold text-white mb-4"
        >
          Classaathi.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-lg md:text-2xl text-white/70 max-w-2xl"
        >
          Your teaching companion.
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-10"
        >
          <svg
            className="w-6 h-6 text-white/50 animate-bounce"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </div>
    </div>
  );
}
