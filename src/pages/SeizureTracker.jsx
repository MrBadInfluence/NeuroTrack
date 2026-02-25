import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { localClient } from '@/api/localClient';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Plus, 
  Pencil, 
  Trash2, 
  ChevronDown,
  AlertCircle,
  Clock,
  Zap,
  Info,
  Printer,
  Moon
} from 'lucide-react';
import { Button } from "@/components/ui/button";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import SeizureForm from '@/components/seizures/SeizureForm';
import SeizureTypeInfo, { getSeizureTypeInfo, seizureTypes } from '@/components/seizures/SeizureTypeInfo';

export default function SeizureTracker() {
  const [showForm, setShowForm] = useState(false);
  const [editingSeizure, setEditingSeizure] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [showTypeGuide, setShowTypeGuide] = useState(false);
  const queryClient = useQueryClient();

  const handlePrint = () => {
    window.print();
  };

  const { data: seizures = [], isLoading } = useQuery({
    queryKey: ['seizures'],
    queryFn: () => localClient.entities.Seizure.list('-date_time', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => localClient.entities.Seizure.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seizures'] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => localClient.entities.Seizure.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seizures'] });
      setShowForm(false);
      setEditingSeizure(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => localClient.entities.Seizure.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seizures'] });
      setDeleteId(null);
    },
  });

  const handleSubmit = (data) => {
    if (editingSeizure) {
      updateMutation.mutate({ id: editingSeizure.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (seizure) => {
    setEditingSeizure(seizure);
    setShowForm(true);
  };

  const severityColors = {
    mild: 'bg-green-100 text-green-700 border-green-200',
    moderate: 'bg-amber-100 text-amber-700 border-amber-200',
    severe: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30">
      <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          button:not(.seizure-print), nav, .shadow-lg, .shadow-md, .shadow-sm { display: none !important; }
          .bg-gradient-to-br, .bg-gradient-to-r { background: white !important; }
          .border { border-color: #e5e7eb !important; }
        }
      `}</style>
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 md:mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-3 md:gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Activity className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-3xl font-bold text-slate-900">Seizure Tracker</h1>
                <p className="text-sm md:text-base text-slate-500 hidden sm:block">Log and monitor seizures</p>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => setShowTypeGuide(!showTypeGuide)}
                className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 flex-1 sm:flex-none text-sm print:hidden"
              >
                <Info className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Guide</span>
              </Button>
              <Button 
                onClick={handlePrint}
                variant="outline"
                className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 flex-1 sm:flex-none text-sm print:hidden"
              >
                <Printer className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Print</span>
              </Button>
              <Button
                onClick={() => {
                  setEditingSeizure(null);
                  setShowForm(true);
                }}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white flex-1 sm:flex-none text-sm"
              >
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Log</span>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Seizure Types Guide */}
        <AnimatePresence>
          {showTypeGuide && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 md:mb-8 overflow-hidden"
            >
              <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6">
                <h2 className="text-base md:text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-indigo-600" />
                  Understanding Seizure Types
                </h2>
                <div className="grid gap-3 md:grid-cols-2 md:gap-4">
                  {Object.entries(seizureTypes).map(([key, info]) => (
                    <Collapsible key={key}>
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between p-3 rounded-lg md:rounded-xl bg-slate-50 hover:bg-indigo-50 transition-colors text-left">
                          <span className="font-medium text-sm md:text-base text-slate-900">{info.name}</span>
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="p-3 md:p-4 mt-2">
                          <SeizureTypeInfo type={key} showFull />
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Seizure List */}
        {isLoading ? (
          <div className="space-y-3 md:space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/4 mb-3"></div>
                <div className="h-6 bg-slate-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : seizures.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 md:py-16 bg-white rounded-xl md:rounded-2xl shadow-sm border border-slate-100"
          >
            <Activity className="w-12 h-12 md:w-16 md:h-16 text-indigo-200 mx-auto mb-4" />
            <h3 className="text-lg md:text-xl font-semibold text-slate-700 mb-2">No seizures logged yet</h3>
            <p className="text-sm md:text-base text-slate-500 mb-6">Start tracking by logging your first entry</p>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm md:text-base"
            >
              <Plus className="w-4 h-4 mr-2" /> Log Your First Seizure
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            <AnimatePresence>
              {seizures.map((seizure, index) => {
                const typeInfo = getSeizureTypeInfo(seizure.seizure_type);
                return (
                  <motion.div
                    key={seizure.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-slate-100 p-4 md:p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-3 md:gap-4">
                      <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                        <div className="text-center bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg md:rounded-xl p-2 md:p-3 border border-indigo-100 flex-shrink-0">
                          <p className="text-xl md:text-2xl font-bold text-indigo-600">
                            {format(parseISO(seizure.date_time), 'd')}
                          </p>
                          <p className="text-xs text-slate-500 uppercase">
                            {format(parseISO(seizure.date_time), 'MMM')}
                          </p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <h3 className="font-semibold text-slate-900">{typeInfo.name}</h3>
                            <SeizureTypeInfo type={seizure.seizure_type} />
                          </div>
                          <div className="flex flex-wrap gap-2 mb-2">
                            <span className="text-sm text-slate-500 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {format(parseISO(seizure.date_time), 'h:mm a')}
                            </span>
                            {seizure.duration_seconds && (
                              <span className="text-sm text-slate-500">
                                • {seizure.duration_seconds < 60 
                                    ? `${seizure.duration_seconds}s` 
                                    : `${Math.floor(seizure.duration_seconds / 60)}m ${seizure.duration_seconds % 60}s`}
                              </span>
                            )}
                            {seizure.severity && (
                              <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${severityColors[seizure.severity]}`}>
                                {seizure.severity}
                              </span>
                            )}
                          </div>
                          {seizure.triggers && (
                            <p className="text-sm text-slate-600 mb-1">
                              <span className="font-medium">Triggers:</span> {seizure.triggers}
                            </p>
                          )}
                          {seizure.post_ictal_symptoms && (
                            <p className="text-sm text-slate-600 mb-1">
                              <span className="font-medium">Post-seizure:</span> {seizure.post_ictal_symptoms}
                            </p>
                          )}
                          {seizure.notes && (
                            <p className="text-sm text-slate-500 mt-2 italic">"{seizure.notes}"</p>
                          )}
                          {seizure.nocturnal && (
                            <div className="flex items-center gap-2 px-3 py-2 mt-2 bg-indigo-50 rounded-lg border border-indigo-100">
                              <Moon className="w-4 h-4 text-indigo-600" />
                              <span className="text-sm text-indigo-900 font-medium">Nocturnal (during sleep)</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 print:hidden">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(seizure)}
                          className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(seizure.id)}
                          className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <SeizureForm
              seizure={editingSeizure}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingSeizure(null);
              }}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Delete Seizure Entry?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this seizure record.
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