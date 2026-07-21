import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, Phone, ShieldCheck, Sparkles, Check, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
  onSwitchToSignUp?: () => void;
  onSwitchToLogin?: () => void;
}

// 1. Customer Login Modal Component
export function LoginModal({ isOpen, onClose, onSuccess, onSwitchToSignUp }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('avb_saved_credentials');
      if (saved) {
        try {
          const { email: savedEmail, password: savedPassword } = JSON.parse(saved);
          if (savedEmail) setEmail(savedEmail);
          if (savedPassword) setPassword(savedPassword);
        } catch (e) {
          console.error('Error loading saved credentials', e);
        }
      }
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        if (rememberMe) {
          localStorage.setItem('avb_saved_credentials', JSON.stringify({ email, password }));
        } else {
          localStorage.removeItem('avb_saved_credentials');
        }
        onSuccess(data.user);
        onClose();
      } else {
        setError(data.error || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError('Connection failed. Please check your internet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Modal content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 sm:p-8 overflow-hidden shadow-2xl z-10 text-left"
          >
            {/* Top Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg border border-zinc-800 hover:border-brand-yellow/30 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 text-brand-yellow font-mono text-[10px] font-bold tracking-widest uppercase bg-brand-yellow/10 border border-brand-yellow/20 px-2.5 py-1 rounded-full mb-3">
                <Sparkles className="w-3 h-3" />
                CUSTOMER PORTAL
              </div>
              <h3 className="text-2xl font-extrabold font-display text-white tracking-tight">
                Sign In to AVB CABS
              </h3>
              <p className="text-zinc-500 text-xs mt-1 font-light">
                Welcome back! Please enter your credentials to manage your bookings.
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3.5 rounded-xl text-xs flex items-start gap-2.5 mb-5 font-medium">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. name@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-yellow/40 rounded-xl py-3 pl-11 pr-4 text-white text-sm outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-yellow/40 rounded-xl py-3 pl-11 pr-4 text-white text-sm outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 py-1 select-none">
                <input
                  id="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-800 bg-zinc-950 text-brand-yellow focus:ring-0 focus:ring-offset-0 accent-brand-yellow cursor-pointer"
                />
                <label htmlFor="rememberMe" className="text-zinc-400 text-xs cursor-pointer">
                  Save credentials for easy login next time
                </label>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="w-full bg-brand-yellow hover:bg-yellow-400 text-brand-dark font-bold text-sm py-3.5 rounded-xl transition-all shadow-md shadow-brand-yellow/5 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-brand-dark border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  'SIGN IN SECURELY'
                )}
              </motion.button>
            </form>

            {/* Footer switcher */}
            {onSwitchToSignUp && (
              <div className="mt-6 pt-5 border-t border-zinc-800 text-center">
                <p className="text-zinc-500 text-xs">
                  New to AVB CABS?{' '}
                  <button
                    onClick={onSwitchToSignUp}
                    className="text-brand-yellow font-semibold hover:underline cursor-pointer"
                  >
                    Create an account
                  </button>
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// 2. Customer Sign-Up Modal Component
export function SignupModal({ isOpen, onClose, onSuccess, onSwitchToLogin }: AuthModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !contact) return;

    if (contact.length !== 10 || !/^\d+$/.test(contact)) {
      setError('Contact number must be exactly 10 digits.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, contact })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        // Save the newly created credentials for easy next-time login
        localStorage.setItem('avb_saved_credentials', JSON.stringify({ email, password }));
        onSuccess(data.user);
        onClose();
      } else {
        setError(data.error || 'Failed to create account.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Modal content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 sm:p-8 overflow-hidden shadow-2xl z-10 text-left"
          >
            {/* Top Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg border border-zinc-800 hover:border-brand-yellow/30 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 text-brand-yellow font-mono text-[10px] font-bold tracking-widest uppercase bg-brand-yellow/10 border border-brand-yellow/20 px-2.5 py-1 rounded-full mb-3">
                <Sparkles className="w-3 h-3" />
                NEW CUSTOMER SIGNUP
              </div>
              <h3 className="text-2xl font-extrabold font-display text-white tracking-tight">
                Create Account
              </h3>
              <p className="text-zinc-500 text-xs mt-1 font-light">
                Sign up to book premium cabs, track driver assignments and review journey histories.
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3.5 rounded-xl text-xs flex items-start gap-2.5 mb-5 font-medium">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-yellow/40 rounded-xl py-3 pl-11 pr-4 text-white text-sm outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. name@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-yellow/40 rounded-xl py-3 pl-11 pr-4 text-white text-sm outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1.5">Contact Number (10-digit)</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    placeholder="e.g. 9876543210"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-yellow/40 rounded-xl py-3 pl-11 pr-4 text-white text-sm outline-none transition-colors font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    required
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-yellow/40 rounded-xl py-3 pl-11 pr-4 text-white text-sm outline-none transition-colors"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="w-full bg-brand-yellow hover:bg-yellow-400 text-brand-dark font-bold text-sm py-3.5 rounded-xl transition-all shadow-md shadow-brand-yellow/5 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-brand-dark border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  'CREATE ACCOUNT'
                )}
              </motion.button>
            </form>

            {/* Footer switcher */}
            {onSwitchToLogin && (
              <div className="mt-6 pt-5 border-t border-zinc-800 text-center">
                <p className="text-zinc-500 text-xs">
                  Already have an account?{' '}
                  <button
                    onClick={onSwitchToLogin}
                    className="text-brand-yellow font-semibold hover:underline cursor-pointer"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface AdminLoginProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string) => void;
}

// 3. Separate Admin Login Modal Component
export function AdminLoginModal({ isOpen, onClose, onSuccess }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        onSuccess(data.token);
        onClose();
      } else {
        setError(data.error || 'Access Denied. Invalid admin credentials.');
      }
    } catch (err) {
      setError('Connection failure. Check backend database service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Modal content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-zinc-900 border border-brand-yellow/25 rounded-2xl w-full max-w-md p-6 sm:p-8 overflow-hidden shadow-[0_0_50px_rgba(250,204,21,0.07)] z-10 text-left"
          >
            {/* Top Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg border border-zinc-800 hover:border-brand-yellow/30 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 text-brand-yellow font-mono text-[10px] font-bold tracking-widest uppercase bg-brand-yellow/10 border border-brand-yellow/30 px-2.5 py-1.5 rounded-full mb-3">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-yellow" />
                SECURE ADMINISTRATIVE ROUTE
              </div>
              <h3 className="text-2xl font-extrabold font-display text-white tracking-tight">
                Admin Control Room
              </h3>
              <p className="text-zinc-500 text-xs mt-1 font-light">
                Sign in using authorized system credentials to manage livery fleet dispatches and bookings.
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3.5 rounded-xl text-xs flex items-start gap-2.5 mb-5 font-medium">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1.5">Admin Username</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    required
                    placeholder="Username (e.g. admin)"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-yellow/40 rounded-xl py-3 pl-11 pr-4 text-white text-sm outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1.5">Security Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-yellow/40 rounded-xl py-3 pl-11 pr-4 text-white text-sm outline-none transition-colors"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="w-full bg-brand-yellow hover:bg-yellow-400 text-brand-dark font-bold text-sm py-3.5 rounded-xl transition-all shadow-md shadow-brand-yellow/5 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-brand-dark border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  'AUTHORIZE ACCESS'
                )}
              </motion.button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
