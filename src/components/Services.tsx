import React from 'react';
import { motion } from 'motion/react';
import { Plane, Compass, ArrowRightLeft, Route, BadgePercent, ChevronRight, Check } from 'lucide-react';

export default function Services() {
  const services = [
    {
      id: 'airport',
      title: 'Airport Transfers',
      icon: Plane,
      tagline: 'Reliable Kempegowda Airport Flat-Rate Rides',
      description: 'Streamlined transfers to and from BLR Airport. Includes free flight tracking, wait time protection, and professional meet-and-greet service.',
      highlights: ['Flat pricing structure', 'No flight delay penalties', 'Pristine vehicle interiors', 'Airport toll inclusive options'],
      bgImage: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=600&auto=format&fit=crop'
    },
    {
      id: 'local',
      title: 'Local Hourly Rentals',
      icon: Compass,
      tagline: 'Flexible Packages for Bangalore Exploration',
      description: 'Rent a luxury car with a dedicated professional chauffeur by the hour. Perfect for business meetings, wedding logistics, or shopping itineraries.',
      highlights: ['Packages starting from 2 hrs', 'Unlimited multi-stop freedom', 'Polite, city-savvy drivers', 'Real-time booking adjustment'],
      bgImage: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=600&auto=format&fit=crop'
    },
    {
      id: 'oneway',
      title: 'One-Way Outstation',
      icon: Route,
      tagline: 'Flat Intercity Travel Without Return Fare',
      description: 'Travel outstation from Bangalore with zero return charges. High-quality vehicles fully optimized for long-distance cruising safety.',
      highlights: ['Only pay for distance travelled', 'Fully certified GPS cabs', 'No hidden fuel surcharges', 'Door-to-door drops'],
      bgImage: 'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?q=80&w=600&auto=format&fit=crop'
    },
    {
      id: 'roundtrip',
      title: 'Round-Trip Outstation',
      icon: ArrowRightLeft,
      tagline: 'Scenic Getaways with Relaxing Return Travel',
      description: 'Secure round-trip bookings to weekend destinations. Rest easy knowing your reliable professional driver remains at your disposal.',
      highlights: ['Up to 10% round-trip discounts', 'Multi-day trip support', 'Experienced highway drivers', 'Customizable sightseeing stops'],
      bgImage: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=600&auto=format&fit=crop'
    }
  ];

  return (
    <section id="services" className="py-24 bg-zinc-950 border-t border-zinc-900 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Block */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="text-brand-yellow font-mono text-xs font-bold tracking-widest uppercase bg-brand-yellow/10 border border-brand-yellow/20 px-3 py-1.5 rounded-full inline-block mb-4">
            WHAT WE PROVIDE
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold font-display tracking-tight text-white mb-4">
            Premium Transport Services
          </h2>
          <p className="text-zinc-400 text-lg">
            High-end mobility tailored for executive comfort, airport precision, and outstation freedom. No compromise on safety, cleanliness, or punctuality.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {services.map((service, index) => {
            const IconComponent = service.icon;
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl hover:border-brand-yellow/30 hover:shadow-brand-yellow/5 transition-all duration-300 flex flex-col justify-between"
              >
                {/* Visual Header */}
                <div className="relative h-48 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent z-10" />
                  <img
                    src={service.bgImage}
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-60"
                  />
                  
                  {/* Icon floating */}
                  <div className="absolute top-4 left-4 z-20 bg-brand-yellow text-brand-dark p-3.5 rounded-xl shadow-lg shadow-brand-yellow/10">
                    <IconComponent className="w-6 h-6 stroke-[2.2]" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8 flex-grow flex flex-col justify-between">
                  <div>
                    <span className="text-brand-yellow font-mono text-xs font-semibold tracking-wider block mb-1">
                      {service.tagline}
                    </span>
                    <h3 className="text-2xl font-bold text-white font-display mb-3">
                      {service.title}
                    </h3>
                    <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                      {service.description}
                    </p>
                  </div>

                  {/* Highlights Grid */}
                  <div className="border-t border-zinc-800/80 pt-5 mt-auto">
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                      {service.highlights.map((item, hIdx) => (
                        <li key={hIdx} className="flex items-center gap-2.5 text-xs text-zinc-300">
                          <span className="flex-shrink-0 w-4 h-4 bg-brand-yellow/10 border border-brand-yellow/20 text-brand-yellow rounded-full flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                          <span className="truncate">{item}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Book Now trigger */}
                    <button
                      onClick={() => {
                        const target = document.querySelector('#booking-stage');
                        if (target) target.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-brand-yellow hover:text-white transition-colors cursor-pointer group-hover:translate-x-1 duration-200"
                    >
                      Book this package
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
