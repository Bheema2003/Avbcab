import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Booking } from '../types';
import { 
  Trash2, Phone, MessageSquare, AlertCircle, Calendar, Clock, 
  MapPin, RefreshCw, Star, Info, User, ShieldAlert 
} from 'lucide-react';

interface MyBookingsProps {
  bookings: Booking[];
  onCancelBooking: (id: string) => void;
  currentUser: any | null;
  onLoginClick: () => void;
  onSignupClick: () => void;
  onRefreshBookings: () => void;
  refreshing: boolean;
}

export default function MyBookings({ 
  bookings, 
  onCancelBooking, 
  currentUser, 
  onLoginClick, 
  onSignupClick,
  onRefreshBookings,
  refreshing
}: MyBookingsProps) {
  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-500';
      case 'Confirmed':
        return 'bg-sky-500/10 border-sky-500/30 text-sky-400';
      case 'Driver Assigned':
        return 'bg-sky-500/15 border-sky-500/40 text-brand-yellow';
      case 'Completed':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case 'Cancelled':
        return 'bg-red-500/10 border-red-500/30 text-red-500';
      default:
        return 'bg-zinc-800 text-zinc-300';
    }
  };

  const getWhatsAppMessageLink = (booking: Booking) => {
    const text = `*Support Request - AVB CABS* 🚖
----------------------------------
*Booking ID:* ${booking.id}
*Service Type:* ${booking.serviceType}
*Pickup:* ${booking.pickup}
*Date:* ${booking.date}
*Time:* ${booking.time}

_I have a question about my booking. Please connect me to a fleet representative._`;
    return `https://wa.me/917338653351?text=${encodeURIComponent(text)}`;
  };

  return (
    <section id="my-bookings" className="py-24 bg-zinc-950 border-t border-zinc-900 scroll-mt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-brand-yellow font-mono text-xs font-bold tracking-widest uppercase bg-brand-yellow/10 border border-brand-yellow/20 px-3 py-1.5 rounded-full inline-block mb-4">
            RIDE TRACKING PORTAL
          </span>
          <h2 className="text-4xl font-bold font-display tracking-tight text-white mb-4">
            My Travel History
          </h2>
          <p className="text-zinc-400 text-base font-light">
            Review your active and historic travel schedules. Synced directly from our secure fleet database.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!currentUser ? (
            /* Logged Out State Prompt */
            <motion.div
              key="logged-out-portal"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-8 sm:p-12 text-center max-w-md mx-auto relative overflow-hidden"
            >
              {/* Subtle background glow */}
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-brand-yellow/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="w-14 h-14 bg-brand-yellow/15 border border-brand-yellow/30 text-brand-yellow rounded-full flex items-center justify-center mx-auto mb-6">
                <User className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Sign In to Track Bookings</h3>
              <p className="text-zinc-400 text-sm mb-8 font-light leading-relaxed">
                Log in or register your account to view live dispatch statuses, access booking confirmations, and manage your luxury schedules.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={onLoginClick}
                  className="bg-brand-yellow hover:bg-yellow-400 text-brand-dark font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-md cursor-pointer flex-1"
                >
                  SIGN IN
                </button>
                <button
                  onClick={onSignupClick}
                  className="bg-zinc-800 hover:bg-zinc-750 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all border border-zinc-700 cursor-pointer flex-1"
                >
                  CREATE ACCOUNT
                </button>
              </div>
            </motion.div>
          ) : (
            /* Logged In Bookings Panel */
            <motion.div
              key="bookings-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Synced status header */}
              <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-4 rounded-xl mb-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  <p className="text-zinc-300 font-medium">
                    Logged in as <span className="text-brand-yellow font-semibold">{currentUser.name}</span>
                  </p>
                </div>
                <button
                  onClick={onRefreshBookings}
                  disabled={refreshing}
                  className="text-zinc-400 hover:text-brand-yellow transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-yellow' : ''}`} />
                  {refreshing ? 'Syncing...' : 'Sync Live Status'}
                </button>
              </div>

              {bookings.length === 0 ? (
                <motion.div
                  key="no-bookings-auth"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-10 text-center max-w-lg mx-auto"
                >
                  <div className="w-12 h-12 bg-zinc-800/80 text-zinc-500 rounded-full flex items-center justify-center mx-auto mb-5 border border-zinc-700/50">
                    <Info className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">No bookings placed yet</h3>
                  <p className="text-zinc-400 text-sm mb-6 max-w-xs mx-auto font-light leading-relaxed">
                    You don't have any bookings in your history yet. Request a luxury ride using the booking engine above.
                  </p>
                  <button
                    onClick={() => {
                      const target = document.querySelector('#booking-stage');
                      if (target) target.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="bg-brand-yellow hover:bg-yellow-400 text-brand-dark font-bold text-xs px-5 py-3 rounded-lg transition-colors cursor-pointer"
                  >
                    BOOK A RIDE NOW
                  </button>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  {bookings.map((booking) => (
                    <motion.div
                      layout
                      key={booking.id}
                      className={`border rounded-2xl overflow-hidden shadow-lg transition-all duration-300 ${
                        booking.status === 'Confirmed' || booking.status === 'Cancelled' || booking.status === 'Completed'
                          ? 'opacity-50 saturate-[0.75] hover:opacity-90 bg-zinc-900/30 border-zinc-950'
                          : 'opacity-100 bg-zinc-900 border border-zinc-800/80 shadow-[0_0_25px_rgba(245,158,11,0.03)] hover:border-zinc-700'
                      }`}
                    >
                      {/* Top Bar */}
                      <div className="bg-zinc-950 px-6 py-4 border-b border-zinc-800/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold text-brand-yellow">{booking.id}</span>
                          <span className="text-zinc-600">|</span>
                          <span className="text-xs text-zinc-400 font-mono">Booked on {booking.createdAt ? booking.createdAt.split(',')[0] : 'Today'}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${getStatusColor(booking.status)}`}>
                            {booking.status}
                          </span>
                          {booking.status === 'Pending' && (
                            <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              Awaiting Dispatcher
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Body Details */}
                      <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 text-left">
                        <div className="md:col-span-8 space-y-4">
                          {/* Addresses */}
                          <div className="relative pl-6 space-y-4">
                            {/* Timeline Connector */}
                            <div className="absolute left-[7px] top-[10px] bottom-[10px] w-[2px] bg-zinc-800" />

                            {/* Pickup Address */}
                            <div className="relative">
                              <div className="absolute -left-[23px] top-[4px] w-3.5 h-3.5 rounded-full bg-brand-yellow/20 border border-brand-yellow flex items-center justify-center">
                                <div className="w-1.5 h-1.5 bg-brand-yellow rounded-full" />
                              </div>
                              <div>
                                <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block">Pickup</span>
                                <span className="text-white text-sm font-medium">{booking.pickup}</span>
                              </div>
                            </div>

                            {/* Drop Address */}
                            {booking.serviceType !== 'Local' && (
                              <div className="relative">
                                <div className="absolute -left-[23px] top-[4px] w-3.5 h-3.5 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center">
                                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                </div>
                                <div>
                                  <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block">Destination</span>
                                  <span className="text-white text-sm font-medium">{booking.drop}</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Schedule details */}
                          <div className="flex flex-wrap gap-6 pt-2">
                            <div className="flex items-center gap-2 text-zinc-300">
                              <Calendar className="w-4 h-4 text-brand-yellow" />
                              <span className="text-xs font-semibold font-mono">{booking.date}</span>
                            </div>
                            <div className="flex items-center gap-2 text-zinc-300">
                              <Clock className="w-4 h-4 text-brand-yellow" />
                              <span className="text-xs font-semibold font-mono">{booking.time}</span>
                            </div>
                          </div>
                        </div>

                        {/* Cost / Dispatcher info */}
                        <div className="md:col-span-4 bg-zinc-950/50 p-4 rounded-xl border border-zinc-800 flex flex-col justify-center">
                          <div>
                            <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block font-mono">SERVICE TYPE</span>
                            <span className="text-brand-yellow text-sm font-bold block">{booking.serviceType}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions Bar */}
                      <div className="bg-zinc-950/60 px-6 py-4 border-t border-zinc-800/40 flex flex-wrap gap-3 items-center justify-between">
                        <div className="flex flex-wrap gap-3">
                          <a
                            href={getWhatsAppMessageLink(booking)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-colors flex items-center gap-1.5"
                          >
                            <MessageSquare className="w-3.5 h-3.5 fill-white" />
                            Chat Support
                          </a>
                          <a
                            href="tel:7338653351"
                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition-all border border-zinc-750 flex items-center gap-1.5"
                          >
                            <Phone className="w-3.5 h-3.5 text-brand-yellow" />
                            Call Dispatch
                          </a>
                        </div>

                        {booking.status !== 'Cancelled' && booking.status !== 'Completed' && (
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to cancel this booking? There are no cancellation fees.')) {
                                onCancelBooking(booking.id);
                                
                                // Prepare cancellation text to copy
                                const cancelText = `*Cancellation Request - AVB CABS* 🚖\n----------------------------------\n*Booking ID:* ${booking.id}\n*Service:* ${booking.serviceType}\n*Date/Time:* ${booking.date} at ${booking.time}\n\n_Please cancel this booking._`;
                                
                                try {
                                  navigator.clipboard.writeText(cancelText).then(() => {
                                    alert('Booking status set to Cancelled on our database. Cancellation details have been copied to your clipboard. We are now opening our WhatsApp Group so you can paste and notify our dispatch team instantly.');
                                    window.open('https://chat.whatsapp.com/DvuQSmCGAm8LZa4G9TXOwf', '_blank');
                                  }).catch(() => {
                                    window.open('https://chat.whatsapp.com/DvuQSmCGAm8LZa4G9TXOwf', '_blank');
                                  });
                                } catch (err) {
                                  window.open('https://chat.whatsapp.com/DvuQSmCGAm8LZa4G9TXOwf', '_blank');
                                }
                              }
                            }}
                            className="text-red-400 hover:text-red-300 font-semibold text-xs py-2 px-3 hover:bg-red-500/10 rounded-md transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Cancel Booking
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
