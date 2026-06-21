import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';

/**
 * AppButton — reusable button component
 *
 * variants:
 *   'primary'   — gradient (default)
 *   'outline'   — white bg with border
 *   'ghost'     — no bg, text only
 *   'danger'    — red gradient
 */
export default function AppButton({
  onPress,
  children,
  variant = 'primary',
  gradient = [colors.indigo600, colors.purple600],
  disabled = false,
  loading = false,
  style,
  textStyle,
  size = 'md',
}) {
  const isDisabled = disabled || loading;

  const handlePress = () => {
    if (isDisabled) return;
    Haptics.impactAsync(
      variant === 'danger'
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light,
    );
    onPress?.();
  };

  const sizeStyles = {
    sm: { paddingVertical: 8,  paddingHorizontal: 12, borderRadius: 10, fontSize: 13 },
    md: { paddingVertical: 13, paddingHorizontal: 16, borderRadius: 12, fontSize: 15 },
    lg: { paddingVertical: 16, paddingHorizontal: 20, borderRadius: 14, fontSize: 16 },
  }[size];

  const content = (
    <View style={[styles.inner]}>
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.slate700 : colors.white} size="small" />
      ) : (
        typeof children === 'string' ? (
          <Text style={[
            styles.text,
            { fontSize: sizeStyles.fontSize },
            variant === 'outline' || variant === 'ghost' ? styles.textDark : styles.textLight,
            textStyle,
          ]}>
            {children}
          </Text>
        ) : children
      )}
    </View>
  );

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[{ borderRadius: sizeStyles.borderRadius, overflow: 'hidden' }, isDisabled && styles.disabled, style]}
      >
        <LinearGradient
          colors={isDisabled ? [colors.slate300, colors.slate400] : gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.btn, { paddingVertical: sizeStyles.paddingVertical, paddingHorizontal: sizeStyles.paddingHorizontal, borderRadius: sizeStyles.borderRadius }]}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'danger') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[{ borderRadius: sizeStyles.borderRadius, overflow: 'hidden' }, isDisabled && styles.disabled, style]}
      >
        <LinearGradient
          colors={[colors.red600, colors.red700]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.btn, { paddingVertical: sizeStyles.paddingVertical, paddingHorizontal: sizeStyles.paddingHorizontal, borderRadius: sizeStyles.borderRadius }]}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'outline') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={isDisabled}
        activeOpacity={0.7}
        style={[
          styles.btn,
          styles.outline,
          { paddingVertical: sizeStyles.paddingVertical, paddingHorizontal: sizeStyles.paddingHorizontal, borderRadius: sizeStyles.borderRadius },
          isDisabled && styles.disabled,
          style,
        ]}
      >
        {content}
      </TouchableOpacity>
    );
  }

  // ghost
  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.6}
      style={[
        styles.btn,
        { paddingVertical: sizeStyles.paddingVertical, paddingHorizontal: sizeStyles.paddingHorizontal, borderRadius: sizeStyles.borderRadius },
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  text: {
    fontWeight: '600',
  },
  textLight: {
    color: colors.white,
  },
  textDark: {
    color: colors.slate700,
  },
  outline: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.slate200,
  },
  disabled: {
    opacity: 0.5,
  },
});
