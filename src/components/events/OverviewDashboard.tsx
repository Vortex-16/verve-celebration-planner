import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Users,
  Briefcase,
  Sparkles,
  ArrowRight,
  Plus,
  MapPin,
  TrendingUp,
  ShieldAlert,
  Percent,
  Download,
  Edit2,
  Trash2,
  X,
  Send
} from 'lucide-react';
import { formatCurrency, calculateBudgetSummary } from '../../lib/budget-math.ts';
import { getDaysRemaining, formatDisplayDate, isTaskOverdue } from '../../lib/date-utils.ts';
import { generateMasterPlanCsv, downloadCsvFile } from '../../lib/csv-exporter.ts';
import { useToast } from '../../context/ToastContext.tsx';
import type {
  EventItem,
  BudgetItem,
  TaskItem,
  VendorItem,
  GuestItem
} from '../../types/index.ts';
import type { ActiveTab } from '../layout/Navbar.tsx';

interface OverviewDashboardProps {
  event: EventItem;
  budgetItems: BudgetItem[];
  tasks: TaskItem[];
  vendors: VendorItem[];
  guests: GuestItem[];
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenNewTask: () => void;
  onOpenNewExpense: () => void;
  onToggleTaskComplete: (task: TaskItem) => void;
  onOpenAIModal: () => void;
  onEditEvent?: () => void;
  onDeleteEvent?: () => void;
  onOpenMailSender?: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  event,
  budgetItems,
  tasks,
  vendors,
  guests,
  onNavigateTab,
  onOpenNewTask,
  onOpenNewExpense,
  onToggleTaskComplete,
  onOpenAIModal,
  onEditEvent,
  onDeleteEvent,
  onOpenMailSender,
}) => {
  const { showToast } = useToast();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const daysLeft = getDaysRemaining(event.date);
  const budgetSummary = calculateBudgetSummary(event.totalBudget, budgetItems);

  // Task statistics
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const overdueTasks = tasks.filter(t => isTaskOverdue(t.dueDate, t.status)).length;
  const taskProgressPercent = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  // Vendor statistics
  const bookedVendors = vendors.filter(v => v.bookingStatus === 'booked').length;

  // Guest statistics
  const attendingGuests = guests.filter(g => g.rsvpStatus === 'attending');
  const attendingCount = attendingGuests.reduce((acc, g) => acc + 1 + (g.plusOnes || 0), 0);
  const awaitingCount = guests.filter(g => g.rsvpStatus === 'awaiting').length;

  // Upcoming pending tasks
  const pendingTasks = tasks
    .filter(t => t.status !== 'completed')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 4);

  // Handle CSV export of the full planning dataset
  const handleExportCsv = () => {
    try {
      setIsExporting(true);
      const csvString = generateMasterPlanCsv(event, budgetItems, tasks, vendors, guests);
      const safeSlug = event.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
      const filename = `${safeSlug || 'verve_event'}_master_plan.csv`;
      downloadCsvFile(csvString, filename);
      showToast('Event planning data exported to CSV successfully!', 'success');
    } catch (err) {
      console.error('Failed to export CSV:', err);
      showToast('Failed to export planning data to CSV.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleConfirmDelete = () => {
    setIsConfirmingDelete(false);
    if (onDeleteEvent) {
      onDeleteEvent();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Event Hero */}
      <div className="rounded-2xl bg-zinc-900 text-white p-6 sm:p-8 shadow-sm border border-zinc-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700 uppercase tracking-wider">
                {event.eventType.replace('_', ' ')}
              </span>
              {daysLeft > 0 ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E11D48] text-white">
                  {daysLeft} Days to Event
                </span>
              ) : daysLeft === 0 ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500 text-white">
                  Event is Today!
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-700 text-zinc-300">
                  Celebration Completed
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{event.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 pt-1">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#E11D48]" />
                {formatDisplayDate(event.date)}
              </span>
              {event.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                  {event.location}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-zinc-400" />
                {event.guestCount} target attendees
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenAIModal}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-zinc-900 text-xs font-semibold hover:bg-zinc-100 transition active:scale-95 shadow-sm cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#E11D48]" />
              <span>AI Master Plan</span>
            </button>
            <button
              onClick={handleExportCsv}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 text-white text-xs font-medium hover:bg-zinc-700 border border-zinc-700 transition active:scale-95 cursor-pointer"
              title="Download complete planning report as CSV"
            >
              <Download className="w-3.5 h-3.5 text-[#E11D48]" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onOpenNewTask}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 text-white text-xs font-medium hover:bg-zinc-700 border border-zinc-700 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-zinc-400" />
              <span>New Task</span>
            </button>
            <button
              onClick={onOpenNewExpense}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 text-white text-xs font-medium hover:bg-zinc-700 border border-zinc-700 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-zinc-400" />
              <span>Expense</span>
            </button>
            {onEditEvent && (
              <button
                onClick={onEditEvent}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 border border-zinc-700 transition active:scale-95 cursor-pointer"
                title="Edit celebration settings"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
            {onDeleteEvent && (
              <button
                onClick={() => setIsConfirmingDelete(true)}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-red-950/40 border border-zinc-700 transition active:scale-95 cursor-pointer"
                title="Delete celebration"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Budget Metric */}
        <div
          onClick={() => onNavigateTab('budget')}
          className="rounded-2xl bg-white p-5 border border-zinc-200 shadow-xs hover:border-zinc-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-zinc-600 pb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Budget Status</span>
            <DollarSign className="w-4 h-4 text-zinc-700" />
          </div>
          <div className="space-y-1">
            <p className="text-xl font-bold text-zinc-900">
              {formatCurrency(budgetSummary.actualTotal, event.currency)}
            </p>
            <p className="text-xs text-zinc-600 flex items-center justify-between">
              <span>of {formatCurrency(budgetSummary.totalBudget, event.currency)}</span>
              <span className={`font-semibold ${budgetSummary.isOverBudget ? 'text-red-600' : 'text-zinc-700'}`}>
                {budgetSummary.utilizationPercentage}% used
              </span>
            </p>
          </div>
          {/* Solid Progress bar */}
          <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden mt-3">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                budgetSummary.isOverBudget ? 'bg-red-600' : 'bg-zinc-900'
              }`}
              style={{ width: `${Math.min(100, budgetSummary.utilizationPercentage)}%` }}
            />
          </div>
          {budgetSummary.isOverBudget && (
            <p className="text-[11px] text-red-600 font-medium mt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Over by {formatCurrency(budgetSummary.overBudgetAmount, event.currency)}
            </p>
          )}
        </div>

        {/* Tasks Metric */}
        <div
          onClick={() => onNavigateTab('timeline')}
          className="rounded-2xl bg-white p-5 border border-zinc-200 shadow-xs hover:border-zinc-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-zinc-600 pb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Milestone Tasks</span>
            <CheckCircle2 className="w-4 h-4 text-zinc-700" />
          </div>
          <div className="space-y-1">
            <p className="text-xl font-bold text-zinc-900">
              {completedTasks} / {tasks.length}
            </p>
            <p className="text-xs text-zinc-600 flex items-center justify-between">
              <span>{tasks.length - completedTasks} remaining</span>
              <span className="font-semibold text-zinc-700">{taskProgressPercent}% done</span>
            </p>
          </div>
          <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden mt-3">
            <div
              className="bg-[#E11D48] h-2 rounded-full transition-all duration-500"
              style={{ width: `${taskProgressPercent}%` }}
            />
          </div>
          {overdueTasks > 0 ? (
            <p className="text-[11px] text-red-600 font-medium mt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {overdueTasks} overdue {overdueTasks === 1 ? 'task' : 'tasks'}
            </p>
          ) : (
            <p className="text-[11px] text-zinc-600 mt-2">All tasks on schedule</p>
          )}
        </div>

        {/* Vendors Metric */}
        <div
          onClick={() => onNavigateTab('vendors')}
          className="rounded-2xl bg-white p-5 border border-zinc-200 shadow-xs hover:border-zinc-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-zinc-600 pb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Vendors & Partners</span>
            <Briefcase className="w-4 h-4 text-zinc-700" />
          </div>
          <div className="space-y-1">
            <p className="text-xl font-bold text-zinc-900">
              {bookedVendors} / {vendors.length}
            </p>
            <p className="text-xs text-zinc-600">
              {bookedVendors} confirmed & contracted
            </p>
          </div>
          <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden mt-3">
            <div
              className="bg-zinc-800 h-2 rounded-full transition-all duration-500"
              style={{ width: `${vendors.length > 0 ? (bookedVendors / vendors.length) * 100 : 0}%` }}
            />
          </div>
          <p className="text-[11px] text-zinc-600 mt-2">
            {vendors.filter(v => v.bookingStatus === 'negotiating' || v.bookingStatus === 'quoted').length} in active negotiation
          </p>
        </div>

        {/* Guests Metric */}
        <div
          onClick={() => onNavigateTab('guests')}
          className="rounded-2xl bg-white p-5 border border-zinc-200 shadow-xs hover:border-zinc-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-zinc-600 pb-2">
            <span className="text-xs font-medium uppercase tracking-wider">RSVP Attendance</span>
            <Users className="w-4 h-4 text-zinc-700" />
          </div>
          <div className="space-y-1">
            <p className="text-xl font-bold text-zinc-900">
              {attendingCount} Confirmed
            </p>
            <p className="text-xs text-zinc-600">
              {awaitingCount} awaiting response
            </p>
          </div>
          <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden mt-3">
            <div
              className="bg-zinc-700 h-2 rounded-full transition-all duration-500"
              style={{ width: `${event.guestCount > 0 ? (attendingCount / event.guestCount) * 100 : 0}%` }}
            />
          </div>
          <p className="text-[11px] text-zinc-600 mt-2">
            Target capacity: {event.guestCount} guests
          </p>
        </div>
      </div>

      {/* Two Column Layout: Upcoming Tasks & Budget Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Timeline Tasks */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-zinc-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 tracking-tight">Immediate Milestones</h2>
              <p className="text-xs text-zinc-600">Prioritized checklist items demanding attention</p>
            </div>
            <button
              onClick={() => onNavigateTab('timeline')}
              className="text-xs font-semibold text-[#E11D48] hover:underline flex items-center gap-1 cursor-pointer"
            >
              View Full Timeline
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {pendingTasks.length === 0 ? (
            <div className="py-8 text-center text-zinc-600">
              <CheckCircle2 className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-xs font-medium">All tasks are currently completed!</p>
              <button
                onClick={onOpenNewTask}
                className="mt-2 text-xs text-[#E11D48] font-semibold hover:underline cursor-pointer"
              >
                Add a new task
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingTasks.map((task) => {
                const overdue = isTaskOverdue(task.dueDate, task.status);
                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onToggleTaskComplete(task)}
                        className="w-5 h-5 rounded-md border border-zinc-300 bg-white hover:border-[#E11D48] flex items-center justify-center transition cursor-pointer"
                        aria-label={`Mark task ${task.title} as completed`}
                      >
                        {task.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-[#E11D48]" />}
                      </button>
                      <div>
                        <p className="text-xs font-semibold text-zinc-900">{task.title}</p>
                        <p className="text-[11px] text-zinc-600 flex items-center gap-2">
                          <span>{task.category || 'General'}</span>
                          <span>•</span>
                          <span className={overdue ? 'text-red-600 font-medium' : ''}>
                            Due {formatDisplayDate(task.dueDate)}
                          </span>
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        task.priority === 'urgent'
                          ? 'bg-red-100 text-red-800'
                          : task.priority === 'high'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-zinc-200 text-zinc-700'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Budget Category Snapshot */}
        <div className="rounded-2xl bg-white border border-zinc-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-900 tracking-tight">Top Allocations</h2>
            <button
              onClick={() => onNavigateTab('budget')}
              className="text-xs font-semibold text-[#E11D48] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Planner
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {budgetSummary.categories.length === 0 ? (
            <div className="py-8 text-center text-zinc-600">
              <DollarSign className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-xs font-medium">No budget line items recorded yet</p>
              <button
                onClick={onOpenNewExpense}
                className="mt-2 text-xs text-[#E11D48] font-semibold hover:underline cursor-pointer"
              >
                Record first expense
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {budgetSummary.categories.slice(0, 4).map((cat) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-zinc-800">{cat.category}</span>
                    <span className="text-zinc-900 font-semibold">
                      {formatCurrency(cat.actualAmount, event.currency)}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full ${
                        cat.isOverPlanned ? 'bg-red-600' : 'bg-zinc-900'
                      }`}
                      style={{
                        width: `${Math.min(100, cat.plannedAmount > 0 ? (cat.actualAmount / cat.plannedAmount) * 100 : 0)}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-600">
                    <span>Planned: {formatCurrency(cat.plannedAmount, event.currency)}</span>
                    <span>{cat.itemCount} items</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Event Confirmation Modal */}
      {isConfirmingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white border border-zinc-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Delete Celebration?</h3>
                <p className="text-xs text-zinc-600">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 bg-zinc-50 p-3 rounded-xl border border-zinc-200">
              Are you sure you want to delete <strong className="text-zinc-900">"{event.name}"</strong>? All associated budget items, tasks, vendors, and guest records will be permanently removed.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                className="px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 cursor-pointer transition active:scale-95"
              >
                Delete Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
