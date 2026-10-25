export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export type EventType =
  | 'wedding'
  | 'birthday'
  | 'anniversary'
  | 'festival'
  | 'community'
  | 'conference'
  | 'dinner_party'
  | 'cultural'
  | 'custom';

export interface EventItem {
  id: string;
  userId: string;
  name: string;
  eventType: string;
  date: string; // YYYY-MM-DD
  endDate?: string;
  location: string;
  locationType: 'in-person' | 'virtual' | 'hybrid';
  totalBudget: number; // in cents
  currency: string;
  guestCount: number;
  theme?: string;
  atmosphere?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BudgetItem {
  id: string;
  eventId: string;
  userId: string;
  category: string;
  title: string;
  plannedAmount: number; // in cents
  actualAmount: number;  // in cents
  paidStatus: 'unpaid' | 'partially_paid' | 'paid';
  vendorId?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskItem {
  id: string;
  eventId: string;
  userId: string;
  title: string;
  description?: string;
  dueDate: string; // YYYY-MM-DD
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed';
  category?: string;
  assignee?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VendorItem {
  id: string;
  eventId: string;
  userId: string;
  name: string;
  category: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  quotedPrice?: number; // in cents
  bookingStatus: 'contacted' | 'quoted' | 'negotiating' | 'booked' | 'declined';
  paymentStatus: 'unpaid' | 'deposit_paid' | 'fully_paid';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GuestItem {
  id: string;
  eventId: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  rsvpStatus: 'attending' | 'declined' | 'tentative' | 'awaiting';
  group?: string; // Family, Friends, VIP, Colleagues
  dietaryNotes?: string;
  plusOnes: number;
  invitationSent: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AIPlanItem {
  id: string;
  eventId: string;
  userId: string;
  summary: string;
  contentJson: string; // Serialized plan data
  status: 'proposed' | 'reviewed' | 'applied';
  createdAt?: string;
  updatedAt?: string;
}
