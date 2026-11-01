import test from 'node:test';
import assert from 'node:assert/strict';

// Helper validator simulating ABAC security rules & Zod schemas
function validateEventSecurity(authUid: string | null, eventData: Record<string, unknown>, pathId?: string): { allowed: boolean; reason?: string } {
  if (!authUid) {
    return { allowed: false, reason: 'UNAUTHENTICATED' };
  }

  // Path ID hardening: isValidId(id)
  const idRegex = /^[a-zA-Z0-9_\-]+$/;
  if (pathId && (!idRegex.test(pathId) || pathId.length > 128)) {
    return { allowed: false, reason: 'INVALID_ID_PATH' };
  }

  // Identity check
  if (eventData.userId !== authUid) {
    return { allowed: false, reason: 'IMPERSONATION_DETECTED' };
  }

  // Key strictness: allowed keys only
  const allowedKeys = new Set([
    'id', 'userId', 'name', 'eventType', 'date', 'endDate', 'location',
    'locationType', 'totalBudget', 'currency', 'guestCount', 'theme',
    'atmosphere', 'notes', 'createdAt', 'updatedAt'
  ]);

  for (const k of Object.keys(eventData)) {
    if (!allowedKeys.has(k)) {
      return { allowed: false, reason: `UNAUTHORIZED_GHOST_FIELD_${k}` };
    }
  }

  // Bounds & types
  if (typeof eventData.name !== 'string' || eventData.name.length === 0 || eventData.name.length > 120) {
    return { allowed: false, reason: 'NAME_SIZE_VIOLATION' };
  }

  if (typeof eventData.totalBudget !== 'number' || eventData.totalBudget < 0) {
    return { allowed: false, reason: 'NEGATIVE_OR_INVALID_BUDGET' };
  }

  return { allowed: true };
}

function validateTaskSecurity(authUid: string | null, parentEventOwner: string, taskData: Record<string, unknown>): { allowed: boolean; reason?: string } {
  if (!authUid) return { allowed: false, reason: 'UNAUTHENTICATED' };
  if (parentEventOwner !== authUid) return { allowed: false, reason: 'PARENT_HIJACKING_DENIED' };

  if (typeof taskData.title !== 'string' || taskData.title.length === 0 || taskData.title.length > 160) {
    return { allowed: false, reason: 'TASK_TITLE_SIZE_VIOLATION' };
  }

  const validPriorities = ['low', 'medium', 'high', 'urgent'];
  if (!validPriorities.includes(taskData.priority as string)) {
    return { allowed: false, reason: 'INVALID_PRIORITY_ENUM' };
  }

  return { allowed: true };
}

test('Dirty Dozen Payload 1: Impersonation on Create is rejected', () => {
  const result = validateEventSecurity('real-user-123', {
    id: 'evt-1',
    userId: 'attacker-456', // Spoofed
    name: 'Legitimate Gala',
    eventType: 'anniversary',
    date: '2026-11-20',
    totalBudget: 500000,
    currency: 'USD',
  });
  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'IMPERSONATION_DETECTED');
});

test('Dirty Dozen Payload 2: Ghost Field Injection (isAdmin: true) is blocked', () => {
  const result = validateEventSecurity('user-1', {
    id: 'evt-1',
    userId: 'user-1',
    name: 'VIP Gala',
    eventType: 'gala',
    date: '2026-11-20',
    totalBudget: 100000,
    currency: 'USD',
    isAdmin: true, // Ghost field
  });
  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'UNAUTHORIZED_GHOST_FIELD_isAdmin');
});

test('Dirty Dozen Payload 3: Parent Hijacking across user boundaries is rejected', () => {
  const result = validateTaskSecurity('attacker-uid', 'legitimate-owner-uid', {
    id: 'tsk-1',
    eventId: 'other-event',
    userId: 'attacker-uid',
    title: 'Plant backdoor task',
    priority: 'urgent',
  });
  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'PARENT_HIJACKING_DENIED');
});

test('Dirty Dozen Payload 4: Unauthenticated access returns UNAUTHENTICATED', () => {
  const result = validateEventSecurity(null, {
    id: 'evt-1',
    userId: 'user-1',
    name: 'Private Event',
    eventType: 'dinner',
    date: '2026-11-20',
    totalBudget: 200000,
  });
  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'UNAUTHENTICATED');
});

test('Dirty Dozen Payload 5: Oversized 5MB payload triggers boundary violation', () => {
  const hugeTitle = 'A'.repeat(5000);
  const result = validateTaskSecurity('user-1', 'user-1', {
    id: 'tsk-1',
    eventId: 'evt-1',
    userId: 'user-1',
    title: hugeTitle,
    priority: 'high',
  });
  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'TASK_TITLE_SIZE_VIOLATION');
});

test('Dirty Dozen Payload 6: Negative budget attack is rejected', () => {
  const result = validateEventSecurity('user-1', {
    id: 'evt-1',
    userId: 'user-1',
    name: 'Negative Spend Gala',
    eventType: 'festival',
    date: '2026-11-20',
    totalBudget: -50000, // Negative budget
    currency: 'USD',
  });
  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'NEGATIVE_OR_INVALID_BUDGET');
});

test('Dirty Dozen Payload 7: Invalid status / priority enum value is rejected', () => {
  const result = validateTaskSecurity('user-1', 'user-1', {
    id: 'tsk-1',
    eventId: 'evt-1',
    userId: 'user-1',
    title: 'Valid task title',
    priority: 'compromised', // Invalid enum
  });
  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'INVALID_PRIORITY_ENUM');
});

test('Dirty Dozen Payload 8: Document ID injection attacks are rejected by regex guard', () => {
  const maliciousPaths = [
    '../events/root',
    'evt;DROP TABLE events;--',
    '<script>alert(1)</script>',
    'evt/sub/poison',
    'A'.repeat(200) // Exceeds 128 chars
  ];

  for (const path of maliciousPaths) {
    const result = validateEventSecurity('user-1', {
      id: 'valid-id',
      userId: 'user-1',
      name: 'Event',
      eventType: 'gala',
      date: '2026-11-20',
      totalBudget: 1000,
    }, path);
    assert.equal(result.allowed, false, `Expected failure for malicious path: ${path}`);
    assert.equal(result.reason, 'INVALID_ID_PATH');
  }
});
