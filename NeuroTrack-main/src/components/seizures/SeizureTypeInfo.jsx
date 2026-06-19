/**
 * SeizureTypeInfo — seizure type data and info card component
 *
 * Exports:
 *   seizureTypes        — map of type key → { name, description, symptoms[] }
 *   getSeizureTypeInfo  — safe lookup that falls back to 'unknown'
 *   SeizureTypeInfo     — React component rendering a full info card for a type
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

// All recognised seizure types with human-readable names, descriptions, and common symptoms
export const seizureTypes = {
  focal_aware: {
    name: 'Focal Aware Seizure',
    description: 'You remain conscious but may experience unusual sensations, movements, or feelings. May include jerking movements, tingling, dizziness, or seeing flashing lights.',
    symptoms: ['Deja vu feelings', 'Unusual tastes or smells', 'Tingling sensations', 'Sudden emotions', 'Stiffening of muscles'],
  },
  focal_impaired_awareness: {
    name: 'Focal Impaired Awareness',
    description: 'Consciousness is affected. You may stare blankly, not respond normally, or make repetitive movements like lip smacking or hand rubbing.',
    symptoms: ['Blank staring', 'Unresponsive to surroundings', 'Repetitive movements', 'Confusion during and after', 'Automatic behaviors'],
  },
  focal_to_bilateral_tonic_clonic: {
    name: 'Focal to Bilateral Tonic-Clonic',
    description: 'Starts in one area of the brain (focal) then spreads to both sides, causing stiffening (tonic) followed by jerking (clonic) movements.',
    symptoms: ['Starts with focal symptoms', 'Loss of consciousness', 'Body stiffening', 'Rhythmic jerking', 'May bite tongue or lose bladder control'],
  },
  generalized_absence: {
    name: 'Absence Seizure',
    description: 'Brief episodes of staring into space or subtle body movements. Often lasts only a few seconds and may go unnoticed.',
    symptoms: ['Brief staring spells', 'Subtle lip smacking', 'Eyelid fluttering', 'No memory of episode', 'Quick return to normal'],
  },
  generalized_tonic_clonic: {
    name: 'Tonic-Clonic (Grand Mal)',
    description: 'The most recognized type. Involves loss of consciousness, body stiffening, followed by rhythmic jerking movements.',
    symptoms: ['Sudden loss of consciousness', 'Body stiffening (tonic phase)', 'Rhythmic jerking (clonic phase)', 'May cry out at onset', 'Post-seizure confusion and fatigue'],
  },
  generalized_tonic: {
    name: 'Tonic Seizure',
    description: 'Muscles suddenly stiffen, especially in the back, legs, and arms. May cause falls if standing.',
    symptoms: ['Sudden muscle stiffening', 'May fall if standing', 'Brief duration (usually under 20 seconds)', 'May affect consciousness'],
  },
  generalized_clonic: {
    name: 'Clonic Seizure',
    description: 'Repeated jerking muscle movements affecting both sides of the body.',
    symptoms: ['Rhythmic jerking movements', 'Affects both sides of body', 'Neck, face, and arms often involved', 'Rare type of seizure'],
  },
  generalized_myoclonic: {
    name: 'Myoclonic Seizure',
    description: 'Quick, brief jerks or twitches of muscles or groups of muscles. Often occurs shortly after waking.',
    symptoms: ['Quick muscle jerks', 'Usually affects arms and legs', 'Very brief (1-2 seconds)', 'May occur in clusters', 'Often happens in morning'],
  },
  generalized_atonic: {
    name: 'Atonic (Drop) Seizure',
    description: "Muscles suddenly go limp, causing falls or head drops. Also called 'drop attacks.'",
    symptoms: ['Sudden loss of muscle tone', 'May cause falls', 'Head may drop suddenly', 'Brief duration', 'Risk of injury from falling'],
  },
  unknown: {
    name: 'Unknown/Unclassified',
    description: 'When the seizure type cannot be clearly determined based on available information.',
    symptoms: ['Symptoms may vary', 'Requires further evaluation', 'Document all observations'],
  },
};

export const getSeizureTypeInfo = (type) => seizureTypes[type] || seizureTypes.unknown;

/** Full info card — used inside SeizureForm and the Guide panel */
export default function SeizureTypeInfo({ type }) {
  const info = getSeizureTypeInfo(type);
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{info.name}</Text>
      <Text style={styles.desc}>{info.description}</Text>
      <Text style={styles.signsLabel}>Common Signs:</Text>
      {info.symptoms.map((s, i) => (
        <View key={i} style={styles.symptomRow}>
          <View style={styles.dot} />
          <Text style={styles.symptom}>{s}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.indigo50,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.indigo100,
    marginTop: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.indigo900,
    marginBottom: 6,
  },
  desc: {
    fontSize: 13,
    color: colors.slate600,
    lineHeight: 19,
    marginBottom: 10,
  },
  signsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.indigo700,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  symptomRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.indigo400,
    marginTop: 5,
    flexShrink: 0,
  },
  symptom: {
    fontSize: 13,
    color: colors.slate600,
    flex: 1,
  },
});
