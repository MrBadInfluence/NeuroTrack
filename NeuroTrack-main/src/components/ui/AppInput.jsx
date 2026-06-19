/**
 * AppInput — labelled text input with focus highlight
 *
 * Props: label, value, onChangeText, placeholder, multiline,
 *        keyboardType, secureTextEntry, editable, required
 * Border turns indigo when the field is focused; dims when editable=false.
 */

import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

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

  return (
    <View style={[styles.wrapper, style]}>
      {label && (
        <Text style={styles.label}>
          {label}{required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.slate400}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        editable={editable}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.input,
          multiline && styles.multiline,
          focused && styles.focused,
          !editable && styles.disabled,
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
    color: colors.slate700,
    marginBottom: 6,
  },
  required: {
    color: colors.red600,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.slate200,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.slate900,
    minHeight: 48,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  focused: {
    borderColor: colors.indigo500,
  },
  disabled: {
    backgroundColor: colors.slate50,
    color: colors.slate400,
  },
});
