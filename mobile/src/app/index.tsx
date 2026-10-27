import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { APP_NAME, SPLASH_DURATION_MS } from '../constants';
import { colors } from '../theme/colors';
import { fontSize, radius, spacing } from '../theme/layout';

/**
 * Splash screen.
 *
 * Replaces `SplashScreenActivity`, which showed the logo for 3 seconds via
 * `Handler.postDelayed` and then started `MainActivity`. Same 3 second delay
 * here, but `router.replace` keeps it out of the back stack.
 *
 * The logo mark is rebuilt with views (rounded square + play glyph) to match
 * the original `ic_logo` vector: cyan glyph on the `#312D4D` square.
 */
export default function SplashScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/home');
    }, SPLASH_DURATION_MS);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Ionicons name="play" size={64} color={colors.text} />
      </View>

      <Text style={styles.appName}>{APP_NAME}</Text>
      <Text style={styles.tagline}>Local &amp; streaming media player</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    gap: spacing.md,
  },
  logo: {
    width: 168,
    height: 168,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    borderWidth: 4,
    borderColor: colors.text,
    marginBottom: spacing.lg,
  },
  appName: {
    color: colors.text,
    fontSize: fontSize.hero,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tagline: {
    color: colors.textMuted,
    fontSize: fontSize.body,
  },
});
