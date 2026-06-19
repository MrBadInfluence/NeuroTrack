import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

/**
 * AppSelect — dropdown select matching Radix Select behaviour
 *
 * options: [{ value: string, label: string, subtitle?: string }]
 */
export default function AppSelect({
  options = [],
  value,
  onValueChange,
  placeholder = 'Select...',
  label,
  required,
  disabled = false,
  accentColor = colors.indigo500,
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <View>
      {label && (
        <Text style={styles.label}>
          {label}{required && <Text style={{ color: colors.red600 }}> *</Text>}
        </Text>
      )}

      <TouchableOpacity
        onPress={() => !disabled && setOpen(true)}
        activeOpacity={0.7}
        style={[styles.trigger, disabled && styles.disabled]}
      >
        <Text style={[styles.triggerText, !selected && styles.placeholder]}>
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.slate400} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setOpen(false)} />
        <View style={styles.center}>
          <View style={styles.sheet}>
            <FlatList
              data={options}
              keyExtractor={item => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  // '18' appended to the hex color adds ~10% opacity for the highlight tint
                  style={[styles.option, item.value === value && { backgroundColor: accentColor + '18' }]}
                  onPress={() => { onValueChange(item.value); setOpen(false); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.optionLabel, item.value === value && { color: accentColor, fontWeight: '600' }]}>
                    {item.label}
                  </Text>
                  {item.subtitle && <Text style={styles.optionSub}>{item.subtitle}</Text>}
                  {item.value === value && (
                    <Ionicons name="checkmark" size={16} color={accentColor} style={styles.check} />
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.sep} />}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.slate700,
    marginBottom: 6,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.slate200,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 48,
  },
  disabled: {
    opacity: 0.5,
  },
  triggerText: {
    fontSize: 15,
    color: colors.slate900,
    flex: 1,
  },
  placeholder: {
    color: colors.slate400,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: colors.white,
    borderRadius: 16,
    width: '100%',
    maxWidth: 360,
    maxHeight: 340,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionLabel: {
    fontSize: 15,
    color: colors.slate800,
    flex: 1,
  },
  optionSub: {
    fontSize: 12,
    color: colors.slate400,
    marginRight: 4,
  },
  check: {
    marginLeft: 8,
  },
  sep: {
    height: 1,
    backgroundColor: colors.slate100,
    marginHorizontal: 16,
  },
});
