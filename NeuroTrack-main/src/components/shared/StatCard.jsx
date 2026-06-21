import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, getTheme } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';

export default function StatCard({ icon: Icon, label, value, gradient }) {
  const { isDark } = useTheme();
  const t = getTheme(isDark);

  return (
    <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
      <View style={styles.row}>
        <View style={styles.textGroup}>
          <Text style={[styles.label, { color: t.textMuted }]} numberOfLines={2}>{label}</Text>
          <Text style={[styles.value, { color: t.text }]}>{value}</Text>
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
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
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
    marginBottom: 4,
    lineHeight: 15,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
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
