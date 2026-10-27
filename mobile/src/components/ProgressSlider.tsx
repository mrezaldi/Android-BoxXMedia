import Slider from '@react-native-community/slider';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { fontSize, spacing } from '../theme/layout';
import { formatDuration } from '../utils/format';

interface ProgressSliderProps {
  positionSec: number;
  durationSec: number;
  onSeek: (seconds: number) => void;
  disabled?: boolean;
}

/**
 * Seek bar.
 *
 * Replaces the `SeekBar` in `activity_raw_audio.xml` plus the `Handler`
 * (`myHandler.postDelayed(UpdateSongTime, 100)`) that pushed `setProgress` on
 * the UI thread every 100 ms. Here the position comes from the player status
 * subscription and the slider only interpolates while the user drags.
 */
export function ProgressSlider({
  positionSec,
  durationSec,
  onSeek,
  disabled = false,
}: ProgressSliderProps) {
  const [scrubbing, setScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);

  const maximum = durationSec > 0 ? durationSec : 1;
  const displayed = scrubbing ? scrubValue : Math.min(Math.max(positionSec, 0), maximum);

  return (
    <View style={styles.container}>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={maximum}
        value={displayed}
        disabled={disabled || durationSec <= 0}
        minimumTrackTintColor={colors.accent}
        maximumTrackTintColor={colors.border}
        thumbTintColor={colors.accent}
        onSlidingStart={() => {
          setScrubValue(displayed);
          setScrubbing(true);
        }}
        onValueChange={setScrubValue}
        onSlidingComplete={(value) => {
          setScrubbing(false);
          onSeek(value);
        }}
      />

      <View style={styles.times}>
        <Text style={styles.time}>{formatDuration(displayed)}</Text>
        <Text style={styles.time}>{formatDuration(durationSec)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  slider: {
    width: '100%',
    height: 34,
  },
  times: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  time: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
    fontVariant: ['tabular-nums'],
  },
});
