/**
 * Pure arithmetic and budget analysis using integer cents (minor currency units)
 * to avoid floating point precision issues in financial calculations.
 */

export interface BudgetItemCalculable {
  id: string;
  category: string;
  plannedAmount: number; // in cents
  actualAmount: number;  // in cents
  paidStatus: 'unpaid' | 'partially_paid' | 'paid';
}

export interface BudgetSummary {
  totalBudget: number;       // in cents
  plannedTotal: number;      // in cents
  actualTotal: number;       // in cents
  paidTotal: number;         // in cents
  remainingBudget: number;   // in cents (totalBudget - actualTotal)
  utilizationPercentage: number; // 0 - 100+
  isOverBudget: boolean;
  overBudgetAmount: number;  // in cents (if actualTotal > totalBudget)
  categories: CategorySummary[];
}

export interface CategorySummary {
  category: string;
  plannedAmount: number;
  actualAmount: number;
  paidAmount: number;
  percentageOfBudget: number;
  itemCount: number;
  isOverPlanned: boolean;
}

/**
 * Format integer minor units (cents) into human-readable currency
 */
export function formatCurrency(cents: number, currency = 'USD'): string {
  const isNegative = cents < 0;
  const absCents = Math.abs(cents);
  const units = Math.floor(absCents / 100);
  const remainder = absCents % 100;
  const formattedUnits = units.toLocaleString('en-US');
  const formattedDecimals = remainder.toString().padStart(2, '0');
  const sign = isNegative ? '-' : '';

  const symbolMap: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    CAD: 'CA$',
    AUD: 'AU$',
    JPY: '¥',
  };

  const symbol = symbolMap[currency.toUpperCase()] || `${currency} `;
  return `${sign}${symbol}${formattedUnits}.${formattedDecimals}`;
}

/**
 * Parses user currency input (e.g. "1,250.50" or "1250") safely into integer cents
 */
export function parseToCents(input: string | number): number {
  if (typeof input === 'number') {
    return Math.round(input * 100);
  }
  const cleaned = input.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed) || parsed < 0) {
    return 0;
  }
  return Math.round(parsed * 100);
}

/**
 * Calculate complete event budget aggregation
 */
export function calculateBudgetSummary(
  totalBudget: number,
  items: BudgetItemCalculable[]
): BudgetSummary {
  let plannedTotal = 0;
  let actualTotal = 0;
  let paidTotal = 0;

  const categoryMap = new Map<string, {
    planned: number;
    actual: number;
    paid: number;
    count: number;
  }>();

  for (const item of items) {
    plannedTotal += item.plannedAmount;
    actualTotal += item.actualAmount;

    if (item.paidStatus === 'paid') {
      paidTotal += item.actualAmount > 0 ? item.actualAmount : item.plannedAmount;
    } else if (item.paidStatus === 'partially_paid') {
      paidTotal += Math.round((item.actualAmount > 0 ? item.actualAmount : item.plannedAmount) * 0.5);
    }

    const currentCat = categoryMap.get(item.category) || { planned: 0, actual: 0, paid: 0, count: 0 };
    currentCat.planned += item.plannedAmount;
    currentCat.actual += item.actualAmount;
    if (item.paidStatus === 'paid') {
      currentCat.paid += item.actualAmount > 0 ? item.actualAmount : item.plannedAmount;
    } else if (item.paidStatus === 'partially_paid') {
      currentCat.paid += Math.round((item.actualAmount > 0 ? item.actualAmount : item.plannedAmount) * 0.5);
    }
    currentCat.count += 1;
    categoryMap.set(item.category, currentCat);
  }

  const remainingBudget = totalBudget - actualTotal;
  const isOverBudget = actualTotal > totalBudget;
  const overBudgetAmount = isOverBudget ? actualTotal - totalBudget : 0;
  const utilizationPercentage = totalBudget > 0
    ? Math.round((actualTotal / totalBudget) * 100)
    : (actualTotal > 0 ? 100 : 0);

  const categories: CategorySummary[] = Array.from(categoryMap.entries()).map(([catName, stats]) => ({
    category: catName,
    plannedAmount: stats.planned,
    actualAmount: stats.actual,
    paidAmount: stats.paid,
    percentageOfBudget: totalBudget > 0 ? Math.round((stats.actual / totalBudget) * 100) : 0,
    itemCount: stats.count,
    isOverPlanned: stats.actual > stats.planned && stats.planned > 0,
  }));

  // Sort categories descending by actual spending
  categories.sort((a, b) => b.actualAmount - a.actualAmount);

  return {
    totalBudget,
    plannedTotal,
    actualTotal,
    paidTotal,
    remainingBudget,
    utilizationPercentage,
    isOverBudget,
    overBudgetAmount,
    categories,
  };
}
