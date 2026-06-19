/**
 * ReminderForm — create or edit a medication reminder
 *
 * The user selects an active medication, a 24-hour time, and one or more
 * days of the week. Days can be toggled on/off individually.
 * The submit button is disabled until medication, time, and at least one
 * day are all provided.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import AppInput from '../ui/AppInput';
import AppButton from '../ui/AppButton';
import AppSelect from '../ui/AppSelect';
import { colors } from '../../theme/colors';

const DAYS = [
  { value: 'monday',    label: 'Mon' },
  { value: 'tuesday',   label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday',  label: 'Thu' },
  { value: 'friday',    label: 'Fri' },
  { value: 'saturday',  label: 'Sat' },
  { value: 'sunday',    label: 'Sun' },
];

export default function ReminderForm({ reminder, medications, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState(reminder || {
    medication_id:   '',
    medication_name: '',
    time:            '08:00',
    days_of_week:    ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'],
    is_active:       true,
    notes:           '',
  });

  // Helper to update a single field without replacing the rest of formData
  const update = (key, val) => setFormData(p => ({ ...p, [key]: val }));

  // Only active medications can have reminders
  const activeMeds = medications.filter(m => m.is_active);

  // Build dropdown options as "Name — Dosage" labels
  const medOptions = activeMeds.map(m => ({
    value: m.id,
    label: `${m.name} — ${m.dosage}`,
  }));

  // When the medication changes, store both the ID and display name
  const handleMedChange = (medId) => {
    const med = medications.find(m => m.id === medId);
    setFormData(p => ({ ...p, medication_id: medId, medication_name: med?.name || '' }));
  };

  // Toggle a day on or off in the days_of_week array
  const toggleDay = (day) => {
    const days = formData.days_of_week || [];
    update('days_of_week', days.includes(day) ? days.filter(d => d !== day) : [...days, day]);
  };

  // All three required fields must be present before submitting
  const canSubmit = formData.medication_id && (formData.days_of_week?.length > 0) && formData.time;

  return (
    <View>
      <Text style={styles.formTitle}>
        {reminder ? 'Edit Reminder' : 'Add Reminder'}
      </Text>

      <AppSelect
        label="Medication"
        required
        options={medOptions}
        value={formData.medication_id}
        onValueChange={handleMedChange}
        placeholder="Select medication..."
        accentColor={colors.amber500}
      />

      <View style={{ height: 14 }} />

      <AppInput
        label="Time"
        required
        value={formData.time}
        onChangeText={v => update('time', v)}
        placeholder="HH:MM (24h, e.g. 08:00)"
      />
      <Text style={styles.hint}>24-hour format, e.g. 08:00 or 20:30</Text>

      <View style={{ height: 14 }} />

      {/* Days of week */}
      <Text style={styles.label}>Days <Text style={{ color: colors.red600 }}>*</Text></Text>
      <View style={styles.daysRow}>
        {DAYS.map(day => {
          const selected = formData.days_of_week?.includes(day.value);
          return (
            <TouchableOpacity
              key={day.value}
              style={[styles.dayBtn, selected && styles.dayBtnActive]}
              onPress={() => toggleDay(day.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.dayText, selected && styles.dayTextActive]}>
                {day.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ height: 14 }} />

      <AppInput
        label="Notes"
        value={formData.notes}
        onChangeText={v => update('notes', v)}
        placeholder="e.g. Take with food..."
        multiline
        numberOfLines={2}
      />

      <View style={{ height: 14 }} />

      <View style={styles.toggleRow}>
        <View>
          <Text style={styles.toggleLabel}>Active Reminder</Text>
          <Text style={styles.toggleSub}>Enable or disable this reminder</Text>
        </View>
        <Switch
          value={formData.is_active}
          onValueChange={v => update('is_active', v)}
          trackColor={{ false: colors.slate200, true: colors.amber500 }}
          thumbColor={colors.white}
        />
      </View>

      <View style={{ height: 20 }} />

      <View style={styles.btnRow}>
        <AppButton variant="outline" onPress={onCancel} style={styles.btn}>Cancel</AppButton>
        <AppButton
          gradient={[colors.amber500, colors.orange500]}
          onPress={() => onSubmit(formData)}
          loading={isLoading}
          disabled={!canSubmit}
          style={styles.btn}
        >
          {reminder ? 'Update Reminder' : 'Add Reminder'}
        </AppButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  formTitle: { fontSize: 20, fontWeight: '700', color: colors.slate900, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '500', color: colors.slate700, marginBottom: 6 },
  hint: { fontSize: 11, color: colors.slate400, marginTop: 3, marginLeft: 2 },
  daysRow: { flexDirection: 'row', gap: 4 },
  dayBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
    backgroundColor: colors.slate100,
  },
  dayBtnActive: {
    backgroundColor: colors.amber500,
    shadowColor: colors.amber500,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  dayText: { fontSize: 11, fontWeight: '600', color: colors.slate600 },
  dayTextActive: { color: colors.white },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.slate50, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.slate200 },
  toggleLabel: { fontSize: 14, fontWeight: '500', color: colors.slate700 },
  toggleSub: { fontSize: 12, color: colors.slate400, marginTop: 2 },
  btnRow: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1 },
});
