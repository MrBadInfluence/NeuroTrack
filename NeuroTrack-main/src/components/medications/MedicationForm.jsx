/**
 * MedicationForm — create or edit a medication entry
 *
 * Features a combobox that filters the built-in COMMON_MEDICATIONS list
 * as the user types. If the typed name doesn't match any known medication,
 * a "Use as custom" option appears in the dropdown.
 * Name and dosage are required; all other fields are optional.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppInput from '../ui/AppInput';
import AppButton from '../ui/AppButton';
import { colors } from '../../theme/colors';

const COMMON_MEDICATIONS = [
  { name: 'Levetiracetam',   brand: 'Keppra' },
  { name: 'Lamotrigine',     brand: 'Lamictal' },
  { name: 'Valproic Acid',   brand: 'Epilim / Depakote' },
  { name: 'Carbamazepine',   brand: 'Tegretol' },
  { name: 'Oxcarbazepine',   brand: 'Trileptal' },
  { name: 'Topiramate',      brand: 'Topamax' },
  { name: 'Zonisamide',      brand: 'Zonegran' },
  { name: 'Lacosamide',      brand: 'Vimpat' },
  { name: 'Phenytoin',       brand: 'Dilantin' },
  { name: 'Phenobarbital',   brand: 'Luminal' },
  { name: 'Clobazam',        brand: 'Onfi / Frisium' },
  { name: 'Clonazepam',      brand: 'Klonopin' },
  { name: 'Brivaracetam',    brand: 'Briviact' },
  { name: 'Perampanel',      brand: 'Fycompa' },
  { name: 'Eslicarbazepine', brand: 'Aptiom' },
  { name: 'Gabapentin',      brand: 'Neurontin' },
  { name: 'Pregabalin',      brand: 'Lyrica' },
  { name: 'Ethosuximide',    brand: 'Zarontin' },
  { name: 'Cannabidiol',     brand: 'Epidiolex' },
  { name: 'Diazepam',        brand: 'Valium' },
];

export default function MedicationForm({ medication, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState(medication || {
    name: '',
    dosage: '',
    frequency: '',
    purpose: '',
    prescribing_doctor: '',
    start_date: new Date().toISOString().split('T')[0],
    notes: '',
    is_active: true,
  });

  const [query,        setQuery]        = useState(medication?.name || '');
  const [showDropdown, setShowDropdown] = useState(false);

  // Show all medications when the field is empty; filter by name or brand otherwise
  const filtered = query.trim().length === 0
    ? COMMON_MEDICATIONS
    : COMMON_MEDICATIONS.filter(m =>
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        m.brand.toLowerCase().includes(query.toLowerCase()),
      );

  // True when the user has typed something that doesn't match any known medication —
  // triggers the "Use as custom medication" option at the bottom of the dropdown
  const isCustomEntry = query.trim().length > 0 &&
    !COMMON_MEDICATIONS.some(m =>
      m.name.toLowerCase() === query.trim().toLowerCase() ||
      m.brand.toLowerCase().includes(query.trim().toLowerCase()),
    );

  // Select a medication from the list: update both the visible input and formData
  const selectMed = (med) => {
    setQuery(med.name);
    setFormData(p => ({ ...p, name: med.name }));
    setShowDropdown(false);
  };

  // Accept the free-typed query as a custom medication name
  const useCustom = () => {
    setFormData(p => ({ ...p, name: query.trim() }));
    setShowDropdown(false);
  };

  // Helper to update a single field without replacing the rest of formData
  const update = (key, val) => setFormData(p => ({ ...p, [key]: val }));

  // Combine filtered known medications with the optional custom entry at the end
  const dropdownItems = [
    ...filtered.map(m => ({ type: 'med', ...m })),
    ...(isCustomEntry ? [{ type: 'custom', name: query.trim() }] : []),
  ];

  return (
    <View>
      <Text style={styles.formTitle}>
        {medication ? 'Edit Medication' : 'Add Medication'}
      </Text>

      {/* Medication name combobox */}
      <Text style={styles.label}>Medication Name <Text style={{ color: colors.red600 }}>*</Text></Text>
      <View>
        <View style={styles.comboRow}>
          <AppInput
            value={query}
            onChangeText={v => { setQuery(v); update('name', v); setShowDropdown(true); }}
            placeholder="Select or type a medication..."
            style={{ flex: 1, marginBottom: 0 }}
            inputStyle={{ borderTopRightRadius: 0, borderBottomRightRadius: query ? 0 : 10 }}
          />
          {query.length > 0 && (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => { setQuery(''); update('name', ''); setShowDropdown(true); }}
            >
              <Ionicons name="close" size={16} color={colors.slate400} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.chevronBtn}
            onPress={() => setShowDropdown(v => !v)}
          >
            <Ionicons name={showDropdown ? 'chevron-up' : 'chevron-down'} size={16} color={colors.slate400} />
          </TouchableOpacity>
        </View>

        {showDropdown && dropdownItems.length > 0 && (
          <View style={styles.dropdown}>
            {dropdownItems.slice(0, 8).map((item, i) =>
              item.type === 'custom' ? (
                <TouchableOpacity key="custom" style={styles.dropItem} onPress={useCustom}>
                  <Text style={styles.dropCustom}>Use "{item.name}"</Text>
                  <Text style={styles.dropSub}>Add as custom medication</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity key={i} style={styles.dropItem} onPress={() => selectMed(item)}>
                  <Text style={styles.dropName}>{item.name}</Text>
                  <Text style={styles.dropSub}>{item.brand}</Text>
                </TouchableOpacity>
              ),
            )}
          </View>
        )}
      </View>

      <View style={{ height: 14 }} />

      <AppInput label="Dosage" required value={formData.dosage} onChangeText={v => update('dosage', v)} placeholder="e.g. 500mg" />
      <View style={{ height: 14 }} />
      <AppInput label="Frequency" value={formData.frequency} onChangeText={v => update('frequency', v)} placeholder="e.g. Twice daily" />
      <View style={{ height: 14 }} />
      <AppInput label="Purpose" value={formData.purpose} onChangeText={v => update('purpose', v)} placeholder="e.g. Seizure prevention" />
      <View style={{ height: 14 }} />
      <AppInput label="Prescribing Doctor" value={formData.prescribing_doctor} onChangeText={v => update('prescribing_doctor', v)} placeholder="e.g. Dr. Smith" />
      <View style={{ height: 14 }} />
      <AppInput label="Start Date" value={formData.start_date} onChangeText={v => update('start_date', v)} placeholder="yyyy-MM-dd" />
      <Text style={styles.hint}>Format: 2025-01-15</Text>
      <View style={{ height: 14 }} />
      <AppInput label="Notes" value={formData.notes} onChangeText={v => update('notes', v)} placeholder="Any additional info..." multiline numberOfLines={3} />

      <View style={{ height: 14 }} />

      {/* Currently Taking toggle */}
      <View style={styles.toggleRow}>
        <View>
          <Text style={styles.toggleLabel}>Currently Taking</Text>
          <Text style={styles.toggleSub}>Mark if you're currently on this medication</Text>
        </View>
        <Switch
          value={formData.is_active}
          onValueChange={v => update('is_active', v)}
          trackColor={{ false: colors.slate200, true: colors.emerald500 }}
          thumbColor={formData.is_active ? colors.white : colors.white}
        />
      </View>

      <View style={{ height: 20 }} />

      <View style={styles.btnRow}>
        <AppButton variant="outline" onPress={onCancel} style={styles.btn}>Cancel</AppButton>
        <AppButton
          gradient={[colors.emerald600, colors.teal600]}
          onPress={() => onSubmit(formData)}
          loading={isLoading}
          disabled={!formData.name || !formData.dosage}
          style={styles.btn}
        >
          {medication ? 'Update Medication' : 'Add Medication'}
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
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.slate700,
    marginBottom: 6,
  },
  hint: {
    fontSize: 11,
    color: colors.slate400,
    marginTop: 3,
    marginLeft: 2,
  },
  comboRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearBtn: {
    backgroundColor: colors.white,
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: colors.slate200,
    paddingHorizontal: 8,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronBtn: {
    backgroundColor: colors.white,
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: colors.slate200,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    paddingHorizontal: 10,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdown: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.slate200,
    borderTopWidth: 0,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    overflow: 'hidden',
  },
  dropItem: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
  },
  dropName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.slate900,
  },
  dropCustom: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.indigo700,
  },
  dropSub: {
    fontSize: 12,
    color: colors.slate400,
    marginTop: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.slate50,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.slate200,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.slate700,
  },
  toggleSub: {
    fontSize: 12,
    color: colors.slate400,
    marginTop: 2,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
  },
});
