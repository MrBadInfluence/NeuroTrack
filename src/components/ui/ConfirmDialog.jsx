import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, getTheme } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';
import AppButton from './AppButton';

export default function ConfirmDialog({
  visible,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  dangerous = true,
}) {
  const { isDark } = useTheme();
  const t = getTheme(isDark);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onCancel} />
      <View style={styles.center}>
        <View style={[styles.card, { backgroundColor: t.surface }]}>
          <Text style={[styles.title, { color: t.text }]}>{title}</Text>
          {description ? <Text style={[styles.desc, { color: t.textMuted }]}>{description}</Text> : null}
          <View style={styles.row}>
            <AppButton variant="outline" onPress={onCancel} style={styles.btn}>
              {cancelLabel}
            </AppButton>
            <AppButton
              variant={dangerous ? 'danger' : 'primary'}
              onPress={onConfirm}
              style={styles.btn}
            >
              {confirmLabel}
            </AppButton>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },
  desc: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
  },
});
