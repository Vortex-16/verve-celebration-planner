import React, { useState } from 'react';
import {
  X,
  Calendar,
  Sparkles,
  MapPin,
  DollarSign,
  Users,
  Check,
  ChevronRight,
  ChevronLeft,
  FileText
} from 'lucide-react';
import { parseToCents } from '../../lib/budget-math.ts';
import type { EventItem } from '../../types/index.ts';

interface EventWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: EventItem, generateAIPlan: boolean) => Promise<void>;
  userId?: string;
  initialEvent?: EventItem | null;
}

const EVENT_TYPES = [
  { id: 'wedding', label: 'Wedding & Reception' },
  { id: 'birthday', label: 'Birthday Celebration' },
  { id: 'anniversary', label: 'Anniversary & Milestone' },
  { id: 'festival', label: 'Festival & Gala' },
  { id: 'community', label: 'Community Gathering' },
  { id: 'conference', label: 'Conference / Summit' },
  { id: 'dinner_party', label: 'Private Dinner & Party' },
  { id: 'cultural', label: 'Cultural Celebration' },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR'];

export const EventWizardModal: React.FC<EventWizardModalProps> = ({
  isOpen,
  onClose,
  onSave,
  userId,
  initialEvent,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState(initialEvent?.name || '');
  const [eventType, setEventType] = useState(initialEvent?.eventType || 'birthday');
  const [date, setDate] = useState(initialEvent?.date || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(initialEvent?.endDate || '');
  const [location, setLocation] = useState(initialEvent?.location || '');
  const [locationType, setLocationType] = useState<'in-person' | 'virtual' | 'hybrid'>(initialEvent?.locationType || 'in-person');
  const [budgetDisplay, setBudgetDisplay] = useState(initialEvent ? (initialEvent.totalBudget / 100).toString() : '5000');
  const [currency, setCurrency] = useState(initialEvent?.currency || 'USD');
  const [guestCount, setGuestCount] = useState<number>(initialEvent?.guestCount || 50);
  const [theme, setTheme] = useState(initialEvent?.theme || '');
  const [atmosphere, setAtmosphere] = useState(initialEvent?.atmosphere || '');
  const [notes, setNotes] = useState(initialEvent?.notes || '');
  const [generateAIPlan, setGenerateAIPlan] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleNextStep = () => {
    setErrorMsg('');
    if (step === 1) {
      if (!name.trim()) {
        setErrorMsg('Please enter an event title.');
        return;
      }
      if (!date) {
        setErrorMsg('Please select an event date.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const cents = parseToCents(budgetDisplay);
      if (cents < 0) {
        setErrorMsg('Budget must be a positive number.');
        return;
      }
      if (guestCount < 1) {
        setErrorMsg('Please specify at least 1 expected guest.');
        return;
      }
      setStep(3);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Event title is required.');
      setStep(1);
      return;
    }

    const totalBudgetCents = parseToCents(budgetDisplay);
    const eventId = initialEvent?.id || `evt-${Date.now()}`;
    const newEvent: EventItem = {
      id: eventId,
      userId: userId || 'local-explorer',
      name: name.trim(),
      eventType,
      date,
      endDate: endDate || undefined,
      location: location.trim(),
      locationType,
      totalBudget: totalBudgetCents,
      currency,
      guestCount: Math.max(1, guestCount),
      theme: theme.trim() || undefined,
      atmosphere: atmosphere.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: initialEvent?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setIsSubmitting(true);
    try {
      await onSave(newEvent, generateAIPlan);
      onClose();
    } catch (err) {
      console.error('Failed to save event:', err);
      setErrorMsg('Failed to save event. Please check inputs and retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-2xl bg-white border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
          <div>
            <h2 className="text-base font-bold text-zinc-900 tracking-tight">
              {initialEvent ? 'Edit Celebration' : 'Plan a New Celebration'}
            </h2>
            <p className="text-xs text-zinc-600 mt-0.5">
              Step {step} of 3: {step === 1 ? 'Core Details' : step === 2 ? 'Budget & Guests' : 'Aesthetic & AI Blueprint'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Tracker */}
        <div className="w-full bg-zinc-100 h-1">
          <div
            className="bg-[#E11D48] h-1 transition-all duration-300"
            style={{ width: step === 1 ? '33.3%' : step === 2 ? '66.6%' : '100%' }}
          />
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              {errorMsg}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1">
                  Celebration Name <span className="text-[#E11D48]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maya & Daniel's Wedding, 40th Birthday Gala"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1">
                  Event Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {EVENT_TYPES.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setEventType(type.id)}
                      className={`px-2.5 py-2 rounded-xl text-xs font-medium border text-left transition cursor-pointer ${
                        eventType === type.id
                          ? 'bg-zinc-900 text-white border-zinc-900'
                          : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1">
                    Event Date <span className="text-[#E11D48]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-800 mb-1">
                    Venue or Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Starlight Botanical Pavilion, Seattle"
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1">
                    Format
                  </label>
                  <select
                    value={locationType}
                    onChange={(e) => setLocationType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  >
                    <option value="in-person">In-Person</option>
                    <option value="virtual">Virtual</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-zinc-800 mb-1">
                    Total Target Budget <span className="text-[#E11D48]">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-zinc-600 font-bold">$</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={budgetDisplay}
                      onChange={(e) => setBudgetDisplay(e.target.value)}
                      placeholder="e.g. 10000"
                      className="w-full pl-7 pr-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-600 mt-1">
                    Stored as minor units for financial calculation accuracy.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 font-semibold"
                  >
                    {CURRENCIES.map((cur) => (
                      <option key={cur} value={cur}>{cur}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1">
                  Expected Guest Count <span className="text-[#E11D48]">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    required
                    value={guestCount}
                    onChange={(e) => setGuestCount(parseInt(e.target.value, 10) || 1)}
                    className="w-32 px-3.5 py-2 rounded-xl border border-zinc-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                  <div className="flex gap-2">
                    {[25, 50, 100, 200].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setGuestCount(preset)}
                        className={`px-2.5 py-1 text-xs rounded-lg border transition cursor-pointer ${
                          guestCount === preset
                            ? 'bg-zinc-900 text-white border-zinc-900'
                            : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1">
                  Theme & Design Concept (Optional)
                </label>
                <input
                  type="text"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="e.g. Modern Minimalist, Rustic Bohemian, Candlelight Monochrome"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1">
                  Atmosphere & Style (Optional)
                </label>
                <input
                  type="text"
                  value={atmosphere}
                  onChange={(e) => setAtmosphere(e.target.value)}
                  placeholder="e.g. Elegant, relaxed, lively jazz dance party, intimate"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1">
                  Dietary, Cultural, or Accessibility Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Halal catering requirements, wheelchair accessible ramp, quiet sensory corner"
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
                />
              </div>

              {!initialEvent && (
                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="genAI"
                    checked={generateAIPlan}
                    onChange={(e) => setGenerateAIPlan(e.target.checked)}
                    className="mt-0.5 rounded text-[#E11D48] focus:ring-[#E11D48]"
                  />
                  <label htmlFor="genAI" className="text-xs text-zinc-800 cursor-pointer">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#E11D48]" />
                      Generate Instant Gemini Master Plan
                    </span>
                    <span className="block text-zinc-600 mt-0.5 text-[11px]">
                      Creates realistic category budget percentages, chronological milestone checklists, and customized vendor recommendations.
                    </span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((step - 1) as any)}
                className="flex items-center gap-1 px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 text-xs font-semibold text-white hover:bg-zinc-800 transition active:scale-95 cursor-pointer"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E11D48] text-xs font-semibold text-white hover:bg-[#be123c] transition active:scale-95 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Generating & Saving...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{initialEvent ? 'Save Changes' : 'Initialize Event'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
