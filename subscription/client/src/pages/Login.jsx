import React, { useState } from 'react';
import {
  Shield,
  Briefcase,
  User,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  Zap,
  Building,
} from 'lucide-react';
import { useAuth, DEMO_USERS } from '../contexts/AuthContext';

export default function Login({ showToast }) {
  const { login, register, switchDemoUser } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        await register({ name, email, password, company });
        showToast({ type: 'success', message: 'Account registered successfully!' });
      } else {
        await login(email, password);
        showToast({ type: 'success', message: 'Welcome back!' });
      }
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoKey) => {
    setLoading(true);
    try {
      await switchDemoUser(demoKey);
      showToast({
        type: 'success',
        title: 'Demo Persona Active',
        message: `Logged in as ${DEMO_USERS[demoKey].name}`,
      });
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-600/20 via-violet-600/10 to-transparent blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        {/* Brand Icon */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-xl shadow-indigo-500/30 text-white font-black text-2xl mb-4">
          S
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">SubFlow</h2>
        <p className="text-xs text-indigo-300 font-semibold uppercase tracking-wider mt-1">
          Subscription Management Platform • Odoo Hackathon
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700/80 py-8 px-6 shadow-2xl rounded-3xl sm:px-10">
          {/* Quick Demo Switcher Panel */}
          <div className="mb-6 p-4 rounded-2xl bg-slate-900/80 border border-slate-700/90 text-left">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-2">
              <Zap className="w-3.5 h-3.5" /> 1-Click Hackathon Demo Logins:
            </div>
            <p className="text-[11px] text-slate-400 mb-3 leading-tight">
              Test each role's specific view, capabilities, and restrictions instantly:
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoLogin('admin')}
                className="p-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800/60 text-purple-200 font-semibold flex items-center gap-2 transition"
              >
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <div className="text-left truncate">
                  <span className="block font-bold">Admin</span>
                  <span className="text-[10px] text-purple-300/70">Full Access</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('staff')}
                className="p-2 rounded-xl bg-blue-950/60 hover:bg-blue-900/60 border border-blue-800/60 text-blue-200 font-semibold flex items-center gap-2 transition"
              >
                <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                <div className="text-left truncate">
                  <span className="block font-bold">Staff</span>
                  <span className="text-[10px] text-blue-300/70">Ops Access</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('customer1')}
                className="p-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/60 text-emerald-200 font-semibold flex items-center gap-2 transition"
              >
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <div className="text-left truncate">
                  <span className="block font-bold truncate">Sarah Chen</span>
                  <span className="text-[10px] text-emerald-300/70">Nexus AI</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('customer2')}
                className="p-2 rounded-xl bg-teal-950/60 hover:bg-teal-900/60 border border-teal-800/60 text-teal-200 font-semibold flex items-center gap-2 transition"
              >
                <User className="w-3.5 h-3.5 text-teal-400" />
                <div className="text-left truncate">
                  <span className="block font-bold truncate">Marcus Vance</span>
                  <span className="text-[10px] text-teal-300/70">Apex Cloud</span>
                </div>
              </button>
            </div>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-slate-800 text-slate-400 font-medium">Or log in manually</span>
            </div>
          </div>

          {/* Login / Register Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alexander Wright"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            )}

            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Company (Optional)</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Corp."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@subflow.io"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isRegister ? 'Create Account' : 'Sign In'} <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Register / Login */}
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              {isRegister
                ? 'Already have an account? Sign in'
                : "Don't have an account? Register as Customer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

