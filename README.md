# Verve — Intelligent Celebration & Event Planning Platform

Verve is an enterprise-grade celebration and milestone event planning application engineered for discerning event organizers, couples, families, and corporate producers. Built on **React 19**, **TypeScript**, **Tailwind CSS v4**, **Firebase Firestore**, and **Google Gemini 3.8 Flash**, Verve delivers end-to-end event orchestration with tactile micro-interactions and offline-first resilience.

---

## Key Features

### 1. Master Planning & Analytics Dashboard
- **Comprehensive KPI Snapshot**: Real-time tracking of countdown timers, budget utilization percentages, pending vs. completed tasks, booked vendors, and confirmed guest headcount.
- **RFC 4180 Multi-Section CSV Export**: Download complete planning dossiers formatted across five structured sections with OWASP CSV formula injection protection:
  1. Celebration Overview & Constraints
  2. Financial Budget & Actual Spend
  3. Timeline Milestones & Task Status
  4. Vendor Directory & Contract Specs
  5. Guest Directory, Dietary Restrictions & RSVP Status
- **Full Celebration CRUD**: Create new celebrations with custom budget and attendee targets, edit core parameters at any time, or safely delete events with confirmation protections.

### 2. Multi-Tier Financial Budget Planner
- **Planned vs. Actual Spend**: Categorized budget allocations with real-time variance calculations.
- **Over-Budget Warnings**: Visual alerts and status indicators when line items exceed planned estimates.
- **Vendor Linkage**: Tie budget line items directly to vendor contracts and track payment phases (`unpaid`, `partially_paid`, `paid`).

### 3. Action-Oriented Timeline & Milestone Tracker
- **Smart Due-Date Offsets**: Tasks automatically calculated relative to the celebration date.
- **Priority Filtering & Urgency Tags**: Sort by urgency (`urgent`, `high`, `medium`, `low`) and overdue flags.
- **One-Click State Toggle**: Rapid micro-interaction for marking milestones complete with undo support.

### 4. Vendor Partner Directory (CRM)
- **Direct Contact Management**: Store primary contacts, phone numbers, emails, and notes.
- **Contract & Booking Lifecycle**: Monitor quotes, negotiation stages, and contract execution.
- **Payment Stage Badges**: Instant status on deposits, balance settlements, and retainers.

### 5. Guest Coordination & Automatic Email Dispatcher
- **RSVP & Headcount Management**: Real-time tallies of attending guests, awaiting responses, declinations, and plus-ones.
- **Dietary & Accessibility Tracking**: Specific meal requirements and accommodations logged per household.
- **Automatic Email Dispatcher**:
  - Batch automated invitation simulation with live progress bar.
  - Dynamic `{GuestName}` template tag replacement.
  - Native `mailto:` client launch for direct one-on-one email transmission.
  - Automatic updates to invitation delivery status.

### 6. AI Master Plan Assistant (Gemini 3.8 Flash)
- **Server-Side AI Generation**: Secure backend proxy using `@google/genai` to generate timeline milestones, budget breakdowns, and recommendations customized to the event theme, headcount, and budget.
- **Intelligent Advisor Chat**: Context-aware consultation on themes, etiquette, timeline scheduling, and contingency planning.
- **Deterministic Resilience**: Graceful fallback templates guarantee uninterrupted planning even during upstream service disruptions.

### 7. Progressive Web App (PWA) & Offline Resilience
- **Service Worker Caching**: Offline access to cached events, tasks, budgets, and guests via `localStorage` sync.
- **Installable Desktop/Mobile App**: Web App Manifest supporting standalone home-screen installation.
- **Connectivity Toast Indicator**: Real-time detection of offline status with auto-reconnect syncing.

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19 SPA with TypeScript |
| **Styling & Design System** | Tailwind CSS v4 (Solid palette, crimson `#E11D48` accent, zero gradients, zero emojis) |
| **Icons** | Lucide React (Strict iconography discipline) |
| **Backend & Proxy** | Node.js + Express (`server.ts`) |
| **AI SDK** | `@google/genai` (Gemini 3.8 Flash) |
| **Database & Auth** | Google Firebase (Firestore Database + Firebase Authentication) |
| **Build & Dev Tooling** | Vite 8, `tsx`, ES2022 |
| **Offline Engine** | `vite-plugin-pwa` + Service Worker |
| **Testing** | Node.js Test Runner (`node:test` via `tsx --test`) |

---

## Design System & Anti-Slop Guidelines

1. **Strictly No Emojis**: Every indicator, button, and header uses purpose-built Lucide icons.
2. **Zero Gradients**: Pure, high-contrast solid backgrounds (`#F8F9FA` off-white, `#18181B` deep charcoal, `#E11D48` crimson accent).
3. **Tactile Micro-Interactions**: Active-press state transitions (`active:scale-95`), responsive feedback toasts on every CRUD mutation, and accessible confirmation dialogs.
4. **Data Density**: High scannability with structured tables, pill-free metric tiles, and clean border separations.
5. **Accessibility First (WCAG AA)**: Full keyboard navigation (Escape to dismiss modals, skip-to-content links), `aria-modal`, `role="dialog"`, `scope="col"` on tables, and `aria-live="polite"` on notifications.

---

## Getting Started

### Prerequisites
- Node.js 20+ installed
- Firebase project configured (Firestore + Auth)
- Gemini API key (for AI planning features)

### Installation
```bash
# Clone repository
git clone https://github.com/verve/celebration-planner.git
cd celebration-planner

# Install dependencies
npm install
```

### Environment Configuration
Configure your `.env` file based on `.env.example`:
```env
# Gemini API Key (injected by AI Studio or set manually)
GEMINI_API_KEY="your-gemini-api-key"

# App URL (optional for self-referential links)
APP_URL="http://localhost:3000"
```

### Running the Development Server
```bash
npm run dev
```
The server will start at `http://localhost:3000` with the Express proxy and Vite development middleware mounted concurrently.

### Running Unit Tests
```bash
npm test
```
Executes domain logic tests, RFC 4180 CSV escaping, formula injection protection, date offsets, budget calculations, email dispatch templating, and Dirty Dozen security assertions across 24 test cases.

### Production Build
```bash
npm run build
npm start
```

---

## Security & Access Control (ABAC)

Firestore security rules enforce strict user-ownership validation and server-side list query restrictions:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }

    match /events/{eventId} {
      allow get: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow list: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow create: if isSignedIn() && isValidId(eventId) && isValidEvent(request.resource.data) && request.resource.data.id == eventId;
      allow update: if isSignedIn() && resource.data.userId == request.auth.uid && isValidEvent(request.resource.data);
      allow delete: if isSignedIn() && resource.data.userId == request.auth.uid;

      match /budgetItems/{itemId} { allow read, write: if isEventOwner(eventId); }
      match /tasks/{taskId} { allow read, write: if isEventOwner(eventId); }
      match /vendors/{vendorId} { allow read, write: if isEventOwner(eventId); }
      match /guests/{guestId} { allow read, write: if isEventOwner(eventId); }
      match /aiPlans/{planId} { allow read, write: if isEventOwner(eventId); }
    }
  }
}
```

---

## License
Licensed under the Apache-2.0 License.
