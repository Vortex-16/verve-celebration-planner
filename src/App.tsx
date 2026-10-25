import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ToastProvider, useToast } from './context/ToastContext.tsx';
import { Navbar, ActiveTab } from './components/layout/Navbar.tsx';
import { OfflineBanner } from './components/layout/OfflineBanner.tsx';
import { WelcomeView } from './components/marketing/WelcomeView.tsx';
import { EventWizardModal } from './components/events/EventWizardModal.tsx';
import { OverviewDashboard } from './components/events/OverviewDashboard.tsx';
import { BudgetPlanner } from './components/budget/BudgetPlanner.tsx';
import { TimelineTasks } from './components/timeline/TimelineTasks.tsx';
import { VendorManager } from './components/vendors/VendorManager.tsx';
import { GuestManager } from './components/guests/GuestManager.tsx';
import { AIPlanningAssistant } from './components/ai/AIPlanningAssistant.tsx';
import { EventService, SAMPLE_EVENT } from './lib/event-store.ts';
import { calculateDueDate } from './lib/date-utils.ts';
import type {
  EventItem,
  BudgetItem,
  TaskItem,
  VendorItem,
  GuestItem,
  AIPlanItem,
} from './types/index.ts';

function MainApp() {
  const { user, loading: authLoading, isGuestMode } = useAuth();
  const { showToast } = useToast();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  // Sub-entity collections for active event
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [guests, setGuests] = useState<GuestItem[]>([]);

  // Modal controls
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingEventForWizard, setEditingEventForWizard] = useState<EventItem | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Check URL query parameters for ?autostart=1
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      setHasStarted(true);
    }
  }, []);

  // Fetch all events on user/guest change
  useEffect(() => {
    async function loadEvents() {
      setIsLoadingData(true);
      try {
        const loaded = await EventService.getEvents(user?.uid);
        setEvents(loaded);
        if (loaded.length > 0) {
          // If no event selected or previous is not in list, select the first
          setSelectedEvent((prev) => {
            if (prev && loaded.some((e) => e.id === prev.id)) {
              return loaded.find((e) => e.id === prev.id)!;
            }
            return loaded[0];
          });
        } else {
          setSelectedEvent(null);
        }
      } catch (err) {
        console.error('Failed to load events:', err);
      } finally {
        setIsLoadingData(false);
      }
    }

    if (!authLoading) {
      loadEvents();
    }
  }, [user, authLoading]);

  // Load sub-entities when selectedEvent changes
  useEffect(() => {
    async function loadSubEntities() {
      if (!selectedEvent) {
        setBudgetItems([]);
        setTasks([]);
        setVendors([]);
        setGuests([]);
        return;
      }

      try {
        const [loadedBudget, loadedTasks, loadedVendors, loadedGuests] = await Promise.all([
          EventService.getBudgetItems(selectedEvent.id, user?.uid),
          EventService.getTasks(selectedEvent.id, user?.uid),
          EventService.getVendors(selectedEvent.id, user?.uid),
          EventService.getGuests(selectedEvent.id, user?.uid),
        ]);

        setBudgetItems(loadedBudget);
        setTasks(loadedTasks);
        setVendors(loadedVendors);
        setGuests(loadedGuests);
      } catch (err) {
        console.error('Failed to load event details:', err);
      }
    }

    loadSubEntities();
  }, [selectedEvent, user]);

  // --- Event mutations ---
  const handleSaveEvent = async (eventToSave: EventItem, generateAIPlan: boolean) => {
    try {
      const saved = await EventService.saveEvent(eventToSave, user?.uid);
      const isUpdate = events.some((e) => e.id === saved.id);
      setEvents((prev) => {
        const exists = prev.findIndex((e) => e.id === saved.id);
        if (exists >= 0) {
          const updated = [...prev];
          updated[exists] = saved;
          return updated;
        }
        return [saved, ...prev];
      });
      setSelectedEvent(saved);
      showToast(isUpdate ? 'Celebration updated successfully!' : 'Celebration created!', 'success');

      // If AI generation requested, switch to AI tab and auto-generate
      if (generateAIPlan) {
        setActiveTab('ai');
      }
    } catch (err) {
      console.error('Failed to save event:', err);
      showToast('Failed to save celebration details.', 'error');
    }
  };

  const handleEditEvent = () => {
    if (!selectedEvent) return;
    setEditingEventForWizard(selectedEvent);
    setIsWizardOpen(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await EventService.deleteEvent(eventId, user?.uid);
      setEvents((prev) => {
        const next = prev.filter((e) => e.id !== eventId);
        if (selectedEvent?.id === eventId) {
          setSelectedEvent(next.length > 0 ? next[0] : null);
        }
        return next;
      });
      showToast('Celebration deleted successfully.', 'info');
    } catch (err) {
      console.error('Failed to delete event:', err);
      showToast('Failed to delete celebration.', 'error');
    }
  };

  // --- Budget mutations ---
  const handleSaveBudgetItem = async (item: BudgetItem) => {
    try {
      const isNew = !budgetItems.some((b) => b.id === item.id);
      const saved = await EventService.saveBudgetItem(item, user?.uid);
      setBudgetItems((prev) => {
        const index = prev.findIndex((b) => b.id === saved.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = saved;
          return updated;
        }
        return [...prev, saved];
      });
      showToast(isNew ? 'Budget line item added.' : 'Budget line item updated.', 'success');
    } catch (err) {
      console.error('Failed to save budget item:', err);
      showToast('Failed to save budget item.', 'error');
    }
  };

  const handleDeleteBudgetItem = async (itemId: string) => {
    if (!selectedEvent) return;
    try {
      await EventService.deleteBudgetItem(selectedEvent.id, itemId, user?.uid);
      setBudgetItems((prev) => prev.filter((b) => b.id !== itemId));
      showToast('Budget allocation removed.', 'info');
    } catch (err) {
      console.error('Failed to delete budget item:', err);
      showToast('Failed to remove budget item.', 'error');
    }
  };

  // --- Task mutations ---
  const handleSaveTask = async (task: TaskItem) => {
    try {
      const isNew = !tasks.some((t) => t.id === task.id);
      const saved = await EventService.saveTask(task, user?.uid);
      setTasks((prev) => {
        const index = prev.findIndex((t) => t.id === saved.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = saved;
          return updated;
        }
        return [...prev, saved];
      });
      showToast(isNew ? 'Milestone task created.' : 'Milestone task updated.', 'success');
    } catch (err) {
      console.error('Failed to save task:', err);
      showToast('Failed to save milestone task.', 'error');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!selectedEvent) return;
    try {
      await EventService.deleteTask(selectedEvent.id, taskId, user?.uid);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      showToast('Milestone task deleted.', 'info');
    } catch (err) {
      console.error('Failed to delete task:', err);
      showToast('Failed to delete task.', 'error');
    }
  };

  const handleToggleTaskComplete = async (task: TaskItem) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    const updated: TaskItem = {
      ...task,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    };
    await handleSaveTask(updated);
    showToast(nextStatus === 'completed' ? `Completed "${task.title}"!` : `Reopened "${task.title}".`, 'info');
  };

  // --- Vendor mutations ---
  const handleSaveVendor = async (vendor: VendorItem) => {
    try {
      const isNew = !vendors.some((v) => v.id === vendor.id);
      const saved = await EventService.saveVendor(vendor, user?.uid);
      setVendors((prev) => {
        const index = prev.findIndex((v) => v.id === saved.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = saved;
          return updated;
        }
        return [...prev, saved];
      });
      showToast(isNew ? 'Vendor partner added.' : 'Vendor profile updated.', 'success');
    } catch (err) {
      console.error('Failed to save vendor:', err);
      showToast('Failed to save vendor partner.', 'error');
    }
  };

  const handleDeleteVendor = async (vendorId: string) => {
    if (!selectedEvent) return;
    try {
      await EventService.deleteVendor(selectedEvent.id, vendorId, user?.uid);
      setVendors((prev) => prev.filter((v) => v.id !== vendorId));
      showToast('Vendor removed from directory.', 'info');
    } catch (err) {
      console.error('Failed to delete vendor:', err);
      showToast('Failed to remove vendor.', 'error');
    }
  };

  // --- Guest mutations ---
  const handleSaveGuest = async (guest: GuestItem) => {
    try {
      const isNew = !guests.some((g) => g.id === guest.id);
      const saved = await EventService.saveGuest(guest, user?.uid);
      setGuests((prev) => {
        const index = prev.findIndex((g) => g.id === saved.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = saved;
          return updated;
        }
        return [...prev, saved];
      });
      showToast(isNew ? 'Guest added to directory.' : 'Guest record updated.', 'success');
    } catch (err) {
      console.error('Failed to save guest:', err);
      showToast('Failed to save guest record.', 'error');
    }
  };

  const handleDeleteGuest = async (guestId: string) => {
    if (!selectedEvent) return;
    try {
      await EventService.deleteGuest(selectedEvent.id, guestId, user?.uid);
      setGuests((prev) => prev.filter((g) => g.id !== guestId));
      showToast('Guest removed from directory.', 'info');
    } catch (err) {
      console.error('Failed to delete guest:', err);
      showToast('Failed to remove guest record.', 'error');
    }
  };

  // --- AI Plan import handler ---
  const handleApplyPlanItems = async (
    newBudgetItems: Partial<BudgetItem>[],
    newTasks: Partial<TaskItem>[]
  ) => {
    if (!selectedEvent) return;

    // Save imported budget items
    for (const b of newBudgetItems) {
      const itemToSave: BudgetItem = {
        id: `bgt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        eventId: selectedEvent.id,
        userId: selectedEvent.userId,
        title: b.title || 'Allocated Expense',
        category: b.category || 'General',
        plannedAmount: b.plannedAmount || 0,
        actualAmount: 0,
        paidStatus: 'unpaid',
        notes: b.notes || 'Imported from AI Master Plan',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await handleSaveBudgetItem(itemToSave);
    }

    // Save imported tasks
    for (const t of newTasks) {
      const taskToSave: TaskItem = {
        id: `tsk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        eventId: selectedEvent.id,
        userId: selectedEvent.userId,
        title: t.title || 'Checklist Item',
        description: t.description || '',
        dueDate: t.dueDate || selectedEvent.date,
        priority: t.priority || 'medium',
        status: 'pending',
        category: t.category || 'General',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await handleSaveTask(taskToSave);
    }
  };

  const handleSaveAIPlanRecord = async (plan: AIPlanItem) => {
    await EventService.saveAIPlan(plan, user?.uid);
  };

  // If user is not signed in and has not entered guest mode, show the Welcome presentation
  const showWelcome = !user && !isGuestMode && !hasStarted;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center text-xs font-semibold text-zinc-600">
        <span className="w-2 h-2 rounded-full bg-[#E11D48] animate-ping mr-2" />
        Initializing Verve Platform...
      </div>
    );
  }

  if (showWelcome) {
    return (
      <>
        <WelcomeView
          onStartExploring={() => {
            setHasStarted(true);
          }}
          onOpenCreate={() => {
            setHasStarted(true);
            setEditingEventForWizard(null);
            setIsWizardOpen(true);
          }}
        />
        <OfflineBanner />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#18181B] flex flex-col justify-between">
      <div>
        {/* Navigation Bar */}
        <Navbar
          events={events}
          selectedEvent={selectedEvent}
          onSelectEvent={(evt) => setSelectedEvent(evt)}
          onOpenNewEvent={() => {
            setEditingEventForWizard(null);
            setIsWizardOpen(true);
          }}
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
        />

        {/* Main Content Viewport */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {selectedEvent ? (
            <>
              {activeTab === 'overview' && (
                <OverviewDashboard
                  event={selectedEvent}
                  budgetItems={budgetItems}
                  tasks={tasks}
                  vendors={vendors}
                  guests={guests}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  onOpenNewTask={() => setActiveTab('timeline')}
                  onOpenNewExpense={() => setActiveTab('budget')}
                  onToggleTaskComplete={handleToggleTaskComplete}
                  onOpenAIModal={() => setActiveTab('ai')}
                  onEditEvent={handleEditEvent}
                  onDeleteEvent={() => selectedEvent && handleDeleteEvent(selectedEvent.id)}
                  onOpenMailSender={() => setActiveTab('guests')}
                />
              )}

              {activeTab === 'budget' && (
                <BudgetPlanner
                  event={selectedEvent}
                  budgetItems={budgetItems}
                  vendors={vendors}
                  onSaveItem={handleSaveBudgetItem}
                  onDeleteItem={handleDeleteBudgetItem}
                  onOpenNewExpense={() => {}}
                />
              )}

              {activeTab === 'timeline' && (
                <TimelineTasks
                  event={selectedEvent}
                  tasks={tasks}
                  onSaveTask={handleSaveTask}
                  onDeleteTask={handleDeleteTask}
                  onToggleComplete={handleToggleTaskComplete}
                  onOpenNewTask={() => {}}
                />
              )}

              {activeTab === 'vendors' && (
                <VendorManager
                  event={selectedEvent}
                  vendors={vendors}
                  onSaveVendor={handleSaveVendor}
                  onDeleteVendor={handleDeleteVendor}
                />
              )}

              {activeTab === 'guests' && (
                <GuestManager
                  event={selectedEvent}
                  guests={guests}
                  onSaveGuest={handleSaveGuest}
                  onDeleteGuest={handleDeleteGuest}
                />
              )}

              {activeTab === 'ai' && (
                <AIPlanningAssistant
                  event={selectedEvent}
                  onApplyPlanItems={handleApplyPlanItems}
                  onSavePlanRecord={handleSaveAIPlanRecord}
                />
              )}
            </>
          ) : (
            <div className="rounded-2xl bg-white border border-zinc-200 p-12 text-center text-zinc-600 max-w-md mx-auto space-y-4 my-12">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center mx-auto">
                <span className="text-sm font-bold text-[#E11D48]">V</span>
              </div>
              <h2 className="text-base font-bold text-zinc-900">No celebrations in workspace</h2>
              <p className="text-xs text-zinc-600">
                Create your first event or load our curated Jubilee Anniversary template.
              </p>
              <div className="flex justify-center gap-2 pt-2">
                <button
                  onClick={() => {
                    setEditingEventForWizard(null);
                    setIsWizardOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 cursor-pointer"
                >
                  Create Event
                </button>
                <button
                  onClick={() => {
                    handleSaveEvent(SAMPLE_EVENT, false);
                  }}
                  className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-800 text-xs font-semibold hover:bg-zinc-200 cursor-pointer"
                >
                  Load Sample
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-4 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-600 gap-2">
          <p>© 2026 Verve Event Platform • Powered by Google Firebase & Gemini 3.8 Flash</p>
          <div className="flex items-center gap-4">
            <span>ABAC Security Verified</span>
            <span>•</span>
            <span>Progressive Web App Ready</span>
          </div>
        </div>
      </footer>

      {/* Event Creation & Edit Wizard Modal */}
      <EventWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSave={handleSaveEvent}
        userId={user?.uid}
        initialEvent={editingEventForWizard}
      />

      {/* Offline Status Toast */}
      <OfflineBanner />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <MainApp />
      </ToastProvider>
    </AuthProvider>
  );
}
