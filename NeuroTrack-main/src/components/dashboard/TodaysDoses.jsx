/**
 * TodaysDoses — today's medication schedule with mark-taken / skip actions
 *
 * Filters active reminders for today's day-of-week, looks up any existing
 * dose logs, and lets the user mark each dose as taken, skipped, or missed.
 * A past-time pending dose is labelled "missed" rather than "skip".
 * Returns null (renders nothing) if no reminders are scheduled today.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { localClient } from '../../api/localClient';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import AppButton from '../ui/AppButton';
import { colors } from '../../theme/colors';

export default function TodaysDoses({ reminders, doseLogs }) {
  const queryClient = useQueryClient();
  // ISO date string for today (yyyy-MM-dd) used to match dose log records
  const today      = format(new Date(), 'yyyy-MM-dd');
  // Full weekday name in lowercase (e.g. "monday") to match reminder.days_of_week
  const currentDay = format(new Date(), 'EEEE').toLowerCase();

  const todaysReminders = reminders
    .filter(r => r.is_active && r.days_of_week?.includes(currentDay))
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  const logDoseMutation = useMutation({
    mutationFn: (data) => localClient.entities.DoseLog.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['doseLogs'] }),
  });

  // Look up today's log entry for a reminder; returns 'pending' if not yet logged
  const getDoseStatus = (reminder) => {
    const log = doseLogs.find(
      l => l.medication_id === reminder.medication_id &&
           l.scheduled_date === today &&
           l.scheduled_time === reminder.time,
    );
    return log?.status || 'pending';
  };

  // Create a dose log entry; only sets taken_at timestamp when status is 'taken'
  const markDose = (reminder, status) => {
    logDoseMutation.mutate({
      medication_id:   reminder.medication_id,
      medication_name: reminder.medication_name,
      scheduled_date:  today,
      scheduled_time:  reminder.time,
      taken_at: status === 'taken' ? new Date().toISOString() : null,
      status,
    });
  };

  if (todaysReminders.length === 0) return null;

  return (
    <LinearGradient colors={[colors.cyan50, '#ecfeff']} style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="time-outline" size={18} color={colors.teal700} />
        <Text style={styles.headerText}>Today's Doses</Text>
      </View>

      {todaysReminders.map((reminder, index) => {
        const status = getDoseStatus(reminder);
        // If the scheduled time has already passed, "skip" becomes "missed"
        const isPast = reminder.time < format(new Date(), 'HH:mm');

        // Card border, background, icon background, icon name, and icon color
        // all vary based on whether the dose was taken, missed, skipped, or pending
        const borderColor =
          status === 'taken'   ? colors.green200 :
          status === 'missed'  ? colors.red200   :
          status === 'skipped' ? colors.slate200 :
          colors.teal100;

        const bgColor =
          status === 'taken'   ? '#f0fdf4' :
          status === 'missed'  ? '#fef2f2' :
          status === 'skipped' ? colors.slate50 :
          colors.white;

        const iconBg =
          status === 'taken'   ? colors.green100 :
          status === 'missed'  ? colors.red100   :
          status === 'skipped' ? colors.slate100 :
          '#ccfbf1';

        const iconName =
          status === 'taken'   ? 'checkmark'    :
          status === 'missed'  ? 'close'         :
          status === 'skipped' ? 'close'         :
          'medical';

        const iconColor =
          status === 'taken'   ? colors.green600 :
          status === 'missed'  ? colors.red600   :
          status === 'skipped' ? colors.slate600 :
          colors.teal600;

        return (
          <View key={`${reminder.id}-${today}`} style={[styles.doseCard, { borderColor, backgroundColor: bgColor }]}>
            <View style={styles.doseTop}>
              <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
                <Ionicons name={iconName} size={20} color={iconColor} />
              </View>
              <View style={styles.doseInfo}>
                <Text style={styles.medName}>{reminder.medication_name}</Text>
                <Text style={styles.schedTime}>Scheduled: {reminder.time}</Text>
              </View>
              {status !== 'pending' && (
                <View style={[styles.badge, {
                  backgroundColor:
                    status === 'taken' ? colors.green100 :
                    status === 'missed' ? colors.red100 :
                    colors.slate100
                }]}>
                  <Text style={[styles.badgeText, {
                    color:
                      status === 'taken' ? colors.green700 :
                      status === 'missed' ? colors.red700 :
                      colors.slate600
                  }]}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </View>
              )}
            </View>

            {status === 'pending' && (
              <View style={styles.actions}>
                <AppButton
                  size="sm"
                  gradient={[colors.green600, colors.emerald600]}
                  onPress={() => markDose(reminder, 'taken')}
                  style={styles.actionBtn}
                >
                  ✓  Mark Taken
                </AppButton>
                <AppButton
                  size="sm"
                  variant="outline"
                  onPress={() => markDose(reminder, isPast ? 'missed' : 'skipped')}
                  style={styles.actionBtn}
                >
                  {`✕  ${isPast ? 'Missed' : 'Skip'}`}
                </AppButton>
              </View>
            )}
          </View>
        );
      })}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#a5f3fc',
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
    color: colors.teal900,
  },
  doseCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  doseTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doseInfo: {
    flex: 1,
  },
  medName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.slate900,
  },
  schedTime: {
    fontSize: 12,
    color: colors.slate500,
    marginTop: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
  },
});
