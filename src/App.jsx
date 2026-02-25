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
      {/* Top nav */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-slate-900 text-lg tracking-tight">
            🧠 NeuroTrack
          </span>
          <div className="flex items-center gap-1">
            <NavLink
              to="/Dashboard"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </NavLink>
            <NavLink
              to="/SeizureTracker"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Seizures</span>
            </NavLink>
            <NavLink
              to="/Medications"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <Pill className="w-4 h-4" />
              <span className="hidden sm:inline">Medications</span>
            </NavLink>
            <NavLink
              to="/Reminders"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-amber-50 text-amber-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Reminders</span>
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="flex-1">
        {children}
      </main>
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
