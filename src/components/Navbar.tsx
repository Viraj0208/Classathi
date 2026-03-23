"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function Navbar() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });
  }, []);

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'FAQ', href: '#faq' },
  ];

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled || mobileMenuOpen
          ? 'bg-navy-900/80 backdrop-blur-xl border-b border-white/5 py-4'
          : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Sparkles className="w-6 h-6 text-cyan-400" />
          <span className="font-bold text-xl md:text-2xl tracking-tight bg-gradient-to-r from-cyan-400 to-cyan-500 bg-clip-text text-transparent">
            Classaathi
          </span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-white/70 hover:text-white transition-colors text-sm font-medium"
            >
              {link.name}
            </a>
          ))}
          {isLoggedIn ? (
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gradient-to-r from-gold-500 to-gold-400 text-navy-900 px-6 py-2.5 rounded-full font-bold text-sm hover:shadow-[0_0_20px_rgba(255,183,77,0.4)] transition-all"
            >
              Dashboard
            </button>
          ) : (
            <>
              <button
                onClick={() => router.push('/login')}
                className="text-white/70 hover:text-white transition-colors text-sm font-medium"
              >
                Log in
              </button>
              <button
                onClick={() => router.push('/signup')}
                className="bg-gradient-to-r from-gold-500 to-gold-400 text-navy-900 px-6 py-2.5 rounded-full font-bold text-sm hover:shadow-[0_0_20px_rgba(255,183,77,0.4)] transition-all"
              >
                Start Free Trial
              </button>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-white/10 bg-navy-900/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="px-6 py-4 flex flex-col space-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white border-b border-white/5 pb-2 text-lg"
                >
                  {link.name}
                </a>
              ))}
              {isLoggedIn ? (
                <button
                  onClick={() => { setMobileMenuOpen(false); router.push('/dashboard'); }}
                  className="bg-gradient-to-r from-gold-500 to-gold-400 text-navy-900 px-6 py-3 rounded-full font-bold w-full mt-4"
                >
                  Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={() => { setMobileMenuOpen(false); router.push('/login'); }}
                    className="text-white border border-white/20 px-6 py-3 rounded-full font-bold w-full mt-4"
                  >
                    Log in
                  </button>
                  <button
                    onClick={() => { setMobileMenuOpen(false); router.push('/signup'); }}
                    className="bg-gradient-to-r from-gold-500 to-gold-400 text-navy-900 px-6 py-3 rounded-full font-bold w-full"
                  >
                    Start Free Trial
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
