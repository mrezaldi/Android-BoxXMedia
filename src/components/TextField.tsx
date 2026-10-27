import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors } from '../theme/colors';
import { fontSize, radius, spacing } from '../theme/layout';

interface TextFieldProps extends TextInputProps {
  label: string;
  /** Rendered under the input; also turns the border red. */
  error?: string | null;
}

/**
 * Labelled text input.
 *
 * The original used `et.setError(...)` on a bare `EditText`, which only shows
 * a bubble on focus. This keeps the message visible next to the field.
 */
export function TextField({ label, error, style, ...inputProps }: TextFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        {...inputProps}
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, !!error && styles.inputError, style]}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    color: colors.text,
    fontSize: fontSize.body,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  inputError: {
    borderColor: colors.danger,
    borderWidth: 1,
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.caption,
  },
});
