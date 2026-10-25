import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateBudgetSummary, formatCurrency, parseToCents } from './budget-math.ts';
import { getDaysRemaining, isTaskOverdue, calculateDueDate } from './date-utils.ts';

test('formatCurrency formats integer minor units correctly', () => {
  assert.equal(formatCurrency(10000, 'USD'), '$100.00');
  assert.equal(formatCurrency(25050, 'USD'), '$250.50');
  assert.equal(formatCurrency(500000, 'EUR'), '€5,000.00');
  assert.equal(formatCurrency(0, 'GBP'), '£0.00');
  assert.equal(formatCurrency(-1500, 'USD'), '-$15.00');
});

test('parseToCents converts decimal strings to minor unit cents accurately', () => {
  assert.equal(parseToCents('100'), 10000);
  assert.equal(parseToCents('$1,250.50'), 125050);
  assert.equal(parseToCents('0.99'), 99);
  assert.equal(parseToCents(50), 5000);
  assert.equal(parseToCents('invalid'), 0);
});

test('calculateBudgetSummary aggregates planned, actual, remaining, and utilization', () => {
  const items = [
    { id: '1', category: 'Venue', plannedAmount: 500000, actualAmount: 480000, paidStatus: 'paid' as const },
    { id: '2', category: 'Catering', plannedAmount: 300000, actualAmount: 320000, paidStatus: 'partially_paid' as const },
    { id: '3', category: 'Music', plannedAmount: 100000, actualAmount: 0, paidStatus: 'unpaid' as const },
  ];

  const totalBudget = 1000000; // $10,000.00 in cents
  const summary = calculateBudgetSummary(totalBudget, items);

  assert.equal(summary.totalBudget, 1000000);
  assert.equal(summary.plannedTotal, 900000);
  assert.equal(summary.actualTotal, 800000);
  assert.equal(summary.remainingBudget, 200000);
  assert.equal(summary.isOverBudget, false);
  assert.equal(summary.utilizationPercentage, 80);
  assert.equal(summary.categories.length, 3);

  // Check venue stats
  const venueCat = summary.categories.find(c => c.category === 'Venue');
  assert.ok(venueCat);
  assert.equal(venueCat.plannedAmount, 500000);
  assert.equal(venueCat.actualAmount, 480000);
  assert.equal(venueCat.paidAmount, 480000);
  assert.equal(venueCat.isOverPlanned, false);

  // Check catering over-planned
  const cateringCat = summary.categories.find(c => c.category === 'Catering');
  assert.ok(cateringCat);
  assert.equal(cateringCat.actualAmount, 320000);
  assert.equal(cateringCat.isOverPlanned, true);
});

test('calculateBudgetSummary detects over budget conditions accurately', () => {
  const items = [
    { id: '1', category: 'Venue', plannedAmount: 500000, actualAmount: 650000, paidStatus: 'paid' as const },
    { id: '2', category: 'Catering', plannedAmount: 500000, actualAmount: 400000, paidStatus: 'paid' as const },
  ];
  const summary = calculateBudgetSummary(1000000, items);
  assert.equal(summary.actualTotal, 1050000);
  assert.equal(summary.isOverBudget, true);
  assert.equal(summary.overBudgetAmount, 50000);
  assert.equal(summary.remainingBudget, -50000);
});

test('date-utils calculates day differences and overdue milestones correctly', () => {
  assert.equal(getDaysRemaining('2026-11-01', '2026-10-22'), 10);
  assert.equal(getDaysRemaining('2026-10-22', '2026-10-22'), 0);
  assert.equal(getDaysRemaining('2026-10-15', '2026-10-22'), -7);

  assert.equal(isTaskOverdue('2026-10-20', 'pending', '2026-10-22'), true);
  assert.equal(isTaskOverdue('2026-10-20', 'completed', '2026-10-22'), false);
  assert.equal(isTaskOverdue('2026-10-25', 'pending', '2026-10-22'), false);

  assert.equal(calculateDueDate('2026-12-25', 10), '2026-12-15');
});

test('escapeCsvField escapes quotes and commas cleanly', async () => {
  const { escapeCsvField, generateMasterPlanCsv } = await import('./csv-exporter.ts');
  assert.equal(escapeCsvField('Simple'), '"Simple"');
  assert.equal(escapeCsvField('Quotes "included"'), '"Quotes ""included"""');
  assert.equal(escapeCsvField('Commas, and, list'), '"Commas, and, list"');
  assert.equal(escapeCsvField(null), '""');

  const sampleEvt = {
    id: 'test-evt',
    userId: 'u1',
    name: 'Sample Gala',
    eventType: 'festival',
    date: '2026-12-31',
    location: 'Main Pavilion',
    locationType: 'in-person' as const,
    totalBudget: 500000,
    currency: 'USD',
    guestCount: 100,
  };
  const csv = generateMasterPlanCsv(sampleEvt, [], [], [], []);
  assert.ok(csv.includes('Sample Gala'));
  assert.ok(csv.includes('--- FINANCIAL BUDGET & EXPENSES ---'));
  assert.ok(csv.includes('--- TIMELINE ACTION MILESTONES ---'));
  assert.ok(csv.includes('--- GUEST DIRECTORY & RSVP ---'));
});
