import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { X, Pill } from 'lucide-react';

export default function MedicationForm({ medication, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState(medication || {
    name: '',
    dosage: '',
    frequency: '',
    purpose: '',
    prescribing_doctor: '',
    start_date: new Date().toISOString().split('T')[0],
    notes: '',
    is_active: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <Pill className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">
            {medication ? 'Edit Medication' : 'Add Medication'}
          </h2>
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-slate-700">Medication Name *</Label>
          <Input
            placeholder="e.g., Levetiracetam"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="h-12 bg-white border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
            required
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-700">Dosage *</Label>
          <Input
            placeholder="e.g., 500mg"
            value={formData.dosage}
            onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
            className="h-12 bg-white border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
            required
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-700">Frequency</Label>
          <Input
            placeholder="e.g., Twice daily, morning and evening"
            value={formData.frequency}
            onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
            className="h-12 bg-white border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-700">Purpose</Label>
          <Input
            placeholder="e.g., Seizure prevention"
            value={formData.purpose}
            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            className="h-12 bg-white border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-700">Prescribing Doctor</Label>
          <Input
            placeholder="e.g., Dr. Smith"
            value={formData.prescribing_doctor}
            onChange={(e) => setFormData({ ...formData, prescribing_doctor: e.target.value })}
            className="h-12 bg-white border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-700">Start Date</Label>
          <Input
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            className="h-12 bg-white border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-700">Notes</Label>
        <Textarea
          placeholder="Any additional information about this medication..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="min-h-24 bg-white border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
        />
      </div>

      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
        <div>
          <Label className="text-slate-700 font-medium">Currently Taking</Label>
          <p className="text-sm text-slate-500">Mark if you're currently on this medication</p>
        </div>
        <Switch
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 h-12 border-slate-200"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !formData.name || !formData.dosage}
          className="flex-1 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
        >
          {isLoading ? 'Saving...' : (medication ? 'Update Medication' : 'Add Medication')}
        </Button>
      </div>
    </form>
  );
}