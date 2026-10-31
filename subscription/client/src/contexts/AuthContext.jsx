import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/client';

const AuthContext = createContext(null);

export const DEMO_USERS = {
  admin: {
    email: 'admin@subflow.io',
    password: 'Admin@12345',
    name: 'Alexander Wright (Admin)',
    role: 'admin',
  },
  staff: {
    email: 'staff@subflow.io',
    password: 'Staff@12345',
    name: 'Jessica Reynolds (Staff)',
    role: 'staff',
  },
  customer1: {
    email: 'sarah.chen@nexusai.com',
    password: 'Customer@12345',
    name: 'Sarah Chen (Nexus AI Customer)',
    role: 'customer',
  },
  customer2: {
    email: 'marcus.vance@apexcloud.io',
    password: 'Customer@12345',
    name: 'Marcus Vance (Apex Cloud Customer)',
    role: 'customer',
  },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('subflow_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('subflow_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await authApi.getMe();
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('subflow_user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.warn('Session verification failed, logging out');
          logout();
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    if (res.success) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('subflow_token', res.token);
      localStorage.setItem('subflow_user', JSON.stringify(res.user));
      return res.user;
    }
  };

  const register = async (userData) => {
    const res = await authApi.register(userData);
    if (res.success) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('subflow_token', res.token);
      localStorage.setItem('subflow_user', JSON.stringify(res.user));
      return res.user;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('subflow_token');
    localStorage.removeItem('subflow_user');
  };

  const switchDemoUser = async (demoKey) => {
    const creds = DEMO_USERS[demoKey];
    if (creds) {
      return await login(creds.email, creds.password);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || 'guest',
        isAuthenticated: !!token && !!user,
        loading,
        login,
        register,
        logout,
        switchDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

