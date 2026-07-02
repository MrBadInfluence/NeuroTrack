/**
 * Medications screen — manage the user's medication list
 *
 * Displays Active / Inactive tabs. Each active medication card shows a
 * 30-day script tracker (pills remaining until next prescription) when set up.
 * Script tracker data is stored locally in AsyncStorage (not synced to Supabase).
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
  RefreshControl, TextInput, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { localClient } from '../api/localClient';
import { format, parseISO } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AppModal from '../components/ui/AppModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import MedicationForm from '../components/medications/MedicationForm';
import AppButton from '../components/ui/AppButton';
import { storageGetJSON, storageSetJSON } from '../utils/storage';
import { colors, gradients, getTheme } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';

const SCRIPT_KEY = 'neurotrack_scripts';

export default function Medications() {
  const [showForm,     setShowForm]     = useState(false);
  const [editingMed,   setEditingMed]   = useState(null);
  const [deleteId,     setDeleteId]     = useState(null);
  const [activeTab,    setActiveTab]    = useState('active');

  // Script tracker state
  const [scripts,         setScripts]         = useState({});        // { [medId]: { quantity, start_date } }
  const [editScriptMed,   setEditScriptMed]   = useState(null);      // medication being configured
  const [scriptQty,       setScriptQty]       = useState('');
  const [scriptStartDate, setScriptStartDate] = useState('');

  const queryClient = useQueryClient();
  const { isDark } = useTheme();
  const t = getTheme(isDark);
  const insets      = useSafeAreaInsets();
  const hPad        = Math.max(16, Math.max(insets.left, insets.right) + 8);

  const { data: medications = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['medications'],
    queryFn:  () => localClient.entities.Medication.list('-created_date', 100),
  });

  // Dose logs needed to calculate pills used since script start
  const { data: doseLogs = [] } = useQuery({
    queryKey: ['doseLogs'],
    queryFn:  () => localClient.entities.DoseLog.list('-created_date', 1000),
  });

  // Load saved script tracker data
  useEffect(() => {
    storageGetJSON(SCRIPT_KEY).then(d => { if (d) setScripts(d); });
  }, []);

  const createMutation = useMutation({
    mutationFn: (data) => localClient.entities.Medication.create(data),
    onSuccess:  () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowForm(false);
    },
    onError: (err) => {
      Alert.alert('Error', err?.message || 'Failed to save medication. Please try again.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => localClient.entities.Medication.update(id, data),
    onSuccess:  () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowForm(false);
      setEditingMed(null);
    },
    onError: (err) => {
      Alert.alert('Error', err?.message || 'Failed to update medication. Please try again.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => localClient.entities.Medication.delete(id),
    onSuccess:  () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      setDeleteId(null);
    },
  });

  const handleSubmit = (data) => {
    if (editingMed) updateMutation.mutate({ id: editingMed.id, data });
    else            createMutation.mutate(data);
  };

  // ── Script tracker helpers ──────────────────────────────────────────────────

  const openScriptEditor = (med) => {
    const existing = scripts[med.id] || {};
    setEditScriptMed(med);
    setScriptQty(existing.quantity ? String(existing.quantity) : '');
    setScriptStartDate(existing.start_date || new Date().toISOString().split('T')[0]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const saveScript = async () => {
    if (!editScriptMed) return;
    const qty = parseInt(scriptQty);
    if (!qty || qty <= 0) {
      Alert.alert('Invalid quantity', 'Please enter a positive number of pills.');
      return;
    }
    // Validate date format (yyyy-MM-dd) before saving
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(scriptStartDate) || isNaN(Date.parse(scriptStartDate))) {
      Alert.alert('Invalid date', 'Please enter the start date in the format yyyy-MM-dd, e.g. 2025-01-15.');
      return;
    }
    const updated = { ...scripts, [editScriptMed.id]: { quantity: qty, start_date: scriptStartDate } };
    setScripts(updated);
    await storageSetJSON(SCRIPT_KEY, updated);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEditScriptMed(null);
  };

  const clearScript = async (medId) => {
    const updated = { ...scripts };
    delete updated[medId];
    setScripts(updated);
    await storageSetJSON(SCRIPT_KEY, updated);
  };

  // Count 'taken' doses for a medication since a given date
  const getDosesTaken = (medId, startDate) => {
    if (!startDate) return 0;
    return doseLogs.filter(d =>
      d.medication_id === medId &&
      (d.scheduled_date || '') >= startDate &&
      d.status === 'taken',
    ).length;
  };

  const activeMeds   = medications.filter(m => m.is_active);
  const inactiveMeds = medications.filter(m => !m.is_active);
  const displayed    = activeTab === 'active' ? activeMeds : inactiveMeds;

  return (
    <LinearGradient
      colors={t.bgGradientEmerald}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      locations={[0, 0.5, 1]}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingLeft: hPad, paddingRight: hPad }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
      >
        {/* Header */}
        <View style={styles.pageHeader}>
          <View style={styles.headerLeft}>
            <LinearGradient colors={gradients.emerald} style={styles.headerIcon} start={{x:0,y:0}} end={{x:1,y:1}}>
              <Ionicons name="medical" size={24} color={colors.white} />
            </LinearGradient>
            <View>
              <Text style={[styles.pageTitle, { color: t.text }]}>Medications</Text>
              <Text style={[styles.pageSubtitle, { color: t.textMuted }]}>Manage your meds</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => { setEditingMed(null); setShowForm(true); }}
          >
            <LinearGradient colors={gradients.emerald} style={styles.addBtnGrad} start={{x:0,y:0}} end={{x:1,y:0}}>
              <Ionicons name="add" size={18} color={colors.white} />
              <Text style={styles.addBtnText}>Add</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={[styles.tabs, { backgroundColor: t.surface, borderColor: t.border }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'active' && { backgroundColor: isDark ? colors.emerald900 : colors.emerald100 }]}
            onPress={() => setActiveTab('active')}
          >
            <Text style={[styles.tabText, { color: t.textMuted }, activeTab === 'active' && styles.tabTextActive]}>
              Active ({activeMeds.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'inactive' && { backgroundColor: isDark ? colors.slate700 : colors.slate100 }]}
            onPress={() => setActiveTab('inactive')}
          >
            <Text style={[styles.tabText, { color: t.textMuted }, activeTab === 'inactive' && styles.tabTextInactive]}>
              Inactive ({inactiveMeds.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* List */}
        {isLoading ? (
          [1,2,3].map(i => (
            <View key={i} style={[styles.card, { marginBottom: 12, backgroundColor: t.surface, borderColor: t.border }]}>
              <View style={styles.skelRow}>
                <View style={[styles.skelIcon, { backgroundColor: t.border }]} />
                <View style={styles.skelLines}>
                  <View style={[styles.skelLine1, { backgroundColor: t.border }]} />
                  <View style={[styles.skelLine2, { backgroundColor: t.border }]} />
                </View>
              </View>
            </View>
          ))
        ) : displayed.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Ionicons name="medical-outline" size={56} color={colors.emerald200} />
            <Text style={[styles.emptyTitle, { color: t.text }]}>
              {activeTab === 'active' ? 'No active medications' : 'No inactive medications'}
            </Text>
            <Text style={[styles.emptySub, { color: t.textMuted }]}>
              {activeTab === 'active'
                ? 'Add your medications to keep track of them'
                : 'Medications you stop taking will appear here'}
            </Text>
            {activeTab === 'active' && (
              <AppButton gradient={gradients.emerald} onPress={() => setShowForm(true)} style={{ marginTop: 8 }}>
                + Add Your First Medication
              </AppButton>
            )}
          </View>
        ) : (
          displayed.map(med => {
            const script     = scripts[med.id];
            const dosesTaken = script ? getDosesTaken(med.id, script.start_date) : 0;
            const remaining  = script ? Math.max(0, script.quantity - dosesTaken) : null;
            const progress   = script ? Math.min(1, dosesTaken / script.quantity) : 0;
            const isLow      = remaining !== null && remaining <= 7;

            return (
              <View key={med.id} style={[styles.card, { marginBottom: 12, backgroundColor: t.surface, borderColor: t.border }, !med.is_active && styles.cardInactive]}>
                <View style={styles.medRow}>
                  {/* Icon */}
                  <View style={[styles.medIcon, med.is_active ? styles.medIconActive : styles.medIconInactive]}>
                    <Ionicons name="medical" size={20} color={med.is_active ? colors.emerald600 : colors.slate400} />
                  </View>

                  <View style={styles.medBody}>
                    <View style={styles.medTopRow}>
                      <Text style={[styles.medName, { color: t.text }]}>{med.name}</Text>
                      <View style={[styles.dosageBadge, { backgroundColor: t.surfaceAlt, borderColor: t.border }]}>
                        <Text style={[styles.dosageText, { color: t.textMuted }]}>{med.dosage}</Text>
                      </View>
                      <View style={[styles.statusBadge, med.is_active ? styles.activeBadge : styles.inactiveBadge]}>
                        <Ionicons
                          name={med.is_active ? 'checkmark-circle' : 'close-circle'}
                          size={11}
                          color={med.is_active ? colors.emerald700 : colors.slate500}
                        />
                        <Text style={[styles.statusText, med.is_active ? styles.activeText : styles.inactiveText]}>
                          {med.is_active ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>

                    {med.frequency && <Text style={[styles.metaText, { color: t.textMuted }]}>{med.frequency}</Text>}

                    <View style={styles.metaChips}>
                      {med.purpose && (
                        <View style={styles.chip}>
                          <View style={styles.chipDot} />
                          <Text style={[styles.chipText, { color: t.textMuted }]}>{med.purpose}</Text>
                        </View>
                      )}
                      {med.prescribing_doctor && (
                        <View style={styles.chip}>
                          <Ionicons name="person-outline" size={11} color={colors.slate400} />
                          <Text style={[styles.chipText, { color: t.textMuted }]}>{med.prescribing_doctor}</Text>
                        </View>
                      )}
                      {med.start_date && (
                        <View style={styles.chip}>
                          <Ionicons name="calendar-outline" size={11} color={colors.slate400} />
                          <Text style={[styles.chipText, { color: t.textMuted }]}>Since {format(parseISO(med.start_date), 'MMM d, yyyy')}</Text>
                        </View>
                      )}
                    </View>

                    {med.notes && <Text style={[styles.noteText, { color: t.textFaint }]}>"{med.notes}"</Text>}

                    {/* ── 30-day Script Tracker ── */}
                    {med.is_active && script ? (
                      <View style={[
                        styles.scriptTracker,
                        isLow
                          ? { backgroundColor: isDark ? colors.amber900 : colors.amber50, borderColor: isDark ? colors.amber700 : colors.amber200 }
                          : { backgroundColor: isDark ? colors.emerald900 : colors.emerald50, borderColor: isDark ? colors.emerald700 : colors.emerald200 },
                      ]}>
                        <View style={styles.scriptHeader}>
                          <View style={styles.scriptHeaderLeft}>
                            <Ionicons
                              name={isLow ? 'warning-outline' : 'timer-outline'}
                              size={13}
                              color={isLow ? colors.amber600 : colors.emerald600}
                            />
                            <Text style={[styles.scriptTitle, isLow && { color: colors.amber700 }]}>
                              Script Tracker
                            </Text>
                          </View>
                          <TouchableOpacity onPress={() => openScriptEditor(med)}>
                            <Ionicons name="pencil-outline" size={13} color={colors.slate400} />
                          </TouchableOpacity>
                        </View>

                        {/* Progress bar */}
                        <View style={styles.progressBg}>
                          <View
                            style={[
                              styles.progressFill,
                              { width: `${progress * 100}%` },
                              isLow && { backgroundColor: colors.amber500 },
                            ]}
                          />
                        </View>

                        <Text style={[styles.scriptRemaining, isLow
                          ? { color: isDark ? colors.amber300 : colors.amber700 }
                          : { color: isDark ? colors.emerald300 : colors.emerald700 }]}>
                          {remaining} of {script.quantity} pills remaining
                          {isLow ? '  — Refill soon!' : ''}
                        </Text>
                        <Text style={[styles.scriptSince, { color: isDark ? colors.emerald400 : colors.emerald600 }]}>
                          Script started {script.start_date}
                        </Text>
                      </View>
                    ) : med.is_active ? (
                      <TouchableOpacity
                        style={styles.scriptSetupBtn}
                        onPress={() => openScriptEditor(med)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="timer-outline" size={13} color={colors.emerald600} />
                        <Text style={styles.scriptSetupText}>Track Script (30-day)</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  <View style={styles.actions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => { setEditingMed(med); setShowForm(true); }}>
                      <Ionicons name="pencil-outline" size={17} color={colors.slate400} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => setDeleteId(med.id)}>
                      <Ionicons name="trash-outline" size={17} color={colors.slate400} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Add / Edit medication modal */}
      <AppModal visible={showForm} onClose={() => { setShowForm(false); setEditingMed(null); }}>
        <MedicationForm
          medication={editingMed}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditingMed(null); }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </AppModal>

      {/* Script tracker setup modal */}
      <Modal
        visible={!!editScriptMed}
        transparent
        animationType="fade"
        onRequestClose={() => setEditScriptMed(null)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <TouchableOpacity style={styles.scriptModalOverlay} activeOpacity={1} onPress={() => setEditScriptMed(null)}>
            <TouchableOpacity activeOpacity={1} style={[styles.scriptModalCard, { backgroundColor: t.surface }]}>
              <View style={styles.scriptModalHeader}>
                <LinearGradient colors={gradients.emerald} style={styles.scriptModalIcon} start={{x:0,y:0}} end={{x:1,y:1}}>
                  <Ionicons name="timer-outline" size={18} color={colors.white} />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.scriptModalTitle, { color: t.text }]}>Script Tracker</Text>
                  <Text style={[styles.scriptModalSub, { color: t.textMuted }]}>{editScriptMed?.name}</Text>
                </View>
                {editScriptMed && scripts[editScriptMed.id] && (
                  <TouchableOpacity onPress={() => { clearScript(editScriptMed.id); setEditScriptMed(null); }}>
                    <Text style={styles.scriptClearBtn}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={[styles.scriptModalLabel, { color: t.textMuted }]}>Pills per script</Text>
              <TextInput
                style={[styles.scriptModalInput, { color: t.text, backgroundColor: t.surfaceAlt, borderColor: t.inputBorder }]}
                value={scriptQty}
                onChangeText={setScriptQty}
                placeholder="e.g. 60"
                keyboardType="number-pad"
                placeholderTextColor={t.textFaint}
              />

              <Text style={[styles.scriptModalLabel, { color: t.textMuted }]}>Script start date</Text>
              <TextInput
                style={[styles.scriptModalInput, { color: t.text, backgroundColor: t.surfaceAlt, borderColor: t.inputBorder }]}
                value={scriptStartDate}
                onChangeText={setScriptStartDate}
                placeholder="yyyy-MM-dd"
                placeholderTextColor={t.textFaint}
              />
              <Text style={[styles.scriptModalHint, { color: t.textFaint }]}>Format: 2025-01-15</Text>

              <View style={styles.scriptModalBtns}>
                <AppButton variant="outline" onPress={() => setEditScriptMed(null)} style={{ flex: 1 }}>Cancel</AppButton>
                <AppButton
                  gradient={gradients.emerald}
                  onPress={saveScript}
                  disabled={!scriptQty || parseInt(scriptQty) <= 0}
                  style={{ flex: 1 }}
                >
                  Save
                </AppButton>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      <ConfirmDialog
        visible={!!deleteId}
        title="Delete Medication?"
        description="This will permanently delete this medication and any associated reminders."
        onConfirm={() => deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  content:    { padding: 16 },
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  pageTitle:  { fontSize: 20, fontWeight: '800', color: colors.slate900 },
  pageSubtitle: { fontSize: 12, color: colors.slate500 },
  addBtn:     { borderRadius: 12, overflow: 'hidden' },
  addBtnGrad: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 10 },
  addBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  tabs:       { flexDirection: 'row', backgroundColor: colors.white, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: colors.slate200, marginBottom: 16 },
  tab:        { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center' },
  tabActive:  { backgroundColor: colors.emerald100 },
  tabInactive: { backgroundColor: colors.slate100 },
  tabText:    { fontSize: 13, fontWeight: '600', color: colors.slate500 },
  tabTextActive:   { color: colors.emerald700 },
  tabTextInactive: { color: colors.slate700 },
  card: {
    backgroundColor: colors.white, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: colors.slate100,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
  },
  cardInactive: { opacity: 0.7 },
  skelRow:  { flexDirection: 'row', gap: 12 },
  skelIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.slate200 },
  skelLines: { flex: 1, gap: 8, justifyContent: 'center' },
  skelLine1: { height: 14, backgroundColor: colors.slate200, borderRadius: 6, width: '50%' },
  skelLine2: { height: 12, backgroundColor: colors.slate200, borderRadius: 6, width: '30%' },
  emptyCard:  { backgroundColor: colors.white, borderRadius: 16, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: colors.slate100, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.slate700 },
  emptySub:   { fontSize: 13, color: colors.slate500, textAlign: 'center' },
  medRow:  { flexDirection: 'row', gap: 12 },
  medIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderWidth: 1 },
  medIconActive:   { backgroundColor: colors.emerald50,  borderColor: colors.emerald200 },
  medIconInactive: { backgroundColor: colors.slate100,   borderColor: colors.slate200 },
  medBody:    { flex: 1, gap: 4 },
  medTopRow:  { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  medName:    { fontSize: 16, fontWeight: '700', color: colors.slate900 },
  dosageBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: colors.slate200, backgroundColor: colors.white },
  dosageText: { fontSize: 12, fontWeight: '600', color: colors.slate700 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20 },
  activeBadge:   { backgroundColor: colors.emerald100 },
  inactiveBadge: { backgroundColor: colors.slate100 },
  statusText:    { fontSize: 11, fontWeight: '600' },
  activeText:    { color: colors.emerald700 },
  inactiveText:  { color: colors.slate500 },
  metaText:  { fontSize: 13, color: colors.slate600 },
  metaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  chip:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chipDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.emerald400 },
  chipText:  { fontSize: 12, color: colors.slate500 },
  noteText:  { fontSize: 12, color: colors.slate400, fontStyle: 'italic', marginTop: 2 },
  actions:   { gap: 4 },
  actionBtn: { padding: 6 },

  // Script tracker
  scriptTracker: {
    marginTop: 10, padding: 10, borderRadius: 10,
    backgroundColor: colors.emerald50, borderWidth: 1, borderColor: colors.emerald200, gap: 4,
  },
  scriptTrackerLow: { backgroundColor: colors.amber50, borderColor: colors.amber200 },
  scriptHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scriptHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  scriptTitle:      { fontSize: 12, fontWeight: '700', color: colors.emerald700 },
  progressBg:       { height: 6, backgroundColor: colors.emerald100, borderRadius: 3, overflow: 'hidden', marginVertical: 2 },
  progressFill:     { height: 6, backgroundColor: colors.emerald500, borderRadius: 3 },
  scriptRemaining:  { fontSize: 12, fontWeight: '600', color: colors.emerald700 },
  scriptSince:      { fontSize: 11, color: colors.emerald600 },
  scriptSetupBtn:   {
    marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8,
    borderWidth: 1, borderStyle: 'dashed', borderColor: colors.emerald300,
    alignSelf: 'flex-start',
  },
  scriptSetupText: { fontSize: 12, fontWeight: '600', color: colors.emerald600 },

  // Script modal
  scriptModalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  scriptModalCard: {
    backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 36,
    shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: -4 }, shadowRadius: 12,
  },
  scriptModalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  scriptModalIcon:   { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  scriptModalTitle:  { fontSize: 16, fontWeight: '700', color: colors.slate900 },
  scriptModalSub:    { fontSize: 13, color: colors.slate500 },
  scriptClearBtn:    { fontSize: 13, fontWeight: '600', color: colors.red600 },
  scriptModalLabel:  { fontSize: 13, fontWeight: '600', color: colors.slate700, marginBottom: 6 },
  scriptModalInput:  {
    borderWidth: 1.5, borderColor: colors.slate200, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 15,
    color: colors.slate900, backgroundColor: colors.white, marginBottom: 4,
  },
  scriptModalHint:   { fontSize: 11, color: colors.slate400, marginBottom: 16 },
  scriptModalBtns:   { flexDirection: 'row', gap: 12, marginTop: 8 },
});
