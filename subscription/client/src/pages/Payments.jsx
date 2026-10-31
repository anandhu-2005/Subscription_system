import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  DollarSign,
  Calendar,
  Building,
  CheckCircle2,
  Receipt,
  Download,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { paymentsApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function Payments({ showToast }) {
  const { role } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await paymentsApi.getAll();
      if (res.success) {
        setPayments(res.payments);
      }
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter((pay) => {
    const matchesMethod = methodFilter === 'all' || pay.paymentMethod === methodFilter;
    const matchesSearch =
      search === '' ||
      pay.paymentNumber?.toLowerCase().includes(search.toLowerCase()) ||
      pay.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      pay.transactionReference?.toLowerCase().includes(search.toLowerCase()) ||
      pay.invoice?.invoiceNumber?.toLowerCase().includes(search.toLowerCase());
    return matchesMethod && matchesSearch;
  });

  const totalCollected = filteredPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Payment Transactions</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit log of all payments recorded against subscription invoices
          </p>
        </div>

        <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold">
          Settled Total: ${totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Method:</span>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="text-xs p-1.5 rounded-lg border border-slate-200 capitalize"
          >
            <option value="all">All Methods</option>
            <option value="credit_card">Credit Card</option>
            <option value="bank_transfer">Bank Transfer / ACH</option>
            <option value="paypal">PayPal</option>
            <option value="cash_upi">UPI / Cash</option>
          </select>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search payment #, txn, customer..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4 font-mono">Transaction Ref</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mb-2" />
                    <div>Loading payments...</div>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <CreditCard className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No payment records found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Payments recorded against open invoices will appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((pay) => (
                  <tr key={pay._id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {pay.paymentNumber}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-indigo-600 font-semibold">
                      {pay.invoice?.invoiceNumber || 'INV-REF'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{pay.customer?.name}</div>
                      <div className="text-[11px] text-slate-500">{pay.customer?.company}</div>
                    </td>
                    <td className="py-3.5 px-4 capitalize text-slate-700">
                      {pay.paymentMethod?.replace('_', ' ')}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {pay.transactionReference || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {new Date(pay.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                      +${pay.amount?.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={pay.status} size="xs" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

