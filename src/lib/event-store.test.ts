import test from 'node:test';
import assert from 'node:assert/strict';
import { SAMPLE_EVENT, SAMPLE_BUDGET, SAMPLE_TASKS, SAMPLE_VENDORS, SAMPLE_GUESTS } from './event-store.ts';
import type { EventItem, BudgetItem, TaskItem, VendorItem, GuestItem } from '../types/index.ts';

test('EventStore Seed: validates demo jubilee event data structure and integrity', () => {
  assert.equal(SAMPLE_EVENT.id, 'demo-jubilee-2026');
  assert.equal(SAMPLE_EVENT.name, 'Golden Jubilee Celebration & Gala');
  assert.equal(SAMPLE_EVENT.totalBudget, 1500000); // $15,000.00
  assert.equal(SAMPLE_EVENT.currency, 'USD');
  assert.equal(SAMPLE_EVENT.guestCount, 85);
  assert.equal(SAMPLE_EVENT.locationType, 'in-person');
  assert.ok(SAMPLE_EVENT.notes && SAMPLE_EVENT.notes.length > 0);
});

test('EventStore Seed: validates sample budget items have valid non-negative amounts', () => {
  assert.equal(SAMPLE_BUDGET.length, 6);
  for (const item of SAMPLE_BUDGET) {
    assert.ok(item.plannedAmount >= 0);
    assert.ok(item.actualAmount >= 0);
    assert.ok(['unpaid', 'partially_paid', 'paid'].includes(item.paidStatus));
    assert.equal(item.eventId, 'demo-jubilee-2026');
  }
});

test('EventStore Seed: validates sample tasks priorities and statuses', () => {
  assert.equal(SAMPLE_TASKS.length, 4);
  const priorities = new Set(['low', 'medium', 'high', 'urgent']);
  const statuses = new Set(['pending', 'in_progress', 'completed']);

  for (const t of SAMPLE_TASKS) {
    assert.ok(priorities.has(t.priority));
    assert.ok(statuses.has(t.status));
    assert.ok(t.title.length > 0);
    assert.ok(t.dueDate.match(/^\d{4}-\d{2}-\d{2}$/));
  }
});

test('EventStore Seed: validates sample vendors and quote bounds', () => {
  assert.equal(SAMPLE_VENDORS.length, 3);
  const bookingStatuses = new Set(['contacted', 'quoted', 'negotiating', 'booked', 'declined']);
  const paymentStatuses = new Set(['unpaid', 'deposit_paid', 'fully_paid']);

  for (const v of SAMPLE_VENDORS) {
    assert.ok(bookingStatuses.has(v.bookingStatus));
    assert.ok(paymentStatuses.has(v.paymentStatus));
    assert.ok(typeof v.quotedPrice === 'number' && v.quotedPrice >= 0);
  }
});

test('EventStore Seed: validates sample guest list RSVP statuses and plusOnes', () => {
  assert.equal(SAMPLE_GUESTS.length, 4);
  const rsvpStatuses = new Set(['attending', 'declined', 'tentative', 'awaiting']);

  for (const g of SAMPLE_GUESTS) {
    assert.ok(rsvpStatuses.has(g.rsvpStatus));
    assert.ok(typeof g.plusOnes === 'number' && g.plusOnes >= 0);
    assert.ok(g.name.length > 0);
  }
});

test('Event CRUD simulation: immutability of parent ids across mutations', () => {
  const originalEvent: EventItem = { ...SAMPLE_EVENT };
  const updatedEvent: EventItem = {
    ...originalEvent,
    name: 'Updated 50th Anniversary Gala',
    totalBudget: 1800000,
    updatedAt: new Date().toISOString()
  };

  assert.equal(updatedEvent.id, originalEvent.id);
  assert.equal(updatedEvent.userId, originalEvent.userId);
  assert.notEqual(updatedEvent.name, originalEvent.name);
  assert.equal(updatedEvent.totalBudget, 1800000);
});
