import React from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { colors, getTheme } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';

export default function AppModal({ visible, onClose, children, scrollable = true }) {
  const { width: ww, height: wh } = useWindowDimensions();
  const isLandscape = ww > wh;
  const { isDark } = useTheme();
  const t = getTheme(isDark);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, isLandscape && styles.containerLandscape]}
        pointerEvents="box-none"
      >
        <View style={[styles.sheet, isLandscape && styles.sheetLandscape, { backgroundColor: t.surface }]}>
          <View style={[styles.handle, { backgroundColor: t.border }]} />

          {scrollable ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              {children}
            </ScrollView>
          ) : (
            <View style={styles.scrollContent}>{children}</View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingBottom: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  scrollContent: {
    padding: 20,
  },
  containerLandscape: {
    justifyContent: 'center',
    paddingHorizontal: '8%',
  },
  sheetLandscape: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
});
