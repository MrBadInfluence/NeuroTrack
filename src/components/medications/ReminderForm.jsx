import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Bell } from 'lucide-react';

const DAYS = [
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
  { value: 'saturday', label: 'Sat' },
  { value: 'sunday', label: 'Sun' },
];

export default function ReminderForm({ reminder, medications, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState(reminder || {
    medication_id: '',
    medication_name: '',
    time: '08:00',
    days_of_week: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    is_active: true,
    notes: ''
  });

  const handleMedicationChange = (medId) => {
    const med = medications.find(m => m.id === medId);
    setFormData({
      ...formData,
      medication_id: medId,
      medication_name: med?.name || ''
    });
  };

  const toggleDay = (day) => {
    const days = formData.days_of_week || [];
    if (days.includes(day)) {
      setFormData({ ...formData, days_of_week: days.filter(d => d !== day) });
    } else {
      setFormData({ ...formData, days_of_week: [...days, day] });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const activeMedications = medications.filter(m => m.is_active);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">
            {reminder ? 'Edit Reminder' : 'Add Reminder'}
          </h2>
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-700">Medication *</Label>
        <Select
          value={formData.medication_id}
          onValueChange={handleMedicationChange}
        >
          <SelectTrigger className="h-12 bg-white border-slate-200 focus:border-amber-500 focus:ring-amber-500">
            <SelectValue placeholder="Select medication..." />
          </SelectTrigger>
          <SelectContent>
            {activeMedications.length === 0 ? (
              <SelectItem value={null} disabled>No active medications</SelectItem>
            ) : (
              activeMedications.map((med) => (
                <SelectItem key={med.id} value={med.id}>
                  {med.name} - {med.dosage}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-700">Time *</Label>
        <Input
          type="time"
          value={formData.time}
          onChange={(e) => setFormData({ ...formData, time: e.target.value })}
          className="h-12 bg-white border-slate-200 focus:border-amber-500 focus:ring-amber-500"
          required
        />
      </div>

      <div className="space-y-3">
        <Label className="text-slate-700">Days *</Label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((day) => (
            <button
              key={day.value}
              type="button"
              onClick={() => toggleDay(day.value)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                formData.days_of_week?.includes(day.value)
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-700">Notes</Label>
        <Textarea
          placeholder="e.g., Take with food..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="min-h-20 bg-white border-slate-200 focus:border-amber-500 focus:ring-amber-500"
        />
      </div>

      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
        <div>
          <Label className="text-slate-700 font-medium">Active Reminder</Label>
          <p className="text-sm text-slate-500">Enable or disable this reminder</p>
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
          disabled={isLoading || !formData.medication_id || formData.days_of_week?.length === 0}
          className="flex-1 h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
        >
          {isLoading ? 'Saving...' : (reminder ? 'Update Reminder' : 'Add Reminder')}
        </Button>
      </div>
    </form>
  );
}