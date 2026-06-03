/**
 * SeizureForm — create or edit a seizure log entry
 *
 * Seizure type and severity are required; all other fields are optional.
 * When a type is selected, a SeizureTypeInfo card appears below the picker
 * to help users identify the correct type.
 * Duration is entered in seconds and converted to a number on submit.
 */

import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView } from 'react-native';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import AppInput from '../ui/AppInput';
import AppButton from '../ui/AppButton';
import AppSelect from '../ui/AppSelect';
import SeizureTypeInfo, { seizureTypes } from './SeizureTypeInfo';
import { colors } from '../../theme/colors';

const seizureTypeOptions = Object.entries(seizureTypes).map(([value, info]) => ({
  value,
  label: info.name,
}));

const severityOptions = [
  { value: 'mild',     label: 'Mild' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'severe',   label: 'Severe' },
];

export default function SeizureForm({ seizure, onSubmit, onCancel, isLoading }) {
  const defaultDateTime = seizure?.date_time
    ? seizure.date_time.slice(0, 16)
    : format(new Date(), "yyyy-MM-dd'T'HH:mm");

  const [formData, setFormData] = useState({
    seizure_type:        seizure?.seizure_type || '',
    date_time:           defaultDateTime,
    duration_seconds:    seizure?.duration_seconds?.toString() || '',
    severity:            seizure?.severity || '',
    nocturnal:           seizure?.nocturnal || false,
    triggers:            seizure?.triggers || '',
    notes:               seizure?.notes || '',
    post_ictal_symptoms: seizure?.post_ictal_symptoms || '',
  });

  // Helper to update a single field without replacing the rest of formData
  const update = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    // Guard: both required fields must be filled before submitting
    if (!formData.seizure_type || !formData.severity) return;
    onSubmit({
      ...formData,
      // Convert the string input to a number (or null if left blank)
      duration_seconds: formData.duration_seconds ? Number(formData.duration_seconds) : null,
    });
  };

  return (
    <View>
      <Text style={styles.formTitle}>
        {seizure ? 'Edit Seizure Entry' : 'Log New Seizure'}
      </Text>

      <AppSelect
        label="Seizure Type"
        required
        options={seizureTypeOptions}
        value={formData.seizure_type}
        onValueChange={v => update('seizure_type', v)}
        placeholder="Select type..."
        accentColor={colors.indigo500}
      />

      {formData.seizure_type && (
        <SeizureTypeInfo type={formData.seizure_type} />
      )}

      <View style={styles.spacer} />

      {/* Date & Time — displayed as text input for cross-platform simplicity */}
      <AppInput
        label="Date & Time"
        required
        value={formData.date_time}
        onChangeText={v => update('date_time', v)}
        placeholder="yyyy-MM-ddTHH:mm"
      />
      <Text style={styles.hint}>Format: 2025-06-01T08:30</Text>

      <View style={styles.spacer} />

      <AppInput
        label="Duration (seconds)"
        value={formData.duration_seconds}
        onChangeText={v => update('duration_seconds', v)}
        placeholder="e.g. 60"
        keyboardType="numeric"
      />

      <View style={styles.spacer} />

      <AppSelect
        label="Severity"
        required
        options={severityOptions}
        value={formData.severity}
        onValueChange={v => update('severity', v)}
        placeholder="Select severity..."
        accentColor={colors.indigo500}
      />

      <View style={styles.spacer} />

      {/* Nocturnal toggle */}
      <View style={styles.toggleRow}>
        <View style={styles.toggleLeft}>
          <Ionicons name="moon-outline" size={18} color={colors.indigo600} />
          <Text style={styles.toggleLabel}>Nocturnal (during sleep)</Text>
        </View>
        <Switch
          value={formData.nocturnal}
          onValueChange={v => update('nocturnal', v)}
          trackColor={{ false: colors.slate200, true: colors.indigo400 }}
          thumbColor={formData.nocturnal ? colors.indigo600 : colors.white}
        />
      </View>

      <View style={styles.spacer} />

      <AppInput
        label="Possible Triggers"
        value={formData.triggers}
        onChangeText={v => update('triggers', v)}
        placeholder="e.g. lack of sleep, stress..."
      />

      <View style={styles.spacer} />

      <AppInput
        label="Post-Seizure Symptoms"
        value={formData.post_ictal_symptoms}
        onChangeText={v => update('post_ictal_symptoms', v)}
        placeholder="e.g. confusion, fatigue..."
      />

      <View style={styles.spacer} />

      <AppInput
        label="Additional Notes"
        value={formData.notes}
        onChangeText={v => update('notes', v)}
        placeholder="Any other details..."
        multiline
        numberOfLines={3}
      />

      <View style={[styles.spacer, { height: 20 }]} />

      <View style={styles.btnRow}>
        <AppButton variant="outline" onPress={onCancel} style={styles.btn}>
          Cancel
        </AppButton>
        <AppButton
          gradient={[colors.indigo600, colors.purple600]}
          onPress={handleSubmit}
          loading={isLoading}
          disabled={!formData.seizure_type || !formData.severity}
          style={styles.btn}
        >
          {seizure ? 'Update Entry' : 'Log Seizure'}
        </AppButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.slate900,
    marginBottom: 20,
  },
  spacer: {
    height: 14,
  },
  hint: {
    fontSize: 11,
    color: colors.slate400,
    marginTop: 3,
    marginLeft: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.indigo50,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.indigo100,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.slate900,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
  },
});
