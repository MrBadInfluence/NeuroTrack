import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { localClient } from '@/api/localClient';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pill, Check, X, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TodaysDoses({ reminders, doseLogs }) {
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const currentDay = format(new Date(), 'EEEE').toLowerCase();
  
  const todaysReminders = reminders.filter(r => 
    r.is_active && r.days_of_week?.includes(currentDay)
  ).sort((a, b) => a.time.localeCompare(b.time));

  const logDoseMutation = useMutation({
    mutationFn: (data) => localClient.entities.DoseLog.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doseLogs'] });
    },
  });

  const getDoseStatus = (reminder) => {
    const log = doseLogs.find(
      l => l.medication_id === reminder.medication_id && 
           l.scheduled_date === today && 
           l.scheduled_time === reminder.time
    );
    return log?.status || 'pending';
  };

  const markDose = (reminder, status) => {
    logDoseMutation.mutate({
      medication_id: reminder.medication_id,
      medication_name: reminder.medication_name,
      scheduled_date: today,
      scheduled_time: reminder.time,
      taken_at: status === 'taken' ? new Date().toISOString() : null,
      status: status
    });
  };

  if (todaysReminders.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-teal-900 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Today's Doses
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {todaysReminders.map((reminder, index) => {
          const status = getDoseStatus(reminder);
          const isPast = reminder.time < format(new Date(), 'HH:mm');

          return (
            <motion.div
              key={`${reminder.id}-${today}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-white rounded-xl p-4 border ${
                status === 'taken' ? 'border-green-200 bg-green-50/50' :
                status === 'missed' ? 'border-red-200 bg-red-50/50' :
                status === 'skipped' ? 'border-slate-200 bg-slate-50/50' :
                'border-teal-100'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  status === 'taken' ? 'bg-green-100' :
                  status === 'missed' ? 'bg-red-100' :
                  status === 'skipped' ? 'bg-slate-100' :
                  'bg-teal-100'
                }`}>
                  {status === 'taken' ? <Check className="w-5 h-5 text-green-600" /> :
                   status === 'missed' ? <X className="w-5 h-5 text-red-600" /> :
                   status === 'skipped' ? <X className="w-5 h-5 text-slate-600" /> :
                   <Pill className="w-5 h-5 text-teal-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900">{reminder.medication_name}</p>
                  <p className="text-sm text-slate-500">Scheduled: {reminder.time}</p>
                </div>
                {status === 'taken' && (
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                    ✓ Taken
                  </span>
                )}
                {status === 'missed' && (
                  <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 font-medium">
                    Missed
                  </span>
                )}
                {status === 'skipped' && (
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
                    Skipped
                  </span>
                )}
              </div>

              {status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => markDose(reminder, 'taken')}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white h-9"
                  >
                    <Check className="w-4 h-4 mr-1" /> Mark Taken
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => markDose(reminder, isPast ? 'missed' : 'skipped')}
                    className="flex-1 border-slate-300 h-9"
                  >
                    <X className="w-4 h-4 mr-1" /> {isPast ? 'Missed' : 'Skip'}
                  </Button>
                </div>
              )}
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}