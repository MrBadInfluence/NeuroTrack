import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import AppButton from './AppButton';

/**
 * ConfirmDialog — matches Radix AlertDialog used for delete confirmations
 */
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
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onCancel} />
      <View style={styles.center}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {description ? <Text style={styles.desc}>{description}</Text> : null}
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
    backgroundColor: colors.white,
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
    color: colors.slate900,
    marginBottom: 8,
  },
  desc: {
    fontSize: 14,
    color: colors.slate500,
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
