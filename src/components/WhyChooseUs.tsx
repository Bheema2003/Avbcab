import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Clock, Car, CreditCard, Headphones, CigaretteOff, Check } from 'lucide-react';

export default function WhyChooseUs() {
  const differentiators = [
    {
      title: 'Secured Booking',
      description: 'Do online payment with zero security risk. Fully encrypted transaction gateways.',
      icon: ShieldCheck,
      color: 'bg-yellow-400 text-black'
    },
    {
      title: 'Reliable Services',
      description: 'We are punctual and we take our customers as our highest and first priority.',
      icon: Clock,
      color: 'bg-zinc-800 text-brand-yellow border border-zinc-700/50'
    },
    {
      title: 'Luxury Cars',
      description: 'We have a wide variety of pristine luxury and standard cars available in our fleet.',
      icon: Car,
      color: 'bg-zinc-800 text-brand-yellow border border-zinc-700/50'
    },
    {
      title: 'Credit Cards Accepted',
      description: 'We accept all major credit cards without any hassle via our secure online system.',
      icon: CreditCard,
      color: 'bg-zinc-800 text-brand-yellow border border-zinc-700/50'
    },
    {
      title: 'Customer Service',
      description: 'You can always reach us 24/7 for any query, flight changes, or updates.',
      icon: Headphones,
      color: 'bg-zinc-800 text-brand-yellow border border-zinc-700/50'
    },
    {
      title: 'No Smoking Policy',
      description: 'Strict no-smoking policy inside all vehicles to maintain fresh, pleasant rides.',
      icon: CigaretteOff,
      color: 'bg-zinc-800 text-brand-yellow border border-zinc-700/50'
    }
  ];

  return (
    <section id="why-us" className="py-24 bg-zinc-900 border-t border-zinc-800/60 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title Block */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-16">
          <div className="max-w-xl">
            <span className="text-brand-yellow font-mono text-xs font-bold tracking-widest uppercase bg-brand-yellow/10 border border-brand-yellow/20 px-3 py-1.5 rounded-full inline-block mb-4">
              WHY CHOOSE AVB CABS
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold font-display tracking-tight text-white">
              Uncompromising Quality in Every Mile
            </h2>
          </div>
          <p className="text-zinc-400 text-sm sm:text-base max-w-sm">
            We hold ourselves to a higher standard of punctuality, driver safety, and cleanliness so you can relax.
          </p>
        </div>

        {/* Bento/Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {differentiators.map((diff, index) => {
            const IconComponent = diff.icon;
            return (
              <motion.div
                key={diff.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="group bg-zinc-950 p-8 rounded-2xl border border-zinc-800/80 hover:border-brand-yellow/30 hover:shadow-lg hover:shadow-brand-yellow/5 transition-all duration-300"
              >
                {/* Icon Wrapper */}
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-105 ${diff.color}`}>
                  <IconComponent className="w-7 h-7 stroke-[2]" />
                </div>

                <h3 className="text-xl font-bold text-white mb-3 font-display">
                  {diff.title}
                </h3>
                
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {diff.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Real Statistics Banner (Only accurate info preserved) */}
        <div className="mt-20 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 p-8 sm:p-12 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="space-y-2">
            <h4 className="text-xl sm:text-2xl font-bold text-white font-display">
              Need a custom multi-day travel plan?
            </h4>
            <p className="text-zinc-400 text-sm sm:text-base">
              Speak directly to our luxury fleet management team for corporate accounts and customizable routes.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 flex-shrink-0">
            <a
              href="tel:9591128048"
              className="bg-brand-yellow hover:bg-yellow-400 text-brand-dark font-bold text-sm px-6 py-3.5 rounded-xl transition-all shadow-md shadow-brand-yellow/15 flex items-center gap-2"
            >
              <PhoneCallIcon />
              Call Fleet Desk
            </a>
            <a
              href="https://chat.whatsapp.com/DvuQSmCGAm8LZa4G9TXOwf"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm px-6 py-3.5 rounded-xl transition-all border border-zinc-750 flex items-center gap-2"
            >
              Message on WhatsApp
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}

function PhoneCallIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-phone-call">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
      <path d="M14.05 2a9 9 0 0 1 8 8"/>
      <path d="M14.05 6A5 5 0 0 1 18 10"/>
    </svg>
  );
}
