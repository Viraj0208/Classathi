export function Pricing() {
  return (
    <section className="bg-crimson-800 w-full py-16 md:py-24">
      <div className="container mx-auto px-6 max-w-3xl">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center">
          Simple, Transparent Pricing
        </h2>
        <p className="text-white/50 text-center mt-3 mb-12 text-lg">
          No hidden fees. Cancel anytime.
        </p>
        
        <div className="flex flex-col md:flex-row justify-center items-stretch gap-6 md:gap-8">
          
          {/* Pro Plan */}
          <div className="glass-card p-8 flex-1 flex flex-col">
            <h3 className="text-2xl font-bold text-white">Pro</h3>
            <div className="mt-4 mb-2">
                <span className="text-4xl font-bold text-gold-300">₹499</span>
                <span className="text-white/50 text-lg">/month</span>
            </div>
            <p className="text-white/50 text-sm mb-6">Perfect for solo tutors</p>
            
            <ul className="space-y-3 flex-1">
              {['Unlimited Students', 'Batch & Attendance Management', 'Automated Fee Tracking', 'WhatsApp Parent Updates', 'Teacher Dashboard'].map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-white/70 text-sm">
                  <span className="text-gold-400">✓</span> {feature}
                </li>
              ))}
            </ul>
            
            <a href="/auth/signup" className="block w-full mt-8 border border-gold-400 text-gold-400 hover:bg-gold-400 hover:text-crimson-800 transition-colors py-3 rounded-full font-semibold text-center">
              Start Free Trial
            </a>
          </div>

          {/* Enterprise Plan */}
          <div className="glass-card-warm p-8 flex-1 relative flex flex-col mt-4 md:mt-0 md:-translate-y-4 shadow-2xl">
            <div className="absolute top-0 right-0 -mt-3 mr-4 bg-gold-400 text-crimson-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Most Popular
            </div>
            <h3 className="text-2xl font-bold text-white">Enterprise</h3>
            <div className="mt-4 mb-2">
                <span className="text-4xl font-bold text-gold-300">₹1,499</span>
                <span className="text-white/50 text-lg">/month</span>
            </div>
            <p className="text-white/50 text-sm mb-6">For coaching institutes with multiple teachers</p>
            
            <ul className="space-y-3 flex-1">
              {['Everything in Pro', 'Multi-Teacher Support', 'Owner Admin Dashboard', 'Per-Teacher Fee Ledgers', 'Shared & Independent Batches', 'Priority WhatsApp Support'].map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-white/70 text-sm">
                  <span className="text-gold-400">✓</span> {feature}
                </li>
              ))}
            </ul>
            
            <a href="/auth/signup" className="block w-full mt-8 bg-gold-400 text-crimson-800 hover:bg-gold-300 transition-colors py-3 rounded-full font-bold text-center">
              Start Free Trial
            </a>
          </div>

        </div>
      </div>
    </section>
  );
}
