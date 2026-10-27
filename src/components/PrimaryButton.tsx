import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import type { IconName } from './IconButton';
import { colors } from '../theme/colors';
import { fontSize, radius, spacing } from '../theme/layout';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function PrimaryButton({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
  loading = false,
  style,
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant].container,
        (pressed || isDisabled) && styles.dimmed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles[variant].label.color} size="small" />
      ) : (
        <>
          {icon ? (
            <Ionicons name={icon} size={18} color={variantStyles[variant].label.color} />
          ) : null}
          <Text style={[styles.label, variantStyles[variant].label]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    minHeight: 48,
  },
  dimmed: {
    opacity: 0.6,
  },
  label: {
    fontSize: fontSize.body,
    fontWeight: '700',
  },
});

const variantStyles: Record<
  ButtonVariant,
  { container: ViewStyle; label: { color: string } }
> = {
  primary: {
    container: { backgroundColor: colors.accent },
    label: { color: colors.primaryDark },
  },
  secondary: {
    container: {
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    label: { color: colors.text },
  },
  danger: {
    container: {
      backgroundColor: colors.surfaceMuted,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.danger,
    },
    label: { color: colors.danger },
  },
};
