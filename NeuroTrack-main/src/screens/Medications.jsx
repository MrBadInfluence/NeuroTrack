/**
 * Medications screen — manage the user's medication list
 *
 * Displays Active / Inactive tabs. Data is fetched from Supabase via
 * React Query (key: 'medications'). Deleting a medication also invalidates
 * the 'reminders' cache because reminders reference medications.
 * Pull-to-refresh is wired to the isFetching state from React Query.
 */

import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { localClient } from '../api/localClient';
import { format, parseISO } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AppModal from '../components/ui/AppModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import MedicationForm from '../components/medications/MedicationForm';
import AppButton from '../components/ui/AppButton';
import { colors, gradients } from '../theme/colors';

export default function Medications() {
  const [showForm,   setShowForm]   = useState(false);        // controls the add/edit modal
  const [editingMed, setEditingMed] = useState(null);         // null = adding, object = editing
  const [deleteId,   setDeleteId]   = useState(null);         // id of the medication pending deletion
  const [activeTab,  setActiveTab]  = useState('active');     // 'active' | 'inactive'

  const queryClient = useQueryClient();

  const { data: medications = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['medications'],
    queryFn: () => localClient.entities.Medication.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => localClient.entities.Medication.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['medications'] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => localClient.entities.Medication.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      setShowForm(false); setEditingMed(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => localClient.entities.Medication.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      setDeleteId(null);
    },
  });

  // Route the form submission to create or update based on whether we're editing
  const handleSubmit = (data) => {
    if (editingMed) updateMutation.mutate({ id: editingMed.id, data });
    else            createMutation.mutate(data);
  };

  // Split the full list into active / inactive for the two tabs
  const activeMeds   = medications.filter(m => m.is_active);
  const inactiveMeds = medications.filter(m => !m.is_active);
  const displayed    = activeTab === 'active' ? activeMeds : inactiveMeds;

  return (
    <LinearGradient
      colors={gradients.bgEmerald}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      locations={[0, 0.5, 1]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
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
              <Text style={styles.pageTitle}>Medications</Text>
              <Text style={styles.pageSubtitle}>Manage your meds</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.addBtn]}
            onPress={() => { setEditingMed(null); setShowForm(true); }}
          >
            <LinearGradient colors={gradients.emerald} style={styles.addBtnGrad} start={{x:0,y:0}} end={{x:1,y:0}}>
              <Ionicons name="add" size={18} color={colors.white} />
              <Text style={styles.addBtnText}>Add</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'active' && styles.tabActive]}
            onPress={() => setActiveTab('active')}
          >
            <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
              Active ({activeMeds.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'inactive' && styles.tabInactive]}
            onPress={() => setActiveTab('inactive')}
          >
            <Text style={[styles.tabText, activeTab === 'inactive' && styles.tabTextInactive]}>
              Inactive ({inactiveMeds.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* List */}
        {isLoading ? (
          [1,2,3].map(i => (
            <View key={i} style={[styles.card, { marginBottom: 12 }]}>
              <View style={styles.skelRow}>
                <View style={styles.skelIcon} />
                <View style={styles.skelLines}>
                  <View style={styles.skelLine1} />
                  <View style={styles.skelLine2} />
                </View>
              </View>
            </View>
          ))
        ) : displayed.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="medical-outline" size={56} color={colors.emerald200} />
            <Text style={styles.emptyTitle}>
              {activeTab === 'active' ? 'No active medications' : 'No inactive medications'}
            </Text>
            <Text style={styles.emptySub}>
              {activeTab === 'active'
                ? 'Add your medications to keep track of them'
                : 'Medications you stop taking will appear here'}
            </Text>
            {activeTab === 'active' && (
              <AppButton
                gradient={gradients.emerald}
                onPress={() => setShowForm(true)}
                style={{ marginTop: 8 }}
              >
                + Add Your First Medication
              </AppButton>
            )}
          </View>
        ) : (
          displayed.map(med => (
            <View key={med.id} style={[styles.card, { marginBottom: 12 }, !med.is_active && styles.cardInactive]}>
              <View style={styles.medRow}>
                {/* Icon */}
                <View style={[styles.medIcon, med.is_active ? styles.medIconActive : styles.medIconInactive]}>
                  <Ionicons name="medical" size={20} color={med.is_active ? colors.emerald600 : colors.slate400} />
                </View>

                <View style={styles.medBody}>
                  <View style={styles.medTopRow}>
                    <Text style={styles.medName}>{med.name}</Text>
                    <View style={styles.dosageBadge}>
                      <Text style={styles.dosageText}>{med.dosage}</Text>
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

                  {med.frequency && <Text style={styles.metaText}>{med.frequency}</Text>}

                  <View style={styles.metaChips}>
                    {med.purpose && (
                      <View style={styles.chip}>
                        <View style={styles.chipDot} />
                        <Text style={styles.chipText}>{med.purpose}</Text>
                      </View>
                    )}
                    {med.prescribing_doctor && (
                      <View style={styles.chip}>
                        <Ionicons name="person-outline" size={11} color={colors.slate400} />
                        <Text style={styles.chipText}>{med.prescribing_doctor}</Text>
                      </View>
                    )}
                    {med.start_date && (
                      <View style={styles.chip}>
                        <Ionicons name="calendar-outline" size={11} color={colors.slate400} />
                        <Text style={styles.chipText}>
                          Since {format(parseISO(med.start_date), 'MMM d, yyyy')}
                        </Text>
                      </View>
                    )}
                  </View>

                  {med.notes && (
                    <Text style={styles.noteText}>"{med.notes}"</Text>
                  )}
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
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      <AppModal visible={showForm} onClose={() => { setShowForm(false); setEditingMed(null); }}>
        <MedicationForm
          medication={editingMed}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditingMed(null); }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </AppModal>

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
  content: { padding: 16 },
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { fontSize: 20, fontWeight: '800', color: colors.slate900 },
  pageSubtitle: { fontSize: 12, color: colors.slate500 },
  addBtn: { borderRadius: 12, overflow: 'hidden' },
  addBtnGrad: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 10 },
  addBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  tabs: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: colors.slate200, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center' },
  tabActive: { backgroundColor: colors.emerald100 },
  tabInactive: { backgroundColor: colors.slate100 },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.slate500 },
  tabTextActive: { color: colors.emerald700 },
  tabTextInactive: { color: colors.slate700 },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.slate100, shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2 },
  cardInactive: { opacity: 0.7 },
  skelRow: { flexDirection: 'row', gap: 12 },
  skelIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.slate200 },
  skelLines: { flex: 1, gap: 8, justifyContent: 'center' },
  skelLine1: { height: 14, backgroundColor: colors.slate200, borderRadius: 6, width: '50%' },
  skelLine2: { height: 12, backgroundColor: colors.slate200, borderRadius: 6, width: '30%' },
  emptyCard: { backgroundColor: colors.white, borderRadius: 16, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: colors.slate100, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.slate700 },
  emptySub: { fontSize: 13, color: colors.slate500, textAlign: 'center' },
  medRow: { flexDirection: 'row', gap: 12 },
  medIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderWidth: 1 },
  medIconActive: { backgroundColor: colors.emerald50, borderColor: colors.emerald200 },
  medIconInactive: { backgroundColor: colors.slate100, borderColor: colors.slate200 },
  medBody: { flex: 1, gap: 4 },
  medTopRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  medName: { fontSize: 16, fontWeight: '700', color: colors.slate900 },
  dosageBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: colors.slate200, backgroundColor: colors.white },
  dosageText: { fontSize: 12, fontWeight: '600', color: colors.slate700 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20 },
  activeBadge: { backgroundColor: colors.emerald100 },
  inactiveBadge: { backgroundColor: colors.slate100 },
  statusText: { fontSize: 11, fontWeight: '600' },
  activeText: { color: colors.emerald700 },
  inactiveText: { color: colors.slate500 },
  metaText: { fontSize: 13, color: colors.slate600 },
  metaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.emerald400 },
  chipText: { fontSize: 12, color: colors.slate500 },
  noteText: { fontSize: 12, color: colors.slate400, fontStyle: 'italic', marginTop: 2 },
  actions: { gap: 4 },
  actionBtn: { padding: 6 },
});
