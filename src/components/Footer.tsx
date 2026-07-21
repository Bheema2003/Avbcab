import React from 'react';
import { Car, Mail, Phone, MessageSquare, Shield, Globe, ArrowUp } from 'lucide-react';

export default function Footer() {
  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-brand-dark text-white border-t border-zinc-800/80 pt-16 pb-8 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">
          
          {/* Column 1: Brand */}
          <div className="md:col-span-5 space-y-6">
            <div className="flex items-center gap-2 cursor-pointer" onClick={handleScrollToTop}>
              <div className="bg-brand-yellow text-brand-dark font-extrabold px-3 py-1.5 rounded-lg tracking-wider font-display text-base flex items-center gap-1.5 shadow-[0_0_12px_rgba(250,204,21,0.15)]">
                <Car className="w-4.5 h-4.5 fill-brand-dark" />
                AVB
              </div>
              <span className="font-bold text-white text-lg tracking-wider font-display">CABS</span>
            </div>

            <p className="text-zinc-400 text-sm leading-relaxed max-w-sm">
              Premium rides with zero compromise. Your highly trusted partner for all your executive, airport, and long-distance transport requirements across Karnataka.
            </p>

            {/* Social / WhatsApp banner */}
            <div className="pt-2">
              <a
                href="https://chat.whatsapp.com/DvuQSmCGAm8LZa4G9TXOwf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 px-4 py-2.5 rounded-lg hover:bg-emerald-600/20 transition-all"
              >
                <MessageSquare className="w-4 h-4 fill-emerald-400/20" />
                Join WhatsApp Community Link
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="md:col-span-3 space-y-4">
            <h3 className="font-bold text-sm tracking-widest text-zinc-300 uppercase font-display border-b border-zinc-800/60 pb-2">
              Quick Links
            </h3>
            <ul className="space-y-2.5 text-sm text-zinc-400">
              <li>
                <a href="#services" className="hover:text-brand-yellow transition-colors">Our Services</a>
              </li>
              <li>
                <a href="#why-us" className="hover:text-brand-yellow transition-colors">Why Choose Us</a>
              </li>
              <li>
                <a href="#reviews" className="hover:text-brand-yellow transition-colors">Passenger Reviews</a>
              </li>
              <li>
                <a href="#my-bookings" className="hover:text-brand-yellow transition-colors">Track Booking</a>
              </li>
            </ul>
          </div>

          {/* Column 3: Contacts */}
          <div className="md:col-span-4 space-y-4">
            <h3 className="font-bold text-sm tracking-widest text-zinc-300 uppercase font-display border-b border-zinc-800/60 pb-2">
              Contact Desk
            </h3>
            <div className="space-y-3.5 text-zinc-400 text-sm">
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold block">Call Representatives (24/7)</span>
                <div className="space-y-1 font-mono text-xs">
                  <a href="tel:7338653351" className="block text-zinc-300 hover:text-brand-yellow transition-colors">+91 7338653351</a>
                  <a href="tel:9591128048" className="block text-zinc-300 hover:text-brand-yellow transition-colors">+91 9591128048</a>
                  <a href="tel:8073166031" className="block text-zinc-300 hover:text-brand-yellow transition-colors">+91 8073166031</a>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold block">Support Email</span>
                <a href="mailto:avbcabz@gmail.com" className="text-zinc-300 hover:text-brand-yellow transition-colors font-mono text-xs">
                  avbcabz@gmail.com
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="border-t border-zinc-800/80 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© 2026 AVB CABS. All rights reserved. *Terms and conditions apply.</p>
          
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-zinc-600" />
              100% Secure Payments
            </span>
            <button
              onClick={handleScrollToTop}
              className="hover:text-brand-yellow transition-colors flex items-center gap-1 font-semibold cursor-pointer"
            >
              Back to top
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}
