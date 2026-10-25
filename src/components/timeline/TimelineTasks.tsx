import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Filter,
  Calendar,
  AlertCircle,
  Clock,
  User,
  Trash2,
  Edit2,
  X,
  CheckCircle2,
  Circle,
  ArrowUpDown
} from 'lucide-react';
import { formatDisplayDate, isTaskOverdue, getDaysRemaining } from '../../lib/date-utils.ts';
import type { EventItem, TaskItem } from '../../types/index.ts';

interface TimelineTasksProps {
  event: EventItem;
  tasks: TaskItem[];
  onSaveTask: (task: TaskItem) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onToggleComplete: (task: TaskItem) => Promise<void>;
  onOpenNewTask: () => void;
}

const TASK_CATEGORIES = [
  'General',
  'Venue',
  'Catering',
  'Vendors',
  'Guests',
  'Decor',
  'Entertainment',
  'Logistics',
  'Attire',
];

export const TimelineTasks: React.FC<TimelineTasksProps> = ({
  event,
  tasks,
  onSaveTask,
  onDeleteTask,
  onToggleComplete,
  onOpenNewTask,
}) => {
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(event.date);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'completed'>('pending');
  const [category, setCategory] = useState('General');
  const [assignee, setAssignee] = useState('');
  const [formError, setFormError] = useState('');

  const openTaskModal = (task?: TaskItem) => {
    if (task) {
      setEditingTask(task);
      setTitle(task.title);
      setDescription(task.description || '');
      setDueDate(task.dueDate);
      setPriority(task.priority);
      setStatus(task.status);
      setCategory(task.category || 'General');
      setAssignee(task.assignee || '');
    } else {
      setEditingTask(null);
      setTitle('');
      setDescription('');
      setDueDate(event.date);
      setPriority('medium');
      setStatus('pending');
      setCategory('General');
      setAssignee('');
    }
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Task title is required.');
      return;
    }
    if (!dueDate) {
      setFormError('Due date is required.');
      return;
    }

    const newTask: TaskItem = {
      id: editingTask ? editingTask.id : `tsk-${Date.now()}`,
      eventId: event.id,
      userId: event.userId,
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate,
      priority,
      status,
      category,
      assignee: assignee.trim() || undefined,
      createdAt: editingTask?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await onSaveTask(newTask);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save task:', err);
      setFormError('Failed to save task. Please retry.');
    }
  };

  // Sort tasks chronologically by due date
  const sortedTasks = [...tasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const filteredTasks = sortedTasks.filter((t) => {
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    return true;
  });

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const overdueCount = tasks.filter(t => isTaskOverdue(t.dueDate, t.status)).length;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-zinc-900 tracking-tight">Timeline & Action Milestones</h1>
          <p className="text-xs text-zinc-600">
            Date-aware checklist and task schedules leading up to {formatDisplayDate(event.date)}
          </p>
        </div>
        <button
          onClick={() => openTaskModal()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition active:scale-95 shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#E11D48]" />
          <span>Add New Task</span>
        </button>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white p-4 border border-zinc-200 shadow-xs">
          <span className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider block">Total Tasks</span>
          <p className="text-lg font-bold text-zinc-900 mt-1">{tasks.length}</p>
          <p className="text-[11px] text-zinc-600 mt-0.5">Across all categories</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-zinc-200 shadow-xs">
          <span className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider block">Completed</span>
          <p className="text-lg font-bold text-zinc-900 mt-1">{completedCount}</p>
          <p className="text-[11px] text-zinc-600 mt-0.5">
            {tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0}% progress
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-zinc-200 shadow-xs">
          <span className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider block">Pending</span>
          <p className="text-lg font-bold text-zinc-900 mt-1">{tasks.length - completedCount}</p>
          <p className="text-[11px] text-zinc-600 mt-0.5">Awaiting completion</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-zinc-200 shadow-xs">
          <span className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider block">Overdue</span>
          <p className={`text-lg font-bold mt-1 ${overdueCount > 0 ? 'text-red-600' : 'text-zinc-900'}`}>
            {overdueCount}
          </p>
          <p className="text-[11px] text-zinc-600 mt-0.5">{overdueCount > 0 ? 'Requires immediate attention' : 'All on track'}</p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-700">
            <Filter className="w-3.5 h-3.5 text-zinc-600" />
            <span className="font-semibold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-700">
            <span className="font-semibold">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-700">
            <span className="font-semibold">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {TASK_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <span className="text-xs text-zinc-600 font-medium">
          Showing {filteredTasks.length} of {tasks.length} tasks
        </span>
      </div>

      {/* Chronological Task Timeline */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="rounded-2xl bg-white border border-zinc-200 p-12 text-center text-zinc-600 space-y-2">
            <CheckSquare className="w-8 h-8 text-zinc-300 mx-auto" />
            <p className="text-xs font-medium">No tasks found matching your filter</p>
            <button
              onClick={() => openTaskModal()}
              className="text-xs text-[#E11D48] font-semibold hover:underline cursor-pointer"
            >
              Create milestone task
            </button>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const overdue = isTaskOverdue(task.dueDate, task.status);
            const daysUntilDue = getDaysRemaining(task.dueDate);

            return (
              <div
                key={task.id}
                className={`rounded-2xl p-4 border transition-all ${
                  task.status === 'completed'
                    ? 'bg-zinc-50/80 border-zinc-200 opacity-75'
                    : overdue
                    ? 'bg-white border-red-200 shadow-xs'
                    : 'bg-white border-zinc-200 shadow-xs hover:border-zinc-300'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => onToggleComplete(task)}
                      className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition cursor-pointer ${
                        task.status === 'completed'
                          ? 'bg-zinc-900 border-zinc-900 text-white'
                          : 'border-zinc-300 bg-white hover:border-[#E11D48]'
                      }`}
                      aria-label={`Toggle completion for ${task.title}`}
                    >
                      {task.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-[#E11D48]" />}
                    </button>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          className={`text-xs font-bold ${
                            task.status === 'completed' ? 'line-through text-zinc-600' : 'text-zinc-900'
                          }`}
                        >
                          {task.title}
                        </h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-700">
                          {task.category || 'General'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            task.priority === 'urgent'
                              ? 'bg-red-100 text-red-800'
                              : task.priority === 'high'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-zinc-100 text-zinc-700'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-xs text-zinc-600 leading-relaxed">{task.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-600 pt-1">
                        <span className={`flex items-center gap-1 ${overdue ? 'text-red-600 font-semibold' : ''}`}>
                          <Calendar className="w-3 h-3" />
                          Due: {formatDisplayDate(task.dueDate)}
                          {overdue && ' (Overdue)'}
                          {!overdue && daysUntilDue >= 0 && daysUntilDue <= 7 && ` (${daysUntilDue} days left)`}
                        </span>

                        {task.assignee && (
                          <span className="flex items-center gap-1 text-zinc-700 font-medium">
                            <User className="w-3 h-3" />
                            {task.assignee}
                          </span>
                        )}

                        <span className="capitalize text-zinc-600">Status: {task.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => openTaskModal(task)}
                      className="p-1 rounded-md text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 cursor-pointer"
                      title="Edit task"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1 rounded-md text-zinc-600 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-zinc-200 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-sm font-bold text-zinc-900">
                {editingTask ? 'Edit Task Milestone' : 'Add Milestone Task'}
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
                  Task Title <span className="text-[#E11D48]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Schedule venue walkthrough, Pay florist deposit"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Specific requirements or details"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1">
                    Due Date <span className="text-[#E11D48]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  >
                    {TASK_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1">Assignee (Optional)</label>
                <input
                  type="text"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  placeholder="e.g. Jordan, Event Coordinator"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900"
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
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
