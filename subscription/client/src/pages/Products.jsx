import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Tag,
  DollarSign,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { productsApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function Products({ showToast }) {
  const { role } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'service',
    salesPrice: '',
    costPrice: '',
    category: 'General',
    description: '',
    variants: [],
    isActive: true,
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await productsApi.getAll({
        type: typeFilter !== 'all' ? typeFilter : undefined,
        search,
      });
      if (res.success) {
        setProducts(res.products);
      }
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [typeFilter, search]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      name: '',
      code: '',
      type: 'service',
      salesPrice: '',
      costPrice: '',
      category: 'General',
      description: '',
      variants: [],
      isActive: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingId(p._id);
    setFormData({
      name: p.name,
      code: p.code || '',
      type: p.type,
      salesPrice: p.salesPrice,
      costPrice: p.costPrice || 0,
      category: p.category || 'General',
      description: p.description || '',
      variants: p.variants || [],
      isActive: p.isActive !== undefined ? p.isActive : true,
    });
    setModalOpen(true);
  };

  // Add Variant Group
  const addVariantGroup = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          name: 'Size / Tier',
          options: [{ name: 'Option 1', priceAdjustment: 0 }],
        },
      ],
    }));
  };

  const removeVariantGroup = (groupIndex) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== groupIndex),
    }));
  };

  const addVariantOption = (groupIndex) => {
    setFormData((prev) => {
      const updated = [...prev.variants];
      updated[groupIndex].options.push({ name: 'New Option', priceAdjustment: 20 });
      return { ...prev, variants: updated };
    });
  };

  const removeVariantOption = (groupIndex, optIndex) => {
    setFormData((prev) => {
      const updated = [...prev.variants];
      updated[groupIndex].options = updated[groupIndex].options.filter((_, i) => i !== optIndex);
      return { ...prev, variants: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await productsApi.update(editingId, formData);
        showToast({ type: 'success', message: 'Product updated successfully' });
      } else {
        await productsApi.create(formData);
        showToast({ type: 'success', message: 'Product created successfully' });
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await productsApi.delete(id);
      showToast({ type: 'success', message: 'Product deleted' });
      fetchProducts();
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Products & Service Catalog</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage subscription line products, software licenses, and variant pricing
          </p>
        </div>

        {(role === 'admin' || role === 'staff') && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        )}
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs p-1.5 rounded-lg border border-slate-200 capitalize"
          >
            <option value="all">All Types</option>
            <option value="service">Service</option>
            <option value="software_license">Software License</option>
            <option value="consumable">Consumable</option>
            <option value="storable">Storable</option>
          </select>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            <div className="inline-block w-6 h-6 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mb-2" />
            <div>Loading products...</div>
          </div>
        ) : products.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-600">No products found</p>
          </div>
        ) : (
          products.map((p) => {
            const margin = p.salesPrice - (p.costPrice || 0);
            return (
              <div
                key={p._id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">
                        {p.code || 'PRD'}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-2 group-hover:text-indigo-600 transition">
                        {p.name}
                      </h3>
                    </div>
                    <span className="capitalize text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
                      {p.type?.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                    {p.description || 'No description provided.'}
                  </p>

                  {/* Pricing Details */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Sales Price</span>
                      <span className="text-lg font-extrabold text-slate-900">${p.salesPrice}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px] uppercase">Cost Price</span>
                      <span className="text-slate-600 font-semibold">${p.costPrice || 0}</span>
                      <span className="text-[10px] text-emerald-600 font-bold block">
                        +${margin} margin
                      </span>
                    </div>
                  </div>

                  {/* Variants Preview */}
                  {p.variants && p.variants.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Variants Available:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {p.variants[0].options?.map((opt, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium"
                          >
                            {opt.name} (+${opt.priceAdjustment})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                {(role === 'admin' || role === 'staff') && (
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      title="Edit Product"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {role === 'admin' && (
                      <button
                        onClick={() => handleDelete(p._id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* CREATE / EDIT PRODUCT MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Product' : 'Add New Product'}
        subtitle="Specify product classification, sales/cost pricing, and tier variants"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Cloud Infrastructure Engine"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Product Code / SKU</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. ENG-01"
                className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-xs uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs capitalize"
              >
                <option value="service">Service</option>
                <option value="software_license">Software License</option>
                <option value="consumable">Consumable</option>
                <option value="storable">Storable</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sales Price ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.salesPrice}
                onChange={(e) => setFormData({ ...formData, salesPrice: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Cost Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Category</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g. Compute, Database, Support"
              className="w-full p-2 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description & Notes</label>
            <textarea
              rows="2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          {/* Product Variants Section */}
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-bold text-slate-800 text-xs">Product Variants & Additional Pricing</h4>
                <p className="text-[11px] text-slate-500">Configure sizing tiers, compute specs, or add-on costs</p>
              </div>
              <button
                type="button"
                onClick={addVariantGroup}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-indigo-600 font-semibold hover:bg-indigo-50"
              >
                + Variant Group
              </button>
            </div>

            {formData.variants?.map((group, gIdx) => (
              <div key={gIdx} className="bg-white p-3 rounded-xl border border-slate-200 mb-2 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={group.name}
                    onChange={(e) => {
                      const updated = [...formData.variants];
                      updated[gIdx].name = e.target.value;
                      setFormData({ ...formData, variants: updated });
                    }}
                    placeholder="Variant Group Name (e.g. Sizing, Tier)"
                    className="font-bold text-slate-800 p-1 border-b border-slate-200 focus:outline-none text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => removeVariantGroup(gIdx)}
                    className="text-rose-500 hover:text-rose-700 text-xs font-semibold"
                  >
                    Remove Group
                  </button>
                </div>

                <div className="space-y-1.5 pl-2">
                  {group.options?.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt.name}
                        onChange={(e) => {
                          const updated = [...formData.variants];
                          updated[gIdx].options[oIdx].name = e.target.value;
                          setFormData({ ...formData, variants: updated });
                        }}
                        placeholder="Option Name (e.g. 4 vCPU, 16GB)"
                        className="flex-1 p-1 rounded border border-slate-200 text-xs"
                      />
                      <div className="flex items-center gap-1 w-28">
                        <span className="text-slate-400">+$</span>
                        <input
                          type="number"
                          value={opt.priceAdjustment}
                          onChange={(e) => {
                            const updated = [...formData.variants];
                            updated[gIdx].options[oIdx].priceAdjustment = Number(e.target.value);
                            setFormData({ ...formData, variants: updated });
                          }}
                          placeholder="Price"
                          className="w-full p-1 rounded border border-slate-200 text-xs"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVariantOption(gIdx, oIdx)}
                        className="text-slate-400 hover:text-rose-500 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addVariantOption(gIdx)}
                    className="text-[11px] text-indigo-600 font-semibold hover:underline mt-1"
                  >
                    + Add Option
                  </button>
                </div>
              </div>
            ))}
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
              {editingId ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

