import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { localClient } from '@/api/localClient';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, isToday, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Pill, 
  Bell, 
  ChevronRight, 
  Plus,
  Clock,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import StatCard from '@/components/shared/StatCard';
import { getSeizureTypeInfo } from '@/components/seizures/SeizureTypeInfo';
import MonthSummary from '@/components/dashboard/MonthSummary';
import MissedDosesSummary from '@/components/dashboard/MissedDosesSummary';
import TodaysDoses from '@/components/dashboard/TodaysDoses';

export default function Dashboard() {
  const { data: seizures = [] } = useQuery({
    queryKey: ['seizures'],
    queryFn: () => localClient.entities.Seizure.list('-date_time', 100),
  });

  const { data: medications = [] } = useQuery({
    queryKey: ['medications'],
    queryFn: () => localClient.entities.Medication.list('-created_date', 100),
  });

  const { data: reminders = [] } = useQuery({
    queryKey: ['reminders'],
    queryFn: () => localClient.entities.MedicationReminder.list('-created_date', 100),
  });

  const { data: doseLogs = [] } = useQuery({
    queryKey: ['doseLogs'],
    queryFn: () => localClient.entities.DoseLog.list('-created_date', 200),
  });

  const activeMedications = medications.filter(m => m.is_active);
  const activeReminders = reminders.filter(r => r.is_active);
  
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  const seizuresThisMonth = seizures.filter(s => {
    const date = parseISO(s.date_time);
    return isWithinInterval(date, { start: monthStart, end: monthEnd });
  });

  const today = format(new Date(), 'yyyy-MM-dd');
  const missedDosesToday = doseLogs.filter(l => 
    l.status === 'missed' && l.scheduled_date === today
  ).length;

  const recentSeizures = seizures.slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30">
      <div className="max-w-6xl mx-auto p-3 md:p-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 md:mb-8"
        >
          <h1 className="text-2xl md:text-4xl font-bold text-slate-900 mb-1 md:mb-2">
            Seizure and Medication Dashboard
          </h1>
          <p className="text-sm md:text-base text-slate-500">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <StatCard
            icon={Activity}
            label="Seizures This Month"
            value={seizuresThisMonth.length}
            gradient="from-indigo-500 to-purple-500"
            delay={0}
          />
          <StatCard
            icon={Pill}
            label="Active Medications"
            value={activeMedications.length}
            gradient="from-emerald-500 to-teal-500"
            delay={0.1}
          />
          <StatCard
            icon={Bell}
            label="Active Reminders"
            value={activeReminders.length}
            gradient="from-amber-500 to-orange-500"
            delay={0.2}
          />
          <StatCard
            icon={Calendar}
            label="Total Seizures"
            value={seizures.length}
            gradient="from-rose-500 to-pink-500"
            delay={0.3}
          />
        </div>

        {/* Monthly Summaries */}
        <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
          <MonthSummary seizures={seizures} />
          <MissedDosesSummary doseLogs={doseLogs} />
        </div>

        {/* Today's Doses Section */}
        <div className="mb-6 md:mb-8">
          <TodaysDoses reminders={activeReminders} doseLogs={doseLogs} />
        </div>

        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          {/* Recent Seizures */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
          >
            <div className="p-4 md:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                  <Activity className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <h2 className="text-base md:text-lg font-semibold text-slate-900">Recent Seizures</h2>
              </div>
              <Link to={createPageUrl('SeizureTracker')}>
                <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 text-xs md:text-sm">
                  View All <ChevronRight className="w-3 h-3 md:w-4 md:h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="p-3 md:p-4">
              {recentSeizures.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Activity className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p>No seizures logged yet</p>
                  <Link to={createPageUrl('SeizureTracker')}>
                    <Button variant="outline" size="sm" className="mt-3">
                      <Plus className="w-4 h-4 mr-2" /> Log First Entry
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentSeizures.map((seizure) => {
                    const typeInfo = getSeizureTypeInfo(seizure.seizure_type);
                    return (
                      <div
                        key={seizure.id}
                        className="flex items-center gap-3 md:gap-4 p-3 rounded-lg md:rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100"
                        >
                        <div className="text-center flex-shrink-0">
                          <p className="text-xs md:text-sm font-semibold text-indigo-600">
                            {format(parseISO(seizure.date_time), 'MMM d')}
                          </p>
                          <p className="text-[10px] md:text-xs text-slate-500">
                            {format(parseISO(seizure.date_time), 'h:mm a')}
                          </p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm md:text-base text-slate-900 truncate">{typeInfo.name}</p>
                          {seizure.severity && (
                            <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                              seizure.severity === 'severe' ? 'bg-red-100 text-red-700' :
                              seizure.severity === 'moderate' ? 'bg-amber-100 text-amber-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {seizure.severity}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 md:mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4"
        >
          <Link to={createPageUrl('SeizureTracker')} className="block">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-4 md:p-5 text-white hover:shadow-lg transition-shadow cursor-pointer">
              <Activity className="w-7 h-7 md:w-8 md:h-8 mb-2 md:mb-3" />
              <h3 className="font-semibold text-base md:text-lg">Log Seizure</h3>
              <p className="text-white/80 text-xs md:text-sm">Record a new event</p>
            </div>
          </Link>
          <Link to={createPageUrl('Medications')} className="block">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-4 md:p-5 text-white hover:shadow-lg transition-shadow cursor-pointer">
              <Pill className="w-7 h-7 md:w-8 md:h-8 mb-2 md:mb-3" />
              <h3 className="font-semibold text-base md:text-lg">Medications</h3>
              <p className="text-white/80 text-xs md:text-sm">Manage your meds</p>
            </div>
          </Link>
          <Link to={createPageUrl('Reminders')} className="block">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 md:p-5 text-white hover:shadow-lg transition-shadow cursor-pointer">
              <Bell className="w-7 h-7 md:w-8 md:h-8 mb-2 md:mb-3" />
              <h3 className="font-semibold text-base md:text-lg">Reminders</h3>
              <p className="text-white/80 text-xs md:text-sm">Never miss a dose</p>
            </div>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}