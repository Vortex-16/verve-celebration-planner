import type { EventItem, BudgetItem, TaskItem, VendorItem, GuestItem } from '../types/index.ts';
import { formatCurrency } from './budget-math.ts';

/**
 * Cleanly escapes field values for RFC 4180 CSV compliance
 */
export function escapeCsvField(field: unknown): string {
  if (field === null || field === undefined) {
    return '""';
  }
  const str = String(field);
  // If field contains quotes, commas, or newlines, enclose in double quotes and escape internal quotes
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Builds the comprehensive master event plan CSV string
 */
export function generateMasterPlanCsv(
  event: EventItem,
  budgetItems: BudgetItem[],
  tasks: TaskItem[],
  vendors: VendorItem[],
  guests: GuestItem[]
): string {
  const rows: string[] = [];

  // --- HEADER: EVENT OVERVIEW ---
  rows.push('--- VERVE CELEBRATION MASTER PLAN ---');
  rows.push(['Field', 'Details'].map(escapeCsvField).join(','));
  rows.push(['Event Name', event.name].map(escapeCsvField).join(','));
  rows.push(['Event Category', event.eventType].map(escapeCsvField).join(','));
  rows.push(['Event Date', event.date].map(escapeCsvField).join(','));
  rows.push(['End Date', event.endDate || 'N/A'].map(escapeCsvField).join(','));
  rows.push(['Location', event.location || 'N/A'].map(escapeCsvField).join(','));
  rows.push(['Location Format', event.locationType].map(escapeCsvField).join(','));
  rows.push(['Total Target Budget', formatCurrency(event.totalBudget, event.currency)].map(escapeCsvField).join(','));
  rows.push(['Expected Guests', event.guestCount.toString()].map(escapeCsvField).join(','));
  rows.push(['Theme Concept', event.theme || 'N/A'].map(escapeCsvField).join(','));
  rows.push(['Atmosphere & Mood', event.atmosphere || 'N/A'].map(escapeCsvField).join(','));
  rows.push(['Notes / Special Constraints', event.notes || 'N/A'].map(escapeCsvField).join(','));
  rows.push('');

  // --- SECTION: BUDGET ALLOCATIONS & EXPENSES ---
  rows.push('--- FINANCIAL BUDGET & EXPENSES ---');
  rows.push([
    'Item Description',
    'Category',
    `Planned (${event.currency})`,
    `Actual Spend (${event.currency})`,
    'Payment Status',
    'Linked Vendor',
    'Notes / Invoicing'
  ].map(escapeCsvField).join(','));

  for (const item of budgetItems) {
    const linkedVendor = vendors.find(v => v.id === item.vendorId);
    rows.push([
      item.title,
      item.category,
      (item.plannedAmount / 100).toFixed(2),
      (item.actualAmount / 100).toFixed(2),
      item.paidStatus.replace('_', ' ').toUpperCase(),
      linkedVendor ? linkedVendor.name : 'N/A',
      item.notes || ''
    ].map(escapeCsvField).join(','));
  }
  rows.push('');

  // --- SECTION: TIMELINE ACTION MILESTONES ---
  rows.push('--- TIMELINE ACTION MILESTONES ---');
  rows.push([
    'Milestone Task',
    'Category',
    'Priority',
    'Due Date',
    'Status',
    'Assignee',
    'Description & Instructions'
  ].map(escapeCsvField).join(','));

  const sortedTasks = [...tasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  for (const t of sortedTasks) {
    rows.push([
      t.title,
      t.category || 'General',
      t.priority.toUpperCase(),
      t.dueDate,
      t.status.replace('_', ' ').toUpperCase(),
      t.assignee || 'Unassigned',
      t.description || ''
    ].map(escapeCsvField).join(','));
  }
  rows.push('');

  // --- SECTION: VENDORS & PARTNERS ---
  rows.push('--- VENDORS & PARTNERS ---');
  rows.push([
    'Vendor / Business Name',
    'Category',
    'Contact Person',
    'Phone',
    'Email',
    `Quoted Fee (${event.currency})`,
    'Booking Status',
    'Payment Status',
    'Notes / Contract Specs'
  ].map(escapeCsvField).join(','));

  for (const v of vendors) {
    rows.push([
      v.name,
      v.category,
      v.contactName || '',
      v.contactPhone || '',
      v.contactEmail || '',
      ((v.quotedPrice || 0) / 100).toFixed(2),
      v.bookingStatus.toUpperCase(),
      v.paymentStatus.replace('_', ' ').toUpperCase(),
      v.notes || ''
    ].map(escapeCsvField).join(','));
  }
  rows.push('');

  // --- SECTION: GUEST DIRECTORY & RSVP ---
  rows.push('--- GUEST DIRECTORY & RSVP ---');
  rows.push([
    'Guest / Household Name',
    'Circle / Group',
    'RSVP Status',
    'Plus-Ones Count',
    'Dietary & Accessibility Restrictions',
    'Email Address',
    'Phone Number',
    'Invitation Delivered'
  ].map(escapeCsvField).join(','));

  for (const g of guests) {
    rows.push([
      g.name,
      g.group || 'General',
      g.rsvpStatus.toUpperCase(),
      (g.plusOnes || 0).toString(),
      g.dietaryNotes || 'None',
      g.email || '',
      g.phone || '',
      g.invitationSent ? 'YES' : 'NO'
    ].map(escapeCsvField).join(','));
  }

  return rows.join('\r\n');
}

/**
 * Triggers client-side browser download of CSV string
 */
export function downloadCsvFile(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
