import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Repeat,
  Calendar,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  XCircle,
  FileText,
  DollarSign,
  Trash2,
  Eye,
  Zap,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import {
  subscriptionsApi,
  customersApi,
  plansApi,
  productsApi,
  taxesApi,
  discountsApi,
} from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function Subscriptions({ showToast }) {
  const { role } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Metadata for create modal
  const [customers, setCustomers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [taxes, setTaxes] = useState([]);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);

  // Create Form State
  const [formData, setFormData] = useState({
    customerId: '',
    planId: '',
    items: [],
    taxIds: [],
    discountCodes: [],
    paymentTerms: 'immediate',
    startDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    autoRenew: true,
    notes: '',
  });

  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await subscriptionsApi.getAll({
        status: statusFilter,
        search,
      });
      if (res.success) {
        setSubscriptions(res.subscriptions);
      }
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [cRes, pRes, prRes, tRes] = await Promise.all([
        customersApi.getAll(),
        plansApi.getAll({ activeOnly: true }),
        productsApi.getAll({ activeOnly: true }),
        taxesApi.getAll({ isActive: true }),
      ]);
      if (cRes.success) setCustomers(cRes.customers);
      if (pRes.success) setPlans(pRes.plans);
      if (prRes.success) setProducts(prRes.products);
      if (tRes.success) setTaxes(tRes.taxes);
    } catch (err) {
      console.error('Failed to load dependency data:', err);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [statusFilter, search]);

  useEffect(() => {
    if (role === 'admin' || role === 'staff') {
      fetchDependencies();
    }
  }, [role]);

  // Handle Workflow Status Transitions
  const handleStatusAction = async (id, action, reason = '') => {
    try {
      const res = await subscriptionsApi.updateStatus(id, { action, reason });
      if (res.success) {
        showToast({
          type: 'success',
          title: 'Status Updated',
          message: res.message,
        });
        fetchSubscriptions();
        if (selectedSub && selectedSub._id === id) {
          setSelectedSub(res.subscription);
        }
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Action Failed', message: err.message });
    }
  };

  // Trigger Instant Invoice Generation
  const handleTriggerInvoice = async (id) => {
    try {
      const res = await subscriptionsApi.triggerInvoice(id, { force: true });
      if (res.success) {
        showToast({
          type: 'success',
          title: 'Invoice Generated!',
          message: `Invoice ${res.invoice.invoiceNumber} generated for $${res.invoice.totalAmount}`,
        });
        fetchSubscriptions();
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Invoicing Failed', message: err.message });
    }
  };

  // Add Item in Create Modal
  const addItemRow = () => {
    if (products.length === 0) return;
    const firstProd = products[0];
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: firstProd._id,
          variant: { groupName: '', optionName: '', priceAdjustment: 0 },
          quantity: 1,
        },
      ],
    }));
  };

  const removeItemRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItemRow = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.items];
      if (field === 'productId') {
        updated[index].productId = value;
        updated[index].variant = { groupName: '', optionName: '', priceAdjustment: 0 };
      } else if (field === 'quantity') {
        updated[index].quantity = Math.max(1, Number(value));
      } else if (field === 'variant') {
        updated[index].variant = value;
      }
      return { ...prev, items: updated };
    });
  };

  // Apply Promo Code
  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoError('');
    try {
      const subtotalEst = calculateSubtotal();
      const res = await discountsApi.validate({
        code: promoInput,
        subtotal: subtotalEst,
        quantity: formData.items.length,
      });
      if (res.success && res.valid) {
        setAppliedPromo(res.discount);
        setFormData((prev) => ({
          ...prev,
          discountCodes: [res.discount.code],
        }));
        showToast({
          type: 'success',
          title: 'Discount Applied!',
          message: `Saved $${res.discount.calculatedAmount} with promo ${res.discount.code}`,
        });
      }
    } catch (err) {
      setPromoError(err.message || 'Invalid promo code');
    }
  };

  // Calculate live preview totals
  const calculateSubtotal = () => {
    const selectedPlan = plans.find((p) => p._id === formData.planId);
    let planAmt = selectedPlan ? selectedPlan.price : 0;
    let itemsAmt = 0;

    formData.items.forEach((item) => {
      const prod = products.find((p) => p._id === item.productId);
      if (prod) {
        let price = prod.salesPrice + (item.variant?.priceAdjustment || 0);
        itemsAmt += price * item.quantity;
      }
    });

    return planAmt + itemsAmt;
  };

  const subtotal = calculateSubtotal();
  const discountAmount = appliedPromo
    ? appliedPromo.type === 'percentage'
      ? (subtotal * appliedPromo.value) / 100
      : Math.min(appliedPromo.value, subtotal)
    : 0;
  const taxable = Math.max(0, subtotal - discountAmount);

  const selectedTaxesList = taxes.filter((t) => formData.taxIds.includes(t._id));
  const taxesTotal = selectedTaxesList.reduce(
    (acc, t) => acc + (taxable * t.rate) / 100,
    0
  );
  const grandTotal = Math.round((taxable + taxesTotal) * 100) / 100;

  // Handle Form Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerId || !formData.planId) {
      showToast({ type: 'error', message: 'Please select customer and plan' });
      return;
    }

    try {
      const res = await subscriptionsApi.create({
        ...formData,
        status: 'draft',
      });
      if (res.success) {
        showToast({
          type: 'success',
          title: 'Subscription Created!',
          message: `Subscription ${res.subscription.subscriptionNumber} created as Draft.`,
        });
        setCreateModalOpen(false);
        // Reset form
        setFormData({
          customerId: '',
          planId: '',
          items: [],
          taxIds: [],
          discountCodes: [],
          paymentTerms: 'immediate',
          startDate: new Date().toISOString().split('T')[0],
          expiryDate: '',
          autoRenew: true,
          notes: '',
        });
        setAppliedPromo(null);
        setPromoInput('');
        fetchSubscriptions();
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Creation Failed', message: err.message });
    }
  };

  const statusTabs = [
    { id: 'all', label: 'All Subscriptions' },
    { id: 'active', label: 'Active' },
    { id: 'quotation', label: 'Quotations' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'draft', label: 'Drafts' },
    { id: 'paused', label: 'Paused' },
    { id: 'closed', label: 'Closed' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Subscription Lifecycle Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage recurring subscriptions: Draft → Quotation → Confirmed → Active → Closed
          </p>
        </div>

        {(role === 'admin' || role === 'staff') && (
          <button
            onClick={() => {
              if (taxes.length > 0 && formData.taxIds.length === 0) {
                const defaultTax = taxes.find((t) => t.isDefault);
                if (defaultTax) {
                  setFormData((prev) => ({ ...prev, taxIds: [defaultTax._id] }));
                }
              }
              setCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" /> Create Subscription
          </button>
        )}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
        {/* Status Tabs */}
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

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subscriptions..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Subscription #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Plan / Cycle</th>
                <th className="py-3 px-4 text-right">Recurring Total</th>
                <th className="py-3 px-4">Next Billing</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mb-2" />
                    <div>Loading subscriptions...</div>
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <Repeat className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No subscriptions found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {statusFilter !== 'all'
                        ? `No subscriptions in '${statusFilter}' status.`
                        : 'Create your first subscription to get started.'}
                    </p>
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub._id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                      {sub.subscriptionNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{sub.customer?.name}</div>
                      <div className="text-[11px] text-slate-500">{sub.customer?.company || sub.customer?.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800">{sub.plan?.name}</span>
                      <span className="text-[11px] text-slate-500 block capitalize">
                        {sub.billingCycle} billing
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      ${sub.totalAmount?.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {new Date(sub.nextBillingDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Details View */}
                        <button
                          onClick={() => {
                            setSelectedSub(sub);
                            setDetailsModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Lifecycle Action Buttons (Admin/Staff only) */}
                        {(role === 'admin' || role === 'staff') && (
                          <>
                            {sub.status === 'draft' && (
                              <button
                                onClick={() => handleStatusAction(sub._id, 'send_quotation')}
                                className="px-2 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-md text-[11px] font-semibold transition"
                                title="Send Quotation"
                              >
                                Send Quote
                              </button>
                            )}

                            {(sub.status === 'draft' || sub.status === 'quotation') && (
                              <button
                                onClick={() => handleStatusAction(sub._id, 'confirm')}
                                className="px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md text-[11px] font-semibold transition"
                                title="Confirm Subscription"
                              >
                                Confirm
                              </button>
                            )}

                            {(sub.status === 'confirmed' || sub.status === 'quotation' || sub.status === 'draft') && (
                              <button
                                onClick={() => handleStatusAction(sub._id, 'activate')}
                                className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md text-[11px] font-semibold transition flex items-center gap-1"
                                title="Activate Subscription"
                              >
                                <PlayCircle className="w-3.5 h-3.5" /> Activate
                              </button>
                            )}

                            {sub.status === 'active' && (
                              <>
                                <button
                                  onClick={() => handleTriggerInvoice(sub._id)}
                                  className="px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-md text-[11px] font-semibold transition flex items-center gap-1"
                                  title="Generate Invoice Now"
                                >
                                  <Zap className="w-3.5 h-3.5 text-amber-600" /> Invoice Now
                                </button>
                                <button
                                  onClick={() => handleStatusAction(sub._id, 'pause')}
                                  className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                  title="Pause Subscription"
                                >
                                  <PauseCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleStatusAction(sub._id, 'close', 'Cancelled by admin')}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                                  title="Close Subscription"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}

                            {sub.status === 'paused' && (
                              <>
                                <button
                                  onClick={() => handleStatusAction(sub._id, 'resume')}
                                  className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md text-[11px] font-semibold transition flex items-center gap-1"
                                  title="Resume Subscription"
                                >
                                  <PlayCircle className="w-3.5 h-3.5" /> Resume
                                </button>
                                <button
                                  onClick={() => handleStatusAction(sub._id, 'close', 'Closed from paused')}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                                  title="Close Subscription"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}

                            {sub.status === 'closed' && (
                              <button
                                onClick={() => handleStatusAction(sub._id, 'renew')}
                                className="px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md text-[11px] font-semibold transition flex items-center gap-1"
                                title="Renew Subscription"
                              >
                                <Repeat className="w-3 h-3" /> Renew
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE SUBSCRIPTION MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Subscription"
        subtitle="Configure customer, plan, add-on products, variants, taxes, and discounts"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-5 text-xs">
          {/* Row 1: Customer & Plan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Customer *</label>
              <select
                required
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">Select a customer...</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.company || c.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Subscription Plan *</label>
              <select
                required
                value={formData.planId}
                onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">Select a plan...</option>
                {plans.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} - ${p.price}/{p.billingCycle}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Line Items (Add-on Products & Variants) */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-bold text-slate-800 text-xs">Product Line Items</h4>
                <p className="text-[11px] text-slate-500">Include optional products, add-on licenses, or variants</p>
              </div>
              <button
                type="button"
                onClick={addItemRow}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-indigo-600 font-semibold hover:bg-indigo-50 flex items-center gap-1 transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Product
              </button>
            </div>

            {formData.items.length === 0 ? (
              <p className="text-center py-4 text-slate-400 italic">No add-on products added yet. Click "+ Add Product".</p>
            ) : (
              <div className="space-y-3">
                {formData.items.map((item, idx) => {
                  const product = products.find((p) => p._id === item.productId);
                  const availableVariants = product?.variants || [];

                  return (
                    <div key={idx} className="flex flex-wrap items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                      {/* Product select */}
                      <div className="flex-1 min-w-[140px]">
                        <select
                          value={item.productId}
                          onChange={(e) => updateItemRow(idx, 'productId', e.target.value)}
                          className="w-full p-1.5 rounded-lg border border-slate-200 text-xs"
                        >
                          {products.map((p) => (
                            <option key={p._id} value={p._id}>
                              {p.name} (${p.salesPrice})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Variant select if available */}
                      {availableVariants.length > 0 && availableVariants[0].options?.length > 0 && (
                        <div className="w-44">
                          <select
                            value={item.variant?.optionName || ''}
                            onChange={(e) => {
                              const opt = availableVariants[0].options.find((o) => o.name === e.target.value);
                              updateItemRow(idx, 'variant', {
                                groupName: availableVariants[0].name,
                                optionName: opt ? opt.name : '',
                                priceAdjustment: opt ? opt.priceAdjustment : 0,
                              });
                            }}
                            className="w-full p-1.5 rounded-lg border border-slate-200 text-xs"
                          >
                            <option value="">Base Variant (+$0)</option>
                            {availableVariants[0].options.map((opt) => (
                              <option key={opt.name} value={opt.name}>
                                {opt.name} (+${opt.priceAdjustment})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Quantity */}
                      <div className="w-20">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItemRow(idx, 'quantity', e.target.value)}
                          className="w-full p-1.5 rounded-lg border border-slate-200 text-xs text-center"
                          placeholder="Qty"
                        />
                      </div>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Row 3: Discounts & Taxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Promo Code */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Discount Promo Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  placeholder="e.g. WELCOME20"
                  className="flex-1 p-2 rounded-xl border border-slate-200 font-mono text-xs uppercase"
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  className="px-3 py-2 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-700"
                >
                  Apply
                </button>
              </div>
              {promoError && <p className="text-rose-500 text-[11px] mt-1">{promoError}</p>}
              {appliedPromo && (
                <p className="text-emerald-600 text-[11px] mt-1 font-semibold">
                  Applied: {appliedPromo.code} (-${appliedPromo.calculatedAmount})
                </p>
              )}
            </div>

            {/* Taxes */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Applicable Taxes</label>
              <div className="space-y-1.5 max-h-24 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-white">
                {taxes.map((t) => (
                  <label key={t._id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={formData.taxIds.includes(t._id)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFormData((prev) => ({
                          ...prev,
                          taxIds: checked
                            ? [...prev.taxIds, t._id]
                            : prev.taxIds.filter((id) => id !== t._id),
                        }));
                      }}
                      className="rounded text-indigo-600"
                    />
                    <span className="text-slate-700">{t.name} ({t.rate}%)</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Row 4: Dates & Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Expiry Date (Optional)</label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Terms</label>
              <select
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-200 text-xs"
              >
                <option value="immediate">Immediate / Due on Receipt</option>
                <option value="net15">Net 15 Days</option>
                <option value="net30">Net 30 Days</option>
                <option value="net60">Net 60 Days</option>
              </select>
            </div>
          </div>

          {/* Pricing Summary Calculation Box */}
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>Plan Base Fee:</span>
              <span>${(plans.find((p) => p._id === formData.planId)?.price || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Add-on Products Subtotal:</span>
              <span>
                $
                {formData.items
                  .reduce((acc, item) => {
                    const prod = products.find((p) => p._id === item.productId);
                    const price = (prod?.salesPrice || 0) + (item.variant?.priceAdjustment || 0);
                    return acc + price * item.quantity;
                  }, 0)
                  .toFixed(2)}
              </span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Discount ({appliedPromo?.code}):</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Taxes Applied:</span>
              <span>+${taxesTotal.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-indigo-200 flex justify-between font-bold text-slate-900 text-sm">
              <span>Total Recurring Amount:</span>
              <span className="text-indigo-600">${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md transition"
            >
              Create Subscription (Draft)
            </button>
          </div>
        </form>
      </Modal>

      {/* SUBSCRIPTION DETAILS MODAL */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title={selectedSub ? `Subscription: ${selectedSub.subscriptionNumber}` : 'Details'}
        subtitle="Full subscription overview, line items, and lifecycle management"
        maxWidth="max-w-2xl"
      >
        {selectedSub && (
          <div className="space-y-5 text-xs">
            {/* Top overview banner */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-[11px] text-slate-500">Customer</p>
                <p className="text-sm font-bold text-slate-900">{selectedSub.customer?.name}</p>
                <p className="text-slate-500">{selectedSub.customer?.company || selectedSub.customer?.email}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-slate-500">Lifecycle Status</p>
                <div className="mt-1">
                  <StatusBadge status={selectedSub.status} />
                </div>
              </div>
            </div>

            {/* Plan & Cycle Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <p className="text-[11px] text-slate-400">Plan</p>
                <p className="font-bold text-slate-800 mt-0.5">{selectedSub.plan?.name}</p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <p className="text-[11px] text-slate-400">Billing Cycle</p>
                <p className="font-bold text-slate-800 mt-0.5 capitalize">{selectedSub.billingCycle}</p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <p className="text-[11px] text-slate-400">Next Billing Date</p>
                <p className="font-bold text-slate-800 mt-0.5">
                  {new Date(selectedSub.nextBillingDate).toLocaleDateString()}
                </p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <p className="text-[11px] text-slate-400">Payment Terms</p>
                <p className="font-bold text-slate-800 mt-0.5 uppercase">{selectedSub.paymentTerms}</p>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h4 className="font-bold text-slate-800 mb-2">Line Items Breakdown</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Item</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Unit Price</th>
                      <th className="p-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* Base plan item */}
                    <tr>
                      <td className="p-2.5 font-medium text-slate-800">
                        {selectedSub.plan?.name} (Base Fee)
                      </td>
                      <td className="p-2.5 text-center">1</td>
                      <td className="p-2.5 text-right">${selectedSub.planPrice?.toFixed(2)}</td>
                      <td className="p-2.5 text-right font-semibold">${selectedSub.planPrice?.toFixed(2)}</td>
                    </tr>
                    {/* Add-on product items */}
                    {selectedSub.items?.map((it, i) => (
                      <tr key={i}>
                        <td className="p-2.5 text-slate-700">
                          {it.productName}
                          {it.variant?.optionName && (
                            <span className="text-slate-400 block text-[11px]">
                              Variant: {it.variant.optionName}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-center">{it.quantity}</td>
                        <td className="p-2.5 text-right">${it.unitPrice?.toFixed(2)}</td>
                        <td className="p-2.5 text-right font-semibold">${it.subtotal?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Price Summary */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-1.5 border border-slate-200">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>${selectedSub.subtotal?.toFixed(2)}</span>
              </div>
              {selectedSub.discountTotal > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount:</span>
                  <span>-${selectedSub.discountTotal?.toFixed(2)}</span>
                </div>
              )}
              {selectedSub.taxTotal > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Taxes:</span>
                  <span>+${selectedSub.taxTotal?.toFixed(2)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-sm">
                <span>Recurring Total:</span>
                <span className="text-indigo-600">${selectedSub.totalAmount?.toFixed(2)}</span>
              </div>
            </div>

            {/* Lifecycle Quick Actions in Modal */}
            {(role === 'admin' || role === 'staff') && (
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Available Actions:</span>
                <div className="flex flex-wrap items-center gap-2">
                  {selectedSub.status === 'draft' && (
                    <button
                      onClick={() => handleStatusAction(selectedSub._id, 'send_quotation')}
                      className="px-3 py-1.5 bg-sky-50 text-sky-700 font-semibold rounded-lg hover:bg-sky-100"
                    >
                      Send Quotation
                    </button>
                  )}
                  {(selectedSub.status === 'draft' || selectedSub.status === 'quotation') && (
                    <button
                      onClick={() => handleStatusAction(selectedSub._id, 'confirm')}
                      className="px-3 py-1.5 bg-indigo-50 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-100"
                    >
                      Confirm
                    </button>
                  )}
                  {(selectedSub.status === 'confirmed' || selectedSub.status === 'quotation' || selectedSub.status === 'draft') && (
                    <button
                      onClick={() => handleStatusAction(selectedSub._id, 'activate')}
                      className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-500 shadow-sm"
                    >
                      Activate Subscription
                    </button>
                  )}
                  {selectedSub.status === 'active' && (
                    <>
                      <button
                        onClick={() => handleTriggerInvoice(selectedSub._id)}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-sm flex items-center gap-1"
                      >
                        <Zap className="w-3.5 h-3.5 text-slate-950" /> Generate Invoice Now
                      </button>
                      <button
                        onClick={() => handleStatusAction(selectedSub._id, 'pause')}
                        className="px-3 py-1.5 bg-amber-50 text-amber-700 font-semibold rounded-lg hover:bg-amber-100"
                      >
                        Pause
                      </button>
                      <button
                        onClick={() => handleStatusAction(selectedSub._id, 'close', 'Cancelled in details')}
                        className="px-3 py-1.5 bg-rose-50 text-rose-700 font-semibold rounded-lg hover:bg-rose-100"
                      >
                        Close
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

