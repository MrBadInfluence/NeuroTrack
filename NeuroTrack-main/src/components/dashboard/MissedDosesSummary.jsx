/**
 * MissedDosesSummary — medication adherence card for the current month
 *
 * Shows a green "perfect adherence" success state when there are no missed
 * doses; otherwise lists the total count and a breakdown by medication name.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

export default function MissedDosesSummary({ doseLogs }) {
  const monthStart = startOfMonth(new Date());
  const monthEnd   = endOfMonth(new Date());

  // Filter dose logs to only "missed" entries within the current calendar month
  const missedThisMonth = doseLogs.filter(log => {
    if (!log.scheduled_date) return false;
    return log.status === 'missed' &&
      isWithinInterval(parseISO(log.scheduled_date), { start: monthStart, end: monthEnd });
  });

  if (missedThisMonth.length === 0) {
    return (
      <LinearGradient colors={[colors.green50, colors.emerald50]} style={styles.card}>
        <View style={styles.header}>
          <Ionicons name="calendar-outline" size={18} color={colors.green700} />
          <Text style={[styles.headerText, { color: colors.green900 }]}>Medication Adherence</Text>
        </View>
        <View style={styles.emptyCenter}>
          <Text style={[styles.emptyTitle, { color: colors.green900 }]}>Perfect adherence! 🎉</Text>
          <Text style={[styles.emptySubtitle, { color: colors.green700 }]}>No missed doses this month</Text>
        </View>
      </LinearGradient>
    );
  }

  // Group missed doses by medication name for the per-med breakdown
  const missedByMed = {};
  missedThisMonth.forEach(log => {
    missedByMed[log.medication_name] = (missedByMed[log.medication_name] || 0) + 1;
  });

  return (
    <LinearGradient colors={[colors.amber50, colors.orange50]} style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="warning-outline" size={18} color={colors.amber700} />
        <Text style={[styles.headerText, { color: colors.amber900 }]}>Missed Doses This Month</Text>
      </View>

      <View style={{ marginBottom: 12 }}>
        <Text style={[styles.bigNum, { color: colors.amber900 }]}>{missedThisMonth.length}</Text>
        <Text style={{ fontSize: 13, color: colors.amber700 }}>
          doses missed in {format(new Date(), 'MMMM')}
        </Text>
      </View>

      <Text style={styles.sectionLabel}>By Medication:</Text>
      {Object.entries(missedByMed)
        .sort((a, b) => b[1] - a[1])
        .map(([medName, count]) => (
          <View key={medName} style={styles.row}>
            <Text style={styles.medName}>{medName}</Text>
            <Text style={styles.count}>{count}</Text>
          </View>
        ))}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.amber200,
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
    paddingVertical: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
  },
  bigNum: {
    fontSize: 32,
    fontWeight: '800',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.amber800,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.amber100,
    marginBottom: 4,
  },
  medName: {
    fontSize: 13,
    color: colors.slate700,
    flex: 1,
  },
  count: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.amber600,
  },
});
