import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { fontSize, radius, spacing } from '../theme/layout';

export interface SegmentedTabItem<T extends string> {
  key: T;
  label: string;
}

interface SegmentedTabsProps<T extends string> {
  items: readonly SegmentedTabItem<T>[];
  value: T;
  onChange: (key: T) => void;
}

/**
 * Replaces `TabLayout` + `ViewPager` from `activity_main.xml`.
 * Two tabs do not justify a pager dependency, and this keeps the original's
 * dark segmented look.
 */
export function SegmentedTabs<T extends string>({
  items,
  value,
  onChange,
}: SegmentedTabsProps<T>) {
  return (
    <View style={styles.container}>
      {items.map((item) => {
        const selected = item.key === value;

        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={item.label}
            onPress={() => onChange(item.key)}
            style={[styles.tab, selected && styles.tabSelected]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    padding: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  tabSelected: {
    backgroundColor: colors.surface,
  },
  label: {
    color: colors.textMuted,
    fontSize: fontSize.body,
    fontWeight: '600',
  },
  labelSelected: {
    color: colors.text,
  },
});
