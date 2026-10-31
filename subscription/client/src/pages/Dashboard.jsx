import React, { useEffect, useState } from 'react';
import {
  Users,
  CreditCard,
  DollarSign,
  AlertTriangle,
  Repeat,
  TrendingUp,
  ArrowRight,
  Clock,
  Zap,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import MetricCard from '../components/MetricCard';
import StatusBadge from '../components/StatusBadge';
import { dashboardApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function Dashboard({ setActivePage, onRunBilling }) {
  const { user, role } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await dashboardApi.getStats();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
        <p className="mt-4 text-sm font-semibold text-slate-500">Loading subscription analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700">
        <h3 className="font-bold">Error loading dashboard</h3>
        <p className="text-sm mt-1">{error}</p>
        <button
          onClick={fetchDashboard}
          className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-500"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { stats, recentPayments, recentInvoices } = data || {};

  // Chart 1: Revenue Timeline
  const revenueChartData = {
    labels: stats?.revenueTimeline?.labels || [],
    datasets: [
      {
        label: 'Monthly Collected Revenue ($)',
        data: stats?.revenueTimeline?.data || [],
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#4f46e5',
        pointRadius: 4,
      },
    ],
  };

  const revenueChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => ` Revenue: $${context.raw?.toLocaleString()}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        ticks: {
          callback: (value) => `$${value}`,
        },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  // Chart 2: Subscription Status Distribution
  const statusSummary = stats?.subscriptionStatusSummary || {};
  const statusLabels = ['Active', 'Quotation', 'Draft', 'Paused', 'Closed'];
  const statusCounts = [
    statusSummary.active || 0,
    statusSummary.quotation || 0,
    statusSummary.draft || 0,
    statusSummary.paused || 0,
    statusSummary.closed || 0,
  ];

  const statusChartData = {
    labels: statusLabels,
    datasets: [
      {
        data: statusCounts,
        backgroundColor: [
          '#10b981', // active: emerald
          '#0ea5e9', // quotation: sky
          '#94a3b8', // draft: slate
          '#f59e0b', // paused: amber
          '#f43f5e', // closed: rose
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const statusChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 12, font: { size: 11 } },
      },
    },
    cutout: '70%',
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl">
        <div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-indigo-200 border border-white/10 mb-3">
            Odoo Hackathon 2026 • Unified Platform
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name?.split(' ')[0]}!
          </h2>
          <p className="text-sm text-indigo-200 mt-1 max-w-xl">
            Complete lifecycle management: from products & tiered plans to automated recurring billing and revenue analytics.
          </p>
        </div>

        {(role === 'admin' || role === 'staff') && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onRunBilling}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg transition active:scale-95"
            >
              <Zap className="w-4 h-4 text-slate-950" /> Run Automated Billing
            </button>
            <button
              onClick={() => setActivePage('subscriptions')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 flex items-center gap-2 transition"
            >
              <Repeat className="w-4 h-4" /> New Subscription
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Active Subscriptions"
          value={stats?.activeSubscriptionsCount ?? 0}
          subtext="Healthy recurring accounts"
          icon={Repeat}
          color="indigo"
          trend="+12%"
        />
        <MetricCard
          title="Total Revenue Collected"
          value={`$${(stats?.totalRevenue ?? 0).toLocaleString()}`}
          subtext={`MRR: $${(stats?.mrr ?? 0).toLocaleString()}`}
          icon={DollarSign}
          color="emerald"
          trend="+18%"
        />
        <MetricCard
          title="Outstanding Receivables"
          value={`$${(stats?.outstandingAmount ?? 0).toLocaleString()}`}
          subtext="Unpaid invoice balance"
          icon={Clock}
          color="amber"
        />
        <MetricCard
          title="Overdue Invoices"
          value={stats?.overdueInvoicesCount ?? 0}
          subtext="Requires payment follow-up"
          icon={AlertTriangle}
          color="rose"
        />
      </div>

      {/* Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Line Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Revenue Collections</h3>
              <p className="text-xs text-slate-500">Historical trend across recent months</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
              <TrendingUp className="w-4 h-4" /> ARR: ${(stats?.arr ?? 0).toLocaleString()}
            </div>
          </div>
          <div className="h-64">
            <Line data={revenueChartData} options={revenueChartOptions} />
          </div>
        </div>

        {/* Subscription Status Distribution Doughnut */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col">
          <h3 className="text-base font-bold text-slate-900">Subscription Status</h3>
          <p className="text-xs text-slate-500 mb-4">Distribution across current pipeline</p>
          <div className="h-64 flex-1 flex items-center justify-center relative">
            <Doughnut data={statusChartData} options={statusChartOptions} />
          </div>
        </div>
      </div>

      {/* Hackathon Demo Pipeline Flow Card */}
      <div className="bg-white rounded-2xl border border-indigo-100 p-6 shadow-sm bg-gradient-to-b from-indigo-50/40 to-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Odoo Hackathon Demo Pipeline</h3>
          </div>
          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
            7-Step Lifecycle
          </span>
        </div>
        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          Walk through the complete end-to-end subscription business lifecycle using the quick links below:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 text-center text-xs">
          <button
            onClick={() => setActivePage('products')}
            className="p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-sm transition"
          >
            <div className="font-bold text-indigo-600 mb-1">1. Product</div>
            <div className="text-[11px] text-slate-500">Create Item & Variants</div>
          </button>
          <button
            onClick={() => setActivePage('plans')}
            className="p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-sm transition"
          >
            <div className="font-bold text-indigo-600 mb-1">2. Plan</div>
            <div className="text-[11px] text-slate-500">Set Cycles & Pricing</div>
          </button>
          <button
            onClick={() => setActivePage('customers')}
            className="p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-sm transition"
          >
            <div className="font-bold text-indigo-600 mb-1">3. Customer</div>
            <div className="text-[11px] text-slate-500">Register Client Profile</div>
          </button>
          <button
            onClick={() => setActivePage('subscriptions')}
            className="p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-sm transition"
          >
            <div className="font-bold text-indigo-600 mb-1">4. Subscribe</div>
            <div className="text-[11px] text-slate-500">Draft → Activate</div>
          </button>
          <button
            onClick={onRunBilling}
            className="p-3 bg-amber-50 rounded-xl border border-amber-200 hover:border-amber-400 hover:shadow-sm transition"
          >
            <div className="font-bold text-amber-700 mb-1">5. Auto-Bill</div>
            <div className="text-[11px] text-amber-600">Generate Invoices</div>
          </button>
          <button
            onClick={() => setActivePage('invoices')}
            className="p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-sm transition"
          >
            <div className="font-bold text-indigo-600 mb-1">6. Invoices</div>
            <div className="text-[11px] text-slate-500">Review Line Items</div>
          </button>
          <button
            onClick={() => setActivePage('payments')}
            className="p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-sm transition"
          >
            <div className="font-bold text-emerald-600 mb-1">7. Payment</div>
            <div className="text-[11px] text-slate-500">Settle & Reconcile</div>
          </button>
        </div>
      </div>

      {/* Two Column Tables: Recent Invoices & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Invoices</h3>
              <p className="text-xs text-slate-500">Latest generated bills</p>
            </div>
            <button
              onClick={() => setActivePage('invoices')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold">
                  <th className="pb-3">Invoice</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3 text-right">Amount</th>
                  <th className="pb-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentInvoices && recentInvoices.length > 0 ? (
                  recentInvoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 font-mono font-bold text-slate-800">{inv.invoiceNumber}</td>
                      <td className="py-3 text-slate-600 truncate max-w-[140px]">
                        {inv.customerSnapshot?.name || inv.customer?.name}
                      </td>
                      <td className="py-3 text-right font-semibold text-slate-900">
                        ${inv.totalAmount?.toFixed(2)}
                      </td>
                      <td className="py-3 text-center">
                        <StatusBadge status={inv.status} size="xs" />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-slate-400">
                      No invoices generated yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Payments</h3>
              <p className="text-xs text-slate-500">Latest settled transactions</p>
            </div>
            <button
              onClick={() => setActivePage('payments')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold">
                  <th className="pb-3">Receipt</th>
                  <th className="pb-3">Method</th>
                  <th className="pb-3 text-right">Amount</th>
                  <th className="pb-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentPayments && recentPayments.length > 0 ? (
                  recentPayments.map((pay) => (
                    <tr key={pay._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 font-mono font-bold text-slate-800">{pay.paymentNumber}</td>
                      <td className="py-3 capitalize text-slate-600">
                        {pay.paymentMethod?.replace('_', ' ')}
                      </td>
                      <td className="py-3 text-right font-semibold text-emerald-600">
                        +${pay.amount?.toFixed(2)}
                      </td>
                      <td className="py-3 text-right text-slate-400">
                        {new Date(pay.paymentDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-slate-400">
                      No payments recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

