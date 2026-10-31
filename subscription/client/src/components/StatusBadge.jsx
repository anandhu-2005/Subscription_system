import React from 'react';

const statusConfig = {
  // Subscription statuses
  draft: { label: 'Draft', bg: 'bg-slate-100 text-slate-700 border-slate-200' },
  quotation: { label: 'Quotation', bg: 'bg-sky-50 text-sky-700 border-sky-200' },
  confirmed: { label: 'Confirmed', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  active: { label: 'Active', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  paused: { label: 'Paused', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  closed: { label: 'Closed', bg: 'bg-rose-50 text-rose-700 border-rose-200' },

  // Invoice statuses
  paid: { label: 'Paid', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  partially_paid: { label: 'Partially Paid', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  overdue: { label: 'Overdue', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
  void: { label: 'Void', bg: 'bg-slate-100 text-slate-600 border-slate-200' },

  // Payment statuses
  success: { label: 'Success', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  pending: { label: 'Pending', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  failed: { label: 'Failed', bg: 'bg-rose-50 text-rose-700 border-rose-200' },

  // General statuses
  inactive: { label: 'Inactive', bg: 'bg-slate-100 text-slate-500 border-slate-200' },
};

export default function StatusBadge({ status, size = 'sm' }) {
  const normalized = status ? status.toLowerCase() : 'draft';
  const config = statusConfig[normalized] || {
    label: status || 'Unknown',
    bg: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  const sizeClass = size === 'xs' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${sizeClass} tracking-wide uppercase`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
      {config.label}
    </span>
  );
}

