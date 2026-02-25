import React from 'react';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Calendar } from 'lucide-react';

export default function MissedDosesSummary({ doseLogs }) {
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  
  const missedThisMonth = doseLogs.filter(log => {
    const date = parseISO(log.scheduled_date);
    return log.status === 'missed' && isWithinInterval(date, { start: monthStart, end: monthEnd });
  });

  if (missedThisMonth.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-green-900 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Medication Adherence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-xl font-bold text-green-900 mb-1">Perfect adherence! ✓</p>
            <p className="text-sm text-green-700">No missed doses this month</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Count by medication
  const missedByMed = {};
  missedThisMonth.forEach(log => {
    missedByMed[log.medication_name] = (missedByMed[log.medication_name] || 0) + 1;
  });

  return (
    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-amber-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Missed Doses This Month
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-3xl font-bold text-amber-900">{missedThisMonth.length}</p>
          <p className="text-sm text-amber-700">doses missed in {format(new Date(), 'MMMM')}</p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-amber-800 uppercase tracking-wide">By Medication:</p>
          {Object.entries(missedByMed)
            .sort((a, b) => b[1] - a[1])
            .map(([medName, count]) => (
              <div key={medName} className="bg-white rounded-lg p-3 border border-amber-100 flex items-center justify-between">
                <span className="text-sm text-slate-700">{medName}</span>
                <span className="font-semibold text-amber-600">{count}</span>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}