import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { localClient } from '@/api/localClient';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Pill, 
  Plus, 
  Pencil, 
  Trash2,
  AlertCircle,
  Calendar,
  User,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import MedicationForm from '@/components/medications/MedicationForm';

export default function Medications() {
  const [showForm, setShowForm] = useState(false);
  const [editingMedication, setEditingMedication] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  const queryClient = useQueryClient();

  const { data: medications = [], isLoading } = useQuery({
    queryKey: ['medications'],
    queryFn: () => localClient.entities.Medication.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => localClient.entities.Medication.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => localClient.entities.Medication.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      setShowForm(false);
      setEditingMedication(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => localClient.entities.Medication.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      setDeleteId(null);
    },
  });

  const handleSubmit = (data) => {
    if (editingMedication) {
      updateMutation.mutate({ id: editingMedication.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (medication) => {
    setEditingMedication(medication);
    setShowForm(true);
  };

  const activeMedications = medications.filter(m => m.is_active);
  const inactiveMedications = medications.filter(m => !m.is_active);

  const MedicationCard = ({ medication, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-slate-100 p-4 md:p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-3 md:gap-4">
        <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 ${
            medication.is_active 
              ? 'bg-gradient-to-br from-emerald-100 to-teal-100 border border-emerald-200'
              : 'bg-slate-100 border border-slate-200'
          }`}>
            <Pill className={`w-5 h-5 md:w-6 md:h-6 ${medication.is_active ? 'text-emerald-600' : 'text-slate-400'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-slate-900 text-lg">{medication.name}</h3>
              <Badge variant="outline" className="font-medium">
                {medication.dosage}
              </Badge>
              {medication.is_active ? (
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                  <CheckCircle className="w-3 h-3 mr-1" /> Active
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-slate-100 text-slate-500">
                  <XCircle className="w-3 h-3 mr-1" /> Inactive
                </Badge>
              )}
            </div>
            {medication.frequency && (
              <p className="text-sm text-slate-600 mb-1">{medication.frequency}</p>
            )}
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-500">
              {medication.purpose && (
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  {medication.purpose}
                </span>
              )}
              {medication.prescribing_doctor && (
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  {medication.prescribing_doctor}
                </span>
              )}
              {medication.start_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Since {format(parseISO(medication.start_date), 'MMM d, yyyy')}
                </span>
              )}
            </div>
            {medication.notes && (
              <p className="text-sm text-slate-500 mt-2 italic">"{medication.notes}"</p>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(medication)}
            className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteId(medication.id)}
            className="text-slate-400 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/30">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 md:mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-3 md:gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Pill className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-3xl font-bold text-slate-900">Medications</h1>
                <p className="text-sm md:text-base text-slate-500 hidden sm:block">Manage your meds</p>
              </div>
            </div>
            <Button
              onClick={() => {
                setEditingMedication(null);
                setShowForm(true);
              }}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm md:text-base"
            >
              <Plus className="w-4 h-4 mr-2" /> Add
            </Button>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="bg-white border border-slate-200">
            <TabsTrigger value="active" className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700">
              Active ({activeMedications.length})
            </TabsTrigger>
            <TabsTrigger value="inactive" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-700">
              Inactive ({inactiveMedications.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Medication List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-slate-200 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {activeTab === 'active' && (
              activeMedications.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16 bg-white rounded-2xl shadow-sm border border-slate-100"
                >
                  <Pill className="w-16 h-16 text-emerald-200 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">No active medications</h3>
                  <p className="text-slate-500 mb-6">Add your medications to keep track of them</p>
                  <Button
                    onClick={() => setShowForm(true)}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Your First Medication
                  </Button>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {activeMedications.map((medication, index) => (
                      <MedicationCard key={medication.id} medication={medication} index={index} />
                    ))}
                  </AnimatePresence>
                </div>
              )
            )}

            {activeTab === 'inactive' && (
              inactiveMedications.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16 bg-white rounded-2xl shadow-sm border border-slate-100"
                >
                  <Pill className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">No inactive medications</h3>
                  <p className="text-slate-500">Medications you stop taking will appear here</p>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {inactiveMedications.map((medication, index) => (
                      <MedicationCard key={medication.id} medication={medication} index={index} />
                    ))}
                  </AnimatePresence>
                </div>
              )
            )}
          </>
        )}

        {/* Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <MedicationForm
              medication={editingMedication}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingMedication(null);
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
                Delete Medication?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this medication and any associated reminders.
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