import React from 'react';
import {
  CalendarDays,
  Wallet,
  CheckSquare,
  Users,
  Briefcase,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  LogIn
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { PWAInstallButton } from '../layout/PWAInstallButton.tsx';

interface WelcomeViewProps {
  onStartExploring: () => void;
  onOpenCreate: () => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({
  onStartExploring,
  onOpenCreate,
}) => {
  const { signIn, enterGuestMode } = useAuth();

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#18181B] flex flex-col justify-between">
      {/* Hero Header */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-12 w-full">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-zinc-200 shadow-xs text-xs font-semibold text-zinc-800">
            <span className="w-2 h-2 rounded-full bg-[#E11D48]" />
            <span>Intelligent Celebration & Event Workspace</span>
          </div>
        </div>

        {/* Hero Title */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 leading-tight">
            Master Every Celebration with Architectural Precision.
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 leading-relaxed max-w-2xl mx-auto">
            Organize weddings, milestone anniversaries, festivals, galas, and community gatherings.
            Featuring decimal-precise budget governance, date-aware timelines, vendor records, and Gemini AI synthesis.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-8 max-w-md mx-auto">
          <button
            onClick={() => signIn()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition active:scale-95 shadow-sm cursor-pointer"
          >
            <LogIn className="w-4 h-4 text-[#E11D48]" />
            <span>Sign In with Google</span>
          </button>

          <button
            onClick={() => {
              enterGuestMode();
              onStartExploring();
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-zinc-900 border border-zinc-200 text-xs font-bold hover:bg-zinc-50 transition active:scale-95 shadow-xs cursor-pointer"
          >
            <span>Explore Demo Event</span>
            <ArrowRight className="w-4 h-4 text-zinc-600" />
          </button>
        </div>

        <div className="flex justify-center mt-4">
          <PWAInstallButton />
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-16">
          <div className="rounded-2xl bg-white p-6 border border-zinc-200 shadow-xs space-y-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center">
              <Wallet className="w-4 h-4 text-[#E11D48]" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">Precise Budget Discipline</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Real arithmetic stored in integer minor units eliminates floating-point drift. Track planned vs. actual allocations, invoices, and remaining funds.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 border border-zinc-200 shadow-xs space-y-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center">
              <CheckSquare className="w-4 h-4 text-[#E11D48]" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">Date-Aware Milestones</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Chronological countdowns, automated overdue alerts, and category filtering ensure zero forgotten logistical tasks leading up to the celebration.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 border border-zinc-200 shadow-xs space-y-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#E11D48]" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">Gemini AI Synthesis</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Transform raw constraints into a validated master plan with custom budget splits, vendor procurement checklists, and an on-demand event advisor.
            </p>
          </div>
        </div>

        {/* Additional Architecture Highlights */}
        <div className="mt-8 rounded-2xl bg-white border border-zinc-200 p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-800">
              <ShieldCheck className="w-4 h-4 text-[#E11D48]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-900">Enterprise Security & Offline Resilience</h4>
              <p className="text-[11px] text-zinc-600">
                Connected to Google Firebase with multi-tier ABAC security rules and Progressive Web App caching.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              enterGuestMode();
              onOpenCreate();
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 hover:text-[#E11D48] transition cursor-pointer"
          >
            <span>Create new event</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-6 text-center text-xs text-zinc-600">
        <p>Verve Celebration & Event Planner • High-fidelity event architecture powered by Firebase & Gemini 3.8 Flash</p>
      </footer>
    </div>
  );
};
