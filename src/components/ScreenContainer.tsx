import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors } from '../theme/colors';

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: readonly Edge[];
}

/** Themed, safe-area aware page background. */
export function ScreenContainer({
  children,
  style,
  edges = ['top', 'bottom'],
}: ScreenContainerProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={edges}>
      <View style={[styles.content, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
