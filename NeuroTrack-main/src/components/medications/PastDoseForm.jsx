/**
 * PastDoseForm — manually log a past dose for any active medication
 *
 * Date input accepts dd-MM-yyyy (user-friendly) and is converted to
 * yyyy-MM-dd (ISO/Supabase format) before submitting. Only active
 * medications appear in the dropdown.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { format } from 'date-fns';
import AppInput from '../ui/AppInput';
import AppButton from '../ui/AppButton';
import AppSelect from '../ui/AppSelect';
import { colors } from '../../theme/colors';

const statusOptions = [
  { value: 'taken',   label: 'Taken' },
  { value: 'missed',  label: 'Missed' },
  { value: 'skipped', label: 'Skipped' },
];

export default function PastDoseForm({ medications, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    medication_id:   '',
    medication_name: '',
    scheduled_date:  '',
    scheduled_time:  '',
    status:          'taken',
    notes:           '',
  });

  // Helper to update a single field without replacing the rest of formData
  const update = (key, val) => setFormData(p => ({ ...p, [key]: val }));

  // Build dropdown options as "Name — Dosage" labels
  const medOptions = medications.map(m => ({ value: m.id, label: `${m.name} — ${m.dosage}` }));

  // When the medication changes, store both the ID and display name
  const handleMedChange = (id) => {
    const med = medications.find(m => m.id === id);
    setFormData(p => ({ ...p, medication_id: id, medication_name: med?.name || '' }));
  };

  // Convert dd-MM-yyyy (user input) → yyyy-MM-dd (Supabase/ISO format)
  const toISODate = (ddMMYYYY) => {
    const parts = ddMMYYYY.split('-');
    if (parts.length !== 3) return ddMMYYYY;
    const [dd, MM, yyyy] = parts;
    return `${yyyy}-${MM}-${dd}`;
  };

  const handleSubmit = () => {
    if (!formData.medication_id || !formData.scheduled_date || !formData.scheduled_time) return;
    const isoDate = toISODate(formData.scheduled_date);
    const takenTimestamp = formData.status === 'taken'
      ? new Date(`${isoDate}T${formData.scheduled_time}`).toISOString()
      : null;
    onSubmit({
      medication_id:   formData.medication_id,
      medication_name: formData.medication_name,
      scheduled_date:  isoDate,
      scheduled_time:  formData.scheduled_time,
      status:          formData.status,
      taken_at:        takenTimestamp,
      notes:           formData.notes || '',
    });
  };

  return (
    <View>
      <Text style={styles.formTitle}>Log Past Dose</Text>

      <AppSelect
        label="Medication"
        required
        options={medOptions}
        value={formData.medication_id}
        onValueChange={handleMedChange}
        placeholder="Select medication..."
        accentColor={colors.teal500}
      />

      <View style={{ height: 14 }} />

      <AppInput
        label="Date"
        required
        value={formData.scheduled_date}
        onChangeText={v => update('scheduled_date', v)}
        placeholder="dd-MM-yyyy"
      />
      <Text style={styles.hint}>Format: 01-06-2025</Text>

      <View style={{ height: 14 }} />

      <AppInput
        label="Time"
        required
        value={formData.scheduled_time}
        onChangeText={v => update('scheduled_time', v)}
        placeholder="HH:MM (e.g. 08:00)"
      />

      <View style={{ height: 14 }} />

      <AppSelect
        label="Status"
        required
        options={statusOptions}
        value={formData.status}
        onValueChange={v => update('status', v)}
        accentColor={colors.teal500}
      />

      <View style={{ height: 14 }} />

      <AppInput
        label="Notes (optional)"
        value={formData.notes}
        onChangeText={v => update('notes', v)}
        placeholder="Any notes about this dose..."
        multiline
        numberOfLines={2}
      />

      <View style={{ height: 20 }} />

      <View style={styles.btnRow}>
        <AppButton variant="outline" onPress={onCancel} style={styles.btn}>Cancel</AppButton>
        <AppButton
          gradient={[colors.teal600, colors.emerald600]}
          onPress={handleSubmit}
          loading={isLoading}
          disabled={!formData.medication_id || !formData.scheduled_date || !formData.scheduled_time}
          style={styles.btn}
        >
          Log Dose
        </AppButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  formTitle: { fontSize: 20, fontWeight: '700', color: colors.slate900, marginBottom: 20 },
  hint: { fontSize: 11, color: colors.slate400, marginTop: 3, marginLeft: 2 },
  btnRow: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1 },
});
