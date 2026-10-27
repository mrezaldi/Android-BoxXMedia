import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';

import { DATABASE_NAME, migrateDbIfNeeded } from '../db/database';
import { AudioPlayerProvider } from '../state/AudioPlayerContext';
import { colors } from '../theme/colors';

/**
 * Root layout.
 *
 * `expo-router` already wraps the tree in `SafeAreaProvider`, so screens only
 * need `ScreenContainer` for the themed insets.
 *
 * The database provider and the audio player provider live here (above the
 * navigator) on purpose:
 *  - the database is opened once for the whole app, like `DbMediaHelper`;
 *  - the player survives navigation, which is what `SongService` used to do.
 */
export default function RootLayout() {
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDbIfNeeded}>
      <AudioPlayerProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        />
      </AudioPlayerProvider>
    </SQLiteProvider>
  );
}
