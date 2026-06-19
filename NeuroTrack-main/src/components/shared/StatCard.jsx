/**
 * StatCard — compact stat tile used in the Dashboard grid
 *
 * Props:
 *   icon     — render-prop accepting { size, color } (e.g. Ionicons)
 *   label    — description text shown above the value
 *   value    — large numeric value to display
 *   gradient — two-color array for the icon badge background
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';

export default function StatCard({ icon: Icon, label, value, gradient }) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.textGroup}>
          <Text style={styles.label} numberOfLines={2}>{label}</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconBadge}
        >
          <Icon size={18} color={colors.white} />
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.slate100,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  textGroup: {
    flex: 1,
    marginRight: 8,
  },
  label: {
    fontSize: 11,
    color: colors.slate500,
    marginBottom: 4,
    lineHeight: 15,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.slate900,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
