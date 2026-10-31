import React, { useState, useEffect } from 'react';
import {
  Percent,
  Plus,
  Trash2,
  Edit2,
  Tag,
  DollarSign,
  Calendar,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import Modal from '../components/Modal';
import { taxesApi, discountsApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function DiscountsTaxes({ showToast }) {
  const { role } = useAuth();
  const [taxes, setTaxes] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [taxModalOpen, setTaxModalOpen] = useState(false);
  const [discountModalOpen, setDiscountModalOpen] = useState(false);

  // Tax Form
  const [taxForm, setTaxForm] = useState({
    name: '',
    rate: '',
    type: 'percentage',
    description: '',
    isDefault: false,
    isActive: true,
  });

  // Discount Form
  const [discountForm, setDiscountForm] = useState({
    name: '',
    code: '',
    type: 'percentage',
    value: '',
    minPurchaseAmount: 0,
    minQuantity: 0,
    usageLimit: '',
    isActive: true,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tRes, dRes] = await Promise.all([taxesApi.getAll(), discountsApi.getAll()]);
      if (tRes.success) setTaxes(tRes.taxes);
      if (dRes.success) setDiscounts(dRes.discounts);
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Tax Submit
  const handleTaxSubmit = async (e) => {
    e.preventDefault();
    try {
      await taxesApi.create(taxForm);
      showToast({ type: 'success', message: 'Tax rate created successfully' });
      setTaxModalOpen(false);
      setTaxForm({ name: '', rate: '', type: 'percentage', description: '', isDefault: false, isActive: true });
      fetchData();
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    }
  };

  const handleTaxDelete = async (id) => {
    if (!window.confirm('Delete this tax rate?')) return;
    try {
      await taxesApi.delete(id);
      showToast({ type: 'success', message: 'Tax deleted' });
      fetchData();
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    }
  };

  // Discount Submit
  const handleDiscountSubmit = async (e) => {
    e.preventDefault();
    try {
      await discountsApi.create({
        ...discountForm,
        code: discountForm.code.toUpperCase().trim(),
        usageLimit: discountForm.usageLimit !== '' ? Number(discountForm.usageLimit) : null,
      });
      showToast({ type: 'success', message: 'Discount coupon created successfully' });
      setDiscountModalOpen(false);
      setDiscountForm({
        name: '',
        code: '',
        type: 'percentage',
        value: '',
        minPurchaseAmount: 0,
        minQuantity: 0,
        usageLimit: '',
        isActive: true,
      });
      fetchData();
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    }
  };

  const handleDiscountDelete = async (id) => {
    if (!window.confirm('Delete this discount code?')) return;
    try {
      await discountsApi.delete(id);
      showToast({ type: 'success', message: 'Discount deleted' });
      fetchData();
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Discounts & Tax Configuration</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure automated tax rules and promotional discount codes with eligibility limits
        </p>
      </div>

      {/* Grid: 2 Columns for Taxes & Discounts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Taxes Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Tax Rates</h3>
              <p className="text-xs text-slate-500">Automatically applied during invoice generation</p>
            </div>
            {role === 'admin' && (
              <button
                onClick={() => setTaxModalOpen(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Tax Rate
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="p-3">Tax Name</th>
                  <th className="p-3 text-right">Rate</th>
                  <th className="p-3 text-center">Default</th>
                  {role === 'admin' && <th className="p-3 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {taxes.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/70">
                    <td className="p-3">
                      <div className="font-bold text-slate-800">{t.name}</div>
                      {t.description && <div className="text-[11px] text-slate-400">{t.description}</div>}
                    </td>
                    <td className="p-3 text-right font-bold text-indigo-600 text-sm">{t.rate}%</td>
                    <td className="p-3 text-center">
                      {t.isDefault ? (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-full text-[10px]">
                          Default
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Optional</span>
                      )}
                    </td>
                    {role === 'admin' && (
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleTaxDelete(t._id)}
                          className="p-1 text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Discounts Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Promotional Discounts</h3>
              <p className="text-xs text-slate-500">Fixed or percentage coupons with usage caps</p>
            </div>
            {role === 'admin' && (
              <button
                onClick={() => setDiscountModalOpen(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Coupon
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="p-3">Coupon Code</th>
                  <th className="p-3">Discount Value</th>
                  <th className="p-3">Usage</th>
                  {role === 'admin' && <th className="p-3 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {discounts.map((d) => (
                  <tr key={d._id} className="hover:bg-slate-50/70">
                    <td className="p-3">
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-xs">
                        {d.code}
                      </span>
                      <div className="text-[11px] text-slate-500 mt-1">{d.name}</div>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-emerald-600">
                        {d.type === 'percentage' ? `${d.value}% OFF` : `$${d.value} OFF`}
                      </span>
                      {d.minPurchaseAmount > 0 && (
                        <div className="text-[11px] text-slate-400">Min: ${d.minPurchaseAmount}</div>
                      )}
                    </td>
                    <td className="p-3 text-slate-600">
                      <span className="font-semibold">{d.timesUsed || 0}</span>
                      <span className="text-slate-400"> / {d.usageLimit ? d.usageLimit : '∞'} uses</span>
                    </td>
                    {role === 'admin' && (
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDiscountDelete(d._id)}
                          className="p-1 text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CREATE TAX MODAL */}
      <Modal
        isOpen={taxModalOpen}
        onClose={() => setTaxModalOpen(false)}
        title="Add Tax Rate"
        subtitle="Define regional or state sales tax percentage"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleTaxSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tax Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. State Sales Tax (8%)"
              value={taxForm.name}
              onChange={(e) => setTaxForm({ ...taxForm, name: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tax Rate Percentage (%) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="8"
              value={taxForm.rate}
              onChange={(e) => setTaxForm({ ...taxForm, rate: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows="2"
              placeholder="Optional description..."
              value={taxForm.description}
              onChange={(e) => setTaxForm({ ...taxForm, description: e.target.value })}
              className="w-full p-2 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={taxForm.isDefault}
              onChange={(e) => setTaxForm({ ...taxForm, isDefault: e.target.checked })}
              className="rounded text-indigo-600"
            />
            <span className="text-slate-700 font-medium">Apply as default tax to new subscriptions</span>
          </label>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setTaxModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-md"
            >
              Save Tax Rate
            </button>
          </div>
        </form>
      </Modal>

      {/* CREATE DISCOUNT MODAL */}
      <Modal
        isOpen={discountModalOpen}
        onClose={() => setDiscountModalOpen(false)}
        title="Add Promo Discount Code"
        subtitle="Create percentage or fixed promotional coupons"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleDiscountSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Discount Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Hackathon Launch Discount"
              value={discountForm.name}
              onChange={(e) => setDiscountForm({ ...discountForm, name: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Promo Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. SAVE20"
                value={discountForm.code}
                onChange={(e) => setDiscountForm({ ...discountForm, code: e.target.value.toUpperCase() })}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-xs uppercase"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Discount Type</label>
              <select
                value={discountForm.type}
                onChange={(e) => setDiscountForm({ ...discountForm, type: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Discount Value *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder={discountForm.type === 'percentage' ? '20' : '50'}
                value={discountForm.value}
                onChange={(e) => setDiscountForm({ ...discountForm, value: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Usage Limit (Max Uses)</label>
              <input
                type="number"
                min="1"
                placeholder="Leave blank for unlimited"
                value={discountForm.usageLimit}
                onChange={(e) => setDiscountForm({ ...discountForm, usageLimit: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Minimum Order Amount ($)</label>
            <input
              type="number"
              min="0"
              value={discountForm.minPurchaseAmount}
              onChange={(e) => setDiscountForm({ ...discountForm, minPurchaseAmount: Number(e.target.value) })}
              className="w-full p-2 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setDiscountModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-md"
            >
              Create Coupon
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

