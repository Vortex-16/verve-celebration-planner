import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Google GenAI client (Server-Side only)
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Zod schemas for AI request validation
const GeneratePlanRequestSchema = z.object({
  name: z.string().min(1).max(120),
  eventType: z.string().min(1).max(60),
  date: z.string().min(1),
  totalBudget: z.number().nonnegative(),
  currency: z.string().min(1).max(10),
  guestCount: z.number().int().nonnegative(),
  location: z.string().max(200).optional().default(''),
  locationType: z.string().optional().default('in-person'),
  theme: z.string().max(200).optional().default(''),
  atmosphere: z.string().max(200).optional().default(''),
  notes: z.string().max(2000).optional().default(''),
});

const AIPlanResponseSchema = z.object({
  summary: z.string(),
  assumptions: z.array(z.string()).default([]),
  themeSuggestions: z.array(z.object({
    title: z.string(),
    description: z.string(),
    colors: z.array(z.string()).default([]),
  })).default([]),
  budgetBreakdown: z.array(z.object({
    category: z.string(),
    percentage: z.number(),
    estimatedAmount: z.number(),
    notes: z.string(),
  })).default([]),
  timelineTasks: z.array(z.object({
    title: z.string(),
    description: z.string(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
    category: z.string(),
    daysBeforeEvent: z.number(),
  })).default([]),
  vendorChecklist: z.array(z.object({
    category: z.string(),
    role: z.string(),
    checklist: z.array(z.string()),
    estimatedCostRange: z.string(),
  })).default([]),
  activityIdeas: z.array(z.object({
    title: z.string(),
    description: z.string(),
    type: z.string(),
  })).default([]),
  risksAndMitigations: z.array(z.object({
    risk: z.string(),
    mitigation: z.string(),
  })).default([]),
});

// Helper for deterministic fallback plan if AI service is unreachable
function getDeterministicFallbackPlan(event: z.infer<typeof GeneratePlanRequestSchema>) {
  const budget = event.totalBudget;
  const isWedding = event.eventType.toLowerCase().includes('wedding');
  const isCorporate = event.eventType.toLowerCase().includes('conference') || event.eventType.toLowerCase().includes('festival');

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

  const budgetBreakdown = budgetCategories.map(cat => ({
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
    summary: `Tailored master plan for ${event.name} (${event.eventType}) accommodating ${event.guestCount} guests with a budget of ${event.currency} ${(event.totalBudget / 100).toLocaleString()}. Focuses on seamless guest flow, vendor clarity, and cost containment.`,
    assumptions: [
      `Estimated for ${event.guestCount} confirmed attendees`,
      `Budget ceiling is strictly capped at ${event.currency} ${(event.totalBudget / 100).toLocaleString()}`,
      `Planning timeline spans up to event date ${event.date}`
    ],
    themeSuggestions: [
      {
        title: event.theme || 'Timeless Modern Minimalist',
        description: 'Clean lines, curated textures, warm ambient lighting, and subtle statement accents.',
        colors: ['#18181B', '#F4F4F5', '#E11D48', '#71717A']
      },
      {
        title: 'Warm Contemporary Warmth',
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
        estimatedCostRange: `${event.currency} ${Math.round((budget * 0.35) / 100).toLocaleString()} - ${Math.round((budget * 0.45) / 100).toLocaleString()}`
      },
      {
        category: 'Catering & Bar',
        role: 'Executive Caterer',
        checklist: ['Dietary options review', 'Staff-to-guest ratio minimum 1:12', 'Bar glassware and ice procurement'],
        estimatedCostRange: `${event.currency} ${Math.round((budget * 0.25) / 100).toLocaleString()} - ${Math.round((budget * 0.35) / 100).toLocaleString()}`
      },
      {
        category: 'Photo & Media',
        role: 'Lead Photographer',
        checklist: ['Pre-event shot list review', 'Lighting gear backup check', 'Delivery timeline contract'],
        estimatedCostRange: `${event.currency} ${Math.round((budget * 0.08) / 100).toLocaleString()} - ${Math.round((budget * 0.15) / 100).toLocaleString()}`
      }
    ],
    activityIdeas: [
      { title: 'Curated Welcome Experience', description: 'Signature beverage station, personalized name cards, and interactive welcome photo moment.', type: 'Reception' },
      { title: 'Interactive Guest Memory Note', description: 'Guests leave handwritten advice or audio memories for the hosts.', type: 'Keepsake' },
      { title: 'Keynote & Toast Moments', description: 'Structured 15-minute toast block with dedicated lighting and wireless mic.', type: 'Program' }
    ],
    risksAndMitigations: [
      { risk: 'Catering count overages beyond budget', mitigation: 'Request a guaranteed minimum cutoff date 7 days before event.' },
      { risk: 'Audio feedback or equipment lag', mitigation: 'Mandate a 45-minute soundcheck 2 hours prior to guest arrival.' },
      { risk: 'Last-minute vendor cancellations', mitigation: 'Store secondary contact numbers and ensure all contracts feature replacement clauses.' }
    ]
  };
}

// Curated domain advice fallback when external LLM experiences transient 503
function getDomainAdvisorAdvice(question: string, context?: any): string {
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// AI Plan Generation Endpoint
app.post('/api/ai/generate-plan', async (req, res) => {
  try {
    const parseResult = GeneratePlanRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: parseResult.error.issues,
      });
    }

    const eventData = parseResult.data;

    // Check if API key is present
    if (!apiKey) {
      console.warn('GEMINI_API_KEY missing, utilizing deterministic planning blueprint.');
      const fallback = getDeterministicFallbackPlan(eventData);
      return res.json({ plan: fallback, source: 'fallback_template' });
    }

    const prompt = `You are an elite event director and financial planner. Generate a comprehensive, professional, highly actionable celebration plan for:
Event Name: ${eventData.name}
Event Type: ${eventData.eventType}
Event Date: ${eventData.date}
Total Budget: ${eventData.currency} ${(eventData.totalBudget / 100).toFixed(2)} (${eventData.totalBudget} cents)
Expected Guest Count: ${eventData.guestCount}
Location: ${eventData.location || 'Local venue'} (${eventData.locationType})
Theme/Concept: ${eventData.theme || 'Open / Modern'}
Atmosphere: ${eventData.atmosphere || 'Warm, organized, celebratory'}
Special Notes: ${eventData.notes || 'None'}

Requirements:
1. Provide a realistic budget breakdown ensuring sum of category percentages equals 100%.
2. Calculate estimatedAmount in cents (nonnegative integer) for each category.
3. Suggest 6-9 key chronological tasks with realistic daysBeforeEvent (e.g. 90, 60, 30, 14, 7, 2, 0).
4. Provide practical vendor checklists and activity ideas matching the budget and guest count.
5. Identify realistic planning risks and concrete mitigations.
6. Adhere strictly to the requested JSON schema.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an expert event architect. Always respond with strict, valid JSON matching the requested structure. Never include markdown blocks or commentary outside the JSON.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              assumptions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              themeSuggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    colors: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    }
                  },
                  required: ['title', 'description', 'colors']
                }
              },
              budgetBreakdown: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING },
                    percentage: { type: Type.NUMBER },
                    estimatedAmount: { type: Type.NUMBER },
                    notes: { type: Type.STRING }
                  },
                  required: ['category', 'percentage', 'estimatedAmount', 'notes']
                }
              },
              timelineTasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    priority: { type: Type.STRING, enum: ['low', 'medium', 'high', 'urgent'] },
                    category: { type: Type.STRING },
                    daysBeforeEvent: { type: Type.NUMBER }
                  },
                  required: ['title', 'description', 'priority', 'category', 'daysBeforeEvent']
                }
              },
              vendorChecklist: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING },
                    role: { type: Type.STRING },
                    checklist: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    estimatedCostRange: { type: Type.STRING }
                  },
                  required: ['category', 'role', 'checklist', 'estimatedCostRange']
                }
              },
              activityIdeas: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    type: { type: Type.STRING }
                  },
                  required: ['title', 'description', 'type']
                }
              },
              risksAndMitigations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    risk: { type: Type.STRING },
                    mitigation: { type: Type.STRING }
                  },
                  required: ['risk', 'mitigation']
                }
              }
            },
            required: [
              'summary',
              'assumptions',
              'themeSuggestions',
              'budgetBreakdown',
              'timelineTasks',
              'vendorChecklist',
              'activityIdeas',
              'risksAndMitigations'
            ]
          }
        }
      });

      const rawText = response.text || '';
      const parsedJson = JSON.parse(rawText);
      const validated = AIPlanResponseSchema.safeParse(parsedJson);
      if (validated.success) {
        return res.json({ plan: validated.data, source: 'gemini_ai' });
      }
    } catch (genErr) {
      console.warn('Gemini generateContent transient error, using benchmark blueprint fallback:', genErr);
    }

    const fallback = getDeterministicFallbackPlan(eventData);
    return res.json({ plan: fallback, source: 'fallback_template' });
  } catch (error) {
    console.error('Gemini generate-plan critical error:', error);
    try {
      const fallback = getDeterministicFallbackPlan(req.body);
      return res.json({ plan: fallback, source: 'fallback_after_error' });
    } catch {
      return res.status(500).json({ error: 'Failed to generate plan' });
    }
  }
});

// AI Event Advisor Chat Endpoint
app.post('/api/ai/advisor-chat', async (req, res) => {
  try {
    const { message, eventContext } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Missing message parameter' });
    }

    if (!apiKey) {
      const advice = getDomainAdvisorAdvice(message, eventContext);
      return res.json({ reply: advice });
    }

    const contextSnippet = eventContext
      ? `Event Context: Name "${eventContext.name}", Type "${eventContext.eventType}", Date "${eventContext.date}", Budget ${eventContext.currency} ${(Number(eventContext.totalBudget || 0)/100).toFixed(2)}, Guests: ${eventContext.guestCount}.`
      : 'General celebration planning context.';

    const systemInstruction = `You are Verve's Event Planning Concierge. Provide concise, professional, insightful guidance on event budgeting, timelines, vendor negotiation, decor, themes, and guest experiences. Keep answers sharp, elegant, and actionable. Never use emojis. Avoid generic platitudes. Context: ${contextSnippet}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: message,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      if (response.text) {
        return res.json({ reply: response.text });
      }
    } catch (llmErr) {
      console.warn('Gemini chat encountered transient upstream error, providing domain advice:', llmErr);
    }

    // High quality domain advice fallback
    const advice = getDomainAdvisorAdvice(message, eventContext);
    return res.json({ reply: advice });
  } catch (error) {
    console.error('Gemini chat outer error:', error);
    const advice = getDomainAdvisorAdvice(req.body?.message || '', req.body?.eventContext);
    res.json({ reply: advice });
  }
});

// Vite middleware or production static files
async function start() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Verve Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
