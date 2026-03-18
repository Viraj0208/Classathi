export function FinalCTA() {
  return (
    <section className="w-full bg-gradient-to-br from-crimson-600 via-crimson-700 to-crimson-900 py-20 md:py-28 text-center px-6">
      <div className="container mx-auto max-w-3xl">
        <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
          Stop Managing Spreadsheets. Start Growing Your Institute.
        </h2>
        <a href="/auth/signup" className="inline-block mt-10 bg-gold-400 hover:bg-gold-300 text-crimson-800 font-bold px-10 py-4 rounded-full text-lg animate-pulse-glow transition-all">
          Get Started Free
        </a>
        <p className="text-white/50 text-sm mt-5">
          No credit card required. Set up in under 2 minutes.
        </p>
      </div>
    </section>
  );
}
