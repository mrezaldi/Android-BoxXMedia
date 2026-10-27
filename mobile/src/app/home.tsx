import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ActionCard } from '../components/ActionCard';
import { AppHeader } from '../components/AppHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { SegmentedTabs, type SegmentedTabItem } from '../components/SegmentedTabs';
import { APP_NAME } from '../constants';
import { spacing } from '../theme/layout';

/**
 * Home.
 *
 * Replaces `MainActivity` + `AudioFragment` + `VideoFragment` +
 * `ViewpagerAdapter`. Two tabs did not warrant a pager dependency, so the tabs
 * are local state and the cards are one component instead of two near-identical
 * fragments with copy-pasted permission code.
 */
const TABS = [
  { key: 'audio', label: 'Audio' },
  { key: 'video', label: 'Video' },
] as const satisfies readonly SegmentedTabItem<string>[];

type HomeTab = (typeof TABS)[number]['key'];

export default function HomeScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<HomeTab>('audio');

  return (
    <ScreenContainer>
      <AppHeader title={APP_NAME} subtitle="Pick a media source" />

      <View style={styles.body}>
        <SegmentedTabs items={TABS} value={tab} onChange={setTab} />

        <View style={styles.cards}>
          {tab === 'audio' ? (
            <>
              <ActionCard
                title="Raw Audio"
                description="Play songs stored on this device"
                icon="musical-notes"
                onPress={() => router.push('/device-audio')}
              />
              <ActionCard
                title="URL Audio"
                description="Save and stream audio from a link"
                icon="globe"
                onPress={() => router.push('/url/audio')}
              />
            </>
          ) : (
            <>
              <ActionCard
                title="Raw Video"
                description="Play videos stored on this device"
                icon="videocam"
                onPress={() => router.push('/device-video')}
              />
              <ActionCard
                title="URL Video"
                description="Save and stream video from a link"
                icon="cloud-download"
                onPress={() => router.push('/url/video')}
              />
            </>
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  cards: {
    flex: 1,
    gap: spacing.lg,
  },
});
