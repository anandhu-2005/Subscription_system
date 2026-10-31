import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md animate-bounce-in">
      <div
        className={`flex items-start gap-3 p-4 rounded-xl shadow-xl border ${
          isSuccess
            ? 'bg-emerald-900 text-white border-emerald-700'
            : isError
            ? 'bg-rose-900 text-white border-rose-700'
            : 'bg-slate-900 text-white border-slate-700'
        }`}
      >
        <div className="mt-0.5">
          {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          {isError && <AlertCircle className="w-5 h-5 text-rose-400" />}
          {!isSuccess && !isError && <Info className="w-5 h-5 text-indigo-400" />}
        </div>
        <div className="flex-1 pr-2">
          {toast.title && <h4 className="text-sm font-bold">{toast.title}</h4>}
          <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">{toast.message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

