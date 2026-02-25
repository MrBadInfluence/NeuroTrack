import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { localClient } from '@/api/localClient';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Plus, 
  Pencil, 
  Trash2,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Pill
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ReminderForm from '@/components/medications/ReminderForm';
import PastDoseForm from '@/components/medications/PastDoseForm';

const DAYS_SHORT = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun'
};

const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function Reminders() {
  const [showForm, setShowForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [showPastDoseForm, setShowPastDoseForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: reminders = [], isLoading: loadingReminders } = useQuery({
    queryKey: ['reminders'],
    queryFn: () => localClient.entities.MedicationReminder.list('-created_date', 100),
  });

  const { data: medications = [], isLoading: loadingMedications } = useQuery({
    queryKey: ['medications'],
    queryFn: () => localClient.entities.Medication.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => localClient.entities.MedicationReminder.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => localClient.entities.MedicationReminder.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      setShowForm(false);
      setEditingReminder(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => localClient.entities.MedicationReminder.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      setDeleteId(null);
    },
  });

  const createDoseLogMutation = useMutation({
    mutationFn: (data) => localClient.entities.DoseLog.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doseLogs'] });
      setShowPastDoseForm(false);
    },
  });

  const toggleActive = async (reminder) => {
    updateMutation.mutate({
      id: reminder.id,
      data: { ...reminder, is_active: !reminder.is_active }
    });
  };

  const handleSubmit = (data) => {
    if (editingReminder) {
      updateMutation.mutate({ id: editingReminder.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (reminder) => {
    setEditingReminder(reminder);
    setShowForm(true);
  };

  const currentDay = format(new Date(), 'EEEE').toLowerCase();
  const activeMedications = medications.filter(m => m.is_active);

  // Sort reminders by time
  const sortedReminders = [...reminders].sort((a, b) => a.time.localeCompare(b.time));

  const isLoading = loadingReminders || loadingMedications;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/30">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 md:mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-3 md:gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Bell className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-3xl font-bold text-slate-900">Reminders</h1>
                <p className="text-sm md:text-base text-slate-500 hidden sm:block">Never miss a dose</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowPastDoseForm(true)}
                variant="outline"
                disabled={activeMedications.length === 0}
                className="border-teal-300 text-teal-700 hover:bg-teal-50 text-xs md:text-sm"
              >
                <Clock className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Log Past Dose</span>
              </Button>
              <Button
                onClick={() => {
                  setEditingReminder(null);
                  setShowForm(true);
                }}
                disabled={activeMedications.length === 0}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm md:text-base"
              >
                <Plus className="w-4 h-4 mr-2" /> Add
              </Button>
            </div>
          </div>
        </motion.div>

        {/* No medications warning */}
        {activeMedications.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">No active medications</p>
                <p className="text-sm text-amber-700">Add some medications first to create reminders for them.</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Today's Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-slate-100 p-4 md:p-5 mb-6 md:mb-8"
        >
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Today's Schedule ({format(new Date(), 'EEEE')})
          </h2>
          {(() => {
            const todaysReminders = sortedReminders.filter(r => 
              r.is_active && r.days_of_week?.includes(currentDay)
            );
            
            if (todaysReminders.length === 0) {
              return (
                <div className="text-center py-8 text-slate-400">
                  <Bell className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p>No reminders scheduled for today</p>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {todaysReminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg md:rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100"
                  >
                    <div className="text-xl md:text-2xl font-bold text-amber-600 w-16 md:w-20 text-center flex-shrink-0">
                      {reminder.time}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Pill className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <p className="font-medium text-sm md:text-base text-slate-900 truncate">{reminder.medication_name}</p>
                      </div>
                      {reminder.notes && (
                        <p className="text-xs md:text-sm text-slate-500 mt-1 truncate">{reminder.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </motion.div>

        {/* All Reminders */}
        <h2 className="text-base md:text-lg font-semibold text-slate-900 mb-4">All Reminders</h2>
        
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-16 h-10 bg-slate-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-slate-200 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : sortedReminders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 md:py-16 bg-white rounded-xl md:rounded-2xl shadow-sm border border-slate-100"
            >
            <Bell className="w-12 h-12 md:w-16 md:h-16 text-amber-200 mx-auto mb-4" />
            <h3 className="text-lg md:text-xl font-semibold text-slate-700 mb-2">No reminders set</h3>
            <p className="text-sm md:text-base text-slate-500 mb-6">Create reminders to help you remember</p>
            {activeMedications.length > 0 && (
              <Button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" /> Create Your First Reminder
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {sortedReminders.map((reminder, index) => (
                <motion.div
                  key={reminder.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white rounded-xl md:rounded-2xl shadow-sm border p-4 md:p-5 hover:shadow-md transition-all ${
                    reminder.is_active ? 'border-slate-100' : 'border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 md:gap-4">
                    <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                      <div className={`text-center rounded-lg md:rounded-xl p-2 md:p-3 min-w-16 md:min-w-20 flex-shrink-0 ${
                        reminder.is_active 
                          ? 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100'
                          : 'bg-slate-50 border border-slate-200'
                      }`}>
                        <p className={`text-xl md:text-2xl font-bold ${reminder.is_active ? 'text-amber-600' : 'text-slate-400'}`}>
                          {reminder.time}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <h3 className="font-semibold text-sm md:text-base text-slate-900 truncate">{reminder.medication_name}</h3>
                          {reminder.is_active ? (
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                              <CheckCircle className="w-3 h-3 mr-1" /> Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-slate-100 text-slate-500">
                              <XCircle className="w-3 h-3 mr-1" /> Paused
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {DAYS_ORDER.map(day => (
                            <span
                              key={day}
                              className={`text-xs px-2 py-1 rounded-md ${
                                reminder.days_of_week?.includes(day)
                                  ? day === currentDay
                                    ? 'bg-amber-500 text-white font-medium'
                                    : 'bg-amber-100 text-amber-700'
                                  : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              {DAYS_SHORT[day]}
                            </span>
                          ))}
                        </div>
                        {reminder.notes && (
                          <p className="text-sm text-slate-500 italic">"{reminder.notes}"</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={reminder.is_active}
                        onCheckedChange={() => toggleActive(reminder)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(reminder)}
                        className="text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(reminder.id)}
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <ReminderForm
              reminder={editingReminder}
              medications={medications}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingReminder(null);
              }}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* Log Past Dose Dialog */}
        <Dialog open={showPastDoseForm} onOpenChange={setShowPastDoseForm}>
          <DialogContent className="max-w-md">
            <PastDoseForm
              medications={activeMedications}
              onSubmit={(data) => createDoseLogMutation.mutate(data)}
              onCancel={() => setShowPastDoseForm(false)}
              isLoading={createDoseLogMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Delete Reminder?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this reminder.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMutation.mutate(deleteId)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}