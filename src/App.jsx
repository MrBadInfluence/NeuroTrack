import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import NavigationTracker from '@/lib/NavigationTracker';
import PageNotFound from '@/lib/PageNotFound';

import Dashboard from '@/pages/Dashboard';
import SeizureTracker from '@/pages/SeizureTracker';
import Medications from '@/pages/Medications';
import Reminders from '@/pages/Reminders';

import { Activity, Pill, Bell, LayoutDashboard } from 'lucide-react';

function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top header — logo only */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center">
          <span className="font-bold text-slate-900 text-lg tracking-tight">
            🧠 NeuroTrack
          </span>
        </div>
      </header>

      {/* Page content — bottom padding so content isn't hidden behind bottom nav */}
      <main className="flex-1 pb-16">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 h-16 flex">
        <NavLink
          to="/Dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 gap-1 text-xs font-medium transition-colors ${
              isActive ? 'text-indigo-700' : 'text-slate-500 hover:text-slate-700'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          Dashboard
        </NavLink>
        <NavLink
          to="/SeizureTracker"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 gap-1 text-xs font-medium transition-colors ${
              isActive ? 'text-indigo-700' : 'text-slate-500 hover:text-slate-700'
            }`
          }
        >
          <Activity className="w-5 h-5" />
          Seizures
        </NavLink>
        <NavLink
          to="/Medications"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 gap-1 text-xs font-medium transition-colors ${
              isActive ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-700'
            }`
          }
        >
          <Pill className="w-5 h-5" />
          Medications
        </NavLink>
        <NavLink
          to="/Reminders"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 gap-1 text-xs font-medium transition-colors ${
              isActive ? 'text-amber-600' : 'text-slate-500 hover:text-slate-700'
            }`
          }
        >
          <Bell className="w-5 h-5" />
          Reminders
        </NavLink>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <BrowserRouter>
        <NavigationTracker />
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/Dashboard" replace />} />
            <Route path="/Dashboard" element={<Dashboard />} />
            <Route path="/SeizureTracker" element={<SeizureTracker />} />
            <Route path="/Medications" element={<Medications />} />
            <Route path="/Reminders" element={<Reminders />} />
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
