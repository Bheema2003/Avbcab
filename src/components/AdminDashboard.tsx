import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Booking } from '../types';
import { 
  Search, Filter, Calendar, MapPin, User, Phone, CheckCircle, 
  XCircle, Clock, RefreshCw, ChevronDown, ShieldCheck, LogOut, TrendingUp, Info
} from 'lucide-react';

interface EnrichedBooking extends Booking {
  customerDetails?: {
    name: string;
    email: string;
    contact: string;
  } | null;
}

interface AdminDashboardProps {
  adminToken: string;
  onLogout: () => void;
}

export default function AdminDashboard({ adminToken, onLogout }: AdminDashboardProps) {
  const [bookings, setBookings] = useState<EnrichedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date' | 'id'>('date');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<EnrichedBooking | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/bookings', {
        headers: {
          'Authorization': adminToken
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setBookings(data.bookings);
        // Backup to durable local storage
        const existingDurableStr = localStorage.getItem('avb_durable_bookings') || '[]';
        try {
          const existingDurable = JSON.parse(existingDurableStr);
          const map = new Map(existingDurable.map((b: any) => [b.id, b]));
          data.bookings.forEach((b: any) => {
            const { customerDetails, ...cleanBooking } = b;
            const existing = map.get(b.id);
            map.set(b.id, existing ? Object.assign({}, existing, cleanBooking) : cleanBooking);
          });
          localStorage.setItem('avb_durable_bookings', JSON.stringify(Array.from(map.values())));
        } catch (e) {}
      } else {
        setError(data.error || 'Failed to fetch bookings.');
      }
    } catch (err) {
      setError('Network error. Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [adminToken]);

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    setUpdatingId(bookingId);
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminToken
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        // Update local state and sync to global durable store
        setBookings(prev => {
          const updated = prev.map(b => b.id === bookingId ? { ...b, status: newStatus as any } : b);
          const existingDurableStr = localStorage.getItem('avb_durable_bookings') || '[]';
          try {
            const existingDurable = JSON.parse(existingDurableStr);
            const map = new Map(existingDurable.map((b: any) => [b.id, b]));
            updated.forEach((b: any) => {
              const { customerDetails, ...cleanBooking } = b;
              const existing = map.get(b.id);
              map.set(b.id, existing ? Object.assign({}, existing, cleanBooking) : cleanBooking);
            });
            localStorage.setItem('avb_durable_bookings', JSON.stringify(Array.from(map.values())));
          } catch (err) {}
          return updated;
        });

        if (selectedBooking && selectedBooking.id === bookingId) {
          setSelectedBooking(prev => prev ? { ...prev, status: newStatus as any } : null);
        }
      } else {
        alert(data.error || 'Failed to update status.');
      }
    } catch (err) {
      alert('Network error. Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter and sort bookings
  const filteredBookings = bookings
    .filter(b => {
      const matchesSearch = 
        b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.pickup.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.drop.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.contact.includes(searchTerm) ||
        (b.customerDetails?.email || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'id') {
        return b.id.localeCompare(a.id);
      }
      // Since date is formatted strings like "20-Jul-2026", we can fall back to raw sorting by ID or reverse order
      return b.id.localeCompare(a.id);
    });

  // Calculate stats
  const totalBookings = bookings.length;
  const pendingBookings = bookings.filter(b => b.status === 'Pending').length;
  const confirmedBookings = bookings.filter(b => b.status === 'Confirmed' || b.status === 'Driver Assigned').length;
  const completedBookings = bookings.filter(b => b.status === 'Completed').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-amber-500/10 border-amber-500/30 text-amber-500';
      case 'Confirmed': return 'bg-sky-500/10 border-sky-500/30 text-sky-500';
      case 'In Progress': return 'bg-purple-500/10 border-purple-500/30 text-purple-500';
      case 'Completed': return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500';
      case 'Cancelled': return 'bg-rose-500/10 border-rose-500/30 text-rose-500';
      default: return 'bg-zinc-500/10 border-zinc-500/30 text-zinc-400';
    }
  };

  return (
    <div id="admin-dashboard-section" className="bg-brand-dark min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="bg-brand-yellow/10 p-3 rounded-xl border border-brand-yellow/20 text-brand-yellow">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <span className="text-brand-yellow font-mono text-xs font-bold tracking-widest block uppercase">AVB CABS CONTROL CENTER</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white tracking-tight">Admin Executive Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={fetchBookings}
              className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:text-brand-yellow hover:border-brand-yellow/20 transition-all cursor-pointer"
              title="Refresh Bookings"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-900/40 bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 transition-all text-sm font-semibold cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-zinc-900/40 border border-zinc-800/80 p-5 rounded-2xl relative overflow-hidden">
            <span className="text-zinc-500 text-xs font-mono font-bold tracking-wider uppercase block">TOTAL LIVERY BOOKINGS</span>
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white mt-1 block">{totalBookings}</span>
            <div className="absolute top-4 right-4 text-zinc-700 font-bold text-lg">#01</div>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800/80 p-5 rounded-2xl relative overflow-hidden">
            <span className="text-amber-500 text-xs font-mono font-bold tracking-wider uppercase block">PENDING DISPATCH</span>
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-amber-500 mt-1 block">{pendingBookings}</span>
            <div className="absolute top-4 right-4 text-amber-950/50 font-bold text-lg">#02</div>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800/80 p-5 rounded-2xl relative overflow-hidden">
            <span className="text-sky-400 text-xs font-mono font-bold tracking-wider uppercase block">ACTIVE/CONFIRMED</span>
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-sky-400 mt-1 block">{confirmedBookings}</span>
            <div className="absolute top-4 right-4 text-sky-950/50 font-bold text-lg">#03</div>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800/80 p-5 rounded-2xl relative overflow-hidden">
            <span className="text-emerald-400 text-xs font-mono font-bold tracking-wider uppercase block">COMPLETED JOURNEYS</span>
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-emerald-400 mt-1 block">{completedBookings}</span>
            <div className="absolute top-4 right-4 text-emerald-950/50 font-bold text-lg">#04</div>
          </div>
        </div>

        {/* Filters and Search Panel */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 p-5 rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Search */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by ID, Customer Name, Route details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800/80 focus:border-brand-yellow/40 rounded-xl py-3 pl-10 pr-4 text-white text-sm outline-none transition-colors placeholder:text-zinc-600"
            />
          </div>

          {/* Filter Options */}
          <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
            <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800/80 p-1 rounded-xl">
              {['All', 'Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    statusFilter === status
                      ? 'bg-brand-yellow text-brand-dark font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bookings Table / List Container */}
        {loading ? (
          <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-2xl p-16 text-center">
            <RefreshCw className="w-8 h-8 text-brand-yellow animate-spin mx-auto mb-4" />
            <p className="text-zinc-400 text-sm font-mono">Synchronizing dispatch registry...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-950/20 border border-rose-900/30 rounded-2xl p-8 text-center text-rose-400">
            <p className="font-mono text-sm">{error}</p>
            <button 
              onClick={fetchBookings} 
              className="mt-4 px-4 py-2 border border-rose-800 hover:border-rose-700 bg-rose-950/40 rounded-lg text-xs font-semibold"
            >
              Retry Connection
            </button>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-2xl p-16 text-center">
            <p className="text-zinc-500 text-sm font-mono">No matching livery bookings registered.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Side: Booking List */}
            <div className="lg:col-span-8 space-y-4">
              <span className="text-zinc-500 font-mono text-xs font-bold block mb-1">
                REGISTERED BOOKINGS ({filteredBookings.length})
              </span>
              <div className="space-y-4">
                {filteredBookings.map((booking) => (
                  <motion.div
                    key={booking.id}
                    layoutId={`booking-card-${booking.id}`}
                    onClick={() => setSelectedBooking(booking)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer text-left relative ${
                      selectedBooking?.id === booking.id
                        ? 'bg-zinc-900 border-brand-yellow/40 shadow-[0_0_15px_rgba(250,204,21,0.05)]'
                        : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80'
                    } ${
                      booking.status === 'Completed' || booking.status === 'Cancelled'
                        ? 'opacity-50 saturate-[0.75] hover:opacity-85'
                        : ''
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 pb-3 border-b border-zinc-800/60 mb-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-brand-yellow font-mono font-bold text-sm tracking-tight">
                          {booking.id}
                        </span>
                        <span className="text-zinc-600 font-mono text-xs">•</span>
                        <span className="text-zinc-400 font-mono text-xs">
                          {booking.createdAt}
                        </span>
                      </div>
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md border ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Customer Info */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-zinc-300">
                          <User className="w-4 h-4 text-brand-yellow/80" />
                          <span className="text-sm font-semibold">{booking.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-400 font-mono text-xs">
                          <Phone className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{booking.contact}</span>
                        </div>
                      </div>

                      {/* Service Info */}
                      <div className="space-y-1 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/40">
                        <span className="text-[10px] font-mono text-zinc-500 block uppercase font-bold">SERVICE RIDE</span>
                        <span className="text-zinc-200 text-xs font-bold">{booking.serviceType}</span>
                        <span className="text-zinc-500 text-[10px] block font-mono">{booking.priceEstimate || 'Varying'}</span>
                      </div>
                    </div>

                    {/* Route */}
                    <div className="mt-4 pt-3.5 border-t border-zinc-800/40 flex flex-col gap-2 text-xs text-zinc-400">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                        <span className="line-clamp-1"><strong>Pickup:</strong> {booking.pickup}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 mt-0.5 shrink-0" />
                        <span className="line-clamp-1"><strong>Drop:</strong> {booking.drop}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right Side: Detailed Booking Inspection & Status Modifier */}
            <div className="lg:col-span-4">
              <div className="sticky top-28 bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 space-y-6 text-left">
                {selectedBooking ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-start pb-4 border-b border-zinc-800">
                      <div>
                        <span className="text-zinc-500 text-[10px] font-mono font-bold uppercase tracking-wider block">Inspecting Ride</span>
                        <h3 className="text-lg font-bold text-white font-mono">{selectedBooking.id}</h3>
                      </div>
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md border ${getStatusColor(selectedBooking.status)}`}>
                        {selectedBooking.status}
                      </span>
                    </div>

                    {/* Route Details */}
                    <div className="space-y-3.5">
                      <h4 className="text-xs text-zinc-500 font-bold uppercase tracking-widest font-mono">Route Details</h4>
                      <div className="space-y-3 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5 shrink-0"></div>
                          <div>
                            <span className="text-zinc-500 text-[10px] uppercase font-bold block">Pickup Location</span>
                            <span className="text-white text-xs font-semibold leading-normal">{selectedBooking.pickup}</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 pt-2.5 border-t border-zinc-800/60">
                          <div className="w-2 h-2 bg-rose-500 rounded-full mt-1.5 shrink-0"></div>
                          <div>
                            <span className="text-zinc-500 text-[10px] uppercase font-bold block">Drop Destination</span>
                            <span className="text-white text-xs font-semibold leading-normal">{selectedBooking.drop}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Booking Timings */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                        <span className="text-zinc-500 text-[10px] uppercase block font-bold">DATE</span>
                        <span className="text-white text-sm font-bold font-mono">{selectedBooking.date}</span>
                      </div>
                      <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                        <span className="text-zinc-500 text-[10px] uppercase block font-bold">TIME</span>
                        <span className="text-white text-sm font-bold font-mono">{selectedBooking.time}</span>
                      </div>
                    </div>

                    {/* Customer Account Details */}
                    <div className="space-y-3">
                      <h4 className="text-xs text-zinc-500 font-bold uppercase tracking-widest font-mono">Customer Information</h4>
                      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2 text-xs">
                        <div>
                          <span className="text-zinc-500 uppercase text-[9px] block">Full Name</span>
                          <span className="text-white font-semibold">{selectedBooking.name}</span>
                        </div>
                        <div className="pt-2.5 border-t border-zinc-800/60">
                          <span className="text-zinc-500 uppercase text-[9px] block">Contact Number</span>
                          <span className="text-white font-mono">{selectedBooking.contact}</span>
                        </div>
                        {selectedBooking.customerDetails?.email && (
                          <div className="pt-2.5 border-t border-zinc-800/60">
                            <span className="text-zinc-500 uppercase text-[9px] block">Email Address</span>
                            <span className="text-white font-mono break-all">{selectedBooking.customerDetails.email}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Management Selector */}
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs text-zinc-500 font-bold uppercase tracking-widest font-mono">Modify Dispatch Status</h4>
                      <div className="relative">
                        <select
                          disabled={updatingId === selectedBooking.id}
                          value={selectedBooking.status}
                          onChange={(e) => handleStatusChange(selectedBooking.id, e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-yellow/50 rounded-xl py-3 px-4 text-white text-sm outline-none cursor-pointer appearance-none"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-3.5 w-4 h-4 text-zinc-400 pointer-events-none" />
                      </div>
                      {updatingId === selectedBooking.id && (
                        <p className="text-zinc-500 text-xs font-mono animate-pulse text-center">
                          Updating status in server...
                        </p>
                      )}
                    </div>

                  </div>
                ) : (
                  <div className="text-center py-16 text-zinc-500 space-y-3">
                    <Info className="w-8 h-8 mx-auto text-zinc-600" />
                    <p className="text-sm font-mono">Select a registered booking from the registry list to inspect details and modify status.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
