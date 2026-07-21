import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Car, Phone, Menu, X, MessageSquare, ShieldCheck, User, LogOut } from 'lucide-react';

interface HeaderProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  bookingCount: number;
  currentUser: any | null;
  adminToken: string | null;
  onLoginClick: () => void;
  onSignupClick: () => void;
  onAdminClick: () => void;
  onLogout: () => void;
  isAdminMode: boolean;
  onExitAdminMode: () => void;
}

export default function Header({ 
  activeSection, 
  setActiveSection, 
  bookingCount,
  currentUser,
  adminToken,
  onLoginClick,
  onSignupClick,
  onAdminClick,
  onLogout,
  isAdminMode,
  onExitAdminMode
}: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: 'Services', href: '#services' },
    { name: 'Why Choose Us', href: '#why-us' },
    { name: 'Reviews', href: '#reviews' },
    { name: 'My Bookings', href: '#my-bookings', badge: bookingCount > 0 ? bookingCount : undefined }
  ];

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    if (isAdminMode) {
      onExitAdminMode();
    }
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-brand-dark/95 backdrop-blur-md border-b border-zinc-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                if (isAdminMode) onExitAdminMode();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="bg-brand-yellow text-brand-dark font-extrabold px-3 py-1.5 rounded-lg tracking-wider font-display text-lg flex items-center gap-1.5 shadow-[0_0_15px_rgba(250,204,21,0.25)]">
                <Car className="w-5 h-5 fill-brand-dark" />
                AVB
              </div>
              <span className="font-bold text-white text-xl tracking-wider font-display">CABS</span>
            </motion.div>

            {isAdminMode && (
              <span className="bg-brand-yellow/10 border border-brand-yellow/30 text-brand-yellow font-mono text-[10px] font-bold px-2 py-0.5 rounded-md animate-pulse">
                ADMIN CONSOLE
              </span>
            )}
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden lg:flex items-center gap-6">
            {!isAdminMode && navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.href)}
                className="text-gray-300 hover:text-brand-yellow font-medium text-sm transition-colors relative py-2 flex items-center gap-1.5 cursor-pointer font-sans"
              >
                {item.name}
                {item.badge !== undefined && (
                  <span className="bg-brand-yellow text-brand-dark text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shadow-[0_0_8px_rgba(250,204,21,0.3)] font-mono">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}

            {/* Admin item hidden if customer is logged in */}
            {!currentUser && (
              <button
                onClick={isAdminMode ? onExitAdminMode : onAdminClick}
                className={`font-semibold text-sm transition-colors relative py-2 flex items-center gap-1 px-3 py-1 rounded-lg cursor-pointer font-sans ${
                  isAdminMode 
                    ? 'bg-brand-yellow text-brand-dark font-bold'
                    : 'text-zinc-400 hover:text-brand-yellow border border-zinc-800 hover:border-zinc-700 bg-zinc-950/40'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                {isAdminMode ? 'Exit Admin' : 'Admin Control'}
              </button>
            )}
          </div>

          {/* Action and Authentication Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {/* Customer Session States - Hidden in Admin Mode */}
            {!isAdminMode && (
              <div className="flex items-center gap-3">
                {currentUser ? (
                  <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 rounded-xl text-sm">
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <User className="w-4 h-4 text-brand-yellow" />
                      <span className="font-semibold">{currentUser.name.split(' ')[0]}</span>
                    </div>
                    <span className="text-zinc-700">|</span>
                    <button 
                      onClick={onLogout}
                      className="text-zinc-500 hover:text-rose-400 transition-colors flex items-center gap-1 text-xs cursor-pointer"
                      title="Sign Out"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={onLoginClick}
                      className="text-zinc-300 hover:text-brand-yellow font-semibold text-sm py-2 px-3 transition-colors cursor-pointer"
                    >
                      Login
                    </button>
                    <button
                      onClick={onSignupClick}
                      className="bg-brand-yellow/10 border border-brand-yellow/20 hover:border-brand-yellow/30 text-brand-yellow font-bold text-xs py-2 px-3.5 rounded-lg transition-colors cursor-pointer font-sans"
                    >
                      Sign Up
                    </button>
                  </div>
                )}
              </div>
            )}

            <a 
              href="tel:7338653351"
              className="flex items-center gap-2 text-gray-300 hover:text-brand-yellow transition-colors font-mono text-xs border border-zinc-800 hover:border-brand-yellow/30 px-3 py-2 rounded-lg bg-zinc-900/40"
            >
              <Phone className="w-3.5 h-3.5 text-brand-yellow" />
              7338653351
            </a>
          </div>

          {/* Mobile Menu Trigger */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-300 hover:text-brand-yellow p-2"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-brand-dark border-b border-zinc-800"
          >
            <div className="px-4 pt-2 pb-6 space-y-4 text-left">
              {!isAdminMode && navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.href)}
                  className="w-full text-left text-gray-300 hover:text-brand-yellow font-medium text-base py-2 flex justify-between items-center"
                >
                  {item.name}
                  {item.badge !== undefined && (
                    <span className="bg-brand-yellow text-brand-dark text-xs font-bold px-2 py-0.5 rounded-full font-mono">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}

              {!currentUser && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    if (isAdminMode) onExitAdminMode();
                    else onAdminClick();
                  }}
                  className="w-full text-left text-brand-yellow font-semibold text-base py-2 flex items-center gap-2"
                >
                  <ShieldCheck className="w-5 h-5" />
                  {isAdminMode ? 'Exit Admin Panel' : 'Admin Control Console'}
                </button>
              )}

              {!isAdminMode && (
                <div className="pt-4 border-t border-zinc-800 space-y-3">
                  {currentUser ? (
                    <div className="space-y-3">
                      <p className="text-zinc-400 text-sm">
                        Signed in as: <span className="text-white font-bold">{currentUser.name}</span>
                      </p>
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          onLogout();
                        }}
                        className="w-full text-center bg-rose-950/40 border border-rose-900/30 text-rose-400 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out Account
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          onLoginClick();
                        }}
                        className="text-center text-white bg-zinc-800 border border-zinc-700 font-semibold py-2.5 rounded-lg text-sm"
                      >
                        Login
                      </button>
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          onSignupClick();
                        }}
                        className="text-center bg-brand-yellow text-brand-dark font-extrabold py-2.5 rounded-lg text-sm"
                      >
                        Sign Up
                      </button>
                    </div>
                  )}

                  <a 
                    href="tel:7338653351"
                    className="flex items-center justify-center gap-3 text-zinc-300 hover:text-brand-yellow py-2.5 font-mono text-sm border border-zinc-800 bg-zinc-950/40 rounded-lg"
                  >
                    <Phone className="w-4 h-4 text-brand-yellow" />
                    +91 7338653351
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
