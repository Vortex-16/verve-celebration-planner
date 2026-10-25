import React, { useState } from 'react';
import {
  CalendarDays,
  Plus,
  ChevronDown,
  LayoutDashboard,
  Wallet,
  CheckSquare,
  Users,
  Briefcase,
  Sparkles,
  LogIn,
  LogOut,
  MapPin,
  Clock,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { PWAInstallButton } from './PWAInstallButton.tsx';
import type { EventItem } from '../../types/index.ts';

export type ActiveTab = 'overview' | 'budget' | 'timeline' | 'vendors' | 'guests' | 'ai';

interface NavbarProps {
  events: EventItem[];
  selectedEvent: EventItem | null;
  onSelectEvent: (event: EventItem) => void;
  onOpenNewEvent: () => void;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  events,
  selectedEvent,
  onSelectEvent,
  onOpenNewEvent,
  activeTab,
  onTabChange,
}) => {
  const { user, signIn, signOut, isGuestMode } = useAuth();
  const [eventMenuOpen, setEventMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'budget', label: 'Budget', icon: Wallet },
    { id: 'timeline', label: 'Timeline & Tasks', icon: CheckSquare },
    { id: 'vendors', label: 'Vendors', icon: Briefcase },
    { id: 'guests', label: 'Guests & RSVP', icon: Users },
    { id: 'ai', label: 'AI Planner', icon: Sparkles },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FFFFFF] border-b border-zinc-200">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand & Event Selector */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white font-bold text-sm tracking-wider">
                <span className="text-[#E11D48]">V</span>
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-sm tracking-tight text-zinc-900">VERVE</span>
                <span className="text-[10px] text-zinc-600 block -mt-1 font-medium">Event Architect</span>
              </div>
            </div>

            <div className="h-5 w-[1px] bg-zinc-200 hidden sm:block" />

            {/* Event Dropdown Picker */}
            {selectedEvent && (
              <div className="relative">
                <button
                  onClick={() => setEventMenuOpen(!eventMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition text-left cursor-pointer"
                  aria-label="Select celebration or event"
                >
                  <div className="max-w-[130px] sm:max-w-[180px] truncate">
                    <p className="text-xs font-semibold text-zinc-900 truncate">{selectedEvent.name}</p>
                    <p className="text-[10px] text-zinc-600 flex items-center gap-1 truncate">
                      <Clock className="w-2.5 h-2.5" />
                      {selectedEvent.date}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
                </button>

                {eventMenuOpen && (
                  <div className="absolute top-full left-0 mt-1 w-64 rounded-xl bg-white border border-zinc-200 shadow-xl py-1 z-50">
                    <div className="px-3 py-1.5 border-b border-zinc-100 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">Your Celebrations</span>
                      <button
                        onClick={() => {
                          setEventMenuOpen(false);
                          onOpenNewEvent();
                        }}
                        className="text-xs text-[#E11D48] hover:underline font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> New
                      </button>
                    </div>
                    <div className="max-h-60 overflow-y-auto py-1">
                      {events.map((evt) => (
                        <button
                          key={evt.id}
                          onClick={() => {
                            onSelectEvent(evt);
                            setEventMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-zinc-50 flex items-center justify-between cursor-pointer ${
                            selectedEvent.id === evt.id ? 'bg-zinc-100 font-semibold text-zinc-900' : 'text-zinc-700'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <p className="truncate text-xs">{evt.name}</p>
                            <p className="text-[10px] text-zinc-600">{evt.date}</p>
                          </div>
                          {selectedEvent.id === evt.id && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={onOpenNewEvent}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-800 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#E11D48]" />
              <span>Create Event</span>
            </button>
          </div>

          {/* Right Tools & Auth */}
          <div className="flex items-center gap-2.5">
            <PWAInstallButton />

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-full border border-zinc-200 hover:bg-zinc-50 transition cursor-pointer"
                >
                  <span className="text-xs font-medium text-zinc-800 max-w-[100px] truncate hidden md:inline">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Avatar"
                      className="w-7 h-7 rounded-full border border-zinc-200 object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-zinc-900 text-white text-xs font-semibold flex items-center justify-center">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-52 rounded-xl bg-white border border-zinc-200 shadow-xl py-1 z-50">
                    <div className="px-3 py-2 border-b border-zinc-100">
                      <p className="text-xs font-semibold text-zinc-900 truncate">{user.displayName || 'Organizer'}</p>
                      <p className="text-[11px] text-zinc-600 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        signOut();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 transition cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => signIn()}
                className="flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 transition active:scale-95 cursor-pointer shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5 text-[#E11D48]" />
                <span>Sign In with Google</span>
              </button>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 cursor-pointer"
              aria-label="Toggle navigation tabs"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Desktop Tab Bar */}
        <div className="hidden md:flex space-x-1 border-t border-zinc-100 pt-1 pb-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#E11D48]' : 'text-zinc-600'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Navigation Drawer / Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 bg-white px-4 py-3 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  onTabChange(tab.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#E11D48]' : 'text-zinc-600'}`} />
                {tab.label}
              </button>
            );
          })}
          <div className="pt-2 border-t border-zinc-100">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenNewEvent();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-zinc-100 text-zinc-900 text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#E11D48]" />
              Create New Celebration
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
