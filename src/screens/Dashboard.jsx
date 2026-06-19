/**
 * Dashboard screen — overview of seizures, medications, reminders, and doses
 *
 * Renders a fixed stats grid (4 StatCards) followed by a draggable list of
 * summary sections: MonthSummary, MissedDoses, TodaysDoses, RecentSeizures,
 * and QuickActions. The user can reorder sections by long-pressing the drag
 * handle; the order is persisted in AsyncStorage across restarts.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { localClient } from '../api/localClient';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, getTheme } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import StatCard from '../components/shared/StatCard';
import MonthSummary from '../components/dashboard/MonthSummary';
import MissedDosesSummary from '../components/dashboard/MissedDosesSummary';
import TodaysDoses from '../components/dashboard/TodaysDoses';
import { getSeizureTypeInfo } from '../components/seizures/SeizureTypeInfo';
import { storageGet, storageSet } from '../utils/storage';
import * as Haptics from 'expo-haptics';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// AsyncStorage key used to persist the user's custom section order
const SECTION_ORDER_KEY = 'neurotrack_dashboard_order';

// Default section order shown on first launch
const DEFAULT_SECTIONS = [
  { key: 'monthSummary' },
  { key: 'missedDoses' },
  { key: 'todaysDoses' },
  { key: 'recentSeizures' },
  { key: 'quickActions' },
];

export default function Dashboard() {
  const navigation = useNavigation();
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const { isDark } = useTheme();
  const t = getTheme(isDark);

  const { width: ww, height: wh } = useWindowDimensions();
  const isLandscape = ww > wh;
  const insets = useSafeAreaInsets();
  const hPad = Math.max(16, Math.max(insets.left, insets.right) + 8);

  // Restore the saved section order from AsyncStorage on first render.
  // Any sections that were added after the order was saved are appended at the end.
  useEffect(() => {
    (async () => {
      const saved = await storageGet(SECTION_ORDER_KEY);
      if (saved) {
        try {
          const keys = JSON.parse(saved);
          const reordered = keys
            .map(k => DEFAULT_SECTIONS.find(s => s.key === k))
            .filter(Boolean);
          const missing = DEFAULT_SECTIONS.filter(s => !keys.includes(s.key));
          setSections([...reordered, ...missing]);
        } catch {}
      }
    })();
  }, []);

  const { data: seizures = [], refetch: refetchSeizures } = useQuery({
    queryKey: ['seizures'],
    queryFn: () => localClient.entities.Seizure.list('-date_time', 100),
  });
  const { data: medications = [] } = useQuery({
    queryKey: ['medications'],
    queryFn: () => localClient.entities.Medication.list('-created_date', 100),
  });
  const { data: reminders = [] } = useQuery({
    queryKey: ['reminders'],
    queryFn: () => localClient.entities.MedicationReminder.list('-created_date', 100),
  });
  const { data: doseLogs = [], refetch: refetchDoseLogs, isFetching } = useQuery({
    queryKey: ['doseLogs'],
    queryFn: () => localClient.entities.DoseLog.list('-created_date', 200),
  });

  const activeMedications = medications.filter(m => m.is_active);
  const activeReminders   = reminders.filter(r => r.is_active);
  const monthStart        = startOfMonth(new Date());
  const monthEnd          = endOfMonth(new Date());
  // Used by the "Seizures This Month" StatCard
  const seizuresThisMonth = seizures.filter(s => {
    if (!s.date_time) return false;
    return isWithinInterval(parseISO(s.date_time), { start: monthStart, end: monthEnd });
  });
  // Show only the 5 most recent entries in the Recent Seizures card
  const recentSeizures = seizures.slice(0, 5);
  // Pull-to-refresh triggers both seizure and dose-log queries
  const onRefresh = () => { refetchSeizures(); refetchDoseLogs(); };

  const severityColors = {
    mild:     { bg: isDark ? colors.green900  : colors.green100,  text: isDark ? colors.green200  : colors.green700 },
    moderate: { bg: isDark ? colors.amber900  : colors.amber100,  text: isDark ? colors.amber200  : colors.amber700 },
    severe:   { bg: isDark ? '#2a0a0a'        : colors.red100,    text: isDark ? colors.red200    : colors.red700 },
  };

  // Persist the new section order after the user drops a dragged item
  const handleDragEnd = ({ data }) => {
    setSections(data);
    storageSet(SECTION_ORDER_KEY, JSON.stringify(data.map(s => s.key)));
  };

  // ── Render each section by key ──────────────────────────────────────────────
  const renderSection = (key) => {
    switch (key) {

      case 'monthSummary':
        return <MonthSummary seizures={seizures} />;

      case 'missedDoses':
        return <MissedDosesSummary doseLogs={doseLogs} />;

      case 'todaysDoses':
        return <TodaysDoses reminders={activeReminders} doseLogs={doseLogs} />;

      case 'recentSeizures':
        return (
          <View style={[styles.card, { paddingBottom: 10, backgroundColor: t.surface, borderColor: t.border }]}>
            <View style={[styles.cardHeader, { borderBottomColor: t.border }]}>
              <View style={styles.cardTitleRow}>
                <LinearGradient colors={gradients.indigo} style={styles.cardIcon} start={{x:0,y:0}} end={{x:1,y:1}}>
                  <Ionicons name="pulse" size={18} color={colors.white} />
                </LinearGradient>
                <Text style={[styles.cardTitle, { color: t.text }]}>Recent Seizures</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('SeizureTracker')}>
                <Text style={styles.viewAll}>View All →</Text>
              </TouchableOpacity>
            </View>

            {recentSeizures.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="pulse-outline" size={44} color={colors.indigo200} />
                <Text style={[styles.emptyTitle, { color: t.textMuted }]}>No seizures logged yet</Text>
                <TouchableOpacity
                  style={[styles.emptyBtn, { borderColor: t.border }]}
                  onPress={() => navigation.navigate('SeizureTracker')}
                >
                  <Text style={[styles.emptyBtnText, { color: t.textMuted }]}>+ Log First Entry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              recentSeizures.map(seizure => {
                const typeInfo = getSeizureTypeInfo(seizure.seizure_type);
                const sev      = severityColors[seizure.severity] || {};
                return (
                  <View key={seizure.id} style={[
                    styles.seizureRow,
                    {
                      backgroundColor: isDark ? colors.indigo900 : colors.indigo50,
                      borderColor:     isDark ? colors.indigo700 : colors.indigo100,
                    },
                  ]}>
                    <View style={styles.seizureDate}>
                      <Text style={styles.seizureDateDay}>
                        {seizure.date_time ? format(parseISO(seizure.date_time), 'd') : '—'}
                      </Text>
                      <Text style={[styles.seizureDateMon, { color: t.textMuted }]}>
                        {seizure.date_time ? format(parseISO(seizure.date_time), 'MMM') : ''}
                      </Text>
                    </View>
                    <View style={styles.seizureInfo}>
                      <Text style={[styles.seizureType, { color: t.text }]}>{typeInfo.name}</Text>
                      {seizure.severity && (
                        <View style={[styles.sevBadge, { backgroundColor: sev.bg }]}>
                          <Text style={[styles.sevText, { color: sev.text }]}>{seizure.severity}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.seizureTime, { color: t.textFaint }]}>
                      {seizure.date_time ? format(parseISO(seizure.date_time), 'h:mm a') : ''}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        );

      case 'quickActions':
        return (
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.qaBtn} onPress={() => navigation.navigate('SeizureTracker')} activeOpacity={0.85}>
              <LinearGradient colors={gradients.indigo} style={styles.qaGradient} start={{x:0,y:0}} end={{x:1,y:1}}>
                <Ionicons name="pulse" size={28} color={colors.white} />
                <Text style={styles.qaTitle}>Log Seizure</Text>
                <Text style={styles.qaSub}>Record a new event</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.qaBtn} onPress={() => navigation.navigate('Medications')} activeOpacity={0.85}>
              <LinearGradient colors={gradients.emerald} style={styles.qaGradient} start={{x:0,y:0}} end={{x:1,y:1}}>
                <Ionicons name="medical" size={28} color={colors.white} />
                <Text style={styles.qaTitle}>Medications</Text>
                <Text style={styles.qaSub}>Manage your meds</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.qaBtn} onPress={() => navigation.navigate('Reminders')} activeOpacity={0.85}>
              <LinearGradient colors={gradients.amber} style={styles.qaGradient} start={{x:0,y:0}} end={{x:1,y:1}}>
                <Ionicons name="notifications" size={28} color={colors.white} />
                <Text style={styles.qaTitle}>Reminders</Text>
                <Text style={styles.qaSub}>Never miss a dose</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  // ── Draggable item renderer ─────────────────────────────────────────────────
  const renderItem = ({ item, drag, isActive }) => (
    <ScaleDecorator activeScale={0.97}>
      <View style={[styles.sectionWrapper, isActive && styles.sectionActive]}>
        {/* Section content — full width */}
        <View style={styles.sectionContent}>
          {renderSection(item.key)}
        </View>

        {/* Drag handle — top-right corner, long press to reorder */}
        <TouchableOpacity
          onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); drag(); }}
          delayLongPress={350}
          style={[styles.dragHandle, { backgroundColor: t.handleBg }]}
          activeOpacity={0.5}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="reorder-three-outline" size={22} color={colors.slate400} />
        </TouchableOpacity>
      </View>
    </ScaleDecorator>
  );

  // ── Fixed header + stats (always at top, not draggable) ─────────────────────
  const ListHeader = (
    <View>
      <View style={styles.header}>
        <Text style={[styles.title, { color: t.text }]}>
          {isLandscape ? 'Dashboard' : `Seizure and Medication\nDashboard`}
        </Text>
        <Text style={[styles.date, { color: t.textMuted }]}>{format(new Date(), 'EEEE, MMMM d, yyyy')}</Text>
      </View>

      {/* Stats grid — fixed, always at top */}
      <View style={styles.statsGrid}>
        {isLandscape ? (
          <View style={styles.statsRow}>
            <StatCard icon={p => <Ionicons name="pulse" {...p} />}         label="Seizures This Month"  value={seizuresThisMonth.length}  gradient={gradients.indigo} />
            <View style={{ width: 10 }} />
            <StatCard icon={p => <Ionicons name="medical" {...p} />}       label="Active Medications"   value={activeMedications.length}  gradient={gradients.emerald} />
            <View style={{ width: 10 }} />
            <StatCard icon={p => <Ionicons name="notifications" {...p} />} label="Active Reminders"     value={activeReminders.length}    gradient={gradients.amber} />
            <View style={{ width: 10 }} />
            <StatCard icon={p => <Ionicons name="calendar" {...p} />}      label="Total Seizures"       value={seizures.length}           gradient={gradients.rose} />
          </View>
        ) : (
          <>
            <View style={styles.statsRow}>
              <StatCard icon={p => <Ionicons name="pulse" {...p} />}         label="Seizures This Month"  value={seizuresThisMonth.length}  gradient={gradients.indigo} />
              <View style={{ width: 10 }} />
              <StatCard icon={p => <Ionicons name="medical" {...p} />}       label="Active Medications"   value={activeMedications.length}  gradient={gradients.emerald} />
            </View>
            <View style={[styles.statsRow, { marginTop: 10 }]}>
              <StatCard icon={p => <Ionicons name="notifications" {...p} />} label="Active Reminders"     value={activeReminders.length}    gradient={gradients.amber} />
              <View style={{ width: 10 }} />
              <StatCard icon={p => <Ionicons name="calendar" {...p} />}      label="Total Seizures"       value={seizures.length}           gradient={gradients.rose} />
            </View>
          </>
        )}
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={t.bgGradient}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      locations={[0, 0.5, 1]}
    >
      <DraggableFlatList
        data={sections}
        keyExtractor={item => item.key}
        onDragEnd={handleDragEnd}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={onRefresh} />}
        contentContainerStyle={[styles.content, { paddingLeft: hPad, paddingRight: hPad }]}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={<View style={{ height: 20 }} />}
        showsVerticalScrollIndicator={false}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 16,
    paddingBottom: 16,
    // paddingLeft/Right come from the safe-area-aware hPad value
    // passed via contentContainerStyle, so they are not set here.
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.slate900,
    lineHeight: 32,
    marginBottom: 4,
  },
  date: {
    fontSize: 13,
    color: colors.slate500,
  },
  hint: {
    fontSize: 11,
    color: colors.slate400,
    marginTop: 4,
    fontStyle: 'italic',
  },

  // ── Drag wrapper ──────────────────────────────────────────────────────────
  sectionWrapper: {
    marginBottom: 16,
    position: 'relative',
  },
  sectionActive: {
    opacity: 0.92,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 8,
  },
  dragHandle: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 10,
    padding: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  sectionContent: {},

  // ── Stats (fixed header) ───────────────────────────────────────────────────
  statsGrid: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
  },

  // ── Recent seizures card ──────────────────────────────────────────────────
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.slate100,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.slate900,
  },
  viewAll: {
    fontSize: 13,
    color: colors.indigo600,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    padding: 28,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 15,
    color: colors.slate500,
  },
  emptyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.slate200,
  },
  emptyBtnText: {
    fontSize: 13,
    color: colors.slate600,
    fontWeight: '600',
  },
  seizureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: colors.indigo50,
    borderWidth: 1,
    borderColor: colors.indigo100,
    gap: 10,
  },
  seizureDate: {
    alignItems: 'center',
    minWidth: 36,
  },
  seizureDateDay: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.indigo600,
  },
  seizureDateMon: {
    fontSize: 10,
    color: colors.slate500,
    textTransform: 'uppercase',
  },
  seizureInfo: {
    flex: 1,
    gap: 3,
  },
  seizureType: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.slate900,
  },
  sevBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  sevText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  seizureTime: {
    fontSize: 11,
    color: colors.slate400,
  },

  // ── Quick actions ─────────────────────────────────────────────────────────
  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  qaBtn: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  qaGradient: {
    padding: 14,
    gap: 6,
    minHeight: 110,
    justifyContent: 'flex-end',
  },
  qaTitle: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  qaSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
  },
});
