import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Building,
  Mail,
  Phone,
  Edit2,
  Trash2,
  Eye,
  Repeat,
  Receipt,
} from 'lucide-react';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { customersApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function Customers({ showToast }) {
  const { role } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedCustomerData, setSelectedCustomerData] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    taxId: '',
    paymentTerms: 'immediate',
    billingAddress: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'USA',
    },
    notes: '',
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await customersApi.getAll({ search });
      if (res.success) {
        setCustomers(res.customers);
      }
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      name: '',
      email: '',
      company: '',
      phone: '',
      taxId: '',
      paymentTerms: 'immediate',
      billingAddress: { street: '', city: '', state: '', postalCode: '', country: 'USA' },
      notes: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingId(c._id);
    setFormData({
      name: c.name,
      email: c.email,
      company: c.company || '',
      phone: c.phone || '',
      taxId: c.taxId || '',
      paymentTerms: c.paymentTerms || 'immediate',
      billingAddress: c.billingAddress || { street: '', city: '', state: '', postalCode: '', country: 'USA' },
      notes: c.notes || '',
    });
    setModalOpen(true);
  };

  const handleOpenDetails = async (id) => {
    try {
      const res = await customersApi.getById(id);
      if (res.success) {
        setSelectedCustomerData(res);
        setDetailsModalOpen(true);
      }
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await customersApi.update(editingId, formData);
        showToast({ type: 'success', message: 'Customer updated successfully' });
      } else {
        await customersApi.create(formData);
        showToast({ type: 'success', message: 'Customer created successfully' });
      }
      setModalOpen(false);
      fetchCustomers();
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      await customersApi.delete(id);
      showToast({ type: 'success', message: 'Customer deleted' });
      fetchCustomers();
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Customer Accounts</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage subscriber profiles, default payment terms, and billing contacts
          </p>
        </div>

        {(role === 'admin' || role === 'staff') && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Customer
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, company, email..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <span className="text-xs font-semibold text-slate-500 hidden sm:block">
          Total: {customers.length} subscribers
        </span>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Email & Phone</th>
                <th className="py-3 px-4 text-center">Active Subs</th>
                <th className="py-3 px-4">Terms</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mb-2" />
                    <div>Loading customers...</div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No customers found</p>
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{c.name}</td>
                    <td className="py-3.5 px-4 text-slate-700">{c.company || 'Individual'}</td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800">{c.email}</div>
                      {c.phone && <div className="text-[11px] text-slate-400">{c.phone}</div>}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 text-xs">
                        {c.activeSubscriptionsCount || 0}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 uppercase font-semibold text-slate-600">
                      {c.paymentTerms}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenDetails(c._id)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="View Customer Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Edit Customer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {role === 'admin' && (
                          <button
                            onClick={() => handleDelete(c._id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Customer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* CREATE / EDIT CUSTOMER MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Customer' : 'Add New Customer'}
        subtitle="Manage customer contact and billing address details"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Customer Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Sarah Chen"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="sarah.chen@nexusai.com"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company / Organization</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Nexus AI Solutions Inc."
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tax ID / VAT #</label>
              <input
                type="text"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                placeholder="US-EIN-94827104"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Default Payment Terms</label>
              <select
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              >
                <option value="immediate">Immediate / Due on Receipt</option>
                <option value="net15">Net 15 Days</option>
                <option value="net30">Net 30 Days</option>
                <option value="net60">Net 60 Days</option>
              </select>
            </div>
          </div>

          {/* Billing Address */}
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2">
            <h4 className="font-bold text-slate-800 text-xs">Billing Address</h4>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Street Address"
                value={formData.billingAddress.street}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    billingAddress: { ...formData.billingAddress, street: e.target.value },
                  })
                }
                className="col-span-2 p-2 rounded-lg border border-slate-200 text-xs"
              />
              <input
                type="text"
                placeholder="City"
                value={formData.billingAddress.city}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    billingAddress: { ...formData.billingAddress, city: e.target.value },
                  })
                }
                className="p-2 rounded-lg border border-slate-200 text-xs"
              />
              <input
                type="text"
                placeholder="State / Province"
                value={formData.billingAddress.state}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    billingAddress: { ...formData.billingAddress, state: e.target.value },
                  })
                }
                className="p-2 rounded-lg border border-slate-200 text-xs"
              />
            </div>
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
              {editingId ? 'Update Customer' : 'Add Customer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CUSTOMER 360 DETAILS MODAL */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title={selectedCustomerData?.customer?.name || 'Customer Profile'}
        subtitle={selectedCustomerData?.customer?.company}
        maxWidth="max-w-2xl"
      >
        {selectedCustomerData && (
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Email</span>
                <span className="font-semibold text-slate-800">{selectedCustomerData.customer.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Phone</span>
                <span className="font-semibold text-slate-800">{selectedCustomerData.customer.phone || 'N/A'}</span>
              </div>
            </div>

            {/* Subscriptions */}
            <div>
              <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <Repeat className="w-4 h-4 text-indigo-600" /> Subscriptions (
                {selectedCustomerData.subscriptions?.length || 0})
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-semibold text-[10px]">
                    <tr>
                      <th className="p-2">Number</th>
                      <th className="p-2">Plan</th>
                      <th className="p-2 text-right">Amount</th>
                      <th className="p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedCustomerData.subscriptions?.map((s) => (
                      <tr key={s._id}>
                        <td className="p-2 font-mono font-bold text-slate-800">{s.subscriptionNumber}</td>
                        <td className="p-2 text-slate-700">{s.plan?.name}</td>
                        <td className="p-2 text-right font-bold">${s.totalAmount?.toFixed(2)}</td>
                        <td className="p-2 text-center">
                          <StatusBadge status={s.status} size="xs" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Invoices */}
            <div>
              <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-indigo-600" /> Invoices (
                {selectedCustomerData.invoices?.length || 0})
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-semibold text-[10px]">
                    <tr>
                      <th className="p-2">Invoice #</th>
                      <th className="p-2 text-right">Total</th>
                      <th className="p-2 text-right">Balance Due</th>
                      <th className="p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedCustomerData.invoices?.map((inv) => (
                      <tr key={inv._id}>
                        <td className="p-2 font-mono font-bold text-slate-800">{inv.invoiceNumber}</td>
                        <td className="p-2 text-right font-semibold">${inv.totalAmount?.toFixed(2)}</td>
                        <td className="p-2 text-right font-bold text-amber-600">
                          ${inv.balanceDue?.toFixed(2)}
                        </td>
                        <td className="p-2 text-center">
                          <StatusBadge status={inv.status} size="xs" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

