import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Filter,
  CreditCard,
  Printer,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Zap,
  ArrowRight,
  DollarSign,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { invoicesApi, paymentsApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function Invoices({ showToast, onRunBilling }) {
  const { role, user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);

  // Payment Form
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'credit_card',
    transactionReference: '',
    notes: '',
  });

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await invoicesApi.getAll({
        status: statusFilter,
        search,
      });
      if (res.success) {
        setInvoices(res.invoices);
      }
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, search]);

  const handleOpenPayment = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentForm({
      amount: invoice.balanceDue || invoice.totalAmount,
      paymentMethod: 'credit_card',
      transactionReference: `TXN-${Date.now().toString().slice(-8)}`,
      notes: `Payment for ${invoice.invoiceNumber}`,
    });
    setPayModalOpen(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    try {
      const res = await paymentsApi.record({
        invoiceId: selectedInvoice._id,
        amount: Number(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        transactionReference: paymentForm.transactionReference,
        notes: paymentForm.notes,
      });

      if (res.success) {
        showToast({
          type: 'success',
          title: 'Payment Recorded!',
          message: `Payment ${res.payment.paymentNumber} of $${paymentForm.amount} applied to ${selectedInvoice.invoiceNumber}`,
        });
        setPayModalOpen(false);
        fetchInvoices();
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Payment Failed', message: err.message });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const statusTabs = [
    { id: 'all', label: 'All Invoices' },
    { id: 'confirmed', label: 'Pending / Due' },
    { id: 'paid', label: 'Paid' },
    { id: 'overdue', label: 'Overdue' },
    { id: 'draft', label: 'Draft' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Invoice Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track automated billing invoices, balances due, and record payments
          </p>
        </div>

        {(role === 'admin' || role === 'staff') && (
          <button
            onClick={onRunBilling}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
          >
            <Zap className="w-4 h-4 text-slate-950" /> Run Automated Billing
          </button>
        )}
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice number, customer..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Subscription</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mb-2" />
                    <div>Loading invoices...</div>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    <Receipt className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No invoices found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Run the Automated Billing Engine to generate invoices from active subscriptions.
                    </p>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const isPaid = inv.status === 'paid';
                  const isOverdue = inv.status === 'overdue' || (inv.dueDate && new Date(inv.dueDate) < new Date() && inv.balanceDue > 0);

                  return (
                    <tr key={inv._id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {inv.customerSnapshot?.name || inv.customer?.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {inv.customerSnapshot?.company || inv.customer?.company}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {inv.subscription?.subscriptionNumber || 'Subscription'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {new Date(inv.issueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={isOverdue && !isPaid ? 'text-rose-600 font-semibold' : 'text-slate-600'}>
                          {new Date(inv.dueDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        ${inv.totalAmount?.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold">
                        <span className={inv.balanceDue > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                          ${inv.balanceDue?.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Invoice */}
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setViewModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="View / Print Invoice"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Record Payment (if balance due > 0) */}
                          {inv.balanceDue > 0 && (
                            <button
                              onClick={() => handleOpenPayment(inv)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg text-xs flex items-center gap-1 transition shadow-xs"
                              title="Record Payment"
                            >
                              <CreditCard className="w-3.5 h-3.5" /> Pay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW & PRINT INVOICE MODAL */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title={selectedInvoice ? `Invoice: ${selectedInvoice.invoiceNumber}` : 'Invoice'}
        subtitle="Official billing document and line item statement"
        maxWidth="max-w-3xl"
      >
        {selectedInvoice && (
          <div className="space-y-6 text-xs">
            {/* Printable Document Box */}
            <div id="printable-invoice" className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm space-y-6">
              {/* Invoice Top Header */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm">
                      S
                    </div>
                    <span className="font-extrabold text-slate-900 text-base">SubFlow Cloud Systems</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">100 Tech Enterprise Blvd, Suite 800</p>
                  <p className="text-[11px] text-slate-500">San Francisco, CA 94107 • billing@subflow.io</p>
                </div>

                <div className="text-right">
                  <h3 className="text-xl font-mono font-bold text-slate-900">
                    {selectedInvoice.invoiceNumber}
                  </h3>
                  <div className="mt-1">
                    <StatusBadge status={selectedInvoice.status} size="xs" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Generated: {selectedInvoice.generationType?.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Bill To & Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Billed To:
                  </h4>
                  <p className="font-bold text-slate-900 text-sm">
                    {selectedInvoice.customerSnapshot?.name || selectedInvoice.customer?.name}
                  </p>
                  <p className="text-slate-600 font-medium">
                    {selectedInvoice.customerSnapshot?.company || selectedInvoice.customer?.company}
                  </p>
                  <p className="text-slate-500">
                    {selectedInvoice.customerSnapshot?.email || selectedInvoice.customer?.email}
                  </p>
                  {selectedInvoice.customerSnapshot?.billingAddress?.street && (
                    <p className="text-slate-500">
                      {selectedInvoice.customerSnapshot.billingAddress.street},{' '}
                      {selectedInvoice.customerSnapshot.billingAddress.city}
                    </p>
                  )}
                  {selectedInvoice.customerSnapshot?.taxId && (
                    <p className="text-slate-500 mt-1">Tax ID: {selectedInvoice.customerSnapshot.taxId}</p>
                  )}
                </div>

                <div className="text-right space-y-1">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Invoice Details:
                  </h4>
                  <p className="text-slate-600">
                    <span className="text-slate-400">Issue Date:</span>{' '}
                    <strong>{new Date(selectedInvoice.issueDate).toLocaleDateString()}</strong>
                  </p>
                  <p className="text-slate-600">
                    <span className="text-slate-400">Due Date:</span>{' '}
                    <strong>{new Date(selectedInvoice.dueDate).toLocaleDateString()}</strong>
                  </p>
                  <p className="text-slate-600">
                    <span className="text-slate-400">Payment Terms:</span>{' '}
                    <strong className="uppercase">{selectedInvoice.paymentTerms}</strong>
                  </p>
                  <p className="text-slate-600">
                    <span className="text-slate-400">Billing Period:</span>{' '}
                    {new Date(selectedInvoice.billingPeriodStart).toLocaleDateString()} -{' '}
                    {new Date(selectedInvoice.billingPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-semibold text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedInvoice.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-800">{item.title}</div>
                          {item.description && (
                            <div className="text-[11px] text-slate-400">{item.description}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-700">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-right text-slate-700">${item.unitPrice?.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                          ${item.subtotal?.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & Breakdown */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>${selectedInvoice.subtotal?.toFixed(2)}</span>
                  </div>

                  {selectedInvoice.discounts?.map((disc, i) => (
                    <div key={i} className="flex justify-between text-emerald-600 font-semibold">
                      <span>Discount ({disc.code}):</span>
                      <span>-${disc.amount?.toFixed(2)}</span>
                    </div>
                  ))}

                  {selectedInvoice.taxes?.map((t, i) => (
                    <div key={i} className="flex justify-between text-slate-600">
                      <span>Tax ({t.name}):</span>
                      <span>+${t.amount?.toFixed(2)}</span>
                    </div>
                  ))}

                  <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-sm">
                    <span>Grand Total:</span>
                    <span>${selectedInvoice.totalAmount?.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Amount Paid:</span>
                    <span>-${selectedInvoice.amountPaid?.toFixed(2)}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-slate-900 text-base">
                    <span>Balance Due:</span>
                    <span className={selectedInvoice.balanceDue > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                      ${selectedInvoice.balanceDue?.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedInvoice.notes && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-500 text-[11px]">
                  <strong>Notes:</strong> {selectedInvoice.notes}
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="flex justify-between items-center no-print">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-slate-700 transition"
              >
                <Printer className="w-4 h-4" /> Print / Save PDF
              </button>

              {selectedInvoice.balanceDue > 0 && (
                <button
                  onClick={() => {
                    setViewModalOpen(false);
                    handleOpenPayment(selectedInvoice);
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
                >
                  <CreditCard className="w-4 h-4" /> Record Payment
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* RECORD PAYMENT MODAL */}
      <Modal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        title="Record Payment"
        subtitle={selectedInvoice ? `Against invoice ${selectedInvoice.invoiceNumber}` : ''}
        maxWidth="max-w-md"
      >
        {selectedInvoice && (
          <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Invoice Total:</span>
                <strong>${selectedInvoice.totalAmount?.toFixed(2)}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Already Paid:</span>
                <span className="text-emerald-600">${selectedInvoice.amountPaid?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-200">
                <span>Remaining Balance Due:</span>
                <span className="text-amber-600">${selectedInvoice.balanceDue?.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Amount ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={selectedInvoice.balanceDue}
                required
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-base font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">Supports full or partial payment settlement.</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Method *</label>
              <select
                value={paymentForm.paymentMethod}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none capitalize"
              >
                <option value="credit_card">Credit Card (Stripe Gateway)</option>
                <option value="bank_transfer">Bank Wire / ACH</option>
                <option value="paypal">PayPal</option>
                <option value="cash_upi">UPI / Cash / Direct Deposit</option>
                <option value="stripe_simulator">Test Simulator</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Transaction Ref / Receipt #</label>
              <input
                type="text"
                value={paymentForm.transactionReference}
                onChange={(e) => setPaymentForm({ ...paymentForm, transactionReference: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-200 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Notes</label>
              <textarea
                rows="2"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                placeholder="Optional notes or remittance reference..."
                className="w-full p-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPayModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition"
              >
                Confirm Payment
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

