import React from 'react';

export default function MetricCard({ title, value, subtext, icon: Icon, color = 'indigo', trend }) {
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-100',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-100',
    },
    sky: {
      bg: 'bg-sky-50',
      text: 'text-sky-600',
      border: 'border-sky-100',
    },
  };

  const scheme = colorMap[color] || colorMap.indigo;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-2 font-sans tracking-tight">{value}</h3>
          {subtext && <p className="text-xs text-slate-500 mt-1 font-medium">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-xl ${scheme.bg} ${scheme.text} transition-transform group-hover:scale-110`}>
          {Icon && <Icon className="w-6 h-6" />}
        </div>
      </div>
      {trend && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-emerald-600 font-semibold">{trend}</span>
          <span className="text-slate-400">vs last month</span>
        </div>
      )}
    </div>
  );
}

