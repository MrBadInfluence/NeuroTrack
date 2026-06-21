/**
 * Reminders screen — manage medication dose reminders
 *
 * Shows today's schedule at the top, then all reminders sorted by time.
 * Supports create, edit, delete, and an inline active/paused toggle.
 * Also provides a PastDoseForm to retroactively log a missed dose.
 * The add/edit buttons are disabled when no active medications exist.
 */

import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { localClient } from '../api/localClient';
import { scheduleReminderNotifications, cancelReminderNotifications } from '../lib/notifications';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AppModal from '../components/ui/AppModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ReminderForm from '../components/medications/ReminderForm';
import PastDoseForm from '../components/medications/PastDoseForm';
import AppButton from '../components/ui/AppButton';
import { colors, gradients, getTheme } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import * as Haptics from 'expo-haptics';

const DAYS_SHORT = {
  monday:'Mon', tuesday:'Tue', wednesday:'Wed', thursday:'Thu',
  friday:'Fri', saturday:'Sat', sunday:'Sun',
};
const DAYS_ORDER = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

export default function Reminders() {
  const [showForm,         setShowForm]         = useState(false);   // controls the add/edit reminder modal
  const [editingReminder,  setEditingReminder]  = useState(null);    // null = adding, object = editing
  const [deleteId,         setDeleteId]         = useState(null);    // id of the reminder pending deletion
  const [showPastDoseForm, setShowPastDoseForm] = useState(false);   // controls the retroactive dose-log modal

  const queryClient = useQueryClient();
  const { isDark } = useTheme();
  const t = getTheme(isDark);
  const insets = useSafeAreaInsets();
  const hPad = Math.max(16, Math.max(insets.left, insets.right) + 8);

  const { data: reminders   = [], isLoading: loadingR, refetch: refetchR, isFetching } = useQuery({
    queryKey: ['reminders'],
    queryFn: () => localClient.entities.MedicationReminder.list('-created_date', 100),
  });
  const { data: medications = [], isLoading: loadingM } = useQuery({
    queryKey: ['medications'],
    queryFn: () => localClient.entities.Medication.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (d) => localClient.entities.MedicationReminder.create(d),
    onSuccess: (row) => {
      scheduleReminderNotifications(row);
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowForm(false);
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => localClient.entities.MedicationReminder.update(id, data),
    onSuccess: (row) => {
      scheduleReminderNotifications(row);
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowForm(false); setEditingReminder(null);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => localClient.entities.MedicationReminder.delete(id),
    onSuccess: (_, id) => {
      cancelReminderNotifications(id);
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      setDeleteId(null);
    },
  });
  const createDoseLogMutation = useMutation({
    mutationFn: (d) => localClient.entities.DoseLog.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['doseLogs'] }); setShowPastDoseForm(false); },
  });

  // Flip the is_active flag directly from the list without opening the form
  const toggleActive = (reminder) => {
    Haptics.selectionAsync();
    updateMutation.mutate({ id: reminder.id, data: { ...reminder, is_active: !reminder.is_active } });
  };
  // Route the form submission to create or update based on whether we're editing
  const handleSubmit = (data) => {
    if (editingReminder) updateMutation.mutate({ id: editingReminder.id, data });
    else createMutation.mutate(data);
  };

  const currentDay      = format(new Date(), 'EEEE').toLowerCase();   // e.g. "monday"
  const activeMeds      = medications.filter(m => m.is_active);
  const sortedReminders = [...reminders].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  // Only active reminders that are scheduled for today appear in the "Today's Schedule" section
  const todaysReminders = sortedReminders.filter(r => r.is_active && r.days_of_week?.includes(currentDay));
  const isLoading       = loadingR || loadingM;

  return (
    <LinearGradient
      colors={t.bgGradientAmber}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      locations={[0, 0.5, 1]}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingLeft: hPad, paddingRight: hPad }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetchR} />}
      >
        {/* Header */}
        <View style={styles.pageHeader}>
          <View style={styles.headerLeft}>
            <LinearGradient colors={gradients.amber} style={styles.headerIcon} start={{x:0,y:0}} end={{x:1,y:1}}>
              <Ionicons name="notifications" size={24} color={colors.white} />
            </LinearGradient>
            <View>
              <Text style={[styles.pageTitle, { color: t.text }]}>Reminders</Text>
              <Text style={[styles.pageSubtitle, { color: t.textMuted }]}>Never miss a dose</Text>
            </View>
          </View>
          <View style={styles.headerBtns}>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: t.surface, borderColor: colors.teal500 }]}
              onPress={() => setShowPastDoseForm(true)}
              disabled={activeMeds.length === 0}
            >
              <Ionicons name="time-outline" size={18} color={colors.teal600} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: colors.amber500, borderColor: colors.amber500 }]}
              onPress={() => { setEditingReminder(null); setShowForm(true); }}
              disabled={activeMeds.length === 0}
            >
              <Ionicons name="add" size={22} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Warning — no active meds */}
        {activeMeds.length === 0 && !isLoading && (
          <View style={[styles.warnBox, isDark && { backgroundColor: '#291a04', borderColor: colors.amber700 }]}>
            <Ionicons name="warning-outline" size={18} color={colors.amber600} />
            <View style={styles.warnText}>
              <Text style={[styles.warnTitle, isDark && { color: colors.amber300 }]}>No active medications</Text>
              <Text style={[styles.warnSub, isDark && { color: colors.amber400 }]}>Add some medications first to create reminders for them.</Text>
            </View>
          </View>
        )}

        {/* Today's Schedule */}
        <LinearGradient
          colors={isDark ? [t.cardGradientAmber[0], t.cardGradientAmber[1]] : [colors.amber50, colors.orange50]}
          style={[styles.todayCard, { borderColor: isDark ? colors.amber800 : colors.amber200 }]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={18} color={colors.amber600} />
            <Text style={[styles.sectionTitle, { color: isDark ? colors.amber300 : colors.amber900 }]}>Today's Schedule ({format(new Date(), 'EEEE')})</Text>
          </View>
          {todaysReminders.length === 0 ? (
            <View style={styles.todayEmpty}>
              <Ionicons name="notifications-outline" size={36} color={colors.amber300} />
              <Text style={[styles.todayEmptyText, { color: t.textMuted }]}>No reminders scheduled for today</Text>
            </View>
          ) : (
            todaysReminders.map(r => (
              <View key={r.id} style={[styles.todayItem, { backgroundColor: t.surface, borderColor: isDark ? colors.amber800 : colors.amber100 }]}>
                <Text style={styles.todayTime}>{r.time}</Text>
                <View style={styles.todayInfo}>
                  <View style={styles.todayNameRow}>
                    <Ionicons name="medical-outline" size={14} color={colors.amber600} />
                    <Text style={[styles.todayMedName, { color: t.text }]} numberOfLines={1}>{r.medication_name}</Text>
                  </View>
                  {r.notes && <Text style={[styles.todayNotes, { color: t.textFaint }]} numberOfLines={1}>{r.notes}</Text>}
                </View>
              </View>
            ))
          )}
        </LinearGradient>

        {/* All Reminders */}
        <Text style={[styles.allTitle, { color: t.text }]}>All Reminders</Text>

        {isLoading ? (
          [1,2,3].map(i => (
            <View key={i} style={[styles.card, { marginBottom: 12, backgroundColor: t.surface, borderColor: t.border }]}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ width: 56, height: 44, backgroundColor: t.border, borderRadius: 10 }} />
                <View style={{ flex: 1, gap: 8 }}>
                  <View style={{ height: 14, backgroundColor: t.border, borderRadius: 6, width: '40%' }} />
                  <View style={{ height: 12, backgroundColor: t.border, borderRadius: 6, width: '60%' }} />
                </View>
              </View>
            </View>
          ))
        ) : sortedReminders.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Ionicons name="notifications-outline" size={56} color={colors.amber200} />
            <Text style={[styles.emptyTitle, { color: t.text }]}>No reminders set</Text>
            <Text style={[styles.emptySub, { color: t.textMuted }]}>Create reminders to help you remember</Text>
            {activeMeds.length > 0 && (
              <AppButton gradient={gradients.amber} onPress={() => setShowForm(true)} style={{ marginTop: 8 }}>
                + Create Your First Reminder
              </AppButton>
            )}
          </View>
        ) : (
          sortedReminders.map(reminder => (
            <View
              key={reminder.id}
              style={[styles.card, { marginBottom: 12, backgroundColor: t.surface, borderColor: t.border }, !reminder.is_active && styles.cardInactive]}
            >
              <View style={styles.reminderRow}>
                {/* Time block */}
                <View style={[styles.timeBlock, reminder.is_active
                  ? { backgroundColor: isDark ? colors.amber900 : colors.amber50, borderColor: isDark ? colors.amber700 : colors.amber100 }
                  : { backgroundColor: isDark ? colors.slate700 : colors.slate50, borderColor: isDark ? colors.slate600 : colors.slate200 }
                ]}>
                  <Text style={[styles.timeText, reminder.is_active ? styles.timeTextActive : styles.timeTextInactive]}>
                    {reminder.time}
                  </Text>
                </View>

                <View style={styles.reminderBody}>
                  <View style={styles.reminderTopRow}>
                    <Text style={[styles.reminderMedName, { color: t.text }]} numberOfLines={1}>{reminder.medication_name}</Text>
                    <View style={[styles.statusBadge, reminder.is_active ? styles.activeBadge : styles.pausedBadge]}>
                      <Ionicons
                        name={reminder.is_active ? 'checkmark-circle' : 'close-circle'}
                        size={10}
                        color={reminder.is_active ? colors.emerald700 : colors.slate500}
                      />
                      <Text style={[styles.statusText, reminder.is_active ? { color: colors.emerald700 } : { color: colors.slate500 }]}>
                        {reminder.is_active ? 'Active' : 'Paused'}
                      </Text>
                    </View>
                  </View>

                  {/* Day chips */}
                  <View style={styles.dayChips}>
                    {DAYS_ORDER.map(day => {
                      const scheduled = reminder.days_of_week?.includes(day);
                      const isToday   = day === currentDay;
                      return (
                        <View key={day} style={[
                          styles.dayChip,
                          scheduled && isToday  ? styles.dayChipToday :
                          scheduled             ? (isDark ? { backgroundColor: colors.amber800 } : styles.dayChipScheduled) :
                                                  (isDark ? { backgroundColor: colors.slate700 } : styles.dayChipOff),
                        ]}>
                          <Text style={[
                            styles.dayChipText,
                            scheduled && isToday  ? styles.dayChipTextToday :
                            scheduled             ? (isDark ? { color: colors.amber300 } : styles.dayChipTextScheduled) :
                                                    (isDark ? { color: colors.slate400 } : styles.dayChipTextOff),
                          ]}>
                            {DAYS_SHORT[day]}
                          </Text>
                        </View>
                      );
                    })}
                  </View>

                  {reminder.notes && <Text style={[styles.noteText, { color: t.textFaint }]}>"{reminder.notes}"</Text>}
                </View>

                {/* Controls */}
                <View style={styles.controls}>
                  <Switch
                    value={reminder.is_active}
                    onValueChange={() => toggleActive(reminder)}
                    trackColor={{ false: colors.slate200, true: colors.amber400 }}
                    thumbColor={colors.white}
                    style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                  />
                  <TouchableOpacity style={styles.actionBtn} onPress={() => { setEditingReminder(reminder); setShowForm(true); }}>
                    <Ionicons name="pencil-outline" size={16} color={colors.slate400} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => setDeleteId(reminder.id)}>
                    <Ionicons name="trash-outline" size={16} color={colors.slate400} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      <AppModal visible={showForm} onClose={() => { setShowForm(false); setEditingReminder(null); }}>
        <ReminderForm
          reminder={editingReminder}
          medications={medications}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditingReminder(null); }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </AppModal>

      <AppModal visible={showPastDoseForm} onClose={() => setShowPastDoseForm(false)}>
        <PastDoseForm
          medications={activeMeds}
          onSubmit={(d) => createDoseLogMutation.mutate(d)}
          onCancel={() => setShowPastDoseForm(false)}
          isLoading={createDoseLogMutation.isPending}
        />
      </AppModal>

      <ConfirmDialog
        visible={!!deleteId}
        title="Delete Reminder?"
        description="This will permanently delete this reminder."
        onConfirm={() => deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16 },
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { fontSize: 20, fontWeight: '800', color: colors.slate900 },
  pageSubtitle: { fontSize: 12, color: colors.slate500 },
  headerBtns: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.slate200, backgroundColor: colors.white },
  warnBox: { flexDirection: 'row', gap: 10, backgroundColor: colors.amber50, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.amber200, marginBottom: 16, alignItems: 'flex-start' },
  warnText: { flex: 1 },
  warnTitle: { fontSize: 14, fontWeight: '700', color: colors.amber800, marginBottom: 2 },
  warnSub: { fontSize: 12, color: colors.amber700 },
  todayCard: { borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.amber200, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.amber900 },
  todayEmpty: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  todayEmptyText: { fontSize: 14, color: colors.slate400 },
  todayItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 10, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: colors.amber100, gap: 10 },
  todayTime: { fontSize: 20, fontWeight: '800', color: colors.amber600, minWidth: 52, textAlign: 'center' },
  todayInfo: { flex: 1, gap: 2 },
  todayNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  todayMedName: { fontSize: 14, fontWeight: '600', color: colors.slate900, flex: 1 },
  todayNotes: { fontSize: 12, color: colors.slate400 },
  allTitle: { fontSize: 16, fontWeight: '700', color: colors.slate900, marginBottom: 12 },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.slate100, shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2 },
  cardInactive: { opacity: 0.6 },
  emptyCard: { backgroundColor: colors.white, borderRadius: 16, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: colors.slate100, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.slate700 },
  emptySub: { fontSize: 13, color: colors.slate500, textAlign: 'center' },
  reminderRow: { flexDirection: 'row', gap: 10 },
  timeBlock: { borderRadius: 10, padding: 10, minWidth: 56, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  timeBlockActive: { backgroundColor: colors.amber50, borderColor: colors.amber100 },
  timeBlockInactive: { backgroundColor: colors.slate50, borderColor: colors.slate200 },
  timeText: { fontSize: 16, fontWeight: '800' },
  timeTextActive: { color: colors.amber600 },
  timeTextInactive: { color: colors.slate400 },
  reminderBody: { flex: 1, gap: 5 },
  reminderTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  reminderMedName: { fontSize: 14, fontWeight: '700', color: colors.slate900, flex: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20 },
  activeBadge: { backgroundColor: colors.emerald100 },
  pausedBadge: { backgroundColor: colors.slate100 },
  statusText: { fontSize: 10, fontWeight: '600' },
  dayChips: { flexDirection: 'row', flexWrap: 'nowrap', gap: 2 },
  dayChip: { paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 },
  dayChipToday: { backgroundColor: colors.amber500 },
  dayChipScheduled: { backgroundColor: colors.amber100 },
  dayChipOff: { backgroundColor: colors.slate100 },
  dayChipText: { fontSize: 10, fontWeight: '600' },
  dayChipTextToday: { color: colors.white },
  dayChipTextScheduled: { color: colors.amber700 },
  dayChipTextOff: { color: colors.slate400 },
  noteText: { fontSize: 12, color: colors.slate400, fontStyle: 'italic' },
  controls: { alignItems: 'center', gap: 2 },
  actionBtn: { padding: 5 },
});
