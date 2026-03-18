export function Footer() {
  return (
    <footer className="bg-[#1a0505] w-full py-12 px-6 border-t border-white/5">
      <div className="container max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
           <span className="text-xl">💡</span>
           <span className="text-xl font-bold text-white">Classaathi</span>
        </div>
        
        <div className="flex flex-wrap justify-center gap-6">
          <a href="/privacy" className="text-white/40 hover:text-white text-sm transition-colors">Privacy Policy</a>
          <a href="/terms" className="text-white/40 hover:text-white text-sm transition-colors">Terms</a>
          <a href="/contact" className="text-white/40 hover:text-white text-sm transition-colors">Contact Us</a>
        </div>
        
        <div className="text-white/30 text-sm">
          Made with ❤️ in India
        </div>
      </div>
    </footer>
  );
}
