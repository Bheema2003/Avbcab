import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ServiceType, Booking } from '../types';
import { 
  Calendar, Clock, MapPin, User, Phone, Check, 
  ChevronRight, MessageSquare, AlertCircle, Sparkles, X, ShieldCheck 
} from 'lucide-react';

interface BookingFormProps {
  onBookingCreated: (booking: Booking) => void;
  currentUser: any | null;
  onUnauthorizedAttempt: (pendingBooking: any) => void;
}

export default function BookingForm({ onBookingCreated, currentUser, onUnauthorizedAttempt }: BookingFormProps) {
  const [activeTab, setActiveTab] = useState<ServiceType>('Airport');
  
  // Form fields state
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [airportOption, setAirportOption] = useState<'to' | 'from'>('to');
  const [packageType, setPackageType] = useState('8 hrs / 80 km');
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('');
  
  // Status state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<Booking | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Auto-fill customer profile details if logged in
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setContact(currentUser.contact || '');
    }
  }, [currentUser]);

  // Listen for scroll event to dismiss popup when open (Goal 1)
  useEffect(() => {
    if (!bookingResult) return;

    let initialScrollY = window.scrollY;
    
    const handleScroll = () => {
      // Dismiss popup on scroll of more than 15px
      if (Math.abs(window.scrollY - initialScrollY) > 15) {
        handleReset();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [bookingResult]);

  // Helper to generate price estimate
  const getPriceEstimate = (): string => {
    switch (activeTab) {
      case 'Airport':
        return '₹1,249 - ₹1,499 (Flat rate)';
      case 'Local':
        if (packageType.includes('2 hrs')) return '₹999 (Standard)';
        if (packageType.includes('4 hrs')) return '₹1,499 (Premium)';
        if (packageType.includes('8 hrs')) return '₹2,499 (Deluxe)';
        return '₹3,499 (All Day)';
      case 'One Way':
        return '₹13/km (Est. ₹1,800 total)';
      case 'Round Trip':
        return '₹11/km (Est. ₹3,200 total - 10% Off)';
      default:
        return '₹1,500';
    }
  };

  const getWhatsAppMessageText = (booking: Booking) => {
    return `*New Booking Request - AVB CABS* 🚖
----------------------------------
*Booking ID:* ${booking.id}
*Service Type:* ${booking.serviceType}
*Customer Name:* ${booking.name}
*Contact Number:* ${booking.contact}
*Pickup:* ${booking.pickup}
*Drop/Destination:* ${booking.drop}
*Date:* ${booking.date}
*Time:* ${booking.time}

_Please confirm my luxury ride with a professional driver._ Thank you!`;
  };

  const getWhatsAppMessageLink = (booking: Booking) => {
    const numbers = ['7338653351', '9591128048', '8073166031'];
    const primaryNum = numbers[0];
    const text = getWhatsAppMessageText(booking);
    return `https://wa.me/91${primaryNum}?text=${encodeURIComponent(text)}`;
  };

  const copyToClipboardAndOpenGroup = (booking: Booking) => {
    const text = getWhatsAppMessageText(booking);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 4000);
      window.open('https://chat.whatsapp.com/DvuQSmCGAm8LZa4G9TXOwf', '_blank');
      // Reset the success popup after 1.5 seconds so it clears out cleanly
      setTimeout(() => {
        handleReset();
      }, 1500);
    }).catch((err) => {
      console.error('Failed to copy text', err);
      window.open('https://chat.whatsapp.com/DvuQSmCGAm8LZa4G9TXOwf', '_blank');
      setTimeout(() => {
        handleReset();
      }, 1500);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Basic validation
    const targetPickup = activeTab === 'Airport' && airportOption === 'from' ? "Kempegowda Int'l Airport (BLR)" : pickup;
    const targetDrop = activeTab === 'Airport' && airportOption === 'to' ? "Kempegowda Int'l Airport (BLR)" : (activeTab === 'Local' ? `Local Package (${packageType})` : drop);

    if (!name || !contact || !targetPickup || !targetDrop || !date || !time) {
      setErrorMessage('Please fill out all required fields.');
      return;
    }

    if (contact.length !== 10 || !/^\d+$/.test(contact)) {
      setErrorMessage('Contact number must be exactly 10 digits.');
      return;
    }

    const bookingDetails = {
      serviceType: activeTab,
      name,
      contact,
      pickup: targetPickup,
      drop: targetDrop,
      date,
      time,
      priceEstimate: getPriceEstimate()
    };

    // If user is not logged in, intercept and trigger auth flow
    if (!currentUser) {
      onUnauthorizedAttempt(bookingDetails);
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit directly to express backend database
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          bookingDetails
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setBookingResult(data.booking);
        onBookingCreated(data.booking);
      } else {
        setErrorMessage(data.error || 'Failed to submit booking on database.');
      }
    } catch (err) {
      setErrorMessage('Network connection failed. Saved to local storage fallback instead.');
      // Local fallback
      const localBooking: Booking = {
        id: 'AVB-L-' + Math.floor(100000 + Math.random() * 900000),
        status: 'Pending',
        createdAt: new Date().toLocaleDateString('en-IN'),
        ...bookingDetails
      };
      setBookingResult(localBooking);
      onBookingCreated(localBooking);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setName(currentUser?.name || '');
    setContact(currentUser?.contact || '');
    setPickup('');
    setDrop('');
    setDate('');
    setTime('');
    setReturnDate('');
    setReturnTime('');
    setBookingResult(null);
    setErrorMessage(null);
  };

  const tabs: { id: ServiceType; label: string }[] = [
    { id: 'Airport', label: 'Airport' },
    { id: 'Local', label: 'Local Rental' },
    { id: 'One Way', label: 'One Way' },
    { id: 'Round Trip', label: 'Round Trip' }
  ];

  return (
    <div className="w-full bg-zinc-900/80 backdrop-blur-md border border-zinc-800/80 rounded-2xl shadow-2xl overflow-hidden max-w-lg mx-auto">
      {/* Alert Strip */}
      <div className="bg-brand-yellow/10 border-b border-brand-yellow/20 px-6 py-2.5 flex items-center justify-between text-xs text-brand-yellow font-medium">
        <span className="flex items-center gap-1.5 font-mono">
          <span className="w-1.5 h-1.5 bg-brand-yellow rounded-full animate-ping"></span>
          OFFER ACTIVE: UP TO 10% DISCOUNT
        </span>
        <span className="opacity-80">Book Online</span>
      </div>

      <div className="p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-white font-display tracking-tight mb-6 text-left">
          Book Your Premium Ride
        </h2>

        {/* Service Tabs */}
        <div className="grid grid-cols-4 bg-zinc-950 p-1 rounded-xl mb-6 border border-zinc-800/50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
              }}
              className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-brand-yellow text-brand-dark shadow-md font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs flex items-center gap-2 mb-4 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            <div>
              <label className="block text-zinc-400 text-xs font-semibold mb-1.5">Your Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-yellow/50 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 text-xs font-semibold mb-1.5">Contact Number *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                <input
                  type="tel"
                  required
                  placeholder="10-digit number"
                  pattern="[0-9]{10}"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-yellow/50 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm outline-none transition-colors font-mono"
                />
              </div>
            </div>
          </div>

          {/* Service-Specific Fields */}
          <div className="space-y-4 text-left">
            {activeTab === 'Airport' && (
              <div className="grid grid-cols-2 gap-3 bg-zinc-950 p-1.5 border border-zinc-800/80 rounded-xl mb-2">
                <button
                  type="button"
                  onClick={() => setAirportOption('to')}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    airportOption === 'to'
                      ? 'bg-zinc-850 text-brand-yellow border border-brand-yellow/15 shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  To Airport
                </button>
                <button
                  type="button"
                  onClick={() => setAirportOption('from')}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    airportOption === 'from'
                      ? 'bg-zinc-850 text-brand-yellow border border-brand-yellow/15 shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  From Airport
                </button>
              </div>
            )}

            {/* Pickup Location */}
            {!(activeTab === 'Airport' && airportOption === 'from') && (
              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1.5">Pickup Location *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-emerald-500" />
                  <input
                    type="text"
                    required
                    placeholder="Enter pickup address / area"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-yellow/50 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Drop Location */}
            {activeTab !== 'Local' && !(activeTab === 'Airport' && airportOption === 'to') && (
              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1.5">Drop Destination *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-rose-500" />
                  <input
                    type="text"
                    required={activeTab !== 'Local'}
                    placeholder="Enter drop address / destination"
                    value={drop}
                    onChange={(e) => setDrop(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-yellow/50 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Local Packages select */}
            {activeTab === 'Local' && (
              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1.5">Select Rental Package *</label>
                <select
                  value={packageType}
                  onChange={(e) => setPackageType(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-yellow/50 rounded-lg py-2.5 px-4 text-white text-sm outline-none transition-colors appearance-none cursor-pointer"
                >
                  <option value="2 hrs / 20 km">2 hrs / 20 km (Short Run)</option>
                  <option value="4 hrs / 40 km">4 hrs / 40 km (Business Run)</option>
                  <option value="8 hrs / 80 km">8 hrs / 80 km (Standard Day)</option>
                  <option value="12 hrs / 120 km">12 hrs / 120 km (Full Day Rental)</option>
                </select>
              </div>
            )}

            {/* Timings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1.5">Pickup Date *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-yellow/50 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm outline-none transition-colors font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1.5">Pickup Time *</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-yellow/50 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm outline-none transition-colors font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand-yellow hover:bg-yellow-400 text-brand-dark font-bold py-4 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-brand-yellow/5 flex items-center justify-center gap-2 mt-6 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-brand-dark border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>REQUEST LIVERY DISPATCH</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>
      </div>

      {/* SUCCESS CONFIRMATION POPUP MODAL (User Request Goal 1) */}
      <AnimatePresence>
        {bookingResult && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            {/* Dark glass cover overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleReset}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Popup Invoice Receipt */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative bg-zinc-900 border border-emerald-500/30 rounded-2xl w-full max-w-md p-6 sm:p-8 overflow-hidden shadow-2xl z-10 text-left"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500" />
              
              {/* Close Button */}
              <button
                onClick={handleReset}
                className="absolute top-5 right-5 p-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Status Header */}
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                  <Check className="w-7 h-7 stroke-[2.5]" />
                </div>
                
                <span className="bg-emerald-950 border border-emerald-900/50 text-emerald-400 font-mono text-[10px] font-bold px-3 py-1 rounded-full inline-block mb-2 uppercase tracking-wider">
                  SUBMISSION SECURED
                </span>

                <h3 className="text-2xl font-extrabold font-display text-white tracking-tight">
                  Booking Submitted Successfully
                </h3>
                <p className="text-zinc-400 text-xs mt-1.5 font-light leading-relaxed">
                  Your pickup ride schedule has been logged in our secure database. A dispatcher will assign a professional chauffeur.
                </p>
              </div>

              {/* Ride Summary Invoice Receipt */}
              <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-5 mb-6 text-xs font-mono text-zinc-300 space-y-2.5">
                <div className="flex justify-between border-b border-zinc-800 pb-2.5 mb-1">
                  <span className="text-zinc-500">BOOKING REFERENCE</span>
                  <span className="text-brand-yellow font-bold text-sm">{bookingResult.id}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-zinc-500">SERVICE DETAILS</span>
                  <span className="text-white font-semibold">{bookingResult.serviceType}</span>
                </div>

                <div className="flex justify-between items-start">
                  <span className="text-zinc-500 shrink-0">PICKUP LOCATION</span>
                  <span className="text-white font-semibold text-right max-w-[200px] font-sans truncate" title={bookingResult.pickup}>
                    {bookingResult.pickup}
                  </span>
                </div>

                {bookingResult.serviceType !== 'Local' && (
                  <div className="flex justify-between items-start">
                    <span className="text-zinc-500 shrink-0">DESTINATION</span>
                    <span className="text-white font-semibold text-right max-w-[200px] font-sans truncate" title={bookingResult.drop}>
                      {bookingResult.drop}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-zinc-500">SCHEDULE DATE/TIME</span>
                  <span className="text-white font-semibold">{bookingResult.date} at {bookingResult.time}</span>
                </div>

                <div className="flex justify-between border-t border-zinc-800 pt-2.5 mt-1">
                  <span className="text-zinc-500 font-bold">DISPATCH STATUS</span>
                  <span className="text-amber-500 font-extrabold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></span>
                    {bookingResult.status}
                  </span>
                </div>
              </div>

              {/* CTA Action Buttons */}
              <div className="flex flex-col gap-3">
                <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest font-mono">Confirm Dispatch Options</p>
                
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => copyToClipboardAndOpenGroup(bookingResult)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm py-3.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer relative"
                >
                  <MessageSquare className="w-4 h-4 fill-white" />
                  {copied ? 'COPIED! OPENING WHATSAPP GROUP...' : 'CONFIRM & POST IN AVB CAB GROUP'}
                </motion.button>

                <p className="text-[11px] text-zinc-400 text-center leading-relaxed font-sans px-1 bg-zinc-900/50 py-2 rounded-lg border border-zinc-800/50">
                  ⚡ <strong className="text-brand-yellow font-bold">How it works:</strong> Clicking above copies the complete booking details and opens our WhatsApp Group. Just paste and send!
                </p>

                {copied && (
                  <p className="text-[11px] text-emerald-400 text-center font-semibold font-mono animate-pulse">
                    ✓ Booking details copied successfully! Paste them in the group.
                  </p>
                )}

                <div className="h-[1px] bg-zinc-800/80 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    handleReset();
                    const historySection = document.querySelector('#my-bookings');
                    if (historySection) {
                      historySection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="bg-brand-yellow hover:bg-yellow-400 text-brand-dark font-bold text-sm py-3 px-4 rounded-xl transition-all shadow-md cursor-pointer text-center"
                >
                  VIEW BOOKING HISTORY
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
