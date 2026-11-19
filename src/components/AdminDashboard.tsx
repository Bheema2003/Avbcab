import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Booking } from '../types';
import { jsPDF } from 'jspdf';
import { 
  Search, Filter, Calendar, MapPin, User, Phone, CheckCircle, 
  XCircle, Clock, RefreshCw, ChevronDown, ShieldCheck, LogOut, TrendingUp, Info,
  Download, IndianRupee, FileText, X, Trash2
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
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<EnrichedBooking | null>(null);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [completionModalBooking, setCompletionModalBooking] = useState<EnrichedBooking | null>(null);
  const [completionAmountInput, setCompletionAmountInput] = useState('');
  const [completionAmountError, setCompletionAmountError] = useState<string | null>(null);
  const [deleteConfirmBooking, setDeleteConfirmBooking] = useState<EnrichedBooking | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dashboardBanner, setDashboardBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    contact: '',
    serviceType: 'Airport',
    pickup: '',
    drop: '',
    date: '',
    time: '',
    priceEstimate: '',
    finalAmount: '',
    driverName: '',
    driverPhone: '',
    vehicleDetails: '',
    adminNotes: '',
    status: 'Pending'
  });

  useEffect(() => {
    if (selectedBooking) {
      setEditForm({
        name: selectedBooking.name || '',
        contact: selectedBooking.contact || '',
        serviceType: selectedBooking.serviceType || 'Airport',
        pickup: selectedBooking.pickup || '',
        drop: selectedBooking.drop || '',
        date: selectedBooking.date || '',
        time: selectedBooking.time || '',
        priceEstimate: selectedBooking.priceEstimate || '',
        finalAmount: selectedBooking.finalAmount || '',
        driverName: selectedBooking.driverName || '',
        driverPhone: selectedBooking.driverPhone || '',
        vehicleDetails: selectedBooking.vehicleDetails || '',
        adminNotes: selectedBooking.adminNotes || '',
        status: selectedBooking.status || 'Pending'
      });
      setIsEditingDetails(false);
      setActionError(null);
      setActionSuccess(null);
    }
  }, [selectedBooking?.id]);

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

  const syncBookingToDurableStore = (updatedList: EnrichedBooking[]) => {
    const existingDurableStr = localStorage.getItem('avb_durable_bookings') || '[]';
    try {
      const existingDurable = JSON.parse(existingDurableStr);
      const map = new Map(Array.isArray(existingDurable) ? existingDurable.map((b: any) => [b.id, b]) : []);
      updatedList.forEach((b: any) => {
        const { customerDetails, ...cleanBooking } = b;
        map.set(b.id, cleanBooking);
      });
      localStorage.setItem('avb_durable_bookings', JSON.stringify(Array.from(map.values())));
    } catch (err) {}
  };

  const applyUpdatedBooking = (savedBooking: Booking) => {
    setBookings(prev => {
      const updated = prev.map(b =>
        b.id === savedBooking.id ? { ...b, ...savedBooking } : b
      );
      syncBookingToDurableStore(updated);
      return updated;
    });
    setSelectedBooking(prev =>
      prev && prev.id === savedBooking.id ? { ...prev, ...savedBooking } : prev
    );
  };

  const parseAmountValue = (raw?: string): number | null => {
    if (!raw) return null;
    const cleaned = String(raw).replace(/₹/g, '').replace(/,/g, '').trim();
    if (!cleaned) return null;
    const parsed = Number(cleaned);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return parsed;
  };

  const hasValidAmount = (booking: Booking): boolean => {
    return parseAmountValue(booking.finalAmount) !== null;
  };

  const formatAmountForUi = (raw?: string): string => {
    const val = parseAmountValue(raw);
    if (val === null) return '';
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const sanitizeForPdf = (text?: string): string => {
    if (!text) return '';
    return String(text).replace(/₹/g, 'INR ');
  };

  const generateBookingReceiptPdf = (booking: EnrichedBooking) => {
    if (booking.status !== 'Completed' || !hasValidAmount(booking)) {
      setActionError('Please enter amount and mark booking as Completed before downloading the PDF receipt.');
      return;
    }

    const numericAmount = parseAmountValue(booking.finalAmount)!;
    const formattedAmountPdf = `INR ${numericAmount.toLocaleString('en-IN', {
      minimumFractionDigits: numericAmount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2
    })}`;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 16;
    const contentWidth = pageWidth - margin * 2;

    // Header Banner
    doc.setFillColor(17, 24, 39);
    doc.rect(0, 0, pageWidth, 42, 'F');
    doc.setFillColor(250, 204, 21);
    doc.rect(0, 42, pageWidth, 2, 'F');

    doc.setTextColor(250, 204, 21);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('AVB CABS', margin, 17);

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('OFFICIAL BOOKING & PAYMENT RECEIPT', margin, 25);

    doc.setTextColor(180, 185, 195);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('24/7 Luxury Chauffeur, Airport & Outstation Fleet • Bengaluru', margin, 32);

    const generatedAt = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.setTextColor(229, 231, 235);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`Receipt #: RCPT-${booking.id}`, pageWidth - margin, 17, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(180, 185, 195);
    doc.text(`Issued: ${generatedAt}`, pageWidth - margin, 24, { align: 'right' });
    doc.text('Status: COMPLETED & PAID', pageWidth - margin, 31, { align: 'right' });

    let y = 54;

    // Summary Strip (Booking ID, Date, Time, Service Type)
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'FD');

    const colW = contentWidth / 4;
    const summaryCols = [
      { label: 'BOOKING ID', value: booking.id },
      { label: 'PICKUP DATE', value: booking.date || '-' },
      { label: 'PICKUP TIME', value: booking.time || '-' },
      { label: 'SERVICE TYPE', value: booking.serviceType || '-' }
    ];

    summaryCols.forEach((col, idx) => {
      const cx = margin + 4 + idx * colW;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(col.label, cx, y + 7);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text(String(col.value), cx, y + 15.5);
    });

    y += 30;

    // Helper for section headers
    const drawSectionTitle = (title: string) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(title, margin, y);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y + 2, pageWidth - margin, y + 2);
      y += 7;
    };

    const drawKeyValueRow = (label: string, value: string, maxWidth = contentWidth - 44) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(label, margin, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      const wrapped = doc.splitTextToSize(value || '-', maxWidth);
      doc.text(wrapped, margin + 44, y);
      y += Math.max(6, wrapped.length * 4.8 + 1.5);
    };

    // Customer & Booking Timestamps
    drawSectionTitle('CUSTOMER & BOOKING INFORMATION');
    drawKeyValueRow('Passenger Name', booking.name || '-');
    drawKeyValueRow('Contact Number', booking.contact || '-');
    if (booking.customerDetails?.email) {
      drawKeyValueRow('Customer Email', booking.customerDetails.email);
    }
    drawKeyValueRow('Booked On', booking.createdAt || '-');
    const completedDisplay = booking.completedAt
      ? new Date(booking.completedAt).toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : generatedAt;
    drawKeyValueRow('Completed On', completedDisplay);
    drawKeyValueRow('Booking Status', booking.status);

    y += 4;

    // Full Journey & Route Details
    drawSectionTitle('JOURNEY & ROUTE DETAILS');
    drawKeyValueRow('Pickup Location', booking.pickup || '-');
    drawKeyValueRow(
      booking.serviceType === 'Local' ? 'Rental Package' : 'Drop Destination',
      booking.drop || '-'
    );

    y += 4;

    // Dispatch & Driver Details
    drawSectionTitle('CHAUFFEUR & VEHICLE DETAILS');
    drawKeyValueRow('Driver Name', booking.driverName || 'Assigned by Dispatch');
    drawKeyValueRow('Driver Contact', booking.driverPhone || '+91 95911 28048');
    drawKeyValueRow('Vehicle Details', booking.vehicleDetails || 'AVB Executive Fleet');
    if (booking.adminNotes) {
      drawKeyValueRow('Dispatch Notes', sanitizeForPdf(booking.adminNotes));
    }

    y += 5;

    // Payment & Fare Summary Box
    if (y > pageHeight - 62) {
      doc.addPage();
      y = 20;
    }

    const boxHeight = booking.priceEstimate ? 36 : 26;
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(16, 185, 129);
    doc.roundedRect(margin, y, contentWidth, boxHeight, 2.5, 2.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(6, 95, 70);
    doc.text('PAYMENT SUMMARY', margin + 6, y + 7);

    let payY = y + 14;
    if (booking.priceEstimate) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text('Initial Fare Estimate:', margin + 6, payY);
      doc.text(sanitizeForPdf(booking.priceEstimate), pageWidth - margin - 6, payY, { align: 'right' });
      payY += 8;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(6, 95, 70);
    doc.text('Final Amount Paid', margin + 6, payY);
    doc.setFontSize(14);
    doc.text(formattedAmountPdf, pageWidth - margin - 6, payY, { align: 'right' });

    // Footer
    const footerY = pageHeight - 20;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Thank you for travelling with AVB CABS • Support: +91 95911 28048 / +91 80731 66031', pageWidth / 2, footerY + 1, { align: 'center' });
    doc.text('This is an electronically generated receipt for your completed booking.', pageWidth / 2, footerY + 6, { align: 'center' });

    doc.save(`AVB-Receipt-${booking.id}.pdf`);
    setActionSuccess(`Downloaded PDF receipt for ${booking.id}.`);
  };

  const openCompletionAmountModal = (booking: EnrichedBooking) => {
    const existing = booking.finalAmount ? String(booking.finalAmount).replace(/₹/g, '').replace(/,/g, '').trim() : '';
    setCompletionModalBooking(booking);
    setCompletionAmountInput(existing);
    setCompletionAmountError(null);
    setActionError(null);
    setActionSuccess(null);
  };

  const performStatusUpdate = async (bookingId: string, newStatus: string, finalAmount?: string) => {
    setUpdatingId(bookingId);
    setActionError(null);
    setActionSuccess(null);
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminToken
        },
        body: JSON.stringify({
          status: newStatus,
          ...(finalAmount !== undefined ? { finalAmount } : {})
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        applyUpdatedBooking(data.booking);
        setEditForm(prev => ({
          ...prev,
          status: data.booking.status,
          finalAmount: data.booking.finalAmount || prev.finalAmount
        }));
        setActionSuccess(
          newStatus === 'Completed' && data.booking.finalAmount
            ? `Booking marked Completed (₹${Number(data.booking.finalAmount).toLocaleString('en-IN')}). PDF receipt is now ready to download.`
            : `Status updated to ${newStatus}`
        );
        return true;
      } else {
        setActionError(data.error || 'Failed to update status.');
        return false;
      }
    } catch (err) {
      setActionError('Network error. Failed to update status.');
      return false;
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    if (newStatus === 'Completed') {
      const targetBooking = bookings.find(b => b.id === bookingId) || selectedBooking;
      if (targetBooking) {
        openCompletionAmountModal(targetBooking);
      }
      return;
    }
    await performStatusUpdate(bookingId, newStatus);
  };

  const handleConfirmCompletionAmount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completionModalBooking) return;
    const cleaned = completionAmountInput.replace(/₹/g, '').replace(/,/g, '').trim();
    const numeric = Number(cleaned);
    if (!cleaned || Number.isNaN(numeric) || numeric <= 0) {
      setCompletionAmountError('Please enter a valid positive amount (e.g., 1450).');
      return;
    }
    setCompletionAmountError(null);
    const ok = await performStatusUpdate(completionModalBooking.id, 'Completed', cleaned);
    if (ok) {
      setCompletionModalBooking(null);
      setCompletionAmountInput('');
    }
  };

  const handleSaveBookingDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setActionError(null);
    setActionSuccess(null);

    const cleanedAmount = editForm.finalAmount.replace(/₹/g, '').replace(/,/g, '').trim();
    if (editForm.status === 'Completed') {
      const numeric = Number(cleanedAmount);
      if (!cleanedAmount || Number.isNaN(numeric) || numeric <= 0) {
        setActionError('Please enter amount before marking this booking as Completed.');
        return;
      }
    }

    setUpdatingId(selectedBooking.id);
    try {
      const response = await fetch(`/api/admin/bookings/${selectedBooking.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminToken
        },
        body: JSON.stringify({
          ...editForm,
          finalAmount: cleanedAmount
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        applyUpdatedBooking(data.booking);
        setIsEditingDetails(false);
        setActionSuccess(
          data.booking.status === 'Completed' && hasValidAmount(data.booking)
            ? 'Booking completed & amount saved. PDF receipt is now available.'
            : 'Booking details synced to customer history.'
        );
      } else {
        setActionError(data.error || 'Failed to save booking updates.');
      }
    } catch (err) {
      setActionError('Network error. Failed to save booking updates.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleConfirmDeleteBooking = async () => {
    if (!deleteConfirmBooking) return;
    const target = deleteConfirmBooking;
    setDeletingId(target.id);
    setDashboardBanner(null);
    setActionError(null);
    setActionSuccess(null);

    try {
      const response = await fetch(`/api/admin/bookings/${encodeURIComponent(target.id)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': adminToken
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setBookings(prev => prev.filter(b => b.id !== target.id));
        setSelectedBooking(prev => (prev?.id === target.id ? null : prev));

        try {
          const existingDurableStr = localStorage.getItem('avb_durable_bookings') || '[]';
          const existingDurable = JSON.parse(existingDurableStr);
          if (Array.isArray(existingDurable)) {
            const filtered = existingDurable.filter((b: any) => b && b.id !== target.id);
            localStorage.setItem('avb_durable_bookings', JSON.stringify(filtered));
          }
        } catch {}

        setDeleteConfirmBooking(null);
        setDashboardBanner({
          type: 'success',
          message: `Booking ${target.id} permanently deleted.`
        });
      } else {
        setDashboardBanner({
          type: 'error',
          message: data.error || 'Failed to delete booking.'
        });
        setDeleteConfirmBooking(null);
      }
    } catch (err) {
      setDashboardBanner({
        type: 'error',
        message: 'Network error. Failed to delete booking.'
      });
      setDeleteConfirmBooking(null);
    } finally {
      setDeletingId(null);
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
  const confirmedBookings = bookings.filter(b =>
    b.status === 'Confirmed' || b.status === 'Driver Assigned' || b.status === 'In Progress'
  ).length;
  const completedBookings = bookings.filter(b => b.status === 'Completed').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-amber-500/10 border-amber-500/30 text-amber-500';
      case 'Confirmed': return 'bg-sky-500/10 border-sky-500/30 text-sky-500';
      case 'Driver Assigned': return 'bg-amber-500/15 border-amber-400/40 text-brand-yellow';
      case 'In Progress': return 'bg-purple-500/10 border-purple-500/30 text-purple-400';
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
            <div className="flex flex-wrap items-center gap-1.5 bg-zinc-950 border border-zinc-800/80 p-1 rounded-xl">
              {['All', 'Pending', 'Confirmed', 'Driver Assigned', 'In Progress', 'Completed', 'Cancelled'].map((status) => (
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

        {dashboardBanner && (
          <div
            className={`px-4 py-3 rounded-xl border text-xs font-medium flex items-center justify-between ${
              dashboardBanner.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            <span>{dashboardBanner.message}</span>
            <button
              type="button"
              onClick={() => setDashboardBanner(null)}
              className="text-zinc-400 hover:text-white cursor-pointer"
              aria-label="Dismiss message"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

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
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md border ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmBooking(booking);
                          }}
                          disabled={deletingId === booking.id}
                          title={`Delete booking ${booking.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
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
                        {booking.status === 'Completed' && hasValidAmount(booking) ? (
                          <span className="text-emerald-400 text-[11px] block font-mono font-bold">
                            Paid: {formatAmountForUi(booking.finalAmount)}
                          </span>
                        ) : (
                          <span className="text-zinc-500 text-[10px] block font-mono">{booking.priceEstimate || 'Varying'}</span>
                        )}
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

                    {booking.status === 'Completed' && hasValidAmount(booking) && (
                      <div className="mt-3 pt-3 border-t border-zinc-800/50 flex items-center justify-between">
                        <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          Receipt Ready ({formatAmountForUi(booking.finalAmount)})
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            generateBookingReceiptPdf(booking);
                          }}
                          className="inline-flex items-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download PDF
                        </button>
                      </div>
                    )}
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

                    {/* Route Details / Full Editor */}
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs text-zinc-500 font-bold uppercase tracking-widest font-mono">
                        {isEditingDetails ? 'Edit Booking & Driver' : 'Booking Details'}
                      </h4>
                      <button
                        type="button"
                        onClick={() => setIsEditingDetails(prev => !prev)}
                        className="text-xs font-semibold text-brand-yellow hover:underline cursor-pointer"
                      >
                        {isEditingDetails ? 'Cancel Edit' : 'Edit Details / Driver'}
                      </button>
                    </div>

                    {actionError && (
                      <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-2.5 rounded-xl text-xs">
                        {actionError}
                      </div>
                    )}
                    {actionSuccess && (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-2.5 rounded-xl text-xs">
                        {actionSuccess}
                      </div>
                    )}

                    {isEditingDetails ? (
                      <form onSubmit={handleSaveBookingDetails} className="space-y-3 bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-zinc-500 uppercase text-[10px] font-bold block mb-1">Passenger Name</label>
                            <input
                              type="text"
                              required
                              value={editForm.name}
                              onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-2.5 text-white outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-zinc-500 uppercase text-[10px] font-bold block mb-1">Contact</label>
                            <input
                              type="text"
                              required
                              value={editForm.contact}
                              onChange={(e) => setEditForm(f => ({ ...f, contact: e.target.value }))}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-2.5 text-white font-mono outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-zinc-500 uppercase text-[10px] font-bold block mb-1">Status</label>
                          <select
                            value={editForm.status}
                            onChange={(e) => setEditForm(f => ({ ...f, status: e.target.value }))}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-white outline-none"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Driver Assigned">Driver Assigned</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-zinc-500 uppercase text-[10px] font-bold block mb-1">Service Type</label>
                          <select
                            value={editForm.serviceType}
                            onChange={(e) => setEditForm(f => ({ ...f, serviceType: e.target.value }))}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-white outline-none"
                          >
                            <option value="Airport">Airport</option>
                            <option value="Local">Local</option>
                            <option value="One Way">One Way</option>
                            <option value="Round Trip">Round Trip</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-zinc-500 uppercase text-[10px] font-bold block mb-1">Pickup Location</label>
                          <input
                            type="text"
                            required
                            value={editForm.pickup}
                            onChange={(e) => setEditForm(f => ({ ...f, pickup: e.target.value }))}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-white outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-zinc-500 uppercase text-[10px] font-bold block mb-1">Drop Destination</label>
                          <input
                            type="text"
                            required
                            value={editForm.drop}
                            onChange={(e) => setEditForm(f => ({ ...f, drop: e.target.value }))}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-white outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-zinc-500 uppercase text-[10px] font-bold block mb-1">Date</label>
                            <input
                              type="date"
                              required
                              value={editForm.date}
                              onChange={(e) => setEditForm(f => ({ ...f, date: e.target.value }))}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-2 text-white font-mono outline-none [color-scheme:dark]"
                            />
                          </div>
                          <div>
                            <label className="text-zinc-500 uppercase text-[10px] font-bold block mb-1">Time</label>
                            <input
                              type="time"
                              required
                              value={editForm.time}
                              onChange={(e) => setEditForm(f => ({ ...f, time: e.target.value }))}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-2 text-white font-mono outline-none [color-scheme:dark]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-zinc-500 uppercase text-[10px] font-bold block mb-1">Fare Estimate</label>
                            <input
                              type="text"
                              placeholder="e.g. ₹1,499"
                              value={editForm.priceEstimate}
                              onChange={(e) => setEditForm(f => ({ ...f, priceEstimate: e.target.value }))}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-white outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-zinc-500 uppercase text-[10px] font-bold block mb-1">
                              Final Amount (₹){editForm.status === 'Completed' ? ' *' : ''}
                            </label>
                            <input
                              type="number"
                              min="1"
                              step="any"
                              required={editForm.status === 'Completed'}
                              placeholder="Please enter amount"
                              value={editForm.finalAmount}
                              onChange={(e) => setEditForm(f => ({ ...f, finalAmount: e.target.value }))}
                              className={`w-full bg-zinc-900 border rounded-lg py-2 px-3 text-white font-mono outline-none ${
                                editForm.status === 'Completed' && parseAmountValue(editForm.finalAmount) === null
                                  ? 'border-amber-500/60 focus:border-brand-yellow'
                                  : 'border-zinc-800 focus:border-brand-yellow/50'
                              }`}
                            />
                          </div>
                        </div>

                        <div className="pt-2 border-t border-zinc-800/80 space-y-2.5">
                          <span className="text-brand-yellow uppercase text-[10px] font-bold block">Driver & Vehicle Info (Visible to Customer)</span>
                          <input
                            type="text"
                            placeholder="Driver Name"
                            value={editForm.driverName}
                            onChange={(e) => setEditForm(f => ({ ...f, driverName: e.target.value }))}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-white outline-none"
                          />
                          <input
                            type="tel"
                            placeholder="Driver Phone Number"
                            value={editForm.driverPhone}
                            onChange={(e) => setEditForm(f => ({ ...f, driverPhone: e.target.value }))}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-white font-mono outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Vehicle Details (e.g. Toyota Innova KA-01-AB-1234)"
                            value={editForm.vehicleDetails}
                            onChange={(e) => setEditForm(f => ({ ...f, vehicleDetails: e.target.value }))}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-white outline-none"
                          />
                          <textarea
                            rows={2}
                            placeholder="Dispatch Notes for Customer..."
                            value={editForm.adminNotes}
                            onChange={(e) => setEditForm(f => ({ ...f, adminNotes: e.target.value }))}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-white outline-none resize-none"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={updatingId === selectedBooking.id}
                          className="w-full bg-brand-yellow hover:bg-yellow-400 text-brand-dark font-bold py-2.5 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                        >
                          {updatingId === selectedBooking.id ? 'Saving Updates...' : 'Save & Sync to Customer'}
                        </button>
                      </form>
                    ) : (
                      <>
                        {/* Route Details */}
                        <div className="space-y-3.5">
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

                        {(selectedBooking.driverName || selectedBooking.driverPhone || selectedBooking.vehicleDetails || selectedBooking.adminNotes) && (
                          <div className="space-y-2">
                            <h4 className="text-xs text-zinc-500 font-bold uppercase tracking-widest font-mono">Assigned Driver & Notes</h4>
                            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-1.5 text-xs">
                              {selectedBooking.driverName && (
                                <p className="text-white"><span className="text-zinc-500">Driver:</span> {selectedBooking.driverName}</p>
                              )}
                              {selectedBooking.driverPhone && (
                                <p className="text-white font-mono"><span className="text-zinc-500 font-sans">Phone:</span> {selectedBooking.driverPhone}</p>
                              )}
                              {selectedBooking.vehicleDetails && (
                                <p className="text-white"><span className="text-zinc-500">Vehicle:</span> {selectedBooking.vehicleDetails}</p>
                              )}
                              {selectedBooking.adminNotes && (
                                <p className="text-zinc-300 pt-1 border-t border-zinc-800/60">{selectedBooking.adminNotes}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Quick Status Management Selector */}
                        <div className="space-y-3 pt-2">
                          <h4 className="text-xs text-zinc-500 font-bold uppercase tracking-widest font-mono">Quick Status Update</h4>
                          <div className="relative">
                            <select
                              disabled={updatingId === selectedBooking.id}
                              value={selectedBooking.status}
                              onChange={(e) => handleStatusChange(selectedBooking.id, e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-yellow/50 rounded-xl py-3 px-4 text-white text-sm outline-none cursor-pointer appearance-none"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Driver Assigned">Driver Assigned</option>
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

                        {/* Completed Booking PDF Receipt Section (only visible once Completed AND amount entered) */}
                        {selectedBooking.status === 'Completed' && (
                          hasValidAmount(selectedBooking) ? (
                            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                                    FINAL SETTLED AMOUNT
                                  </span>
                                  <span className="text-xl font-extrabold font-mono text-white">
                                    {formatAmountForUi(selectedBooking.finalAmount)}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => openCompletionAmountModal(selectedBooking)}
                                  className="text-[11px] font-semibold text-zinc-300 hover:text-brand-yellow underline cursor-pointer"
                                >
                                  Edit Amount
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => generateBookingReceiptPdf(selectedBooking)}
                                className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                              >
                                <Download className="w-4 h-4" />
                                Download PDF Receipt
                              </button>
                            </div>
                          ) : (
                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-2.5">
                              <p className="text-amber-300 text-xs font-medium">
                                Please enter amount to unlock the downloadable PDF receipt for this completed booking.
                              </p>
                              <button
                                type="button"
                                onClick={() => openCompletionAmountModal(selectedBooking)}
                                className="w-full bg-brand-yellow hover:bg-yellow-400 text-brand-dark font-bold text-xs py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <IndianRupee className="w-3.5 h-3.5" />
                                Enter Final Amount
                              </button>
                            </div>
                          )
                        )}
                        {/* Manual Delete Booking Action */}
                        <div className="pt-3 border-t border-zinc-800/80">
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmBooking(selectedBooking)}
                            disabled={deletingId === selectedBooking.id}
                            className="w-full bg-rose-950/30 hover:bg-rose-950/60 border border-rose-900/50 text-rose-400 hover:text-rose-300 font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete This Booking
                          </button>
                        </div>
                      </>
                    )}

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

      {/* Completion Final Amount Prompt Modal */}
      <AnimatePresence>
        {completionModalBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl text-left space-y-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-yellow/15 border border-brand-yellow/30 text-brand-yellow flex items-center justify-center shrink-0">
                    <IndianRupee className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-brand-yellow font-bold block">
                      Complete Booking • {completionModalBooking.id}
                    </span>
                    <h3 className="text-lg font-bold text-white">Please enter amount</h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCompletionModalBooking(null);
                    setCompletionAmountError(null);
                  }}
                  className="text-zinc-500 hover:text-white p-1 rounded-lg cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-3.5 text-xs space-y-1">
                <p className="text-zinc-300 font-semibold">
                  {completionModalBooking.name} • <span className="font-mono text-zinc-400">{completionModalBooking.serviceType}</span>
                </p>
                <p className="text-zinc-500 line-clamp-1">
                  {completionModalBooking.pickup} → {completionModalBooking.drop}
                </p>
                <p className="text-zinc-500 font-mono">
                  {completionModalBooking.date} at {completionModalBooking.time}
                </p>
              </div>

              <form onSubmit={handleConfirmCompletionAmount} className="space-y-4">
                <div>
                  <label className="text-zinc-400 text-xs font-semibold block mb-2">
                    Final Fare Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-brand-yellow font-bold font-mono">₹</span>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      autoFocus
                      required
                      placeholder="Please enter amount (e.g. 1450)"
                      value={completionAmountInput}
                      onChange={(e) => {
                        setCompletionAmountInput(e.target.value);
                        if (completionAmountError) setCompletionAmountError(null);
                      }}
                      className="w-full bg-zinc-950 border border-zinc-700 focus:border-brand-yellow rounded-xl py-3 pl-9 pr-4 text-white font-mono text-base outline-none"
                    />
                  </div>
                  <p className="text-zinc-500 text-[11px] mt-2">
                    The downloadable PDF receipt will appear after you enter and confirm the amount.
                  </p>
                </div>

                {completionAmountError && (
                  <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-2.5 rounded-xl text-xs">
                    {completionAmountError}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setCompletionModalBooking(null);
                      setCompletionAmountError(null);
                    }}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs py-3 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingId === completionModalBooking.id}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs py-3 px-4 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                  >
                    {updatingId === completionModalBooking.id ? 'Saving...' : 'Complete & Save Amount'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Booking Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="w-full max-w-md bg-zinc-900 border border-rose-900/50 rounded-2xl p-6 shadow-2xl text-left space-y-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-rose-400 font-bold block">
                      Confirm Deletion • {deleteConfirmBooking.id}
                    </span>
                    <h3 className="text-lg font-bold text-white">Delete this booking?</h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmBooking(null)}
                  className="text-zinc-500 hover:text-white p-1 rounded-lg cursor-pointer"
                  aria-label="Close delete confirmation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-3.5 text-xs space-y-1">
                <p className="text-zinc-200 font-semibold">
                  {deleteConfirmBooking.name} • <span className="font-mono text-zinc-400">{deleteConfirmBooking.serviceType}</span>
                </p>
                <p className="text-zinc-500 line-clamp-1">
                  {deleteConfirmBooking.pickup} → {deleteConfirmBooking.drop}
                </p>
                <p className="text-zinc-500 font-mono">
                  {deleteConfirmBooking.date} at {deleteConfirmBooking.time}
                </p>
              </div>

              <p className="text-zinc-400 text-xs leading-relaxed">
                This will permanently remove booking <span className="text-white font-mono font-semibold">{deleteConfirmBooking.id}</span> from the database and customer booking history. This action cannot be undone.
              </p>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmBooking(null)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs py-3 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteBooking}
                  disabled={deletingId === deleteConfirmBooking.id}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {deletingId === deleteConfirmBooking.id ? 'Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
