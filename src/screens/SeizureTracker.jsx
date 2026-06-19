/**
 * SeizureTracker screen — list, log, edit, and delete seizure entries
 *
 * Data is fetched from Supabase via React Query (key: 'seizures').
 * Create, update, and delete mutations each invalidate the cache on success.
 * A collapsible guide lists every seizure type with descriptions and symptoms.
 * Pull-to-refresh is wired to the isFetching state from React Query.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { localClient } from '../api/localClient';
import { format, parseISO } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AppModal from '../components/ui/AppModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import SeizureForm from '../components/seizures/SeizureForm';
import SeizureTypeInfo, { seizureTypes, getSeizureTypeInfo } from '../components/seizures/SeizureTypeInfo';
import AppButton from '../components/ui/AppButton';
import * as Haptics from 'expo-haptics';
import { colors, gradients, getTheme } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';

// Background / text / border colors for each severity level used in the list cards
const severityColors = {
  mild:     { bg: colors.green100,  text: colors.green700,  border: colors.green200 },
  moderate: { bg: colors.amber100,  text: colors.amber700,  border: colors.amber200 },
  severe:   { bg: colors.red100,    text: colors.red700,    border: colors.red200 },
};

export default function SeizureTracker() {
  const [showForm,       setShowForm]       = useState(false);          // controls the add/edit modal
  const [editingSeizure, setEditingSeizure] = useState(null);           // null = adding, object = editing
  const [deleteId,       setDeleteId]       = useState(null);           // id of the seizure pending deletion
  const [showGuide,      setShowGuide]      = useState(false);          // toggle for the seizure-types guide

  const queryClient = useQueryClient();
  const { isDark } = useTheme();
  const t = getTheme(isDark);
  const insets = useSafeAreaInsets();
  const hPad = Math.max(16, Math.max(insets.left, insets.right) + 8);

  const { data: seizures = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['seizures'],
    queryFn: () => localClient.entities.Seizure.list('-date_time', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => localClient.entities.Seizure.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seizures'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => localClient.entities.Seizure.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seizures'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowForm(false);
      setEditingSeizure(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => localClient.entities.Seizure.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['seizures'] }); setDeleteId(null); },
  });

  // Route the form submission to create or update based on whether we're editing
  const handleSubmit = (data) => {
    if (editingSeizure) {
      updateMutation.mutate({ id: editingSeizure.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Open the form pre-filled with the selected seizure's data
  const handleEdit = (seizure) => { setEditingSeizure(seizure); setShowForm(true); };

  return (
    <LinearGradient
      colors={t.bgGradient}
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
        {/* Page header */}
        <View style={styles.pageHeader}>
          <View style={styles.headerLeft}>
            <LinearGradient colors={gradients.indigo} style={styles.headerIcon} start={{x:0,y:0}} end={{x:1,y:1}}>
              <Ionicons name="pulse" size={24} color={colors.white} />
            </LinearGradient>
            <View>
              <Text style={[styles.pageTitle, { color: t.text }]}>Seizure Tracker</Text>
              <Text style={[styles.pageSubtitle, { color: t.textMuted }]}>Log and monitor seizures</Text>
            </View>
          </View>
          <View style={styles.headerBtns}>
            <TouchableOpacity
              style={[styles.iconBtn, {
                backgroundColor: showGuide
                  ? (isDark ? colors.indigo900 : colors.indigo100)
                  : t.surface,
                borderColor: t.border,
              }]}
              onPress={() => setShowGuide(!showGuide)}
            >
              <Ionicons name="information-circle-outline" size={20} color={colors.indigo600} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: colors.indigo600 }]}
              onPress={() => { setEditingSeizure(null); setShowForm(true); }}
            >
              <Ionicons name="add" size={22} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Seizure Types Guide (collapsible) */}
        {showGuide && (
          <View style={[styles.card, { marginBottom: 16, backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[styles.guideTitle, { color: t.text }]}>
              <Ionicons name="flash" size={16} color={colors.indigo600} /> Understanding Seizure Types
            </Text>
            {Object.entries(seizureTypes).map(([key, info]) => (
              <SeizureTypeInfo key={key} type={key} />
            ))}
          </View>
        )}

        {/* Loading skeletons */}
        {isLoading ? (
          [1, 2, 3].map(i => (
            <View key={i} style={[styles.card, styles.skeleton, { marginBottom: 12, backgroundColor: t.surface, borderColor: t.border }]}>
              <View style={[styles.skelLine1, { backgroundColor: t.border }]} />
              <View style={[styles.skelLine2, { backgroundColor: t.border }]} />
            </View>
          ))
        ) : seizures.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Ionicons name="pulse-outline" size={56} color={colors.indigo200} />
            <Text style={[styles.emptyTitle, { color: t.text }]}>No seizures logged yet</Text>
            <Text style={[styles.emptySub, { color: t.textMuted }]}>Start tracking by logging your first entry</Text>
            <AppButton
              gradient={gradients.indigo}
              onPress={() => setShowForm(true)}
              style={{ marginTop: 8 }}
            >
              + Log Your First Seizure
            </AppButton>
          </View>
        ) : (
          seizures.map(seizure => {
            const typeInfo = getSeizureTypeInfo(seizure.seizure_type);
            const sev = severityColors[seizure.severity] || {};
            return (
              <View key={seizure.id} style={[styles.card, { marginBottom: 12, backgroundColor: t.surface, borderColor: t.border }]}>
                <View style={styles.seizureRow}>
                  {/* Date block */}
                  <View style={[styles.dateBlock, {
                    backgroundColor: isDark ? colors.indigo900 : colors.indigo50,
                    borderColor: isDark ? colors.indigo700 : colors.indigo100,
                  }]}>
                    <Text style={styles.dateDay}>
                      {seizure.date_time ? format(parseISO(seizure.date_time), 'd') : '—'}
                    </Text>
                    <Text style={[styles.dateMon, { color: t.textMuted }]}>
                      {seizure.date_time ? format(parseISO(seizure.date_time), 'MMM') : ''}
                    </Text>
                  </View>

                  <View style={styles.seizureBody}>
                    {/* Type + info */}
                    <Text style={[styles.seizureTypeName, { color: t.text }]}>{typeInfo.name}</Text>

                    {/* Meta row */}
                    <View style={styles.metaRow}>
                      <Text style={[styles.metaText, { color: t.textMuted }]}>
                        <Ionicons name="time-outline" size={12} />
                        {' '}{seizure.date_time ? format(parseISO(seizure.date_time), 'h:mm a') : '—'}
                      </Text>
                      {seizure.duration_seconds && (
                        <Text style={[styles.metaText, { color: t.textMuted }]}>
                          · {seizure.duration_seconds < 60
                            ? `${seizure.duration_seconds}s`
                            : `${Math.floor(seizure.duration_seconds / 60)}m ${seizure.duration_seconds % 60}s`}
                        </Text>
                      )}
                      {seizure.severity && (
                        <View style={[styles.sevBadge, { backgroundColor: sev.bg, borderColor: sev.border }]}>
                          <Text style={[styles.sevText, { color: sev.text }]}>{seizure.severity}</Text>
                        </View>
                      )}
                    </View>

                    {seizure.triggers && (
                      <Text style={[styles.detailText, { color: t.textMuted }]}><Text style={styles.detailLabel}>Triggers: </Text>{seizure.triggers}</Text>
                    )}
                    {seizure.post_ictal_symptoms && (
                      <Text style={[styles.detailText, { color: t.textMuted }]}><Text style={styles.detailLabel}>Post-seizure: </Text>{seizure.post_ictal_symptoms}</Text>
                    )}
                    {seizure.notes && (
                      <Text style={[styles.noteText, { color: t.textFaint }]}>"{seizure.notes}"</Text>
                    )}
                    {seizure.nocturnal && (
                      <View style={[styles.nocturnalBadge, {
                        backgroundColor: isDark ? colors.indigo900 : colors.indigo50,
                        borderColor: isDark ? colors.indigo700 : colors.indigo100,
                      }]}>
                        <Ionicons name="moon-outline" size={13} color={colors.indigo600} />
                        <Text style={[styles.nocturnalText, { color: isDark ? colors.indigo200 : colors.indigo900 }]}>Nocturnal (during sleep)</Text>
                      </View>
                    )}
                  </View>

                  {/* Actions */}
                  <View style={styles.actions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleEdit(seizure)}>
                      <Ionicons name="pencil-outline" size={17} color={colors.slate400} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => setDeleteId(seizure.id)}>
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

      {/* Add / Edit Modal */}
      <AppModal visible={showForm} onClose={() => { setShowForm(false); setEditingSeizure(null); }}>
        <SeizureForm
          seizure={editingSeizure}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditingSeizure(null); }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </AppModal>

      {/* Delete confirmation */}
      <ConfirmDialog
        visible={!!deleteId}
        title="Delete Seizure Entry?"
        description="This action cannot be undone. This will permanently delete this seizure record."
        onConfirm={() => deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.slate900,
  },
  pageSubtitle: {
    fontSize: 12,
    color: colors.slate500,
  },
  headerBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.slate200,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.slate100,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  guideTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.slate900,
    marginBottom: 12,
  },
  skeleton: {
    gap: 10,
  },
  skelLine1: {
    height: 14,
    backgroundColor: colors.slate200,
    borderRadius: 6,
    width: '40%',
  },
  skelLine2: {
    height: 20,
    backgroundColor: colors.slate200,
    borderRadius: 6,
    width: '60%',
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.slate100,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.slate700,
  },
  emptySub: {
    fontSize: 13,
    color: colors.slate500,
    textAlign: 'center',
  },
  seizureRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateBlock: {
    alignItems: 'center',
    backgroundColor: colors.indigo50,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.indigo100,
    minWidth: 46,
    flexShrink: 0,
  },
  dateDay: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.indigo600,
  },
  dateMon: {
    fontSize: 10,
    color: colors.slate500,
    textTransform: 'uppercase',
  },
  seizureBody: {
    flex: 1,
    gap: 4,
  },
  seizureTypeName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.slate900,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: colors.slate500,
  },
  sevBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
  },
  sevText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  detailText: {
    fontSize: 12,
    color: colors.slate600,
  },
  detailLabel: {
    fontWeight: '600',
  },
  noteText: {
    fontSize: 12,
    color: colors.slate400,
    fontStyle: 'italic',
  },
  nocturnalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.indigo50,
    borderRadius: 8,
    padding: 6,
    borderWidth: 1,
    borderColor: colors.indigo100,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  nocturnalText: {
    fontSize: 12,
    color: colors.indigo900,
    fontWeight: '500',
  },
  actions: {
    gap: 4,
  },
  actionBtn: {
    padding: 6,
  },
});
