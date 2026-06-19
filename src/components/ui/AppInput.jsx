import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet } from 'react-native';
import { colors, getTheme } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';

export default function AppInput({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  numberOfLines,
  keyboardType = 'default',
  secureTextEntry = false,
  style,
  inputStyle,
  required = false,
  editable = true,
}) {
  const [focused, setFocused] = useState(false);
  const { isDark } = useTheme();
  const t = getTheme(isDark);

  return (
    <View style={[styles.wrapper, style]}>
      {label && (
        <Text style={[styles.label, { color: t.textMuted }]}>
          {label}{required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={t.textFaint}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        editable={editable}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.input,
          {
            backgroundColor: editable ? t.surfaceAlt : t.border,
            borderColor:     focused ? colors.indigo500 : t.inputBorder,
            color:           editable ? t.text : t.textMuted,
          },
          multiline && styles.multiline,
          inputStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  required: {
    color: colors.red600,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 48,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
});
