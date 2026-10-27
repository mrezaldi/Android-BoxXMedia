import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '../theme/colors';

export type IconName = keyof typeof Ionicons.glyphMap;

interface IconButtonProps {
  name: IconName;
  onPress: () => void;
  /** Required: these are icon-only controls. */
  accessibilityLabel: string;
  size?: number;
  color?: string;
  /** Draws a filled circular background; use for the primary transport button. */
  filled?: boolean;
  /** Highlights the button as toggled on. */
  active?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  name,
  onPress,
  accessibilityLabel,
  size = 26,
  color,
  filled = false,
  active = false,
  disabled = false,
  style,
}: IconButtonProps) {
  const resolvedColor = color ?? (active ? colors.accent : colors.text);
  const circleSize = size + 22;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, selected: active }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        filled && {
          width: circleSize,
          height: circleSize,
          borderRadius: circleSize / 2,
          backgroundColor: colors.accent,
        },
        (pressed || active) && !filled && styles.pressed,
        pressed && filled && styles.pressedFilled,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Ionicons
        name={name}
        size={size}
        color={filled ? colors.primaryDark : resolvedColor}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  pressed: {
    opacity: 0.6,
  },
  pressedFilled: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.35,
  },
});
