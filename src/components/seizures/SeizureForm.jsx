import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Moon } from 'lucide-react';
import SeizureTypeInfo, { seizureTypes } from './SeizureTypeInfo';
import { Checkbox } from "@/components/ui/checkbox";

export default function SeizureForm({ seizure, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    seizure_type: seizure?.seizure_type || '',
    date_time: seizure?.date_time || new Date().toISOString().slice(0, 16),
    duration_seconds: seizure?.duration_seconds || '',
    severity: seizure?.severity || '',
    nocturnal: seizure?.nocturnal || false,
    triggers: seizure?.triggers || '',
    notes: seizure?.notes || '',
    post_ictal_symptoms: seizure?.post_ictal_symptoms || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      duration_seconds: formData.duration_seconds ? Number(formData.duration_seconds) : null
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-900">
          {seizure ? 'Edit Seizure Entry' : 'Log New Seizure'}
        </h2>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-slate-700">Seizure Type *</Label>
          <Select
            value={formData.seizure_type}
            onValueChange={(value) => setFormData({ ...formData, seizure_type: value })}
          >
            <SelectTrigger className="h-12 bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500">
              <SelectValue placeholder="Select type..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(seizureTypes).map(([key, value]) => (
                <SelectItem key={key} value={key} className="py-3">
                  <span className="font-medium">{value.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formData.seizure_type && (
            <SeizureTypeInfo type={formData.seizure_type} showFull />
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-slate-700">Date & Time *</Label>
            <Input
              type="datetime-local"
              value={formData.date_time}
              onChange={(e) => setFormData({ ...formData, date_time: e.target.value })}
              className="h-12 bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700">Duration (seconds)</Label>
            <Input
              type="number"
              placeholder="e.g., 60"
              value={formData.duration_seconds}
              onChange={(e) => setFormData({ ...formData, duration_seconds: e.target.value })}
              className="h-12 bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700">Severity</Label>
            <Select
              value={formData.severity}
              onValueChange={(value) => setFormData({ ...formData, severity: value })}
            >
              <SelectTrigger className="h-12 bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500">
                <SelectValue placeholder="Select severity..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mild">Mild</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="severe">Severe</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Nocturnal Checkbox */}
          <div className="flex items-center space-x-3 p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
            <Checkbox 
              id="nocturnal"
              checked={formData.nocturnal}
              onCheckedChange={(checked) => setFormData({...formData, nocturnal: checked})}
            />
            <label htmlFor="nocturnal" className="flex items-center gap-2 text-sm font-medium text-slate-900 cursor-pointer">
              <Moon className="w-4 h-4 text-indigo-600" />
              Nocturnal (occurred during sleep)
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-700">Possible Triggers</Label>
        <Input
          placeholder="e.g., lack of sleep, stress, missed medication..."
          value={formData.triggers}
          onChange={(e) => setFormData({ ...formData, triggers: e.target.value })}
          className="h-12 bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-slate-700">Post-Seizure Symptoms</Label>
        <Input
          placeholder="e.g., confusion, fatigue, headache..."
          value={formData.post_ictal_symptoms}
          onChange={(e) => setFormData({ ...formData, post_ictal_symptoms: e.target.value })}
          className="h-12 bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-slate-700">Additional Notes</Label>
        <Textarea
          placeholder="Any other details you want to remember..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="min-h-24 bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
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
          disabled={isLoading || !formData.seizure_type}
          className="flex-1 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
        >
          {isLoading ? 'Saving...' : (seizure ? 'Update Entry' : 'Log Seizure')}
        </Button>
      </div>
    </form>
  );
}