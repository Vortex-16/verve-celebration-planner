import React, { useState } from 'react';
import {
  Mail,
  Send,
  X,
  CheckCircle2,
  Users,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Check
} from 'lucide-react';
import type { EventItem, GuestItem } from '../../types/index.ts';
import { formatDisplayDate } from '../../lib/date-utils.ts';

interface MailSenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem;
  guests: GuestItem[];
  targetGuest?: GuestItem | null;
  onMarkInvitationsSent: (guestIds: string[]) => Promise<void>;
  onSuccess: (count: number) => void;
}

export const MailSenderModal: React.FC<MailSenderModalProps> = ({
  isOpen,
  onClose,
  event,
  guests,
  targetGuest,
  onMarkInvitationsSent,
  onSuccess,
}) => {
  const recipients = targetGuest
    ? [targetGuest]
    : guests.filter((g) => !g.invitationSent || g.rsvpStatus === 'awaiting');

  const [subject, setSubject] = useState(
    `Invitation: ${event.name} — ${formatDisplayDate(event.date)}`
  );
  const [template, setTemplate] = useState(
    `Dear {GuestName},\n\nYou are cordially invited to celebrate ${event.name}.\n\nDate: ${formatDisplayDate(event.date)}\nVenue: ${event.location || 'See event program'}\nAtmosphere: ${event.atmosphere || 'Celebratory'}\n\nPlease let us know if you can attend and confirm any dietary preferences.\n\nWarm regards,\nThe Event Host`
  );

  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);

  if (!isOpen) return null;

  const handleSimulatedAutoSend = async () => {
    if (recipients.length === 0) return;
    setIsSending(true);
    setSendProgress(0);

    for (let i = 0; i <= recipients.length; i++) {
      await new Promise((r) => setTimeout(r, 200));
      setSendProgress(Math.round((i / recipients.length) * 100));
    }

    const ids = recipients.map((r) => r.id);
    await onMarkInvitationsSent(ids);
    setIsSending(false);
    onSuccess(recipients.length);
    onClose();
  };

  const handleOpenMailClient = (guest: GuestItem) => {
    const personalizedBody = template.replace('{GuestName}', guest.name);
    const mailtoUrl = `mailto:${guest.email || ''}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(personalizedBody)}`;
    window.location.href = mailtoUrl;
    onMarkInvitationsSent([guest.id]);
    onSuccess(1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white border border-zinc-200 shadow-2xl p-6 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
              <Mail className="w-4 h-4 text-[#E11D48]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">
                {targetGuest ? `Send Invitation to ${targetGuest.name}` : 'Automatic Email Dispatcher'}
              </h3>
              <p className="text-xs text-zinc-600">
                {recipients.length} {recipients.length === 1 ? 'recipient' : 'recipients'} queued
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-3.5 overflow-y-auto flex-1">
          {recipients.length === 0 ? (
            <div className="p-8 text-center text-zinc-600 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-[#E11D48] mx-auto" />
              <p className="text-xs font-semibold text-zinc-800">All guest invitations have been dispatched!</p>
              <p className="text-[11px] text-zinc-600">No pending unsent guests remaining in the directory.</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1">Subject Line</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1">
                  Message Template <span className="text-zinc-600 text-[10px]">({'{GuestName}'} dynamic tag)</span>
                </label>
                <textarea
                  rows={6}
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none font-mono text-[11px]"
                />
              </div>

              {/* Recipients preview */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
                  Target Recipients ({recipients.length})
                </label>
                <div className="max-h-32 overflow-y-auto border border-zinc-200 rounded-xl divide-y divide-zinc-100">
                  {recipients.map((r) => (
                    <div key={r.id} className="p-2 flex items-center justify-between text-xs bg-zinc-50/50">
                      <div>
                        <span className="font-semibold text-zinc-900">{r.name}</span>
                        <span className="text-[11px] text-zinc-600 ml-2">{r.email || 'No email provided'}</span>
                      </div>
                      <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-zinc-200 text-zinc-700">
                        {r.group || 'Guest'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {isSending && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-semibold text-zinc-800">
                    <span>Dispatching invitations...</span>
                    <span>{sendProgress}%</span>
                  </div>
                  <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#E11D48] h-2 rounded-full transition-all duration-200"
                      style={{ width: `${sendProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {recipients.length > 0 && (
          <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
            {targetGuest ? (
              <button
                type="button"
                onClick={() => handleOpenMailClient(targetGuest)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-zinc-600" />
                <span>Open in Mail App</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSending}
                onClick={handleSimulatedAutoSend}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 disabled:opacity-50 cursor-pointer active:scale-95 transition"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#E11D48]" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 text-[#E11D48]" />
                    <span>Send {recipients.length} {recipients.length === 1 ? 'Invitation' : 'Invitations'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
