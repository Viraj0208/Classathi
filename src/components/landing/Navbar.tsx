"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

export function Navbar() {
    const router = useRouter();
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <motion.nav
            className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${isScrolled || mobileMenuOpen
                    ? "bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm"
                    : "bg-transparent"
                }`}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <span className="font-heading font-bold text-2xl text-accent-blue">
                            Classaathi
                        </span>
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center space-x-8">
                        <a
                            href="#features"
                            className="text-text-muted dark:text-slate-400 hover:text-text-primary dark:hover:text-white font-medium transition-colors"
                        >
                            Features
                        </a>
                        <a
                            href="#pricing"
                            className="text-text-muted dark:text-slate-400 hover:text-text-primary dark:hover:text-white font-medium transition-colors"
                        >
                            Pricing
                        </a>
                        <button
                            onClick={() => router.push("/login")}
                            className="bg-accent-blue text-white px-6 py-2.5 rounded-full font-medium hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            Start Free
                        </button>
                    </div>

                    {/* Mobile menu button */}
                    <div className="flex items-center md:hidden">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="text-text-primary dark:text-white hover:text-accent-blue focus:outline-none"
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? (
                                <X className="h-6 w-6" />
                            ) : (
                                <Menu className="h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="md:hidden bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 overflow-hidden"
                    >
                        <div className="px-4 pt-4 pb-6 space-y-4 shadow-lg">
                            <a
                                href="#features"
                                onClick={() => setMobileMenuOpen(false)}
                                className="block text-base font-medium text-text-primary dark:text-white hover:text-accent-blue"
                            >
                                Features
                            </a>
                            <a
                                href="#pricing"
                                onClick={() => setMobileMenuOpen(false)}
                                className="block text-base font-medium text-text-primary dark:text-white hover:text-accent-blue"
                            >
                                Pricing
                            </a>
                            <button
                                onClick={() => {
                                    setMobileMenuOpen(false);
                                    router.push("/login");
                                }}
                                className="w-full bg-accent-blue text-white px-6 py-3 rounded-full font-medium hover:bg-blue-700 transition-colors text-center"
                            >
                                Start Free
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
}
