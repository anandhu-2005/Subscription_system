import React, { useState } from 'react';
import {
  LayoutDashboard,
  Repeat,
  Receipt,
  CreditCard,
  Package,
  Layers,
  Users,
  Percent,
  LogOut,
  ChevronDown,
  UserCheck,
  Shield,
  Briefcase,
  User,
  Zap,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Layout({ activePage, setActivePage, children, onRunBilling }) {
  const { user, role, logout, switchDemoUser } = useAuth();
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [runningBilling, setRunningBilling] = useState(false);

  // Define navigation items based on role
  const adminNav = [
    { id: 'dashboard', label: 'Dashboard & Reports', icon: LayoutDashboard },
    { id: 'subscriptions', label: 'Subscriptions', icon: Repeat },
    { id: 'invoices', label: 'Invoices', icon: Receipt },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'products', label: 'Products & Variants', icon: Package },
    { id: 'plans', label: 'Subscription Plans', icon: Layers },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'discounts-taxes', label: 'Discounts & Taxes', icon: Percent },
  ];

  const staffNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'subscriptions', label: 'Subscriptions', icon: Repeat },
    { id: 'invoices', label: 'Invoices', icon: Receipt },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'products', label: 'Products Catalog', icon: Package },
  ];

  const customerNav = [
    { id: 'portal', label: 'My Subscriptions & Bills', icon: LayoutDashboard },
    { id: 'subscriptions', label: 'My Subscriptions', icon: Repeat },
    { id: 'invoices', label: 'My Invoices', icon: Receipt },
    { id: 'payments', label: 'Payment History', icon: CreditCard },
  ];

  let navItems = adminNav;
  if (role === 'staff') navItems = staffNav;
  if (role === 'customer') navItems = customerNav;

  const handleQuickSwitch = async (demoKey) => {
    setDemoMenuOpen(false);
    try {
      await switchDemoUser(demoKey);
      if (demoKey === 'customer1' || demoKey === 'customer2') {
        setActivePage('portal');
      } else {
        setActivePage('dashboard');
      }
    } catch (err) {
      console.error('Failed to switch demo user:', err);
    }
  };

  const handleRunBillingClick = async () => {
    if (!onRunBilling) return;
    setRunningBilling(true);
    try {
      await onRunBilling();
    } finally {
      setRunningBilling(false);
    }
  };

  const roleBadgeColors = {
    admin: 'bg-purple-100 text-purple-700 border-purple-200',
    staff: 'bg-blue-100 text-blue-700 border-blue-200',
    customer: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800">
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black text-lg">
              S
            </div>
            <div>
              <span className="font-extrabold text-white text-lg tracking-tight">SubFlow</span>
              <span className="text-[10px] text-indigo-400 block -mt-1 font-semibold tracking-wider uppercase">
                Odoo Edition
              </span>
            </div>
          </div>
        </div>

        {/* Demo Role Switcher Bar */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-900/80">
          <div className="relative">
            <button
              onClick={() => setDemoMenuOpen(!demoMenuOpen)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700 transition"
              title="Switch demo persona to test roles"
            >
              <div className="flex items-center gap-2 truncate">
                <UserCheck className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span className="truncate">Demo Persona: <strong>{role.toUpperCase()}</strong></span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {demoMenuOpen && (
              <div className="absolute left-0 top-full mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-1 z-50 text-xs">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Switch Role / Persona:
                </div>
                <button
                  onClick={() => handleQuickSwitch('admin')}
                  className="w-full text-left px-3 py-2 hover:bg-slate-700/80 flex items-center gap-2 text-purple-300 font-medium"
                >
                  <Shield className="w-3.5 h-3.5" /> Alexander (Admin)
                </button>
                <button
                  onClick={() => handleQuickSwitch('staff')}
                  className="w-full text-left px-3 py-2 hover:bg-slate-700/80 flex items-center gap-2 text-blue-300 font-medium"
                >
                  <Briefcase className="w-3.5 h-3.5" /> Jessica (Staff)
                </button>
                <button
                  onClick={() => handleQuickSwitch('customer1')}
                  className="w-full text-left px-3 py-2 hover:bg-slate-700/80 flex items-center gap-2 text-emerald-300 font-medium"
                >
                  <User className="w-3.5 h-3.5" /> Sarah (Customer - Nexus AI)
                </button>
                <button
                  onClick={() => handleQuickSwitch('customer2')}
                  className="w-full text-left px-3 py-2 hover:bg-slate-700/80 flex items-center gap-2 text-teal-300 font-medium"
                >
                  <User className="w-3.5 h-3.5" /> Marcus (Customer - Apex)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Automated Billing Trigger Widget (Admin/Staff only) */}
        {(role === 'admin' || role === 'staff') && (
          <div className="p-3 mx-3 mb-3 rounded-xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-900/50">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold mb-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Automated Billing Engine
            </div>
            <p className="text-[11px] text-slate-400 leading-tight mb-2.5">
              Run recurring cycle to invoice active due subscriptions.
            </p>
            <button
              onClick={handleRunBillingClick}
              disabled={runningBilling}
              className="w-full py-1.5 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow"
            >
              {runningBilling ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="w-3 h-3 text-amber-300" /> Run Billing Cycle Now
                </>
              )}
            </button>
          </div>
        )}

        {/* User Footer Profile */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200 uppercase flex-shrink-0">
                {user?.name?.slice(0, 2) || 'US'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold text-slate-900 capitalize tracking-tight">
              {activePage.replace('-', ' ')}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Role Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                roleBadgeColors[role] || 'bg-slate-100 text-slate-700'
              }`}
            >
              {role === 'admin' && <Shield className="w-3.5 h-3.5 text-purple-600" />}
              {role === 'staff' && <Briefcase className="w-3.5 h-3.5 text-blue-600" />}
              {role === 'customer' && <User className="w-3.5 h-3.5 text-emerald-600" />}
              Role: {role}
            </span>

            <div className="h-6 w-px bg-slate-200" />

            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-800">{user?.name}</div>
              <div className="text-[11px] text-slate-400">{user?.email}</div>
            </div>
          </div>
        </header>

        {/* Main Viewport Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

