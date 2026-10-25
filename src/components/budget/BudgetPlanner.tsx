import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  Filter,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  Edit2,
  X,
  PieChart,
  ArrowUpDown,
  Tag
} from 'lucide-react';
import { formatCurrency, parseToCents, calculateBudgetSummary } from '../../lib/budget-math.ts';
import type { EventItem, BudgetItem, VendorItem } from '../../types/index.ts';

interface BudgetPlannerProps {
  event: EventItem;
  budgetItems: BudgetItem[];
  vendors: VendorItem[];
  onSaveItem: (item: BudgetItem) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
  onOpenNewExpense: () => void;
}

const DEFAULT_CATEGORIES = [
  'Venue',
  'Catering',
  'Photography',
  'Music & Sound',
  'Decor & Floral',
  'Attire & Styling',
  'Invitations & Print',
  'Transportation',
  'Contingency',
  'Other',
];

export const BudgetPlanner: React.FC<BudgetPlannerProps> = ({
  event,
  budgetItems,
  vendors,
  onSaveItem,
  onDeleteItem,
  onOpenNewExpense,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states for Add/Edit
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Venue');
  const [plannedDisplay, setPlannedDisplay] = useState('0');
  const [actualDisplay, setActualDisplay] = useState('0');
  const [paidStatus, setPaidStatus] = useState<'unpaid' | 'partially_paid' | 'paid'>('unpaid');
  const [vendorId, setVendorId] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const summary = calculateBudgetSummary(event.totalBudget, budgetItems);

  const openEditModal = (item?: BudgetItem) => {
    if (item) {
      setEditingItem(item);
      setTitle(item.title);
      setCategory(item.category);
      setPlannedDisplay((item.plannedAmount / 100).toString());
      setActualDisplay((item.actualAmount / 100).toString());
      setPaidStatus(item.paidStatus);
      setVendorId(item.vendorId || '');
      setNotes(item.notes || '');
    } else {
      setEditingItem(null);
      setTitle('');
      setCategory(DEFAULT_CATEGORIES[0]);
      setPlannedDisplay('0');
      setActualDisplay('0');
      setPaidStatus('unpaid');
      setVendorId('');
      setNotes('');
    }
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Line item title is required.');
      return;
    }

    const plannedCents = parseToCents(plannedDisplay);
    const actualCents = parseToCents(actualDisplay);

    const newItem: BudgetItem = {
      id: editingItem ? editingItem.id : `bgt-${Date.now()}`,
      eventId: event.id,
      userId: event.userId,
      title: title.trim(),
      category,
      plannedAmount: plannedCents,
      actualAmount: actualCents,
      paidStatus,
      vendorId: vendorId || undefined,
      notes: notes.trim() || undefined,
      createdAt: editingItem?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await onSaveItem(newItem);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save budget item:', err);
      setFormError('Failed to save item. Please retry.');
    }
  };

  const filteredItems = budgetItems.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (statusFilter !== 'all' && item.paidStatus !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Overview Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-zinc-900 tracking-tight">Event Financial Planner</h1>
          <p className="text-xs text-zinc-600">
            Allocate planned funds, track vendor invoices, and manage payment milestones
          </p>
        </div>
        <button
          onClick={() => openEditModal()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition active:scale-95 shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#E11D48]" />
          <span>Add Expense Item</span>
        </button>
      </div>

      {/* Warning banner if spending exceeds or nears budget */}
      {summary.isOverBudget ? (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-900">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div className="text-xs">
            <span className="font-bold">Over Budget Alert: </span>
            Actual commitments exceed your designated budget ceiling by{' '}
            <strong className="underline font-semibold">{formatCurrency(summary.overBudgetAmount, event.currency)}</strong>.
            Review individual category line items below.
          </div>
        </div>
      ) : summary.utilizationPercentage >= 90 ? (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="text-xs">
            <span className="font-bold">Budget Warning: </span>
            You have committed {summary.utilizationPercentage}% of total budget. Only{' '}
            <strong>{formatCurrency(summary.remainingBudget, event.currency)}</strong> remains for contingency.
          </div>
        </div>
      ) : null}

      {/* Financial KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white p-4 border border-zinc-200 shadow-xs">
          <span className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider block">Target Budget</span>
          <p className="text-lg font-bold text-zinc-900 mt-1">{formatCurrency(summary.totalBudget, event.currency)}</p>
          <p className="text-[11px] text-zinc-600 mt-0.5">Authoritative ceiling</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-zinc-200 shadow-xs">
          <span className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider block">Planned Total</span>
          <p className="text-lg font-bold text-zinc-900 mt-1">{formatCurrency(summary.plannedTotal, event.currency)}</p>
          <p className="text-[11px] text-zinc-600 mt-0.5">{budgetItems.length} planned line items</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-zinc-200 shadow-xs">
          <span className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider block">Actual Committed</span>
          <p className={`text-lg font-bold mt-1 ${summary.isOverBudget ? 'text-red-600' : 'text-zinc-900'}`}>
            {formatCurrency(summary.actualTotal, event.currency)}
          </p>
          <p className="text-[11px] text-zinc-600 mt-0.5">{summary.utilizationPercentage}% utilized</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-zinc-200 shadow-xs">
          <span className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider block">Remaining Balance</span>
          <p className={`text-lg font-bold mt-1 ${summary.remainingBudget < 0 ? 'text-red-600' : 'text-zinc-900'}`}>
            {formatCurrency(summary.remainingBudget, event.currency)}
          </p>
          <p className="text-[11px] text-zinc-600 mt-0.5">
            {formatCurrency(summary.paidTotal, event.currency)} settled
          </p>
        </div>
      </div>

      {/* Category Breakdown Bars */}
      <div className="rounded-2xl bg-white border border-zinc-200 p-5 shadow-xs space-y-3">
        <h2 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Category Allocation Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {summary.categories.map((cat) => (
            <div
              key={cat.category}
              onClick={() => setSelectedCategory(selectedCategory === cat.category ? 'all' : cat.category)}
              className={`p-3 rounded-xl border transition cursor-pointer ${
                selectedCategory === cat.category
                  ? 'border-zinc-900 bg-zinc-50'
                  : 'border-zinc-200 bg-white hover:border-zinc-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-zinc-900">{cat.category}</span>
                <span className="text-zinc-700">{formatCurrency(cat.actualAmount, event.currency)}</span>
              </div>
              <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden my-2">
                <div
                  className={`h-1.5 rounded-full ${cat.isOverPlanned ? 'bg-red-600' : 'bg-zinc-900'}`}
                  style={{ width: `${Math.min(100, cat.plannedAmount > 0 ? (cat.actualAmount / cat.plannedAmount) * 100 : 0)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-zinc-600">
                <span>Planned: {formatCurrency(cat.plannedAmount, event.currency)}</span>
                <span>{cat.percentageOfBudget}% of budget</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-700">
            <Filter className="w-3.5 h-3.5 text-zinc-600" />
            <span className="font-semibold">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {DEFAULT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-700">
            <span className="font-semibold">Payment:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
        </div>

        <span className="text-xs text-zinc-600 font-medium">
          Showing {filteredItems.length} of {budgetItems.length} items
        </span>
      </div>

      {/* Line Items Table */}
      <div className="rounded-2xl bg-white border border-zinc-200 shadow-xs overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="py-12 text-center text-zinc-600 space-y-2">
            <Wallet className="w-8 h-8 text-zinc-300 mx-auto" />
            <p className="text-xs font-medium">No line items match your current filter</p>
            <button
              onClick={() => openEditModal()}
              className="text-xs text-[#E11D48] font-semibold hover:underline cursor-pointer"
            >
              Create new item
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/70 text-zinc-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Title & Notes</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Planned</th>
                  <th className="py-3 px-4">Actual Spend</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50/60 transition">
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-semibold text-zinc-900">{item.title}</p>
                      {item.notes && <p className="text-[11px] text-zinc-600 truncate mt-0.5">{item.notes}</p>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-zinc-100 text-zinc-800">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-zinc-700">
                      {formatCurrency(item.plannedAmount, event.currency)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-zinc-900">
                      {formatCurrency(item.actualAmount, event.currency)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          item.paidStatus === 'paid'
                            ? 'bg-zinc-900 text-white'
                            : item.paidStatus === 'partially_paid'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-zinc-100 text-zinc-600'
                        }`}
                      >
                        {item.paidStatus === 'paid' && <CheckCircle className="w-3 h-3 text-[#E11D48]" />}
                        {item.paidStatus === 'partially_paid' && <Clock className="w-3 h-3 text-amber-600" />}
                        {item.paidStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1 rounded-md text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 cursor-pointer"
                        title="Edit line item"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteItem(item.id)}
                        className="p-1 rounded-md text-zinc-600 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                        title="Delete line item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-zinc-200 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-sm font-bold text-zinc-900">
                {editingItem ? 'Edit Budget Item' : 'Add Expense / Allocation'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3.5 mt-4">
              {formError && (
                <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs">{formError}</div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1">
                  Item Description <span className="text-[#E11D48]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Reception Venue Deposit, DJ Package"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  >
                    {DEFAULT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1">Payment Status</label>
                  <select
                    value={paidStatus}
                    onChange={(e) => setPaidStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="partially_paid">Partially Paid</option>
                    <option value="paid">Paid in Full</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1">
                    Planned Amount ({event.currency})
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={plannedDisplay}
                    onChange={(e) => setPlannedDisplay(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1">
                    Actual Spent ({event.currency})
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={actualDisplay}
                    onChange={(e) => setActualDisplay(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1">Linked Vendor (Optional)</label>
                <select
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  <option value="">No vendor linked</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>{v.name} ({v.category})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1">Notes & Invoicing</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Invoice number, payment schedule, contract specs"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 cursor-pointer"
                >
                  {editingItem ? 'Save Changes' : 'Record Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
