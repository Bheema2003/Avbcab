import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Booking, Review } from './types';
import Header from './components/Header';
import BookingForm from './components/BookingForm';
import Services from './components/Services';
import WhyChooseUs from './components/WhyChooseUs';
import MyBookings from './components/MyBookings';
import Reviews from './components/Reviews';
import Footer from './components/Footer';
import AdminDashboard from './components/AdminDashboard';
import { LoginModal, SignupModal, AdminLoginModal } from './components/AuthModals';
import { Car, Sparkles, Phone, Mail, Clock, Shield, Star, MessageSquare } from 'lucide-react';

export default function App() {
  const [activeSection, setActiveSection] = useState('home');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);

  // Modals visibility
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);

  // Buffer to queue booking when guest submits form
  const [pendingBookingToSubmit, setPendingBookingToSubmit] = useState<any | null>(null);

  // 1. Initial State Load
  useEffect(() => {
    // Load local auth states
    const savedUser = localStorage.getItem('avb_user');
    const savedAdminToken = localStorage.getItem('avb_admin_token');

    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
      } catch (e) {
        console.error('Error parsing saved customer profile', e);
      }
    }

    if (savedAdminToken) {
      setAdminToken(savedAdminToken);
      setIsAdminMode(true);
    }

    // Load initial reviews from server
    fetchReviews();
  }, []);

  // 1b. Background sync local durable backups to the server on app mount/republish (durability across server resets)
  useEffect(() => {
    const syncLocalBackupToServer = async () => {
      const backupBookingsStr = localStorage.getItem('avb_durable_bookings');
      if (backupBookingsStr) {
        try {
          const backupBookings = JSON.parse(backupBookingsStr);
          if (Array.isArray(backupBookings) && backupBookings.length > 0) {
            const response = await fetch('/api/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ bookings: backupBookings })
            });
            const data = await response.json();
            if (response.ok && data.success) {
              console.log('Successfully synchronized client-side durable booking statuses with the server.');
              // If logged in, fetch to update UI state
              if (currentUser) {
                fetchMyBookings(currentUser.id);
              }
            }
          }
        } catch (err) {
          console.error('Failed to auto-synchronize client-side backups with backend.', err);
        }
      }
    };
    syncLocalBackupToServer();
  }, [currentUser?.id]);

  // 2. Fetch Customer Bookings on User State Change
  useEffect(() => {
    if (currentUser) {
      fetchMyBookings(currentUser.id);
    } else {
      setBookings([]);
    }
  }, [currentUser]);

  // Sync bookings to localStorage when they change to ensure offline fallback has correct status
  useEffect(() => {
    if (currentUser && bookings.length > 0) {
      localStorage.setItem('avb_bookings', JSON.stringify(bookings));

      // Also update the durable backups list to preserve all changes & statuses securely
      const existingDurableStr = localStorage.getItem('avb_durable_bookings') || '[]';
      try {
        const existingDurable = JSON.parse(existingDurableStr);
        const map = new Map(existingDurable.map((b: any) => [b.id, b]));
        bookings.forEach(b => {
          const existing = map.get(b.id);
          map.set(b.id, existing ? Object.assign({}, existing, b) : b);
        });
        localStorage.setItem('avb_durable_bookings', JSON.stringify(Array.from(map.values())));
      } catch (err) {}
    } else if (!currentUser) {
      localStorage.removeItem('avb_bookings');
    }
  }, [bookings, currentUser]);

  // Sync Bookings from Server
  const fetchMyBookings = async (userId: string) => {
    setRefreshing(true);
    try {
      const response = await fetch(`/api/bookings/my?userId=${userId}`);
      const data = await response.json();
      if (response.ok && data.success) {
        // Merge with client-side durable statuses in case server has restarted but not fully synced yet
        const existingDurableStr = localStorage.getItem('avb_durable_bookings') || '[]';
        let mergedBookings = data.bookings;
        try {
          const existingDurable = JSON.parse(existingDurableStr);
          if (Array.isArray(existingDurable) && existingDurable.length > 0) {
            const backupMap = new Map(existingDurable.map((b: any) => [b.id, b]));
            mergedBookings = data.bookings.map((b: any) => {
              const backup = backupMap.get(b.id);
              if (backup) {
                return { ...b, ...backup };
              }
              return b;
            });
          }
        } catch (err) {}

        setBookings(mergedBookings);
        localStorage.setItem('avb_bookings', JSON.stringify(mergedBookings));
      }
    } catch (e) {
      console.error('Failed to sync bookings from server.', e);
      // Fallback to local storage if network is offline
      const savedBookings = localStorage.getItem('avb_bookings');
      if (savedBookings) {
        try {
          setBookings(JSON.parse(savedBookings));
        } catch (err) {}
      }
    } finally {
      setRefreshing(false);
    }
  };

  // Sync Reviews from Server
  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/reviews');
      const data = await response.json();
      if (response.ok && data.success) {
        setReviews(data.reviews);
      }
    } catch (e) {
      console.error('Failed to sync reviews.', e);
      const savedReviews = localStorage.getItem('avb_reviews');
      if (savedReviews) {
        try {
          setReviews(JSON.parse(savedReviews));
        } catch (err) {}
      }
    }
  };

  // Handle Booking creation success
  const handleBookingCreated = (newBooking: Booking) => {
    setBookings(prev => [newBooking, ...prev]);
  };

  // Handle Cancel Booking
  const handleCancelBooking = async (id: string) => {
    if (!currentUser) return;
    try {
      const response = await fetch(`/api/bookings/${id}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        // Refresh bookings
        fetchMyBookings(currentUser.id);
      } else {
        alert(data.error || 'Failed to cancel booking.');
      }
    } catch (e) {
      alert('Network failure. Failed to cancel booking.');
    }
  };

  // Handle Review submission
  const handleReviewCreated = async (newReview: { name: string; rating: number; comment: string }) => {
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReview)
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setReviews(prev => {
          const updated = [data.review, ...prev];
          localStorage.setItem('avb_reviews', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (e) {
      // Offline fallback
      const localReview: Review = {
        id: 'REV-L-' + Math.floor(Math.random() * 100000),
        name: newReview.name,
        rating: newReview.rating,
        comment: newReview.comment,
        date: new Date().toLocaleDateString('en-IN')
      };
      setReviews(prev => {
        const updated = [localReview, ...prev];
        localStorage.setItem('avb_reviews', JSON.stringify(updated));
        return updated;
      });
    }
  };

  // Handle Guest unauthorized booking request attempt
  const handleUnauthorizedAttempt = (pendingBooking: any) => {
    setPendingBookingToSubmit(pendingBooking);
    setShowLoginModal(true);
  };

  // Login Success Callback
  const handleLoginSuccess = async (user: any) => {
    setCurrentUser(user);
    localStorage.setItem('avb_user', JSON.stringify(user));

    // If there is a queued booking from this login prompt, submit it right now!
    if (pendingBookingToSubmit) {
      const bDetails = pendingBookingToSubmit;
      setPendingBookingToSubmit(null);
      try {
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            bookingDetails: bDetails
          })
        });
        const data = await response.json();
        if (response.ok && data.success) {
          handleBookingCreated(data.booking);
          // Trigger success confirmation pop-up on BookingForm widget manually or via a state!
          // Since the Success Modal is nested inside BookingForm, we can pass down the result as prop
          // or simple alert. But since BookingForm holds bookingResult, let's just let them know 
          // they are logged in and can click "Request Livery Dispatch" now!
          alert(`Successfully logged in as ${user.name}! Please click the "REQUEST LIVERY DISPATCH" button to secure your booking.`);
        }
      } catch (err) {
        console.error('Failed to submit queued booking.', err);
      }
    }
  };

  // Signup Success Callback
  const handleSignupSuccess = (user: any) => {
    setCurrentUser(user);
    localStorage.setItem('avb_user', JSON.stringify(user));

    if (pendingBookingToSubmit) {
      setPendingBookingToSubmit(null);
      alert(`Account created successfully! Welcome ${user.name}. Please click the "REQUEST LIVERY DISPATCH" button to secure your booking.`);
    }
  };

  // Admin Login Success Callback
  const handleAdminLoginSuccess = (token: string) => {
    setAdminToken(token);
    localStorage.setItem('avb_admin_token', token);
    setIsAdminMode(true);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAdminToken(null);
    setIsAdminMode(false);
    localStorage.removeItem('avb_user');
    localStorage.removeItem('avb_admin_token');
  };

  const handleExitAdminMode = () => {
    setIsAdminMode(false);
  };

  const handleAdminClick = () => {
    if (adminToken) {
      setIsAdminMode(true);
    } else {
      setShowAdminLoginModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark text-white font-sans antialiased overflow-x-hidden selection:bg-brand-yellow selection:text-brand-dark">
      
      {/* Dynamic Header Component */}
      <Header 
        activeSection={activeSection} 
        setActiveSection={setActiveSection} 
        bookingCount={bookings.filter(b => b.status !== 'Cancelled').length} 
        currentUser={currentUser}
        adminToken={adminToken}
        onLoginClick={() => setShowLoginModal(true)}
        onSignupClick={() => setShowSignupModal(true)}
        onAdminClick={handleAdminClick}
        onLogout={handleLogout}
        isAdminMode={isAdminMode}
        onExitAdminMode={handleExitAdminMode}
      />

      <AnimatePresence mode="wait">
        {isAdminMode ? (
          /* SECTION 5: ADMIN DASHBOARD (Renders exclusively for super administrators) */
          <motion.div
            key="admin-view"
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.2 }}
          >
            <AdminDashboard 
              adminToken={adminToken || ''} 
              onLogout={handleLogout} 
            />
          </motion.div>
        ) : (
          /* STANDARD LANDING WEBSITE FOR CUSTOMERS */
          <motion.div
            key="landing-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Hero Section */}
            <header className="relative bg-zinc-950 min-h-[650px] lg:min-h-[800px] flex items-center justify-center overflow-hidden py-16 lg:py-24">
              {/* Luxury Car Background Mask */}
              <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-radial-gradient from-transparent via-brand-dark/90 to-brand-dark z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/85 to-transparent z-10" />
                <img
                  src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=2070&auto=format&fit=crop"
                  alt="Luxury Executive Car Interior"
                  className="w-full h-full object-cover opacity-35"
                />
              </div>

              {/* Content Container */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                  
                  {/* Left Content Column */}
                  <div className="lg:col-span-7 space-y-8 text-left">
                    {/* Discount Alert Badge */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5 }}
                      className="inline-flex items-center gap-2 bg-brand-yellow/15 border border-brand-yellow/30 text-brand-yellow px-4 py-2 rounded-full text-xs font-semibold font-mono"
                    >
                      <Sparkles className="w-4 h-4" />
                      BOOK NOW TO AVAIL DISCOUNTS UP TO 10%
                    </motion.div>

                    {/* Headline */}
                    <div className="space-y-4">
                      <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-5xl sm:text-6xl lg:text-7xl font-extrabold font-display leading-none tracking-tight text-white"
                      >
                        Premium Rides.<br />
                        <span className="text-brand-yellow">Zero Compromise.</span>
                      </motion.h1>

                      <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-zinc-400 text-base sm:text-lg lg:text-xl max-w-xl font-light leading-relaxed font-sans"
                      >
                        Your premier luxury chauffeur-driven fleet for Bangalore Airport Transfers, Local Rentals, and comfortable Outstation journeys. Redefining your transit comfort since 2026.
                      </motion.p>
                    </div>

                    {/* Highlights List */}
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="flex flex-wrap gap-5 text-sm font-semibold text-brand-yellow pt-2"
                    >
                      <span className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 px-4 py-2 rounded-xl">
                        <span className="w-2.5 h-2.5 bg-brand-yellow rounded-full animate-pulse"></span>
                        24/7 Availability
                      </span>
                      <span className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 px-4 py-2 rounded-xl">
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        Professional Drivers
                      </span>
                      <span className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 px-4 py-2 rounded-xl">
                        <span className="w-2.5 h-2.5 bg-sky-500 rounded-full animate-pulse"></span>
                        Luxury Fleet
                      </span>
                    </motion.div>

                    {/* Direct Support Numbers */}
                    <motion.div 
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      className="pt-6 border-t border-zinc-800/80 max-w-md space-y-4"
                    >
                      <div>
                        <h3 className="text-zinc-500 text-[11px] uppercase tracking-widest font-bold font-mono mb-1.5">Direct Booking Desk</h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <a 
                            href="tel:7338653351"
                            className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight hover:text-brand-yellow transition-colors block"
                          >
                            7338653351
                          </a>
                          <span className="hidden sm:inline text-zinc-700 font-sans">|</span>
                          <div className="flex flex-wrap gap-x-3 text-sm text-zinc-400 font-mono">
                            <a href="tel:9591128048" className="hover:text-brand-yellow transition-colors">9591128048</a>
                            <span>•</span>
                            <a href="tel:8073166031" className="hover:text-brand-yellow transition-colors">8073166031</a>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-zinc-400 text-sm">
                        <Mail className="w-4 h-4 text-brand-yellow" />
                        <a href="mailto:avbcabz@gmail.com" className="hover:text-white transition-colors font-mono">
                          avbcabz@gmail.com
                        </a>
                      </div>
                    </motion.div>
                  </div>

                  {/* Right Widget Column */}
                  <div id="booking-stage" className="lg:col-span-5 w-full scroll-mt-24">
                    <BookingForm 
                      onBookingCreated={handleBookingCreated} 
                      currentUser={currentUser}
                      onUnauthorizedAttempt={handleUnauthorizedAttempt}
                    />
                  </div>

                </div>
              </div>
            </header>

            {/* Trust Banner / Features Summary */}
            <section className="bg-brand-charcoal border-y border-zinc-800/60 py-8">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center md:text-left">
                  <div className="space-y-1">
                    <span className="text-[10px] text-brand-yellow uppercase tracking-widest font-bold font-mono block">TRUST FACTOR</span>
                    <span className="text-white text-base font-bold font-display">100% Secure Checkout</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-brand-yellow uppercase tracking-widest font-bold font-mono block">CLEANLINESS</span>
                    <span className="text-white text-base font-bold font-display">Strict No-Smoking policy</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-brand-yellow uppercase tracking-widest font-bold font-mono block">RELIABILITY</span>
                    <span className="text-white text-base font-bold font-display">Guaranteed Punctuality</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-brand-yellow uppercase tracking-widest font-bold font-mono block">SUPPORT DESK</span>
                    <span className="text-white text-base font-bold font-display">24/7 Telephone Assistance</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Services Showcase */}
            <Services />

            {/* Why Choose Us */}
            <WhyChooseUs />

            {/* Track Bookings History (User Request Goal 3) */}
            <MyBookings 
              bookings={bookings} 
              onCancelBooking={handleCancelBooking} 
              currentUser={currentUser}
              onLoginClick={() => setShowLoginModal(true)}
              onSignupClick={() => setShowSignupModal(true)}
              onRefreshBookings={() => currentUser && fetchMyBookings(currentUser.id)}
              refreshing={refreshing}
            />

            {/* Customer Reviews & Feedback */}
            <Reviews reviews={reviews} onReviewCreated={handleReviewCreated} />

            {/* Final Call to Action Block */}
            <section className="py-24 bg-gradient-to-t from-zinc-950 to-brand-dark border-t border-zinc-900 text-center relative overflow-hidden">
              {/* Abstract shapes/glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-yellow/5 rounded-full blur-[120px] pointer-events-none" />

              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8 text-center">
                <span className="text-brand-yellow font-mono text-xs font-bold tracking-widest uppercase bg-brand-yellow/10 border border-brand-yellow/20 px-3.5 py-1.5 rounded-full inline-block">
                  READY TO RIDE?
                </span>

                <h2 className="text-4xl sm:text-5xl font-extrabold font-display tracking-tight text-white max-w-2xl mx-auto leading-tight">
                  Book Premium Rides with Zero Compromise
                </h2>

                <p className="text-zinc-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed font-light font-sans">
                  Join hundreds of satisfied corporate travellers and families who depend on AVB CABS for absolute punctuality, modern vehicles, and safe journeys.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <motion.a
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    href="https://chat.whatsapp.com/DvuQSmCGAm8LZa4G9TXOwf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-8 py-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4 fill-white" />
                    JOIN WHATSAPP GROUP
                  </motion.a>

                  <button
                    onClick={() => {
                      const target = document.querySelector('#booking-stage');
                      if (target) target.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="bg-brand-yellow hover:bg-yellow-400 text-brand-dark font-bold text-sm px-8 py-4 rounded-xl transition-all shadow-md shadow-brand-yellow/10 cursor-pointer"
                  >
                    BOOK LIVERY CAB NOW
                  </button>
                </div>
              </div>
            </section>

            {/* Footer */}
            <Footer />
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- POPUP AUTHENTICATION MODALS OVERLAYS --- */}
      
      {/* Customer Login Modal */}
      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
        onSwitchToSignUp={() => {
          setShowLoginModal(false);
          setShowSignupModal(true);
        }}
      />

      {/* Customer Sign-Up Modal */}
      <SignupModal 
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSuccess={handleSignupSuccess}
        onSwitchToLogin={() => {
          setShowSignupModal(false);
          setShowLoginModal(true);
        }}
      />

      {/* Separate Admin Login Modal */}
      <AdminLoginModal 
        isOpen={showAdminLoginModal}
        onClose={() => setShowAdminLoginModal(false)}
        onSuccess={handleAdminLoginSuccess}
      />

    </div>
  );
}
