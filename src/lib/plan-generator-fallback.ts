import type { EventItem } from '../types/index.ts';

export function getClientDeterministicFallbackPlan(event: Partial<EventItem>) {
  const budget = event.totalBudget || 1000000;
  const eventType = (event.eventType || '').toLowerCase();
  const isWedding = eventType.includes('wedding');
  const isCorporate = eventType.includes('conference') || eventType.includes('festival') || eventType.includes('community');

  const budgetCategories = isWedding
    ? [
        { category: 'Venue & Reception', percentage: 40, notes: 'Hall rental, tables, chairs and site fee' },
        { category: 'Catering & Beverages', percentage: 30, notes: 'Plated dinner or buffet, bar service and dessert' },
        { category: 'Photography & Video', percentage: 12, notes: 'Full day coverage and edited album' },
        { category: 'Music & Entertainment', percentage: 8, notes: 'Live band or professional DJ' },
        { category: 'Decor & Floral', percentage: 7, notes: 'Table centerpieces, stage and entrance decor' },
        { category: 'Contingency Fund', percentage: 3, notes: 'Reserve for unexpected expenses' },
      ]
    : isCorporate
    ? [
        { category: 'Venue & Staging', percentage: 35, notes: 'Auditorium or venue hall with AV infrastructure' },
        { category: 'Catering & Refreshments', percentage: 25, notes: 'Coffee breaks, lunch and hospitality' },
        { category: 'Production & AV', percentage: 20, notes: 'Sound system, projectors and live streaming' },
        { category: 'Marketing & Signage', percentage: 10, notes: 'Badges, banners, program guides' },
        { category: 'Contingency Fund', percentage: 10, notes: 'Buffer for logistics and overtime' },
      ]
    : [
        { category: 'Venue Rental', percentage: 35, notes: 'Space rental and setup fee' },
        { category: 'Food & Drinks', percentage: 35, notes: 'Buffet, custom cake and beverages' },
        { category: 'Decor & Atmosphere', percentage: 15, notes: 'Balloons, lighting and table accents' },
        { category: 'Entertainment & Games', percentage: 10, notes: 'Host, playlist and party activities' },
        { category: 'Contingency Fund', percentage: 5, notes: 'Buffer reserve' },
      ];

  const budgetBreakdown = budgetCategories.map((cat) => ({
    category: cat.category,
    percentage: cat.percentage,
    estimatedAmount: Math.round((budget * cat.percentage) / 100),
    notes: cat.notes,
  }));

  const timelineTasks = [
    { title: 'Confirm Event Venue', description: 'Review contract terms, deposit policy, and equipment allowance.', priority: 'urgent' as const, category: 'Venue', daysBeforeEvent: 90 },
    { title: 'Finalize Guest List & Invitations', description: 'Collect physical addresses/emails and send formal invitations.', priority: 'high' as const, category: 'Guests', daysBeforeEvent: 60 },
    { title: 'Book Core Vendors', description: 'Secure catering, photography, and audio/music specialists.', priority: 'high' as const, category: 'Vendors', daysBeforeEvent: 45 },
    { title: 'Plan Menu & Dietary Accommodations', description: 'Schedule tasting, confirm vegetarian/vegan/allergy options.', priority: 'medium' as const, category: 'Catering', daysBeforeEvent: 30 },
    { title: 'Order Decor, Signage & Rentals', description: 'Confirm centerpiece orders, welcome signs, and lighting gear.', priority: 'medium' as const, category: 'Decor', daysBeforeEvent: 21 },
    { title: 'Final RSVP Headcount & Seating', description: 'Lock in final attendee numbers with the caterer and venue coordinator.', priority: 'urgent' as const, category: 'Logistics', daysBeforeEvent: 10 },
    { title: 'Final Vendor Run-Through', description: 'Distribute timeline sheet and load-in schedules to all vendors.', priority: 'high' as const, category: 'Logistics', daysBeforeEvent: 3 },
  ];

  return {
    summary: `Tailored master plan for ${event.name || 'Celebration'} (${event.eventType || 'Event'}) accommodating ${event.guestCount || 50} guests with a budget of ${event.currency || 'USD'} ${((budget) / 100).toLocaleString()}. Focuses on seamless guest flow, vendor clarity, and cost containment.`,
    assumptions: [
      `Estimated for ${event.guestCount || 50} confirmed attendees`,
      `Budget ceiling is strictly capped at ${event.currency || 'USD'} ${((budget) / 100).toLocaleString()}`,
      `Planning timeline spans up to event date ${event.date || 'upcoming'}`
    ],
    themeSuggestions: [
      {
        title: event.theme || 'Timeless Modern Minimalist',
        description: 'Clean lines, curated textures, warm ambient lighting, and subtle statement accents.',
        colors: ['#18181B', '#F4F4F5', '#E11D48', '#71717A']
      },
      {
        title: 'Warm Contemporary Radiance',
        description: 'Subtle earth tones, wood textures, botanical greenery, and inviting lounge seating.',
        colors: ['#27272A', '#E4E4E7', '#BE123C', '#A1A1AA']
      }
    ],
    budgetBreakdown,
    timelineTasks,
    vendorChecklist: [
      {
        category: 'Venue & Facilities',
        role: 'Venue Operations Manager',
        checklist: ['Verify load-in hours', 'Confirm sound curfew', 'Review damage deposit and cleaning requirements'],
        estimatedCostRange: `${event.currency || 'USD'} ${Math.round((budget * 0.35) / 100).toLocaleString()} - ${Math.round((budget * 0.45) / 100).toLocaleString()}`
      },
      {
        category: 'Catering & Bar',
        role: 'Executive Caterer',
        checklist: ['Dietary options review', 'Staff-to-guest ratio minimum 1:12', 'Bar glassware and ice procurement'],
        estimatedCostRange: `${event.currency || 'USD'} ${Math.round((budget * 0.25) / 100).toLocaleString()} - ${Math.round((budget * 0.35) / 100).toLocaleString()}`
      },
      {
        category: 'Photo & Media',
        role: 'Lead Photographer',
        checklist: ['Pre-event shot list review', 'Lighting gear backup check', 'Delivery timeline contract'],
        estimatedCostRange: `${event.currency || 'USD'} ${Math.round((budget * 0.08) / 100).toLocaleString()} - ${Math.round((budget * 0.15) / 100).toLocaleString()}`
      }
    ],
    activityIdeas: [
      { title: 'Curated Welcome Experience', description: 'Signature beverage station, personalized name cards, and interactive welcome moment.', type: 'Reception' },
      { title: 'Interactive Guest Memory Note', description: 'Guests leave handwritten advice or digital memories for the hosts.', type: 'Keepsake' },
      { title: 'Keynote & Toast Moments', description: 'Structured 15-minute toast block with dedicated lighting and wireless audio.', type: 'Program' }
    ],
    risksAndMitigations: [
      { risk: 'Catering count overages beyond budget', mitigation: 'Request a guaranteed minimum cutoff date 7 days before event.' },
      { risk: 'Audio feedback or equipment lag', mitigation: 'Mandate a 45-minute soundcheck 2 hours prior to guest arrival.' },
      { risk: 'Last-minute vendor cancellations', mitigation: 'Store secondary contact numbers and ensure all contracts feature replacement clauses.' }
    ]
  };
}

export function getClientDomainAdvisorAdvice(question: string, context?: any): string {
  const q = question.toLowerCase();

  if (q.includes('ratio') || q.includes('staff') || q.includes('server') || q.includes('waiter')) {
    const guests = context?.guestCount || 85;
    const servers = Math.ceil(guests / 11);
    const runners = Math.ceil(guests / 28);
    const bartenders = Math.max(2, Math.ceil(guests / 50));
    return `For ${guests} attendees, standard hospitality benchmarks recommend:
• Plated Dinner: 1 server per 10–12 guests (approx. ${servers} floor servers) for synchronized course pacing.
• Food Runners: 1 runner per 25–30 guests (${runners} runners).
• Bar Service: 1 bartender per 50 guests (plan for ${bartenders} bartenders to eliminate drink lines).
• Lead Captain: 1 dedicated banquet captain managing room flow and timing.`;
  }

  if (q.includes('hors d') || q.includes('appetizer') || q.includes('cocktail') || q.includes('food')) {
    return `For a cocktail hour preceding dinner:
• Pre-Dinner Cocktail (1–1.5 hours): Plan 4–6 pieces per guest, split across 3 cold and 2 warm selections.
• Heavy Cocktail Reception (2+ hours without full dinner): Plan 10–14 pieces per guest, including 2 substantial carving or small-plate stations.
• Dietary coverage: Ensure at least 1 vegan, 1 gluten-free, and 1 nut-free option on all passed trays.`;
  }

  if (q.includes('save') || q.includes('cut') || q.includes('cost') || q.includes('budget')) {
    return `Three effective ways to optimize spending without compromising guest experience:
1. Simplify Bar Options: Feature beer, wine, and 2 signature cocktails rather than a full top-shelf open bar.
2. Repurpose Ceremony Decor: Move entrance floral pillars or altar arches to frame the head table or cake area for the reception.
3. Friday or Sunday Bookings: Venues frequently discount rental and minimum spend thresholds by 15–30% outside of peak Saturday slots.`;
  }

  if (q.includes('music') || q.includes('sound') || q.includes('dj') || q.includes('band')) {
    return `Sound and entertainment recommendations:
• Provide a strict "Do Not Play" list alongside your top 10 landmark tracks.
• Require a 60-minute soundcheck before any guest enters the venue.
• Request dedicated handheld wireless microphones with fresh backup lithium batteries for all speeches and toasts.`;
  }

  return `Here is key planning guidance for "${context?.name || 'your celebration'}":
• Prioritize venue and catering contracts first, as they govern roughly 65–70% of total outlay.
• Maintain a 5–10% contingency reserve for late headcount confirmations and service gratuities.
• Schedule a walkthrough 14 days prior to verify load-in logistics and power circuits with all contracted vendors.`;
}
