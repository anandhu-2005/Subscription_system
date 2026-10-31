import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Toast from './components/Toast';
import Dashboard from './pages/Dashboard';
import Subscriptions from './pages/Subscriptions';
import Invoices from './pages/Invoices';
import Payments from './pages/Payments';
import Products from './pages/Products';
import Plans from './pages/Plans';
import Customers from './pages/Customers';
import DiscountsTaxes from './pages/DiscountsTaxes';
import CustomerPortal from './pages/CustomerPortal';
import Login from './pages/Login';
import { invoicesApi } from './api/client';

export default function App() {
  const { isAuthenticated, role, loading } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [toast, setToast] = useState(null);

  const showToast = (toastData) => {
    setToast(toastData);
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  // Run Automated Billing Cycle Engine Globally
  const handleRunBilling = async () => {
    try {
      showToast({
        type: 'info',
        title: 'Billing Cycle Initiated',
        message: 'Evaluating active subscriptions due for billing...',
      });

      const res = await invoicesApi.runBilling();
      if (res.success) {
        showToast({
          type: 'success',
          title: 'Automated Billing Completed!',
          message: `Generated ${res.results?.generatedCount || 0} invoice(s), ${res.results?.skippedCount || 0} skipped.`,
        });
        // Force refresh current view if needed
        return res;
      }
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Billing Engine Error',
        message: err.message || 'Failed to execute billing engine',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <p className="mt-4 text-xs font-semibold text-slate-400">Initializing SubFlow...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Login showToast={showToast} />
        <Toast toast={toast} onClose={() => setToast(null)} />
      </>
    );
  }

  // Render view based on active page & role
  const renderContent = () => {
    // If customer role, only allow customer portal, their subscriptions, invoices, or payments
    if (role === 'customer') {
      if (activePage === 'subscriptions') return <Subscriptions showToast={showToast} />;
      if (activePage === 'invoices') return <Invoices showToast={showToast} onRunBilling={handleRunBilling} />;
      if (activePage === 'payments') return <Payments showToast={showToast} />;
      return <CustomerPortal showToast={showToast} />;
    }

    switch (activePage) {
      case 'dashboard':
        return <Dashboard setActivePage={setActivePage} onRunBilling={handleRunBilling} />;
      case 'subscriptions':
        return <Subscriptions showToast={showToast} />;
      case 'invoices':
        return <Invoices showToast={showToast} onRunBilling={handleRunBilling} />;
      case 'payments':
        return <Payments showToast={showToast} />;
      case 'products':
        return <Products showToast={showToast} />;
      case 'plans':
        return <Plans showToast={showToast} />;
      case 'customers':
        return <Customers showToast={showToast} />;
      case 'discounts-taxes':
        return <DiscountsTaxes showToast={showToast} />;
      case 'portal':
        return <CustomerPortal showToast={showToast} />;
      default:
        return <Dashboard setActivePage={setActivePage} onRunBilling={handleRunBilling} />;
    }
  };

  return (
    <>
      <Layout
        activePage={activePage}
        setActivePage={setActivePage}
        onRunBilling={handleRunBilling}
      >
        {renderContent()}
      </Layout>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}

