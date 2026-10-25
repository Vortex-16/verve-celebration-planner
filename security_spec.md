# Security Specification & Threat Model

## 1. Data Invariants
1. A user document `/users/{userId}` can only be read, created, or updated by the authenticated user whose `request.auth.uid == userId`.
2. An event document `/events/{eventId}` can only be read, created, updated, or deleted by the user whose `request.auth.uid == resource.data.userId` (or `request.auth.uid == request.resource.data.userId` on create).
3. Subcollection documents (`budgetItems`, `tasks`, `vendors`, `guests`, `aiPlans`) under `/events/{eventId}` MUST have a valid parent event owned by `request.auth.uid`.
4. Users cannot change `userId` or `eventId` upon update.
5. All IDs must be hardened with `isValidId(id)`.
6. Numerical monetary amounts (budgets, expenses, quotes) must be nonnegative numbers.

## 2. The "Dirty Dozen" Threat Payloads
1. **Payload 1 (Impersonation on Create)**: Attempting to create an event with `userId: "attacker_id"` while logged in as a different user. Expected: `PERMISSION_DENIED`.
2. **Payload 2 (Ghost Field Injection)**: Attempting to inject `isAdmin: true` into an event document. Expected: `PERMISSION_DENIED`.
3. **Payload 3 (Parent Hijacking)**: Attempting to create a task in someone else's `/events/{otherEventId}/tasks/{taskId}`. Expected: `PERMISSION_DENIED`.
4. **Payload 4 (Unauthenticated Read)**: Attempting to read `/events/{eventId}` while `request.auth == null`. Expected: `PERMISSION_DENIED`.
5. **Payload 5 (Cross-User List Scraping)**: Attempting to list all events from other users. Expected: `PERMISSION_DENIED`.
6. **Payload 6 (Oversized Payload / Denial of Wallet)**: Submitting a 5MB task title string. Expected: `PERMISSION_DENIED`.
7. **Payload 7 (Negative Budget Attack)**: Setting `plannedAmount: -50000`. Expected: `PERMISSION_DENIED`.
8. **Payload 8 (Invalid Enum Value)**: Setting `paidStatus: "stolen"` instead of valid enums. Expected: `PERMISSION_DENIED`.
9. **Payload 9 (ID Character Injection)**: Injecting script tags or directory traversal into `{eventId}`. Expected: `PERMISSION_DENIED`.
10. **Payload 10 (Immutable ID Mutation)**: Attempting to update `userId` on an existing event. Expected: `PERMISSION_DENIED`.
11. **Payload 11 (Guest PII Snoop)**: Non-owner trying to read `/events/{eventId}/guests/{guestId}`. Expected: `PERMISSION_DENIED`.
12. **Payload 12 (Direct Root Write)**: Writing to arbitrary root collections like `/admin_secrets`. Expected: `PERMISSION_DENIED`.
