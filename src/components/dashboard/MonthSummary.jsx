import React from 'react';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, eachDayOfInterval } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { getSeizureTypeInfo } from '@/components/seizures/SeizureTypeInfo';

export default function MonthSummary({ seizures }) {
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  
  const seizuresThisMonth = seizures.filter(s => {
    const date = parseISO(s.date_time);
    return isWithinInterval(date, { start: monthStart, end: monthEnd });
  });

  if (seizuresThisMonth.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-green-900 flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            {format(new Date(), 'MMMM yyyy')} Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <Activity className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-900 mb-1">No seizures this month! 🎉</p>
            <p className="text-sm text-green-700">Keep up the great progress</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Count by type
  const typeBreakdown = {};
  seizuresThisMonth.forEach(s => {
    typeBreakdown[s.seizure_type] = (typeBreakdown[s.seizure_type] || 0) + 1;
  });

  // Count by severity
  const severityBreakdown = {
    mild: 0,
    moderate: 0,
    severe: 0
  };
  seizuresThisMonth.forEach(s => {
    if (s.severity) severityBreakdown[s.severity]++;
  });

  // Average per week
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: new Date() }).length;
  const weeksElapsed = daysInMonth / 7;
  const avgPerWeek = (seizuresThisMonth.length / weeksElapsed).toFixed(1);

  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-indigo-900 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          {format(new Date(), 'MMMM yyyy')} Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Count */}
        <div className="bg-white rounded-xl p-4 border border-indigo-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Seizures</p>
              <p className="text-3xl font-bold text-indigo-600">{seizuresThisMonth.length}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Avg per week</p>
              <p className="text-2xl font-semibold text-slate-700">{avgPerWeek}</p>
            </div>
          </div>
        </div>

        {/* Type Breakdown */}
        <div>
          <p className="text-sm font-medium text-indigo-900 mb-2">By Type:</p>
          <div className="space-y-2">
            {Object.entries(typeBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => {
                const typeInfo = getSeizureTypeInfo(type);
                return (
                  <div key={type} className="bg-white rounded-lg p-3 border border-slate-100 flex items-center justify-between">
                    <span className="text-sm text-slate-700">{typeInfo.name}</span>
                    <span className="font-semibold text-indigo-600">{count}</span>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Severity Breakdown */}
        {(severityBreakdown.mild + severityBreakdown.moderate + severityBreakdown.severe) > 0 && (
          <div>
            <p className="text-sm font-medium text-indigo-900 mb-2">By Severity:</p>
            <div className="grid grid-cols-3 gap-2">
              {severityBreakdown.mild > 0 && (
                <div className="bg-green-100 rounded-lg p-3 text-center border border-green-200">
                  <p className="text-xs text-green-700 mb-1">Mild</p>
                  <p className="text-lg font-bold text-green-800">{severityBreakdown.mild}</p>
                </div>
              )}
              {severityBreakdown.moderate > 0 && (
                <div className="bg-amber-100 rounded-lg p-3 text-center border border-amber-200">
                  <p className="text-xs text-amber-700 mb-1">Moderate</p>
                  <p className="text-lg font-bold text-amber-800">{severityBreakdown.moderate}</p>
                </div>
              )}
              {severityBreakdown.severe > 0 && (
                <div className="bg-red-100 rounded-lg p-3 text-center border border-red-200">
                  <p className="text-xs text-red-700 mb-1">Severe</p>
                  <p className="text-lg font-bold text-red-800">{severityBreakdown.severe}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}