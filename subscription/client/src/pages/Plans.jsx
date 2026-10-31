import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Check,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import Modal from '../components/Modal';
import { plansApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function Plans({ showToast }) {
  const { role } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cycleFilter, setCycleFilter] = useState('all');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    billingCycle: 'monthly',
    intervalCount: 1,
    price: '',
    currency: 'USD',
    minQuantity: 1,
    trialDays: 0,
    description: '',
    features: [''],
    allowPause: true,
    allowRenewal: true,
    isActive: true,
  });

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await plansApi.getAll({
        cycle: cycleFilter !== 'all' ? cycleFilter : undefined,
      });
      if (res.success) {
        setPlans(res.plans);
      }
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [cycleFilter]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      name: '',
      code: '',
      billingCycle: 'monthly',
      intervalCount: 1,
      price: '',
      currency: 'USD',
      minQuantity: 1,
      trialDays: 0,
      description: '',
      features: ['Unlimited API calls', 'Automated Daily Backups'],
      allowPause: true,
      allowRenewal: true,
      isActive: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (plan) => {
    setEditingId(plan._id);
    setFormData({
      name: plan.name,
      code: plan.code || '',
      billingCycle: plan.billingCycle,
      intervalCount: plan.intervalCount || 1,
      price: plan.price,
      currency: plan.currency || 'USD',
      minQuantity: plan.minQuantity || 1,
      trialDays: plan.trialDays || 0,
      description: plan.description || '',
      features: plan.features && plan.features.length > 0 ? plan.features : [''],
      allowPause: plan.allowPause !== undefined ? plan.allowPause : true,
      allowRenewal: plan.allowRenewal !== undefined ? plan.allowRenewal : true,
      isActive: plan.isActive !== undefined ? plan.isActive : true,
    });
    setModalOpen(true);
  };

  const handleFeatureChange = (index, value) => {
    const updated = [...formData.features];
    updated[index] = value;
    setFormData({ ...formData, features: updated });
  };

  const addFeatureInput = () => {
    setFormData({ ...formData, features: [...formData.features, ''] });
  };

  const removeFeatureInput = (index) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const cleanFeatures = formData.features.filter((f) => f.trim() !== '');
      const payload = { ...formData, features: cleanFeatures };

      if (editingId) {
        await plansApi.update(editingId, payload);
        showToast({ type: 'success', message: 'Plan updated successfully' });
      } else {
        await plansApi.create(payload);
        showToast({ type: 'success', message: 'Plan created successfully' });
      }
      setModalOpen(false);
      fetchPlans();
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subscription plan?')) return;
    try {
      await plansApi.delete(id);
      showToast({ type: 'success', message: 'Plan deleted' });
      fetchPlans();
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Subscription Plans</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Define recurring billing cycles (daily, weekly, monthly, yearly), trial periods, and terms
          </p>
        </div>

        {role === 'admin' && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" /> Create Plan
          </button>
        )}
      </div>

      {/* Cycle Tabs */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200/80 w-fit">
        {['all', 'daily', 'weekly', 'monthly', 'yearly'].map((cycle) => (
          <button
            key={cycle}
            onClick={() => setCycleFilter(cycle)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
              cycleFilter === cycle
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {cycle}
          </button>
        ))}
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            <div className="inline-block w-6 h-6 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mb-2" />
            <div>Loading plans...</div>
          </div>
        ) : plans.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            <Layers className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-600">No subscription plans found</p>
          </div>
        ) : (
          plans.map((p) => {
            const isYearly = p.billingCycle === 'yearly';
            return (
              <div
                key={p._id}
                className={`bg-white rounded-3xl p-6 border transition flex flex-col justify-between relative shadow-sm hover:shadow-md ${
                  isYearly ? 'border-indigo-300 ring-2 ring-indigo-500/10' : 'border-slate-200/80'
                }`}
              >
                {isYearly && (
                  <span className="absolute -top-3 left-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow">
                    Most Popular
                  </span>
                )}

                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">
                        {p.code || 'PLN'}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 mt-2">{p.name}</h3>
                    </div>
                    <span className="capitalize text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full">
                      {p.billingCycle}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-2 min-h-[32px]">{p.description}</p>

                  {/* Pricing Display */}
                  <div className="mt-5 pb-5 border-b border-slate-100 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900">${p.price}</span>
                    <span className="text-xs text-slate-500 font-semibold">/{p.billingCycle}</span>
                    {p.trialDays > 0 && (
                      <span className="ml-auto text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {p.trialDays}-day trial
                      </span>
                    )}
                  </div>

                  {/* Features List */}
                  <div className="mt-5 space-y-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Included Capabilities:
                    </span>
                    {p.features && p.features.length > 0 ? (
                      p.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                          <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">Standard tier features</p>
                    )}
                  </div>
                </div>

                {/* Footer Controls */}
                {role === 'admin' && (
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-3 text-[11px]">
                      <span>Pause: {p.allowPause ? 'Yes' : 'No'}</span>
                      <span>Renewal: {p.allowRenewal ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p._id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* CREATE / EDIT PLAN MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
        subtitle="Set pricing, recurrence cycle, trial days, and features"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Plan Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Professional Business Tier"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Code / SKU</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. PLN-M-PRO"
                className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-xs uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Billing Cycle *</label>
              <select
                value={formData.billingCycle}
                onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs capitalize"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Plan Price ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Trial Period (Days)</label>
              <input
                type="number"
                min="0"
                value={formData.trialDays}
                onChange={(e) => setFormData({ ...formData, trialDays: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Plan Description</label>
            <textarea
              rows="2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          {/* Features Checklist */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700">Included Features</label>
              <button
                type="button"
                onClick={addFeatureInput}
                className="text-[11px] text-indigo-600 font-semibold hover:underline"
              >
                + Add Feature
              </button>
            </div>
            <div className="space-y-2">
              {formData.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={feat}
                    onChange={(e) => handleFeatureChange(idx, e.target.value)}
                    placeholder="e.g. 24/7 Priority SLA"
                    className="flex-1 p-2 rounded-lg border border-slate-200 text-xs"
                  />
                  {formData.features.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFeatureInput(idx)}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Settings checkboxes */}
          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allowPause}
                onChange={(e) => setFormData({ ...formData, allowPause: e.target.checked })}
                className="rounded text-indigo-600"
              />
              <span className="text-slate-700">Allow Pausing</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allowRenewal}
                onChange={(e) => setFormData({ ...formData, allowRenewal: e.target.checked })}
                className="rounded text-indigo-600"
              />
              <span className="text-slate-700">Allow Auto-Renewal</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md transition"
            >
              {editingId ? 'Update Plan' : 'Create Plan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

