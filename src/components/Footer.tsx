import React from 'react';
import { Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-black/40 backdrop-blur-lg border-t border-white/10 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-6">
              <Sparkles className="w-6 h-6 text-cyan-400" />
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-cyan-400 to-cyan-500 bg-clip-text text-transparent">
                Classaathi
              </span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed mb-6">
              Empowering Indian coaching institutes with intelligent management and seamless communication tools.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-bold mb-6">Product</h4>
            <ul className="space-y-4">
              <li><a href="#features" className="text-white/50 hover:text-cyan-400 transition-colors text-sm">Features</a></li>
              <li><a href="#pricing" className="text-white/50 hover:text-cyan-400 transition-colors text-sm">Pricing</a></li>
              <li><a href="#" className="text-white/50 hover:text-cyan-400 transition-colors text-sm">Case Studies</a></li>
              <li><a href="#" className="text-white/50 hover:text-cyan-400 transition-colors text-sm">Updates</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-bold mb-6">Support</h4>
            <ul className="space-y-4">
              <li><a href="#faq" className="text-white/50 hover:text-cyan-400 transition-colors text-sm">FAQ</a></li>
              <li><a href="#" className="text-white/50 hover:text-cyan-400 transition-colors text-sm">Help Center</a></li>
              <li><a href="#" className="text-white/50 hover:text-cyan-400 transition-colors text-sm">Contact Us</a></li>
              <li><a href="#" className="text-white/50 hover:text-cyan-400 transition-colors text-sm">WhatsApp Support</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-bold mb-6">Legal</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-white/50 hover:text-cyan-400 transition-colors text-sm">Privacy Policy</a></li>
              <li><a href="#" className="text-white/50 hover:text-cyan-400 transition-colors text-sm">Terms of Service</a></li>
              <li><a href="#" className="text-white/50 hover:text-cyan-400 transition-colors text-sm">Refund Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-white/40 text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} Classaathi. All rights reserved.
          </p>
          <p className="text-white/40 text-sm flex items-center">
            Made with <span className="text-red-500 mx-1">❤️</span> for Indian educators
          </p>
        </div>
      </div>
    </footer>
  );
}
