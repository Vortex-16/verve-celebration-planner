import React, { useState } from 'react';
import {
  Users,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
  Mail,
  Phone,
  Trash2,
  Edit2,
  X,
  Send,
  Utensils,
  ExternalLink
} from 'lucide-react';
import type { EventItem, GuestItem } from '../../types/index.ts';
import { MailSenderModal } from './MailSenderModal.tsx';
import { useToast } from '../../context/ToastContext.tsx';

interface GuestManagerProps {
  event: EventItem;
  guests: GuestItem[];
  onSaveGuest: (guest: GuestItem) => Promise<void>;
  onDeleteGuest: (guestId: string) => Promise<void>;
}

const GUEST_GROUPS = ['Family', 'Friends', 'Colleagues', 'VIP', 'General'];

export const GuestManager: React.FC<GuestManagerProps> = ({
  event,
  guests,
  onSaveGuest,
  onDeleteGuest,
}) => {
  const { showToast } = useToast();
  const [rsvpFilter, setRsvpFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<GuestItem | null>(null);

  // Email sender modal states
  const [isMailModalOpen, setIsMailModalOpen] = useState(false);
  const [selectedGuestForMail, setSelectedGuestForMail] = useState<GuestItem | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [rsvpStatus, setRsvpStatus] = useState<'attending' | 'declined' | 'tentative' | 'awaiting'>('awaiting');
  const [group, setGroup] = useState('Friends');
  const [dietaryNotes, setDietaryNotes] = useState('');
  const [plusOnes, setPlusOnes] = useState(0);
  const [invitationSent, setInvitationSent] = useState(false);
  const [formError, setFormError] = useState('');

  const openGuestModal = (guest?: GuestItem) => {
    if (guest) {
      setEditingGuest(guest);
      setName(guest.name);
      setEmail(guest.email || '');
      setPhone(guest.phone || '');
      setRsvpStatus(guest.rsvpStatus);
      setGroup(guest.group || 'Friends');
      setDietaryNotes(guest.dietaryNotes || '');
      setPlusOnes(guest.plusOnes || 0);
      setInvitationSent(guest.invitationSent || false);
    } else {
      setEditingGuest(null);
      setName('');
      setEmail('');
      setPhone('');
      setRsvpStatus('awaiting');
      setGroup('Friends');
      setDietaryNotes('');
      setPlusOnes(0);
      setInvitationSent(false);
    }
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Guest name is required.');
      return;
    }

    const newGuest: GuestItem = {
      id: editingGuest ? editingGuest.id : `gst-${Date.now()}`,
      eventId: event.id,
      userId: event.userId,
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      rsvpStatus,
      group,
      dietaryNotes: dietaryNotes.trim() || undefined,
      plusOnes: Math.max(0, plusOnes),
      invitationSent,
      createdAt: editingGuest?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await onSaveGuest(newGuest);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save guest:', err);
      setFormError('Failed to save guest record.');
    }
  };

  const handleQuickStatusChange = async (guest: GuestItem, status: GuestItem['rsvpStatus']) => {
    await onSaveGuest({
      ...guest,
      rsvpStatus: status,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleToggleInvite = async (guest: GuestItem) => {
    await onSaveGuest({
      ...guest,
      invitationSent: !guest.invitationSent,
      updatedAt: new Date().toISOString(),
    });
    showToast(
      guest.invitationSent ? `Marked ${guest.name} as uninvited` : `Marked ${guest.name} invitation delivered`,
      'info'
    );
  };

  const handleMarkInvitationsSent = async (guestIds: string[]) => {
    for (const id of guestIds) {
      const g = guests.find((item) => item.id === id);
      if (g) {
        await onSaveGuest({
          ...g,
          invitationSent: true,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  };

  const filteredGuests = guests.filter((g) => {
    if (rsvpFilter !== 'all' && g.rsvpStatus !== rsvpFilter) return false;
    if (groupFilter !== 'all' && g.group !== groupFilter) return false;
    return true;
  });

  // Calculate metrics
  const attendingGuests = guests.filter(g => g.rsvpStatus === 'attending');
  const attendingHeadcount = attendingGuests.reduce((acc, g) => acc + 1 + (g.plusOnes || 0), 0);
  const awaitingCount = guests.filter(g => g.rsvpStatus === 'awaiting').length;
  const declinedCount = guests.filter(g => g.rsvpStatus === 'declined').length;
  const dietaryCount = guests.filter(g => g.dietaryNotes && g.dietaryNotes.trim().length > 0).length;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-zinc-900 tracking-tight">Guest & RSVP Coordination</h1>
          <p className="text-xs text-zinc-600">
            Track headcount, group designations, invitations, and dietary accommodations
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              setSelectedGuestForMail(null);
              setIsMailModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 text-white text-xs font-semibold hover:bg-zinc-700 transition active:scale-95 border border-zinc-700 shadow-xs cursor-pointer"
          >
            <Mail className="w-4 h-4 text-[#E11D48]" />
            <span>Dispatch Invites</span>
          </button>
          <button
            onClick={() => openGuestModal()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition active:scale-95 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#E11D48]" />
            <span>Add Guest Record</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white p-4 border border-zinc-200 shadow-xs">
          <span className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider block">Confirmed Headcount</span>
          <p className="text-lg font-bold text-zinc-900 mt-1">{attendingHeadcount}</p>
          <p className="text-[11px] text-zinc-600 mt-0.5">Including plus-ones</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-zinc-200 shadow-xs">
          <span className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider block">Awaiting RSVP</span>
          <p className="text-lg font-bold text-zinc-900 mt-1">{awaitingCount}</p>
          <p className="text-[11px] text-zinc-600 mt-0.5">Pending responses</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-zinc-200 shadow-xs">
          <span className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider block">Declined</span>
          <p className="text-lg font-bold text-zinc-900 mt-1">{declinedCount}</p>
          <p className="text-[11px] text-zinc-600 mt-0.5">Cannot attend</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-zinc-200 shadow-xs">
          <span className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider block">Dietary Restrictions</span>
          <p className="text-lg font-bold text-zinc-900 mt-1">{dietaryCount}</p>
          <p className="text-[11px] text-zinc-600 mt-0.5">Special meal requests</p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-700">
            <Filter className="w-3.5 h-3.5 text-zinc-600" />
            <span className="font-semibold">RSVP:</span>
            <select
              value={rsvpFilter}
              onChange={(e) => setRsvpFilter(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="all">All Responses</option>
              <option value="attending">Attending</option>
              <option value="tentative">Tentative</option>
              <option value="awaiting">Awaiting</option>
              <option value="declined">Declined</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-700">
            <span className="font-semibold">Circle:</span>
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="all">All Groups</option>
              {GUEST_GROUPS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>

        <span className="text-xs text-zinc-600 font-medium">
          Showing {filteredGuests.length} of {guests.length} guest records
        </span>
      </div>

      {/* Guests Table */}
      <div className="rounded-2xl bg-white border border-zinc-200 shadow-xs overflow-hidden">
        {filteredGuests.length === 0 ? (
          <div className="py-12 text-center text-zinc-600 space-y-2">
            <Users className="w-8 h-8 text-zinc-300 mx-auto" />
            <p className="text-xs font-medium">No guest records found matching your filter</p>
            <button
              onClick={() => openGuestModal()}
              className="text-xs text-[#E11D48] font-semibold hover:underline cursor-pointer"
            >
              Add your first guest
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/70 text-zinc-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Guest Name</th>
                  <th className="py-3 px-4">Group / Circle</th>
                  <th className="py-3 px-4">RSVP Status</th>
                  <th className="py-3 px-4">Plus-Ones</th>
                  <th className="py-3 px-4">Dietary & Accessibility</th>
                  <th className="py-3 px-4">Invitation</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredGuests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-zinc-50/60 transition">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-zinc-900">{guest.name}</p>
                      <div className="flex items-center gap-3 text-[11px] text-zinc-600 mt-0.5">
                        {guest.email && <span>{guest.email}</span>}
                        {guest.phone && <span>{guest.phone}</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-zinc-100 text-zinc-800">
                        {guest.group || 'General'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={guest.rsvpStatus}
                        onChange={(e) => handleQuickStatusChange(guest, e.target.value as any)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase border focus:outline-none cursor-pointer ${
                          guest.rsvpStatus === 'attending'
                            ? 'bg-zinc-900 text-white border-zinc-900'
                            : guest.rsvpStatus === 'tentative'
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : guest.rsvpStatus === 'declined'
                            ? 'bg-red-100 text-red-800 border-red-200'
                            : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                        }`}
                      >
                        <option value="attending">Attending</option>
                        <option value="tentative">Tentative</option>
                        <option value="awaiting">Awaiting</option>
                        <option value="declined">Declined</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 font-semibold text-zinc-800">
                      +{guest.plusOnes || 0}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      {guest.dietaryNotes ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                          <Utensils className="w-3 h-3 text-amber-700" />
                          {guest.dietaryNotes}
                        </span>
                      ) : (
                        <span className="text-[11px] text-zinc-600">None specified</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleInvite(guest)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border transition cursor-pointer ${
                            guest.invitationSent
                              ? 'bg-zinc-100 text-zinc-900 border-zinc-300'
                              : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                          }`}
                          title="Toggle invitation sent status"
                        >
                          <CheckCircle2 className={`w-3 h-3 ${guest.invitationSent ? 'text-[#E11D48]' : 'text-zinc-400'}`} />
                          {guest.invitationSent ? 'Sent' : 'Mark'}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedGuestForMail(guest);
                            setIsMailModalOpen(true);
                          }}
                          className="p-1 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
                          title={`Email invitation to ${guest.name}`}
                          aria-label={`Email invitation to ${guest.name}`}
                        >
                          <Mail className="w-3.5 h-3.5 text-[#E11D48]" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => openGuestModal(guest)}
                        className="p-1 rounded-md text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 cursor-pointer"
                        title="Edit guest"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteGuest(guest.id)}
                        className="p-1 rounded-md text-zinc-600 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                        title="Delete guest"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Guest Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-zinc-200 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-sm font-bold text-zinc-900">
                {editingGuest ? 'Edit Guest Record' : 'Add Guest'}
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
                  Full Name / Household <span className="text-[#E11D48]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. David & Rachel Miller"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. david@example.com"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +1 555-0123"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1">RSVP Status</label>
                  <select
                    value={rsvpStatus}
                    onChange={(e) => setRsvpStatus(e.target.value as any)}
                    className="w-full px-2.5 py-2 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  >
                    <option value="awaiting">Awaiting</option>
                    <option value="attending">Attending</option>
                    <option value="tentative">Tentative</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1">Circle / Group</label>
                  <select
                    value={group}
                    onChange={(e) => setGroup(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  >
                    {GUEST_GROUPS.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1">Plus-Ones</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={plusOnes}
                    onChange={(e) => setPlusOnes(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-2.5 py-2 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1">Dietary & Accessibility Notes</label>
                <input
                  type="text"
                  value={dietaryNotes}
                  onChange={(e) => setDietaryNotes(e.target.value)}
                  placeholder="e.g. Vegetarian, Nut allergy, Needs wheelchair space"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="inviteSent"
                  checked={invitationSent}
                  onChange={(e) => setInvitationSent(e.target.checked)}
                  className="rounded text-[#E11D48] focus:ring-[#E11D48]"
                />
                <label htmlFor="inviteSent" className="text-xs text-zinc-700 cursor-pointer">
                  Invitation has already been delivered / sent
                </label>
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
                  {editingGuest ? 'Save Changes' : 'Add Guest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Automatic Mail Dispatcher Modal */}
      <MailSenderModal
        isOpen={isMailModalOpen}
        onClose={() => {
          setIsMailModalOpen(false);
          setSelectedGuestForMail(null);
        }}
        event={event}
        guests={guests}
        targetGuest={selectedGuestForMail}
        onMarkInvitationsSent={handleMarkInvitationsSent}
        onSuccess={(count) => {
          showToast(`Successfully dispatched ${count} invitation${count === 1 ? '' : 's'}!`, 'success');
        }}
      />
    </div>
  );
};
