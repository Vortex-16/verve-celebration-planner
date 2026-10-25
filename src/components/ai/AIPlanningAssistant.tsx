import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Check,
  CheckSquare,
  Wallet,
  Briefcase,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Download,
  ShieldCheck,
  RefreshCw,
  MessageSquare,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { formatCurrency } from '../../lib/budget-math.ts';
import { calculateDueDate, formatDisplayDate } from '../../lib/date-utils.ts';
import { getClientDeterministicFallbackPlan, getClientDomainAdvisorAdvice } from '../../lib/plan-generator-fallback.ts';
import type { EventItem, BudgetItem, TaskItem, AIPlanItem } from '../../types/index.ts';

interface AIPlanningAssistantProps {
  event: EventItem;
  onApplyPlanItems: (budgetItems: Partial<BudgetItem>[], tasks: Partial<TaskItem>[]) => Promise<void>;
  onSavePlanRecord: (plan: AIPlanItem) => Promise<void>;
}

export const AIPlanningAssistant: React.FC<AIPlanningAssistantProps> = ({
  event,
  onApplyPlanItems,
  onSavePlanRecord,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'blueprint' | 'advisor'>('blueprint');

  // AI Master Plan states
  const [isGenerating, setIsGenerating] = useState(false);
  const [planData, setPlanData] = useState<any>(null);
  const [planSource, setPlanSource] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');

  // Apply to event selection state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedBudgetIndices, setSelectedBudgetIndices] = useState<number[]>([]);
  const [selectedTaskIndices, setSelectedTaskIndices] = useState<number[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const [applySuccessMsg, setApplySuccessMsg] = useState('');

  // Concierge Chat states
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    {
      role: 'assistant',
      text: `Welcome to your dedicated Verve Event Advisor. I have context on "${event.name}" (${event.eventType}, ${event.guestCount} guests, ${event.currency} ${(event.totalBudget / 100).toLocaleString()}). Ask me about vendor contracts, budget optimization, menu pacing, or timeline coordination.`,
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Generate Master Plan
  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    setErrorMsg('');
    setApplySuccessMsg('');

    try {
      let plan: any;
      let source = 'gemini_ai';

      try {
        const res = await fetch('/api/ai/generate-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: event.name,
            eventType: event.eventType,
            date: event.date,
            totalBudget: event.totalBudget,
            currency: event.currency,
            guestCount: event.guestCount,
            location: event.location,
            locationType: event.locationType,
            theme: event.theme,
            atmosphere: event.atmosphere,
            notes: event.notes,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          plan = data.plan;
          source = data.source || 'gemini_ai';
        } else {
          plan = getClientDeterministicFallbackPlan(event);
          source = 'deterministic_blueprint';
        }
      } catch {
        plan = getClientDeterministicFallbackPlan(event);
        source = 'deterministic_blueprint';
      }

      setPlanData(plan);
      setPlanSource(source);

      // Pre-select all suggested items for the review modal
      if (plan.budgetBreakdown) {
        setSelectedBudgetIndices(plan.budgetBreakdown.map((_: any, idx: number) => idx));
      }
      if (plan.timelineTasks) {
        setSelectedTaskIndices(plan.timelineTasks.map((_: any, idx: number) => idx));
      }

      // Save plan record to history
      const planItem: AIPlanItem = {
        id: `plan-${Date.now()}`,
        eventId: event.id,
        userId: event.userId,
        summary: plan.summary,
        contentJson: JSON.stringify(plan),
        status: 'proposed',
        createdAt: new Date().toISOString(),
      };
      await onSavePlanRecord(planItem);
    } catch (err: any) {
      console.error('Error generating AI plan:', err);
      setErrorMsg(err.message || 'An error occurred during plan generation. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Commit selected items into the actual event
  const handleConfirmApply = async () => {
    if (!planData) return;
    setIsApplying(true);

    try {
      const budgetToImport: Partial<BudgetItem>[] = (planData.budgetBreakdown || [])
        .filter((_: any, idx: number) => selectedBudgetIndices.includes(idx))
        .map((b: any) => ({
          title: `${b.category} Allocation`,
          category: b.category,
          plannedAmount: b.estimatedAmount,
          actualAmount: 0,
          paidStatus: 'unpaid' as const,
          notes: b.notes,
        }));

      const tasksToImport: Partial<TaskItem>[] = (planData.timelineTasks || [])
        .filter((_: any, idx: number) => selectedTaskIndices.includes(idx))
        .map((t: any) => ({
          title: t.title,
          description: t.description,
          dueDate: calculateDueDate(event.date, t.daysBeforeEvent || 14),
          priority: t.priority,
          status: 'pending' as const,
          category: t.category,
        }));

      await onApplyPlanItems(budgetToImport, tasksToImport);
      setIsApplyModalOpen(false);
      setApplySuccessMsg(
        `Successfully imported ${budgetToImport.length} budget allocations and ${tasksToImport.length} timeline milestones into your event!`
      );
    } catch (err) {
      console.error('Failed to import plan items:', err);
      setErrorMsg('Failed to apply selected suggestions. Please retry.');
    } finally {
      setIsApplying(false);
    }
  };

  // Concierge Chat Submission
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userText = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setIsChatLoading(true);

    try {
      let reply = '';
      try {
        const res = await fetch('/api/ai/advisor-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userText,
            eventContext: {
              name: event.name,
              eventType: event.eventType,
              date: event.date,
              totalBudget: event.totalBudget,
              currency: event.currency,
              guestCount: event.guestCount,
            },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          reply = data.reply;
        } else {
          reply = getClientDomainAdvisorAdvice(userText, event);
        }
      } catch {
        reply = getClientDomainAdvisorAdvice(userText, event);
      }

      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: reply || getClientDomainAdvisorAdvice(userText, event) },
      ]);
    } catch (err) {
      console.error('Chat error:', err);
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: getClientDomainAdvisorAdvice(userText, event),
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-zinc-900 tracking-tight">AI Planning Concierge</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-900 text-white">
              Gemini 3.8 Flash
            </span>
          </div>
          <p className="text-xs text-zinc-600 mt-0.5">
            Architect tailored budgets, date-aware milestones, vendor checklists, and interactive event advice
          </p>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('blueprint')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeSubTab === 'blueprint' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Master Blueprint
          </button>
          <button
            onClick={() => setActiveSubTab('advisor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeSubTab === 'advisor' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Event Advisor Chat
          </button>
        </div>
      </div>

      {applySuccessMsg && (
        <div className="p-4 rounded-xl bg-zinc-900 text-white border border-zinc-700 flex items-center justify-between text-xs">
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#E11D48]" />
            {applySuccessMsg}
          </span>
          <button onClick={() => setApplySuccessMsg('')} className="p-1 hover:text-zinc-400">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
          {errorMsg}
        </div>
      )}

      {/* View 1: Master Blueprint */}
      {activeSubTab === 'blueprint' && (
        <div className="space-y-6">
          {/* Action Trigger Card */}
          <div className="rounded-2xl bg-white border border-zinc-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1 max-w-xl">
              <h2 className="text-sm font-bold text-zinc-900">
                Generate or Revise Master Celebration Blueprint
              </h2>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Gemini will synthesize your {event.eventType.replace('_', ' ')} parameters ({event.guestCount} guests,{' '}
                {event.currency} {(event.totalBudget / 100).toLocaleString()}) to build a comprehensive plan proposal.
              </p>
            </div>

            <button
              onClick={handleGeneratePlan}
              disabled={isGenerating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition active:scale-95 shadow-sm cursor-pointer disabled:opacity-50 self-start md:self-auto"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#E11D48]" />
                  <span>Synthesizing Plan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#E11D48]" />
                  <span>{planData ? 'Regenerate Master Blueprint' : 'Generate Master Blueprint'}</span>
                </>
              )}
            </button>
          </div>

          {/* Rendered Plan Sections */}
          {planData ? (
            <div className="space-y-6">
              {/* Proposal Header with Source Tag */}
              <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                    Generated Proposal
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 font-medium">
                    {planSource === 'gemini_ai' ? 'Verified by Gemini 3.8 Flash' : 'Benchmark Template'}
                  </span>
                </div>

                <button
                  onClick={() => setIsApplyModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#E11D48] text-white text-xs font-semibold hover:bg-[#be123c] transition active:scale-95 cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Review & Apply to Event</span>
                </button>
              </div>

              {/* Executive Summary */}
              <div className="rounded-2xl bg-white border border-zinc-200 p-5 shadow-xs space-y-2">
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-[#E11D48]" />
                  Executive Summary
                </h3>
                <p className="text-xs text-zinc-800 leading-relaxed">{planData.summary}</p>
                {planData.assumptions && planData.assumptions.length > 0 && (
                  <div className="pt-2 border-t border-zinc-100">
                    <span className="text-[11px] font-semibold text-zinc-600 block mb-1">Key Assumptions:</span>
                    <ul className="list-disc list-inside text-[11px] text-zinc-600 space-y-0.5">
                      {planData.assumptions.map((asm: string, idx: number) => (
                        <li key={idx}>{asm}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Theme & Atmosphere Suggestions */}
              {planData.themeSuggestions && planData.themeSuggestions.length > 0 && (
                <div className="rounded-2xl bg-white border border-zinc-200 p-5 shadow-xs space-y-3">
                  <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                    Recommended Aesthetic & Theme Directions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {planData.themeSuggestions.map((thm: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl border border-zinc-100 bg-zinc-50/50 space-y-2">
                        <h4 className="text-xs font-bold text-zinc-900">{thm.title}</h4>
                        <p className="text-xs text-zinc-600 leading-relaxed">{thm.description}</p>
                        {thm.colors && thm.colors.length > 0 && (
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[10px] text-zinc-600 font-medium">Palette:</span>
                            <div className="flex gap-1.5">
                              {thm.colors.map((c: string, cIdx: number) => (
                                <span
                                  key={cIdx}
                                  className="w-4 h-4 rounded-full border border-zinc-300 shadow-2xs"
                                  style={{ backgroundColor: c }}
                                  title={c}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Proposed Budget Breakdown */}
              {planData.budgetBreakdown && planData.budgetBreakdown.length > 0 && (
                <div className="rounded-2xl bg-white border border-zinc-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Wallet className="w-3.5 h-3.5 text-[#E11D48]" />
                      Proposed Budget Allocations
                    </h3>
                    <span className="text-xs text-zinc-600">
                      Target: {formatCurrency(event.totalBudget, event.currency)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {planData.budgetBreakdown.map((item: any, idx: number) => (
                      <div key={idx} className="p-3.5 rounded-xl border border-zinc-200 bg-white space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-zinc-900">{item.category}</span>
                          <span className="text-zinc-700">{item.percentage}%</span>
                        </div>
                        <p className="text-sm font-bold text-zinc-900">
                          {formatCurrency(item.estimatedAmount, event.currency)}
                        </p>
                        <p className="text-[11px] text-zinc-600 line-clamp-2">{item.notes}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Proposed Timeline Tasks */}
              {planData.timelineTasks && planData.timelineTasks.length > 0 && (
                <div className="rounded-2xl bg-white border border-zinc-200 p-5 shadow-xs space-y-3">
                  <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-[#E11D48]" />
                    Suggested Milestone Schedule
                  </h3>
                  <div className="divide-y divide-zinc-100">
                    {planData.timelineTasks.map((t: any, idx: number) => {
                      const estimatedDate = calculateDueDate(event.date, t.daysBeforeEvent || 14);
                      return (
                        <div key={idx} className="py-2.5 flex items-start justify-between gap-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-zinc-900">{t.title}</span>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-zinc-100 text-zinc-700">
                                {t.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-600">{t.description}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="text-xs font-semibold text-zinc-800 block">
                              {formatDisplayDate(estimatedDate)}
                            </span>
                            <span className="text-[10px] text-zinc-600">
                              {t.daysBeforeEvent} days before
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Vendor & Activity Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {planData.vendorChecklist && (
                  <div className="rounded-2xl bg-white border border-zinc-200 p-5 shadow-xs space-y-3">
                    <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-[#E11D48]" />
                      Vendor Procurement Checklist
                    </h3>
                    <div className="space-y-3">
                      {planData.vendorChecklist.map((v: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 space-y-1">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-zinc-900">{v.role}</span>
                            <span className="text-[11px] text-zinc-600">{v.estimatedCostRange}</span>
                          </div>
                          <ul className="list-disc list-inside text-[11px] text-zinc-600 space-y-0.5">
                            {v.checklist?.map((chk: string, cIdx: number) => (
                              <li key={cIdx}>{chk}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {planData.risksAndMitigations && (
                  <div className="rounded-2xl bg-white border border-zinc-200 p-5 shadow-xs space-y-3">
                    <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#E11D48]" />
                      Identified Risks & Mitigations
                    </h3>
                    <div className="space-y-2.5">
                      {planData.risksAndMitigations.map((r: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 space-y-1 text-xs">
                          <p className="font-semibold text-zinc-900">Risk: {r.risk}</p>
                          <p className="text-zinc-600 text-[11px]">Mitigation: {r.mitigation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-white border border-zinc-200 p-12 text-center text-zinc-600 space-y-3">
              <Sparkles className="w-8 h-8 text-[#E11D48] mx-auto" />
              <h3 className="text-sm font-bold text-zinc-900">No blueprint generated yet</h3>
              <p className="text-xs text-zinc-600 max-w-sm mx-auto">
                Click above to generate an initial structured plan containing custom budget breakdowns, timeline milestones, and vendor checklists.
              </p>
            </div>
          )}
        </div>
      )}

      {/* View 2: Concierge Chat */}
      {activeSubTab === 'advisor' && (
        <div className="rounded-2xl bg-white border border-zinc-200 shadow-xs flex flex-col h-[580px]">
          {/* Chat Header */}
          <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-zinc-900">Event Concierge Chat</span>
            </div>
            <span className="text-[11px] text-zinc-600">Context: {event.name}</span>
          </div>

          {/* Messages scroll area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-zinc-900 text-white rounded-br-xs'
                      : 'bg-zinc-100 text-zinc-900 rounded-bl-xs border border-zinc-200/50'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="bg-zinc-100 rounded-2xl px-4 py-2.5 text-xs text-zinc-600 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#E11D48]" />
                  <span>Consulting event intelligence...</span>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input bar */}
          <form onSubmit={handleSendChatMessage} className="p-3 border-t border-zinc-100 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about venue negotiations, seating styles, dietary ratios..."
              className="flex-1 px-3.5 py-2 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
            <button
              type="submit"
              disabled={isChatLoading || !chatInput.trim()}
              className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Review & Apply Modal */}
      {isApplyModalOpen && planData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white border border-zinc-200 shadow-2xl p-6 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Review & Import Plan to Event</h3>
                <p className="text-xs text-zinc-600">
                  Select which AI-generated budget items and timeline milestones you wish to commit
                </p>
              </div>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-5">
              {/* Budget selections */}
              {planData.budgetBreakdown && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                      Budget Allocations ({selectedBudgetIndices.length} selected)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedBudgetIndices(
                          selectedBudgetIndices.length === planData.budgetBreakdown.length
                            ? []
                            : planData.budgetBreakdown.map((_: any, i: number) => i)
                        )
                      }
                      className="text-xs text-[#E11D48] hover:underline font-medium"
                    >
                      {selectedBudgetIndices.length === planData.budgetBreakdown.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {planData.budgetBreakdown.map((b: any, idx: number) => {
                      const isChecked = selectedBudgetIndices.includes(idx);
                      return (
                        <label
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50 cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedBudgetIndices([...selectedBudgetIndices, idx]);
                                } else {
                                  setSelectedBudgetIndices(selectedBudgetIndices.filter((i) => i !== idx));
                                }
                              }}
                              className="rounded text-[#E11D48] focus:ring-[#E11D48]"
                            />
                            <span className="font-semibold text-zinc-900">{b.category}</span>
                            <span className="text-zinc-600 text-[11px]">({b.percentage}%)</span>
                          </div>
                          <span className="font-bold text-zinc-900">
                            {formatCurrency(b.estimatedAmount, event.currency)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Task selections */}
              {planData.timelineTasks && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                      Timeline Milestones ({selectedTaskIndices.length} selected)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedTaskIndices(
                          selectedTaskIndices.length === planData.timelineTasks.length
                            ? []
                            : planData.timelineTasks.map((_: any, i: number) => i)
                        )
                      }
                      className="text-xs text-[#E11D48] hover:underline font-medium"
                    >
                      {selectedTaskIndices.length === planData.timelineTasks.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {planData.timelineTasks.map((t: any, idx: number) => {
                      const isChecked = selectedTaskIndices.includes(idx);
                      const estimatedDate = calculateDueDate(event.date, t.daysBeforeEvent || 14);
                      return (
                        <label
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50 cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedTaskIndices([...selectedTaskIndices, idx]);
                                } else {
                                  setSelectedTaskIndices(selectedTaskIndices.filter((i) => i !== idx));
                                }
                              }}
                              className="rounded text-[#E11D48] focus:ring-[#E11D48]"
                            />
                            <div>
                              <span className="font-semibold text-zinc-900">{t.title}</span>
                              <span className="text-zinc-600 text-[11px] block">{t.category}</span>
                            </div>
                          </div>
                          <span className="text-zinc-700 font-medium text-[11px]">
                            {formatDisplayDate(estimatedDate)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(false)}
                className="px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApply}
                disabled={isApplying || (selectedBudgetIndices.length === 0 && selectedTaskIndices.length === 0)}
                className="px-5 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
              >
                {isApplying ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#E11D48]" />
                    <span>Committing Updates...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#E11D48]" />
                    <span>Commit Selected Items</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
