import React, { useState, useEffect } from 'react';
import {
  Repeat,
  Receipt,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Eye,
  Calendar,
  DollarSign,
  Zap,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import MetricCard from '../components/MetricCard';
import { subscriptionsApi, invoicesApi, paymentsApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function CustomerPortal({ showToast }) {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pay Modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('credit_card');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sRes, iRes] = await Promise.all([
        subscriptionsApi.getAll(),
        invoicesApi.getAll(),
      ]);
      if (sRes.success) setSubscriptions(sRes.subscriptions);
      if (iRes.success) setInvoices(iRes.invoices);
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalOutstanding = invoices
    .filter((inv) => inv.balanceDue > 0)
    .reduce((acc, inv) => acc + inv.balanceDue, 0);

  const activeSub = subscriptions.find((s) => s.status === 'active');

  const handleOpenPay = (inv) => {
    setSelectedInvoice(inv);
    setPayAmount(inv.balanceDue);
    setPayModalOpen(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    try {
      const res = await paymentsApi.record({
        invoiceId: selectedInvoice._id,
        amount: Number(payAmount),
        paymentMethod: payMethod,
        transactionReference: `PORTAL-PAY-${Date.now().toString().slice(-6)}`,
        notes: `Paid via Customer Portal by ${user.name}`,
      });

      if (res.success) {
        showToast({
          type: 'success',
          title: 'Payment Successful!',
          message: `Your payment of $${payAmount} for invoice ${selectedInvoice.invoiceNumber} was processed successfully.`,
        });
        setPayModalOpen(false);
        fetchData();
      }
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
        <p className="mt-3 text-xs text-slate-500 font-semibold">Loading your customer portal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-xl">
        <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">
          Subscriber Self-Service Portal
        </span>
        <h2 className="text-2xl font-bold">Hello, {user?.name}!</h2>
        <p className="text-xs text-slate-300 mt-1">
          Review your subscriptions, manage your active cloud plans, and view or settle open invoices.
        </p>

        {totalOutstanding > 0 && (
          <div className="mt-5 p-3.5 bg-amber-500/20 border border-amber-500/30 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-xs font-bold text-amber-200">Payment Due: ${totalOutstanding.toFixed(2)}</p>
                <p className="text-[11px] text-amber-300/80">You have open invoices awaiting settlement.</p>
              </div>
            </div>
            {invoices.find((i) => i.balanceDue > 0) && (
              <button
                onClick={() => handleOpenPay(invoices.find((i) => i.balanceDue > 0))}
                className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs transition"
              >
                Pay Now
              </button>
            )}
          </div>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <MetricCard
          title="Active Subscriptions"
          value={subscriptions.filter((s) => s.status === 'active').length}
          subtext={activeSub ? `${activeSub.plan?.name} (${activeSub.billingCycle})` : 'No active subscriptions'}
          icon={Repeat}
          color="indigo"
        />
        <MetricCard
          title="Outstanding Balance"
          value={`$${totalOutstanding.toFixed(2)}`}
          subtext="Total due on all invoices"
          icon={CreditCard}
          color={totalOutstanding > 0 ? 'amber' : 'emerald'}
        />
        <MetricCard
          title="Total Invoices"
          value={invoices.length}
          subtext={`${invoices.filter((i) => i.status === 'paid').length} Paid`}
          icon={Receipt}
          color="sky"
        />
      </div>

      {/* My Subscriptions */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900">My Subscriptions</h3>
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="p-3.5">Subscription #</th>
                <th className="p-3.5">Plan</th>
                <th className="p-3.5">Billing Cycle</th>
                <th className="p-3.5 text-right">Recurring Fee</th>
                <th className="p-3.5">Next Renewal</th>
                <th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-slate-400">
                    No subscriptions found for your account.
                  </td>
                </tr>
              ) : (
                subscriptions.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/70">
                    <td className="p-3.5 font-mono font-bold text-indigo-600">{s.subscriptionNumber}</td>
                    <td className="p-3.5 font-bold text-slate-800">{s.plan?.name}</td>
                    <td className="p-3.5 capitalize text-slate-600">{s.billingCycle}</td>
                    <td className="p-3.5 text-right font-bold text-slate-900">${s.totalAmount?.toFixed(2)}</td>
                    <td className="p-3.5 text-slate-600">
                      {new Date(s.nextBillingDate).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-center">
                      <StatusBadge status={s.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* My Invoices */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900">My Invoices & Statements</h3>
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="p-3.5">Invoice #</th>
                <th className="p-3.5">Issue Date</th>
                <th className="p-3.5">Due Date</th>
                <th className="p-3.5 text-right">Amount</th>
                <th className="p-3.5 text-right">Balance Due</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-6 text-center text-slate-400">
                    No invoices generated yet.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/70">
                    <td className="p-3.5 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="p-3.5 text-slate-600">{new Date(inv.issueDate).toLocaleDateString()}</td>
                    <td className="p-3.5 text-slate-600">{new Date(inv.dueDate).toLocaleDateString()}</td>
                    <td className="p-3.5 text-right font-bold text-slate-900">${inv.totalAmount?.toFixed(2)}</td>
                    <td className="p-3.5 text-right font-bold text-amber-600">
                      ${inv.balanceDue?.toFixed(2)}
                    </td>
                    <td className="p-3.5 text-center">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="p-3.5 text-right">
                      {inv.balanceDue > 0 ? (
                        <button
                          onClick={() => handleOpenPay(inv)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-xs transition"
                        >
                          Pay ${inv.balanceDue.toFixed(2)}
                        </button>
                      ) : (
                        <span className="text-emerald-600 font-bold text-xs flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Settled
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Quick Pay Modal */}
      <Modal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        title="Pay Invoice"
        subtitle={selectedInvoice ? `Settling balance on ${selectedInvoice.invoiceNumber}` : ''}
        maxWidth="max-w-md"
      >
        {selectedInvoice && (
          <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Total Invoice:</span>
                <span className="font-semibold">${selectedInvoice.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                <span>Amount Due:</span>
                <span className="text-indigo-600">${selectedInvoice.balanceDue.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pay Amount ($)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={selectedInvoice.balanceDue}
                required
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-base font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 capitalize"
              >
                <option value="credit_card">Credit Card (Instant Processing)</option>
                <option value="bank_transfer">ACH Direct Debit</option>
                <option value="paypal">PayPal</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPayModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition"
              >
                Submit Payment
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

