import React, { useState, useEffect, useRef } from 'react';
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
  queuedBooking?: any | null;
  onQueuedBookingConsumed?: () => void;
}

export default function BookingForm({
  onBookingCreated,
  currentUser,
  onUnauthorizedAttempt,
  queuedBooking,
  onQueuedBookingConsumed
}: BookingFormProps) {
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
  const [pendingBooking, setPendingBooking] = useState<Booking | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [now, setNow] = useState<Date>(() => new Date());
  const timePickerRef = useRef<HTMLDivElement>(null);

  const getLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getLocalTimeString = (d: Date) => {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const todayStr = getLocalDateString(now);
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const isTodaySelected = !date || date === todayStr;

  // Keep current time fresh and handle click outside time picker
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (timePickerRef.current && !timePickerRef.current.contains(e.target as Node)) {
        setIsTimePickerOpen(false);
      }
    };
    if (isTimePickerOpen) {
      setNow(new Date());
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isTimePickerOpen]);

  const formatDisplayTime = (time24: string) => {
    if (!time24) return '';
    const [hStr, mStr] = time24.split(':');
    const h = Number(hStr);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${String(h12).padStart(2, '0')}:${mStr} ${period}`;
  };

  const formatHourLabel = (h: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${String(h12).padStart(2, '0')} ${period}`;
  };

  const selectedHour = time ? Number(time.split(':')[0]) : null;
  const selectedMinute = time ? Number(time.split(':')[1]) : null;

  const handleDateChange = (newDate: string) => {
    if (!newDate) {
      setDate('');
      return;
    }
    if (newDate < todayStr) {
      setErrorMessage('Previous dates cannot be selected. Please pick today or a future date.');
      setDate(todayStr);
      return;
    }
    setErrorMessage(null);
    setDate(newDate);
    if (newDate === todayStr && time) {
      const currentTimeStr = getLocalTimeString(new Date());
      if (time < currentTimeStr) {
        setTime('');
      }
    }
  };

  const handleSelectHour = (h: number) => {
    const freshNow = new Date();
    const freshToday = getLocalDateString(freshNow);
    const freshHour = freshNow.getHours();
    const freshMin = freshNow.getMinutes();
    const checkToday = !date || date === freshToday;

    if (checkToday && h < freshHour) return;

    let nextMin = selectedMinute ?? 0;
    if (checkToday && h === freshHour && nextMin < freshMin) {
      nextMin = freshMin;
    }
    setErrorMessage(null);
    setTime(`${String(h).padStart(2, '0')}:${String(nextMin).padStart(2, '0')}`);
  };

  const handleSelectMinute = (m: number) => {
    const freshNow = new Date();
    const freshToday = getLocalDateString(freshNow);
    const freshHour = freshNow.getHours();
    const freshMin = freshNow.getMinutes();
    const checkToday = !date || date === freshToday;

    const targetHour = selectedHour !== null ? selectedHour : freshHour;
    if (checkToday && (targetHour < freshHour || (targetHour === freshHour && m < freshMin))) {
      return;
    }
    setErrorMessage(null);
    setTime(`${String(targetHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  };

  // Auto-fill customer profile details if logged in
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setContact(currentUser.contact || '');
    }
  }, [currentUser]);

  // Open Confirmation Required modal automatically when returning from guest Login/Signup
  useEffect(() => {
    if (currentUser && queuedBooking) {
      const draftBooking: Booking = {
        id: queuedBooking.id || 'AVB-T-' + Math.floor(100000 + Math.random() * 900000),
        status: 'Pending',
        createdAt: new Date().toLocaleDateString('en-IN'),
        ...queuedBooking,
        name: queuedBooking.name || currentUser.name || '',
        contact: queuedBooking.contact || currentUser.contact || ''
      };
      setPendingBooking(draftBooking);
      onQueuedBookingConsumed?.();
    }
  }, [currentUser, queuedBooking]);

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
    return `*New Booking Request - AVB CABS*
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

  const WHATSAPP_NUMBER = '919591128048';

  const getWhatsAppUrl = (booking: Booking) => {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(getWhatsAppMessageText(booking))}`;
  };

  const handleConfirmAndPost = async () => {
    if (!pendingBooking || !currentUser || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          bookingDetails: pendingBooking
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        onBookingCreated(data.booking);
        setTimeout(() => {
          handleReset();
        }, 800);
      } else {
        setErrorMessage(data.error || 'Failed to submit booking on database.');
      }
    } catch (err) {
      const localBooking: Booking = {
        ...pendingBooking,
        status: 'Pending',
        createdAt: new Date().toLocaleDateString('en-IN')
      };
      onBookingCreated(localBooking);
      setTimeout(() => {
        handleReset();
      }, 800);
    } finally {
      setIsSubmitting(false);
    }
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

    const latestNow = new Date();
    const latestToday = getLocalDateString(latestNow);
    const latestTime = getLocalTimeString(latestNow);
    if (date < latestToday || (date === latestToday && time < latestTime)) {
      setErrorMessage('Pickup date and time cannot be in the past. Please select current or future time.');
      return;
    }

    if (contact.length !== 10 || !/^\d+$/.test(contact)) {
      setErrorMessage('Contact number must be exactly 10 digits.');
      return;
    }

    const bookingDetails = {
      id: 'AVB-T-' + Math.floor(100000 + Math.random() * 900000),
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

    // Open Confirmation Required modal first before finalizing & posting to WhatsApp
    setPendingBooking({
      ...bookingDetails,
      status: 'Pending',
      createdAt: new Date().toLocaleDateString('en-IN')
    });
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
    setPendingBooking(null);
    setErrorMessage(null);
  };

  const tabs: { id: ServiceType; label: string }[] = [
    { id: 'Airport', label: 'Airport' },
    { id: 'Local', label: 'Local Rental' },
    { id: 'One Way', label: 'One Way' },
    { id: 'Round Trip', label: 'Round Trip' }
  ];

  return (
    <div className="w-full bg-zinc-900/80 backdrop-blur-md border border-zinc-800/80 rounded-2xl shadow-2xl max-w-lg mx-auto">
      {/* Alert Strip */}
      <div className="bg-brand-yellow/10 border-b border-brand-yellow/20 rounded-t-2xl px-6 py-2.5 flex items-center justify-between text-xs text-brand-yellow font-medium">
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
                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-zinc-500 pointer-events-none" />
                  <input
                    type="date"
                    required
                    min={todayStr}
                    value={date}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-yellow/50 rounded-lg py-2.5 pl-10 pr-3 text-white text-sm outline-none transition-colors font-mono [color-scheme:dark]"
                  />
                </div>
              </div>

              <div ref={timePickerRef} className="relative">
                <label className="block text-zinc-400 text-xs font-semibold mb-1.5">Pickup Time *</label>
                <button
                  type="button"
                  onClick={() => setIsTimePickerOpen((prev) => !prev)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-yellow/50 hover:border-zinc-700 rounded-lg py-2.5 pl-10 pr-3 text-left text-sm outline-none transition-colors font-mono relative cursor-pointer flex items-center justify-between"
                >
                  <Clock className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                  <span className={time ? 'text-white' : 'text-zinc-500'}>
                    {time ? formatDisplayTime(time) : '--:-- --'}
                  </span>
                </button>

                {isTimePickerOpen && (
                  <div className="absolute bottom-full mb-2 right-0 w-64 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-3 z-40">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                        Select Time
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const fresh = new Date();
                          setNow(fresh);
                          setTime(getLocalTimeString(fresh));
                          setIsTimePickerOpen(false);
                        }}
                        className="text-[10px] font-mono font-bold text-brand-yellow hover:underline cursor-pointer"
                      >
                        Now
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="block text-[10px] text-zinc-500 font-mono uppercase mb-1 px-1">Hour</span>
                        <div className="max-h-44 overflow-y-auto space-y-0.5 pr-1">
                          {Array.from({ length: 24 }, (_, h) => {
                            const disabled = isTodaySelected && h < currentHour;
                            const isSelected = selectedHour === h;
                            return (
                              <button
                                key={h}
                                type="button"
                                disabled={disabled}
                                onClick={() => handleSelectHour(h)}
                                className={`w-full text-left px-2 py-1.5 rounded-md text-xs font-mono transition-colors ${
                                  disabled
                                    ? 'text-zinc-600 opacity-35 cursor-not-allowed'
                                    : isSelected
                                      ? 'bg-brand-yellow text-brand-dark font-bold cursor-pointer'
                                      : 'text-zinc-200 hover:bg-zinc-800 cursor-pointer'
                                }`}
                              >
                                {formatHourLabel(h)}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <span className="block text-[10px] text-zinc-500 font-mono uppercase mb-1 px-1">Min</span>
                        <div className="max-h-44 overflow-y-auto space-y-0.5 pr-1">
                          {Array.from({ length: 60 }, (_, m) => {
                            const activeHour = selectedHour !== null ? selectedHour : currentHour;
                            const disabled = isTodaySelected && (activeHour < currentHour || (activeHour === currentHour && m < currentMinute));
                            const isSelected = selectedMinute === m;
                            return (
                              <button
                                key={m}
                                type="button"
                                disabled={disabled}
                                onClick={() => handleSelectMinute(m)}
                                className={`w-full text-left px-2 py-1.5 rounded-md text-xs font-mono transition-colors ${
                                  disabled
                                    ? 'text-zinc-600 opacity-35 cursor-not-allowed'
                                    : isSelected
                                      ? 'bg-brand-yellow text-brand-dark font-bold cursor-pointer'
                                      : 'text-zinc-200 hover:bg-zinc-800 cursor-pointer'
                                }`}
                              >
                                {String(m).padStart(2, '0')}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsTimePickerOpen(false)}
                      className="w-full mt-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-semibold py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                )}
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
                <span>BOOK YOUR CAB</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>
      </div>

      {/* CONFIRMATION REQUIRED MODAL (Shown right after clicking BOOK YOUR CAB) */}
      <AnimatePresence>
        {pendingBooking && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            {/* Dark glass cover overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPendingBooking(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Confirmation Required Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative bg-zinc-900 border border-emerald-500/25 rounded-2xl w-full max-w-md p-6 sm:p-8 overflow-hidden shadow-2xl z-10 text-left max-h-[92vh] overflow-y-auto"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-500" />

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setPendingBooking(null)}
                className="absolute top-5 right-5 p-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-all cursor-pointer"
                title="Edit booking details"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Status Header */}
              <div className="text-center mb-6 pt-1">
                <span className="bg-amber-950/90 border border-amber-700/40 text-amber-400 font-mono text-[10px] font-bold px-3.5 py-1 rounded-full inline-block mb-3 uppercase tracking-wider">
                  CONFIRMATION REQUIRED
                </span>

                <h3 className="text-2xl font-extrabold font-display text-white tracking-tight">
                  Confirm Your Ride Schedule
                </h3>
                <p className="text-zinc-400 text-xs mt-2 font-light leading-relaxed max-w-xs mx-auto">
                  Your ride details are ready. Please click below to send your booking on WhatsApp and finalize your ride.
                </p>
              </div>

              {/* Ride Summary Receipt */}
              <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-5 mb-6 text-xs font-mono text-zinc-300 space-y-3">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                  <span className="text-zinc-500">BOOKING REFERENCE</span>
                  <span className="text-brand-yellow font-bold text-sm">{pendingBooking.id}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">SERVICE DETAILS</span>
                  <span className="text-white font-semibold">{pendingBooking.serviceType}</span>
                </div>

                <div className="flex justify-between items-start gap-4">
                  <span className="text-zinc-500 shrink-0">PICKUP LOCATION</span>
                  <span className="text-white font-semibold text-right font-sans break-words" title={pendingBooking.pickup}>
                    {pendingBooking.pickup}
                  </span>
                </div>

                {pendingBooking.serviceType !== 'Local' && (
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-zinc-500 shrink-0">DESTINATION</span>
                    <span className="text-white font-semibold text-right font-sans break-words" title={pendingBooking.drop}>
                      {pendingBooking.drop}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-start gap-4">
                  <span className="text-zinc-500 shrink-0">SCHEDULE DATE/TIME</span>
                  <span className="text-white font-semibold text-right">
                    {pendingBooking.date} at {pendingBooking.time}
                  </span>
                </div>

                <div className="flex justify-between items-center border-t border-zinc-800 pt-3">
                  <span className="text-zinc-500 font-bold">DISPATCH STATUS</span>
                  <span className="text-amber-500 font-extrabold flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                    {pendingBooking.status}
                  </span>
                </div>
              </div>

              {/* Error message inside modal if save fails */}
              {errorMessage && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs flex items-center gap-2 mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* CTA Action Buttons */}
              <div className="flex flex-col gap-3">
                <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest font-mono">
                  CONFIRM DISPATCH OPTIONS
                </p>

                <motion.a
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  href={getWhatsAppUrl(pendingBooking)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleConfirmAndPost}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm py-3.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2.5 cursor-pointer text-center"
                >
                  <MessageSquare className="w-4 h-4 fill-white shrink-0" />
                  <span>{isSubmitting ? 'SAVING & OPENING WHATSAPP...' : 'CONFIRM & SEND ON WHATSAPP'}</span>
                </motion.a>

                <p className="text-[11px] text-zinc-400 text-center leading-relaxed font-sans px-3 bg-zinc-950/60 py-3 rounded-xl border border-zinc-800/60">
                  <strong className="text-brand-yellow font-bold">Important:</strong> Clicking above saves your trip to your travel history and opens WhatsApp with your booking details pre-filled—just tap Send!
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
