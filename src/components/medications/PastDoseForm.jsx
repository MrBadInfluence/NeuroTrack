import React, { useState } from 'react';
import { format } from 'date-fns';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Clock } from 'lucide-react';

export default function PastDoseForm({ medications, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    medication_id: '',
    medication_name: '',
    scheduled_date: '',
    scheduled_time: '',
    status: 'taken',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.medication_id || !formData.scheduled_date || !formData.scheduled_time) return;
    
    const selectedMed = medications.find(m => m.id === formData.medication_id);
    const takenTimestamp = formData.status === 'taken' 
      ? new Date(`${formData.scheduled_date}T${formData.scheduled_time}`).toISOString() 
      : null;
    
    onSubmit({
      medication_id: formData.medication_id,
      medication_name: selectedMed?.name || '',
      scheduled_date: formData.scheduled_date,
      scheduled_time: formData.scheduled_time,
      status: formData.status,
      taken_at: takenTimestamp,
      notes: formData.notes || ''
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 text-teal-700 mb-2">
        <Clock className="w-5 h-5" />
        <h3 className="font-semibold">Log Past Dose</h3>
      </div>
      <div className="space-y-2">
        <Label htmlFor="medication">Medication</Label>
        <Select 
          value={formData.medication_id} 
          onValueChange={(value) => {
            const med = medications.find(m => m.id === value);
            setFormData({...formData, medication_id: value, medication_name: med?.name || ''});
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select medication" />
          </SelectTrigger>
          <SelectContent>
            {medications.map(med => (
              <SelectItem key={med.id} value={med.id}>
                {med.name} - {med.dosage}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.scheduled_date}
            onChange={(e) => setFormData({...formData, scheduled_date: e.target.value})}
            max={format(new Date(), 'yyyy-MM-dd')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="time">Time</Label>
          <Input
            id="time"
            type="time"
            value={formData.scheduled_time}
            onChange={(e) => setFormData({...formData, scheduled_time: e.target.value})}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select 
          value={formData.status} 
          onValueChange={(value) => setFormData({...formData, status: value})}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="taken">Taken</SelectItem>
            <SelectItem value="missed">Missed</SelectItem>
            <SelectItem value="skipped">Skipped</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          placeholder="Any notes about this dose..."
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading || !formData.medication_id || !formData.scheduled_date || !formData.scheduled_time}
          className="flex-1 bg-teal-600 hover:bg-teal-700"
        >
          {isLoading ? 'Saving...' : 'Log Dose'}
        </Button>
      </div>
    </form>
  );
}