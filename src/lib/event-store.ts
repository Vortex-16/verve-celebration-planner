import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase.ts';
import type {
  EventItem,
  BudgetItem,
  TaskItem,
  VendorItem,
  GuestItem,
  AIPlanItem
} from '../types/index.ts';

const LOCAL_STORAGE_KEY = 'verve_offline_events_cache';

// Starter demo data for guest exploration and zero-state demonstration
export const SAMPLE_EVENT: EventItem = {
  id: 'demo-jubilee-2026',
  userId: 'local-explorer',
  name: 'Golden Jubilee Celebration & Gala',
  eventType: 'anniversary',
  date: '2026-11-20',
  endDate: '2026-11-21',
  location: 'The Grand Conservatory Gardens',
  locationType: 'in-person',
  totalBudget: 1500000, // $15,000.00
  currency: 'USD',
  guestCount: 85,
  theme: 'Refined Gold & Botanical Monochrome',
  atmosphere: 'Sophisticated, celebratory, and intimately vibrant',
  notes: '50th anniversary gathering honoring our founders. Requires acoustic jazz ensemble, passed hors d’oeuvres, and outdoor fairy lighting.',
  createdAt: '2026-10-22T00:00:00.000Z',
  updatedAt: '2026-10-22T00:00:00.000Z',
};

export const SAMPLE_BUDGET: BudgetItem[] = [
  { id: 'b-1', eventId: 'demo-jubilee-2026', userId: 'local-explorer', category: 'Venue', title: 'Conservatory Hall Rental', plannedAmount: 500000, actualAmount: 520000, paidStatus: 'paid', notes: 'Includes tables, Chiavari chairs, and early load-in pass.' },
  { id: 'b-2', eventId: 'demo-jubilee-2026', userId: 'local-explorer', category: 'Catering', title: 'Seasonal 3-Course Plated Dinner', plannedAmount: 450000, actualAmount: 435000, paidStatus: 'partially_paid', notes: 'Menu tasting finalized; includes champagne toast.' },
  { id: 'b-3', eventId: 'demo-jubilee-2026', userId: 'local-explorer', category: 'Photography', title: 'Full Evening Photo & Video Archive', plannedAmount: 200000, actualAmount: 200000, paidStatus: 'paid', notes: 'Includes drone footage and edited memory album.' },
  { id: 'b-4', eventId: 'demo-jubilee-2026', userId: 'local-explorer', category: 'Music', title: 'Live Jazz Quartet & PA System', plannedAmount: 180000, actualAmount: 150000, paidStatus: 'unpaid', notes: 'Arrival at 5:00 PM for sound check.' },
  { id: 'b-5', eventId: 'demo-jubilee-2026', userId: 'local-explorer', category: 'Decor', title: 'Floral Table Centerpieces & Lighting', plannedAmount: 120000, actualAmount: 110000, paidStatus: 'paid', notes: 'White roses, eucalyptus, and warm uplighting.' },
  { id: 'b-6', eventId: 'demo-jubilee-2026', userId: 'local-explorer', category: 'Contingency', title: 'Unplanned Expenses Reserve', plannedAmount: 50000, actualAmount: 0, paidStatus: 'unpaid', notes: 'Emergency fund buffer.' },
];

export const SAMPLE_TASKS: TaskItem[] = [
  { id: 't-1', eventId: 'demo-jubilee-2026', userId: 'local-explorer', title: 'Sign Conservatory Venue Contract', description: 'Confirm safety deposits and access times with hall administrator.', dueDate: '2026-10-25', priority: 'urgent', status: 'completed', category: 'Venue', assignee: 'Devon' },
  { id: 't-2', eventId: 'demo-jubilee-2026', userId: 'local-explorer', title: 'Confirm Jazz Quartet Repertoire', description: 'Select 5 landmark classic songs for the anniversary toast segment.', dueDate: '2026-11-05', priority: 'high', status: 'in_progress', category: 'Entertainment', assignee: 'Elena' },
  { id: 't-3', eventId: 'demo-jubilee-2026', userId: 'local-explorer', title: 'Finalize Seating Chart & Place Cards', description: 'Arrange 11 round tables of 8 guests each with calligraphy cards.', dueDate: '2026-11-12', priority: 'medium', status: 'pending', category: 'Guests', assignee: 'Devon' },
  { id: 't-4', eventId: 'demo-jubilee-2026', userId: 'local-explorer', title: 'Send Dietary Restrictions to Chef', description: 'Confirm gluten-free, vegan, and shellfish allergy totals.', dueDate: '2026-11-14', priority: 'urgent', status: 'pending', category: 'Catering', assignee: 'Elena' },
];

export const SAMPLE_VENDORS: VendorItem[] = [
  { id: 'v-1', eventId: 'demo-jubilee-2026', userId: 'local-explorer', name: 'Artisan Culinary Group', category: 'Catering', contactName: 'Chef Marcella Vance', contactPhone: '+1 (555) 234-5678', contactEmail: 'marcella@artisanculinary.com', quotedPrice: 450000, bookingStatus: 'booked', paymentStatus: 'deposit_paid', notes: 'Dietary tasting completed. Staffing ratio 1:10.' },
  { id: 'v-2', eventId: 'demo-jubilee-2026', userId: 'local-explorer', name: 'Blue Horizon Jazz Ensemble', category: 'Music', contactName: 'Miles Campbell', contactPhone: '+1 (555) 876-5432', contactEmail: 'booking@bluehorizonjazz.com', quotedPrice: 180000, bookingStatus: 'booked', paymentStatus: 'unpaid', notes: '4-piece band: saxophone, upright bass, piano, drums.' },
  { id: 'v-3', eventId: 'demo-jubilee-2026', userId: 'local-explorer', name: 'Lumière Photo Studios', category: 'Photography', contactName: 'Sara Lin', contactPhone: '+1 (555) 998-1122', contactEmail: 'sara@lumiere.studio', quotedPrice: 200000, bookingStatus: 'booked', paymentStatus: 'fully_paid', notes: '8 hours of coverage plus online high-res gallery.' },
];

export const SAMPLE_GUESTS: GuestItem[] = [
  { id: 'g-1', eventId: 'demo-jubilee-2026', userId: 'local-explorer', name: 'Arthur & Eleanor Pendelton', email: 'arthur.p@family.net', phone: '+1 555-443-2211', rsvpStatus: 'attending', group: 'Family', dietaryNotes: 'Low sodium', plusOnes: 1, invitationSent: true },
  { id: 'g-2', eventId: 'demo-jubilee-2026', userId: 'local-explorer', name: 'Dr. Gregory Vance', email: 'gvance@university.edu', phone: '+1 555-789-0123', rsvpStatus: 'attending', group: 'VIP', dietaryNotes: 'Vegetarian', plusOnes: 0, invitationSent: true },
  { id: 'g-3', eventId: 'demo-jubilee-2026', userId: 'local-explorer', name: 'Caroline Sterling', email: 'c.sterling@foundry.com', phone: '+1 555-654-3210', rsvpStatus: 'tentative', group: 'Colleagues', dietaryNotes: '', plusOnes: 1, invitationSent: true },
  { id: 'g-4', eventId: 'demo-jubilee-2026', userId: 'local-explorer', name: 'Marcus & Naomi Kim', email: 'kim.marcus@kimlaw.com', phone: '+1 555-321-7654', rsvpStatus: 'awaiting', group: 'Friends', dietaryNotes: 'Nut allergy', plusOnes: 1, invitationSent: true },
];

interface OfflineStore {
  events: EventItem[];
  budgetItems: Record<string, BudgetItem[]>; // key: eventId
  tasks: Record<string, TaskItem[]>;
  vendors: Record<string, VendorItem[]>;
  guests: Record<string, GuestItem[]>;
  aiPlans: Record<string, AIPlanItem[]>;
}

function getOfflineStore(): OfflineStore {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Could not read offline storage:', err);
  }

  // Initial seed store
  const defaultStore: OfflineStore = {
    events: [SAMPLE_EVENT],
    budgetItems: { [SAMPLE_EVENT.id]: SAMPLE_BUDGET },
    tasks: { [SAMPLE_EVENT.id]: SAMPLE_TASKS },
    vendors: { [SAMPLE_EVENT.id]: SAMPLE_VENDORS },
    guests: { [SAMPLE_EVENT.id]: SAMPLE_GUESTS },
    aiPlans: {},
  };
  saveOfflineStore(defaultStore);
  return defaultStore;
}

function saveOfflineStore(store: OfflineStore) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.error('Could not save to offline storage:', err);
  }
}

// Data service with Firestore integration and offline fallback
export const EventService = {
  // --- Events ---
  async getEvents(userId?: string): Promise<EventItem[]> {
    if (userId) {
      try {
        const eventsRef = collection(db, 'events');
        const q = query(eventsRef, where('userId', '==', userId));
        const snapshot = await getDocs(q);
        const remoteEvents: EventItem[] = [];
        snapshot.forEach((docSnap) => {
          remoteEvents.push(docSnap.data() as EventItem);
        });

        // Sync with local cache
        const store = getOfflineStore();
        // Keep demo event if no remote events yet so user can explore
        const merged = remoteEvents.length > 0 ? remoteEvents : store.events;
        store.events = merged;
        saveOfflineStore(store);
        return merged;
      } catch (err) {
        console.warn('Firestore fetch failed, using offline cache:', err);
        const store = getOfflineStore();
        return store.events;
      }
    } else {
      const store = getOfflineStore();
      return store.events;
    }
  },

  async saveEvent(event: EventItem, userId?: string): Promise<EventItem> {
    const store = getOfflineStore();
    const existingIndex = store.events.findIndex(e => e.id === event.id);
    if (existingIndex >= 0) {
      store.events[existingIndex] = event;
    } else {
      store.events.unshift(event);
    }
    saveOfflineStore(store);

    if (userId) {
      const path = `events/${event.id}`;
      try {
        await setDoc(doc(db, 'events', event.id), event);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }
    return event;
  },

  async deleteEvent(eventId: string, userId?: string): Promise<void> {
    const store = getOfflineStore();
    store.events = store.events.filter(e => e.id !== eventId);
    delete store.budgetItems[eventId];
    delete store.tasks[eventId];
    delete store.vendors[eventId];
    delete store.guests[eventId];
    delete store.aiPlans[eventId];
    saveOfflineStore(store);

    if (userId) {
      const path = `events/${eventId}`;
      try {
        await deleteDoc(doc(db, 'events', eventId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    }
  },

  // --- Budget Items ---
  async getBudgetItems(eventId: string, userId?: string): Promise<BudgetItem[]> {
    if (userId && !eventId.startsWith('demo-')) {
      const path = `events/${eventId}/budgetItems`;
      try {
        const subRef = collection(db, 'events', eventId, 'budgetItems');
        const snapshot = await getDocs(subRef);
        const remoteItems: BudgetItem[] = [];
        snapshot.forEach(docSnap => remoteItems.push(docSnap.data() as BudgetItem));
        const store = getOfflineStore();
        store.budgetItems[eventId] = remoteItems;
        saveOfflineStore(store);
        return remoteItems;
      } catch (err) {
        console.warn('Could not load budget items from Firestore, falling back to cache:', err);
      }
    }
    const store = getOfflineStore();
    return store.budgetItems[eventId] || [];
  },

  async saveBudgetItem(item: BudgetItem, userId?: string): Promise<BudgetItem> {
    const store = getOfflineStore();
    const items = store.budgetItems[item.eventId] || [];
    const index = items.findIndex(i => i.id === item.id);
    if (index >= 0) {
      items[index] = item;
    } else {
      items.push(item);
    }
    store.budgetItems[item.eventId] = items;
    saveOfflineStore(store);

    if (userId && !item.eventId.startsWith('demo-')) {
      const path = `events/${item.eventId}/budgetItems/${item.id}`;
      try {
        await setDoc(doc(db, 'events', item.eventId, 'budgetItems', item.id), item);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }
    return item;
  },

  async deleteBudgetItem(eventId: string, itemId: string, userId?: string): Promise<void> {
    const store = getOfflineStore();
    if (store.budgetItems[eventId]) {
      store.budgetItems[eventId] = store.budgetItems[eventId].filter(i => i.id !== itemId);
      saveOfflineStore(store);
    }

    if (userId && !eventId.startsWith('demo-')) {
      const path = `events/${eventId}/budgetItems/${itemId}`;
      try {
        await deleteDoc(doc(db, 'events', eventId, 'budgetItems', itemId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    }
  },

  // --- Tasks ---
  async getTasks(eventId: string, userId?: string): Promise<TaskItem[]> {
    if (userId && !eventId.startsWith('demo-')) {
      try {
        const subRef = collection(db, 'events', eventId, 'tasks');
        const snapshot = await getDocs(subRef);
        const remoteTasks: TaskItem[] = [];
        snapshot.forEach(docSnap => remoteTasks.push(docSnap.data() as TaskItem));
        const store = getOfflineStore();
        store.tasks[eventId] = remoteTasks;
        saveOfflineStore(store);
        return remoteTasks;
      } catch (err) {
        console.warn('Could not load tasks from Firestore, falling back to cache:', err);
      }
    }
    const store = getOfflineStore();
    return store.tasks[eventId] || [];
  },

  async saveTask(task: TaskItem, userId?: string): Promise<TaskItem> {
    const store = getOfflineStore();
    const tasks = store.tasks[task.eventId] || [];
    const index = tasks.findIndex(t => t.id === task.id);
    if (index >= 0) {
      tasks[index] = task;
    } else {
      tasks.push(task);
    }
    store.tasks[task.eventId] = tasks;
    saveOfflineStore(store);

    if (userId && !task.eventId.startsWith('demo-')) {
      const path = `events/${task.eventId}/tasks/${task.id}`;
      try {
        await setDoc(doc(db, 'events', task.eventId, 'tasks', task.id), task);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }
    return task;
  },

  async deleteTask(eventId: string, taskId: string, userId?: string): Promise<void> {
    const store = getOfflineStore();
    if (store.tasks[eventId]) {
      store.tasks[eventId] = store.tasks[eventId].filter(t => t.id !== taskId);
      saveOfflineStore(store);
    }

    if (userId && !eventId.startsWith('demo-')) {
      const path = `events/${eventId}/tasks/${taskId}`;
      try {
        await deleteDoc(doc(db, 'events', eventId, 'tasks', taskId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    }
  },

  // --- Vendors ---
  async getVendors(eventId: string, userId?: string): Promise<VendorItem[]> {
    if (userId && !eventId.startsWith('demo-')) {
      try {
        const subRef = collection(db, 'events', eventId, 'vendors');
        const snapshot = await getDocs(subRef);
        const remoteVendors: VendorItem[] = [];
        snapshot.forEach(docSnap => remoteVendors.push(docSnap.data() as VendorItem));
        const store = getOfflineStore();
        store.vendors[eventId] = remoteVendors;
        saveOfflineStore(store);
        return remoteVendors;
      } catch (err) {
        console.warn('Could not load vendors from Firestore, falling back to cache:', err);
      }
    }
    const store = getOfflineStore();
    return store.vendors[eventId] || [];
  },

  async saveVendor(vendor: VendorItem, userId?: string): Promise<VendorItem> {
    const store = getOfflineStore();
    const vendors = store.vendors[vendor.eventId] || [];
    const index = vendors.findIndex(v => v.id === vendor.id);
    if (index >= 0) {
      vendors[index] = vendor;
    } else {
      vendors.push(vendor);
    }
    store.vendors[vendor.eventId] = vendors;
    saveOfflineStore(store);

    if (userId && !vendor.eventId.startsWith('demo-')) {
      const path = `events/${vendor.eventId}/vendors/${vendor.id}`;
      try {
        await setDoc(doc(db, 'events', vendor.eventId, 'vendors', vendor.id), vendor);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }
    return vendor;
  },

  async deleteVendor(eventId: string, vendorId: string, userId?: string): Promise<void> {
    const store = getOfflineStore();
    if (store.vendors[eventId]) {
      store.vendors[eventId] = store.vendors[eventId].filter(v => v.id !== vendorId);
      saveOfflineStore(store);
    }

    if (userId && !eventId.startsWith('demo-')) {
      const path = `events/${eventId}/vendors/${vendorId}`;
      try {
        await deleteDoc(doc(db, 'events', eventId, 'vendors', vendorId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    }
  },

  // --- Guests ---
  async getGuests(eventId: string, userId?: string): Promise<GuestItem[]> {
    if (userId && !eventId.startsWith('demo-')) {
      try {
        const subRef = collection(db, 'events', eventId, 'guests');
        const snapshot = await getDocs(subRef);
        const remoteGuests: GuestItem[] = [];
        snapshot.forEach(docSnap => remoteGuests.push(docSnap.data() as GuestItem));
        const store = getOfflineStore();
        store.guests[eventId] = remoteGuests;
        saveOfflineStore(store);
        return remoteGuests;
      } catch (err) {
        console.warn('Could not load guests from Firestore, falling back to cache:', err);
      }
    }
    const store = getOfflineStore();
    return store.guests[eventId] || [];
  },

  async saveGuest(guest: GuestItem, userId?: string): Promise<GuestItem> {
    const store = getOfflineStore();
    const guests = store.guests[guest.eventId] || [];
    const index = guests.findIndex(g => g.id === guest.id);
    if (index >= 0) {
      guests[index] = guest;
    } else {
      guests.push(guest);
    }
    store.guests[guest.eventId] = guests;
    saveOfflineStore(store);

    if (userId && !guest.eventId.startsWith('demo-')) {
      const path = `events/${guest.eventId}/guests/${guest.id}`;
      try {
        await setDoc(doc(db, 'events', guest.eventId, 'guests', guest.id), guest);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }
    return guest;
  },

  async deleteGuest(eventId: string, guestId: string, userId?: string): Promise<void> {
    const store = getOfflineStore();
    if (store.guests[eventId]) {
      store.guests[eventId] = store.guests[eventId].filter(g => g.id !== guestId);
      saveOfflineStore(store);
    }

    if (userId && !eventId.startsWith('demo-')) {
      const path = `events/${eventId}/guests/${guestId}`;
      try {
        await deleteDoc(doc(db, 'events', eventId, 'guests', guestId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    }
  },

  // --- AI Plans ---
  async getAIPlans(eventId: string, userId?: string): Promise<AIPlanItem[]> {
    if (userId && !eventId.startsWith('demo-')) {
      try {
        const subRef = collection(db, 'events', eventId, 'aiPlans');
        const snapshot = await getDocs(subRef);
        const remotePlans: AIPlanItem[] = [];
        snapshot.forEach(docSnap => remotePlans.push(docSnap.data() as AIPlanItem));
        const store = getOfflineStore();
        store.aiPlans[eventId] = remotePlans;
        saveOfflineStore(store);
        return remotePlans;
      } catch (err) {
        console.warn('Could not load AI plans from Firestore, falling back to cache:', err);
      }
    }
    const store = getOfflineStore();
    return store.aiPlans[eventId] || [];
  },

  async saveAIPlan(plan: AIPlanItem, userId?: string): Promise<AIPlanItem> {
    const store = getOfflineStore();
    const plans = store.aiPlans[plan.eventId] || [];
    const index = plans.findIndex(p => p.id === plan.id);
    if (index >= 0) {
      plans[index] = plan;
    } else {
      plans.unshift(plan);
    }
    store.aiPlans[plan.eventId] = plans;
    saveOfflineStore(store);

    if (userId && !plan.eventId.startsWith('demo-')) {
      const path = `events/${plan.eventId}/aiPlans/${plan.id}`;
      try {
        await setDoc(doc(db, 'events', plan.eventId, 'aiPlans', plan.id), plan);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }
    return plan;
  }
};
