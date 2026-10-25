/**
 * Pure date calculations for event timeline and milestone management.
 */

/**
 * Returns integer days remaining until target event date.
 * Positive number = days until event.
 * 0 = event is today.
 * Negative number = event has passed.
 */
export function getDaysRemaining(eventDateIso: string, referenceDateIso?: string): number {
  if (!eventDateIso) return 0;
  const target = new Date(eventDateIso);
  const ref = referenceDateIso ? new Date(referenceDateIso) : new Date();

  // Normalize to UTC midnight for precise calendar day differences
  const targetUtc = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  const refUtc = Date.UTC(ref.getFullYear(), ref.getMonth(), ref.getDate());

  const diffMs = targetUtc - refUtc;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Check if a task is overdue based on due date and status
 */
export function isTaskOverdue(dueDateIso: string, status: string, referenceDateIso?: string): boolean {
  if (status === 'completed') return false;
  if (!dueDateIso) return false;
  return getDaysRemaining(dueDateIso, referenceDateIso) < 0;
}

/**
 * Calculates a specific due date given the event date and days before event
 */
export function calculateDueDate(eventDateIso: string, daysBeforeEvent: number): string {
  const date = new Date(eventDateIso);
  date.setDate(date.getDate() - daysBeforeEvent);
  return date.toISOString().split('T')[0];
}

/**
 * Format ISO date string into standard readable date
 */
export function formatDisplayDate(isoDate: string): string {
  if (!isoDate) return 'No date set';
  try {
    const parts = isoDate.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
    const d = new Date(isoDate);
    return isNaN(d.getTime()) ? isoDate : d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return isoDate;
  }
}
