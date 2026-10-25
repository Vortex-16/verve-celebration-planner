import React, { useState } from 'react';
import {
  Briefcase,
  Plus,
  Filter,
  Phone,
  Mail,
  User,
  DollarSign,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  X,
  FileText,
  Building
} from 'lucide-react';
import { formatCurrency, parseToCents } from '../../lib/budget-math.ts';
import type { EventItem, VendorItem } from '../../types/index.ts';

interface VendorManagerProps {
  event: EventItem;
  vendors: VendorItem[];
  onSaveVendor: (vendor: VendorItem) => Promise<void>;
  onDeleteVendor: (vendorId: string) => Promise<void>;
}

const VENDOR_CATEGORIES = [
  'Venue',
  'Catering',
  'Photography',
  'Music & Entertainment',
  'Decor & Floral',
  'Transportation',
  'Equipment & Rentals',
  'Invitations & Print',
  'Other',
];

export const VendorManager: React.FC<VendorManagerProps> = ({
  event,
  vendors,
  onSaveVendor,
  onDeleteVendor,
}) => {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorItem | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState(VENDOR_CATEGORIES[0]);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [quotedDisplay, setQuotedDisplay] = useState('0');
  const [bookingStatus, setBookingStatus] = useState<'contacted' | 'quoted' | 'negotiating' | 'booked' | 'declined'>('contacted');
  const [paymentStatus, setPaymentStatus] = useState<'unpaid' | 'deposit_paid' | 'fully_paid'>('unpaid');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const openVendorModal = (vendor?: VendorItem) => {
    if (vendor) {
      setEditingVendor(vendor);
      setName(vendor.name);
      setCategory(vendor.category);
      setContactName(vendor.contactName || '');
      setContactPhone(vendor.contactPhone || '');
      setContactEmail(vendor.contactEmail || '');
      setQuotedDisplay(((vendor.quotedPrice || 0) / 100).toString());
      setBookingStatus(vendor.bookingStatus);
      setPaymentStatus(vendor.paymentStatus);
      setNotes(vendor.notes || '');
    } else {
      setEditingVendor(null);
      setName('');
      setCategory(VENDOR_CATEGORIES[0]);
      setContactName('');
      setContactPhone('');
      setContactEmail('');
      setQuotedDisplay('0');
      setBookingStatus('contacted');
      setPaymentStatus('unpaid');
      setNotes('');
    }
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Vendor name is required.');
      return;
    }

    const quotedCents = parseToCents(quotedDisplay);
    const newVendor: VendorItem = {
      id: editingVendor ? editingVendor.id : `vnd-${Date.now()}`,
      eventId: event.id,
      userId: event.userId,
      name: name.trim(),
      category,
      contactName: contactName.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined,
      quotedPrice: quotedCents,
      bookingStatus,
      paymentStatus,
      notes: notes.trim() || undefined,
      createdAt: editingVendor?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await onSaveVendor(newVendor);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save vendor:', err);
      setFormError('Failed to save vendor. Please retry.');
    }
  };

  const filteredVendors = vendors.filter((v) => {
    if (categoryFilter !== 'all' && v.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && v.bookingStatus !== statusFilter) return false;
    return true;
  });

  const bookedCount = vendors.filter(v => v.bookingStatus === 'booked').length;
  const negotiatingCount = vendors.filter(v => v.bookingStatus === 'negotiating' || v.bookingStatus === 'quoted').length;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-zinc-900 tracking-tight">Vendor & Partner Directory</h1>
          <p className="text-xs text-zinc-600">
            Compare quotes, track contract execution, and coordinate day-of event service providers
          </p>
        </div>
        <button
          onClick={() => openVendorModal()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition active:scale-95 shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#E11D48]" />
          <span>Add Vendor</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white p-4 border border-zinc-200 shadow-xs">
          <span className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider block">Total Providers</span>
          <p className="text-lg font-bold text-zinc-900 mt-1">{vendors.length}</p>
          <p className="text-[11px] text-zinc-600 mt-0.5">Contacted or active</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-zinc-200 shadow-xs">
          <span className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider block">Booked & Locked</span>
          <p className="text-lg font-bold text-zinc-900 mt-1">{bookedCount}</p>
          <p className="text-[11px] text-zinc-600 mt-0.5">Contract signed</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-zinc-200 shadow-xs">
          <span className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider block">In Negotiation</span>
          <p className="text-lg font-bold text-zinc-900 mt-1">{negotiatingCount}</p>
          <p className="text-[11px] text-zinc-600 mt-0.5">Awaiting quotes / terms</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-zinc-200 shadow-xs">
          <span className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider block">Total Quoted</span>
          <p className="text-lg font-bold text-zinc-900 mt-1">
            {formatCurrency(vendors.reduce((sum, v) => sum + (v.quotedPrice || 0), 0), event.currency)}
          </p>
          <p className="text-[11px] text-zinc-600 mt-0.5">Combined estimate</p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-700">
            <Filter className="w-3.5 h-3.5 text-zinc-600" />
            <span className="font-semibold">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {VENDOR_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-700">
            <span className="font-semibold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="booked">Booked</option>
              <option value="negotiating">Negotiating</option>
              <option value="quoted">Quoted</option>
              <option value="contacted">Contacted</option>
              <option value="declined">Declined</option>
            </select>
          </div>
        </div>

        <span className="text-xs text-zinc-600 font-medium">
          Showing {filteredVendors.length} of {vendors.length} vendors
        </span>
      </div>

      {/* Vendor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVendors.length === 0 ? (
          <div className="col-span-full rounded-2xl bg-white border border-zinc-200 p-12 text-center text-zinc-600 space-y-2">
            <Building className="w-8 h-8 text-zinc-300 mx-auto" />
            <p className="text-xs font-medium">No vendors match your search</p>
            <button
              onClick={() => openVendorModal()}
              className="text-xs text-[#E11D48] font-semibold hover:underline cursor-pointer"
            >
              Add a new vendor record
            </button>
          </div>
        ) : (
          filteredVendors.map((vendor) => (
            <div
              key={vendor.id}
              className="rounded-2xl bg-white border border-zinc-200 p-5 shadow-xs hover:border-zinc-300 transition space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-700">
                      {vendor.category}
                    </span>
                    <h3 className="text-sm font-bold text-zinc-900 mt-1">{vendor.name}</h3>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      vendor.bookingStatus === 'booked'
                        ? 'bg-zinc-900 text-white'
                        : vendor.bookingStatus === 'negotiating'
                        ? 'bg-amber-100 text-amber-800'
                        : vendor.bookingStatus === 'declined'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-zinc-100 text-zinc-700'
                    }`}
                  >
                    {vendor.bookingStatus}
                  </span>
                </div>

                {vendor.quotedPrice ? (
                  <p className="text-base font-bold text-zinc-900 mt-2">
                    {formatCurrency(vendor.quotedPrice, event.currency)}
                    <span className="text-[11px] font-normal text-zinc-600 ml-1">quoted</span>
                  </p>
                ) : null}

                <div className="space-y-1.5 text-xs text-zinc-600 mt-3 pt-3 border-t border-zinc-100">
                  {vendor.contactName && (
                    <p className="flex items-center gap-1.5 text-zinc-800 font-medium truncate">
                      <User className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
                      {vendor.contactName}
                    </p>
                  )}
                  {vendor.contactPhone && (
                    <p className="flex items-center gap-1.5 truncate">
                      <Phone className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
                      {vendor.contactPhone}
                    </p>
                  )}
                  {vendor.contactEmail && (
                    <p className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
                      {vendor.contactEmail}
                    </p>
                  )}
                  {vendor.notes && (
                    <p className="text-[11px] text-zinc-600 line-clamp-2 mt-1 bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                      {vendor.notes}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-zinc-600 uppercase">
                  Payment: {vendor.paymentStatus.replace('_', ' ')}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openVendorModal(vendor)}
                    className="p-1 rounded-md text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 cursor-pointer"
                    title="Edit vendor"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteVendor(vendor.id)}
                    className="p-1 rounded-md text-zinc-600 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                    title="Delete vendor"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Vendor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-zinc-200 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-sm font-bold text-zinc-900">
                {editingVendor ? 'Edit Vendor Record' : 'Add New Vendor'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3.5 mt-4">
              {formError && (
                <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs">{formError}</div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1">
                  Vendor or Company Name <span className="text-[#E11D48]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Skyline Starlight Catering, Soundwave DJs"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  >
                    {VENDOR_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1">
                    Quoted Fee ({event.currency})
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={quotedDisplay}
                    onChange={(e) => setQuotedDisplay(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1">Booking Status</label>
                  <select
                    value={bookingStatus}
                    onChange={(e) => setBookingStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  >
                    <option value="contacted">Contacted</option>
                    <option value="quoted">Quoted</option>
                    <option value="negotiating">Negotiating</option>
                    <option value="booked">Booked</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="deposit_paid">Deposit Paid</option>
                    <option value="fully_paid">Fully Paid</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Elena"
                    className="w-full px-2.5 py-2 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="e.g. +1 555-0192"
                    className="w-full px-2.5 py-2 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1">Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="e.g. info@vendor.com"
                    className="w-full px-2.5 py-2 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1">Notes & Scope of Work</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Load-in schedule, equipment provisions, contract riders"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 cursor-pointer"
                >
                  {editingVendor ? 'Save Changes' : 'Add Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
