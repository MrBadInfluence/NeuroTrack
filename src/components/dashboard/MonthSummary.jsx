/**
 * MonthSummary — seizure summary card for the current calendar month
 *
 * Shows a green "no seizures" success state when count is 0, otherwise
 * displays total count, a per-type breakdown, and a per-severity breakdown
 * (severity section only renders if any entries have severity data).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { getSeizureTypeInfo } from '../seizures/SeizureTypeInfo';

export default function MonthSummary({ seizures }) {
  const monthStart = startOfMonth(new Date());
  const monthEnd   = endOfMonth(new Date());

  // Only include seizures whose date_time falls within this calendar month
  const seizuresThisMonth = seizures.filter(s => {
    if (!s.date_time) return false;
    return isWithinInterval(parseISO(s.date_time), { start: monthStart, end: monthEnd });
  });

  if (seizuresThisMonth.length === 0) {
    return (
      <LinearGradient colors={[colors.green50, colors.emerald50]} style={styles.card}>
        <View style={styles.header}>
          <Ionicons name="trending-down" size={18} color={colors.green700} />
          <Text style={[styles.headerText, { color: colors.green900 }]}>
            {format(new Date(), 'MMMM yyyy')} Summary
          </Text>
        </View>
        <View style={styles.emptyCenter}>
          <View style={[styles.iconCircle, { backgroundColor: colors.green100 }]}>
            <Ionicons name="pulse" size={28} color={colors.green600} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.green900 }]}>No seizures this month!</Text>
          <Text style={[styles.emptySubtitle, { color: colors.green700 }]}>Keep up the great progress</Text>
        </View>
      </LinearGradient>
    );
  }

  // Count occurrences of each seizure type: { focal_aware: 2, generalized_tonic_clonic: 1, ... }
  const typeBreakdown = {};
  seizuresThisMonth.forEach(s => {
    typeBreakdown[s.seizure_type] = (typeBreakdown[s.seizure_type] || 0) + 1;
  });

  // Count per severity level; only show the section if any entry has a severity
  const severityBreakdown = { mild: 0, moderate: 0, severe: 0 };
  seizuresThisMonth.forEach(s => { if (s.severity) severityBreakdown[s.severity]++; });
  const hasSeverity = Object.values(severityBreakdown).some(v => v > 0);

  return (
    <LinearGradient colors={[colors.indigo50, colors.purple50]} style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="pulse" size={18} color={colors.indigo700} />
        <Text style={[styles.headerText, { color: colors.indigo900 }]}>
          {format(new Date(), 'MMMM yyyy')} Summary
        </Text>
      </View>

      <View style={styles.totalBox}>
        <Text style={styles.totalLabel}>Total Seizures</Text>
        <Text style={styles.totalNum}>{seizuresThisMonth.length}</Text>
      </View>

      <Text style={styles.sectionLabel}>By Type:</Text>
      {Object.entries(typeBreakdown)
        .sort((a, b) => b[1] - a[1])
        .map(([type, count]) => {
          const info = getSeizureTypeInfo(type);
          return (
            <View key={type} style={styles.typeRow}>
              <Text style={styles.typeName}>{info.name}</Text>
              <Text style={styles.typeCount}>{count}</Text>
            </View>
          );
        })}

      {hasSeverity && (
        <>
          <Text style={[styles.sectionLabel, { marginTop: 10 }]}>By Severity:</Text>
          <View style={styles.severityRow}>
            {severityBreakdown.mild > 0 && (
              <View style={[styles.sevBadge, { backgroundColor: colors.green100, borderColor: colors.green200 }]}>
                <Text style={[styles.sevLabel, { color: colors.green700 }]}>Mild</Text>
                <Text style={[styles.sevNum, { color: colors.green800 }]}>{severityBreakdown.mild}</Text>
              </View>
            )}
            {severityBreakdown.moderate > 0 && (
              <View style={[styles.sevBadge, { backgroundColor: colors.amber100, borderColor: colors.amber200 }]}>
                <Text style={[styles.sevLabel, { color: colors.amber700 }]}>Moderate</Text>
                <Text style={[styles.sevNum, { color: colors.amber800 }]}>{severityBreakdown.moderate}</Text>
              </View>
            )}
            {severityBreakdown.severe > 0 && (
              <View style={[styles.sevBadge, { backgroundColor: colors.red100, borderColor: colors.red200 }]}>
                <Text style={[styles.sevLabel, { color: colors.red700 }]}>Severe</Text>
                <Text style={[styles.sevNum, { color: colors.red700 }]}>{severityBreakdown.severe}</Text>
              </View>
            )}
          </View>
        </>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.indigo200,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  headerText: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyCenter: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
  },
  totalBox: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.indigo100,
    marginBottom: 10,
  },
  totalLabel: {
    fontSize: 12,
    color: colors.slate500,
    marginBottom: 2,
  },
  totalNum: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.indigo600,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.indigo900,
    marginBottom: 6,
  },
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.slate100,
    marginBottom: 4,
  },
  typeName: {
    fontSize: 13,
    color: colors.slate700,
    flex: 1,
  },
  typeCount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.indigo600,
  },
  severityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sevBadge: {
    flex: 1,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  sevLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  sevNum: {
    fontSize: 18,
    fontWeight: '800',
  },
});
