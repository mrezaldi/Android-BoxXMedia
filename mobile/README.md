# BoxXMedia — React Native rewrite

A React Native (Expo) rewrite of the original Android/Java **BoxXMedia** app: play audio and video
stored on the device, and save + stream audio and video from URLs.

The original Android project is untouched in the repository root (`app/`, `build.gradle`, ...), so
both versions can be diffed side by side.

---

## Stack

| Concern | Choice | Replaces |
| --- | --- | --- |
| Framework | Expo SDK 58 / React Native 0.88 / React 19.3, TypeScript (strict) | Java + Android SDK 28 |
| Navigation | `expo-router` (file based, `src/app`) | `Activity` + `Intent` + `startActivityForResult` |
| Device media | `expo-media-library` | `ContentResolver` + `MediaStore.Audio/Video` |
| Audio playback | `expo-audio` | ExoPlayer (`SimpleExoPlayer`) + `MediaPlayer` + `SongService` |
| Video playback | `expo-video` | ExoPlayer (`PlayerView`) |
| Local data | `expo-sqlite` | `SQLiteOpenHelper` |
| State | React Context + hooks | `ServiceConnection` + `Binder` + loose booleans |
| UI | Plain RN components + `@expo/vector-icons` | XML layouts + `RecyclerView` adapters + ButterKnife |

Everything is a first-party Expo module except `@react-native-community/slider` (seek bar) and
`@expo/vector-icons`, both of which are part of the Expo SDK's supported set.

---

## Getting started

```bash
cd mobile
npm install
npm run typecheck     # tsc --noEmit
npm run lint          # expo lint
npm run android       # or: npm run ios
```

### Use a development build, not Expo Go

Two things this app needs are configured natively and are **not** available in Expo Go:

* background audio playback (the `expo-audio` plugin, `enableBackgroundPlayback: true`);
* the granular `READ_MEDIA_AUDIO` / `READ_MEDIA_VIDEO` Android permissions.

Build a development client once:

```bash
npx expo run:android     # or: npx expo run:ios
```

Expo Go will still open the app and show the UI, but background playback and the media
permission prompts will not behave correctly.

---

## Project structure

```
mobile/
  src/
    app/                       # routes (one file = one screen)
      _layout.tsx              # SQLiteProvider + AudioPlayerProvider + Stack
      index.tsx                # splash -> /home
      home.tsx                 # Audio | Video tabs, four source cards
      device-audio.tsx         # device songs + mini player
      device-video.tsx         # device videos
      url/[kind]/index.tsx     # saved URL entries (kind = audio | video)
      url/[kind]/edit.tsx      # add / edit / delete an entry
      player/audio.tsx         # URL audio player (shared player, whole list as queue)
      player/video.tsx         # video player (device or URL, HLS/DASH hint)
    components/                # presentational building blocks
    db/                        # database bootstrap + URL media repository
    services/mediaLibrary.ts   # device audio/video discovery
    state/AudioPlayerContext.tsx
    theme/                     # colours ported from colors.xml + spacing/type scale
    types/media.ts             # domain types
    utils/                     # formatting + route-param helpers
```

Non-route code never lives under `src/app`, per this project's `AGENTS.md`.

---

## Screen mapping

| Original | New |
| --- | --- |
| `SplashScreenActivity` (`Handler` 3 s) | `src/app/index.tsx` (`setTimeout` → `router.replace('/home')`) |
| `MainActivity` + `TabLayout` + `ViewPager` + `ViewpagerAdapter` | `src/app/home.tsx` + `SegmentedTabs` |
| `AudioFragment` / `VideoFragment` + `fragment_audio.xml` / `fragment_video.xml` | `src/app/home.tsx` + `ActionCard` (one component, not two duplicated fragments) |
| `RawAudioActivity` + `SongService` + `SongRawAdapter` + `item_song.xml` | `src/app/device-audio.tsx` + `DeviceAudioRow` + `AudioPlayerContext` |
| `PlayerAudioActivity` (throwaway ExoPlayer) | `src/app/player/audio.tsx` (shared player, whole saved list as the queue) |
| `UrlAudioActivity` + `LoadUrlAudioAsync` + `SongUrlAdapter` + `item_url_song.xml` | `src/app/url/[kind]/index.tsx` + `UrlMediaRow` |
| `EditUrlSongActivity` | `src/app/url/[kind]/edit.tsx` |
| `RawVideoActivity` + `MovieRawAdapter` + `item_movie.xml` | `src/app/device-video.tsx` + `DeviceVideoRow` |
| `PlayerVideoActivity` + `Util.inferContentType` branching | `src/app/player/video.tsx` + `inferContentType` |
| `UrlVideoActivity` + `LoadUrlVideoAsync` + `MovieUrlAdapter` + `item_url_video.xml` | `src/app/url/[kind]/index.tsx` + `UrlMediaRow` |
| `EditUrlMovieActivity` | `src/app/url/[kind]/edit.tsx` |
| `DbMediaHelper` / `SongUrlHelper` / `VideoUrlHelper` | `src/db/database.ts` + `src/db/urlMediaRepo.ts` |
| `Song` / `Movie` / `SongUrl` / `MovieUrl` (`Parcelable`) | `AudioTrack` / `DeviceVideoTrack` / `UrlMedia` in `src/types/media.ts` |
| `ItemClickSupport` | `onPress` on a `Pressable` |
| Share `ACTION_SEND` intent | `Share.share` |
| `SongUrlAdapter` / `MovieUrlAdapter` duplicated item layouts | one `UrlMediaRow` |

### Data model

The original used two tables in `dbMedia`:

```sql
CREATE TABLE table_song  (_id, title_song, url_song);
CREATE TABLE table_video (_id, title_video, url_song);   -- note the column name
```

The rewrite uses `url_audio` and `url_video`, both `(id, title, url, created_at)`, versioned through
`PRAGMA user_version`. `created_at` is new; it gives lists a stable secondary sort.

---

## Bugs fixed

These are defects in the original code that the rewrite does not carry over. Each one was confirmed
by reading the Java source.

1. **The video URL column was named `url_song`.** `DbMediaContract.VideoColumns.URL_VIDEO` was
   declared as `"url_song"`, so the video table stored its URL in a column named after songs.
2. **The "add URL entry" form could not be saved after one validation error.**
   `EditUrlSongActivity` / `EditUrlMovieActivity` kept `isEmpty` as an Activity field and never reset
   it before validating, so the first failed save poisoned every later attempt.
3. **Saved entries could never be deleted.** `showAlertDialog(ALERT_DIALOG_DELETE)` existed but no UI
   ever called it. There is now a Delete button with confirmation.
4. **The discard dialog appeared over a finishing screen.** `onBackPressed()` called
   `super.onBackPressed()` *before* showing the dialog.
5. **Cursors were leaked.** `RawAudioActivity.getListSongs()` and `RawVideoActivity.getListMovie()`
   never closed their `Cursor`.
6. **Shuffle could never be enabled.** `SongService.setShuffle()` and `unsetShuffle()` both set
   `shuffle = false`.
7. **`playNext()` threw at the end of the queue.** The guard was `songPosition > songs.size()`; at
   `songs.size()` the following `songs.get(...)` is out of bounds. It should have been `>=`.
8. **The phone-state listener was registered but the field was never assigned.**
   `callStateListener()` shadowed the class fields with locals, so the listener was never
   unregistered in `onDestroy`.
9. **`onDestroy()` could crash.** `removeAudioFocus()` ran unconditionally while `audioManager` is
   only assigned inside `requestAudioFocus()`, which is skipped when no song was ever played.
10. **The whole process was killed to leave the player.** `RawAudioActivity.onBackPressed()` and the
    `action_end` menu item called `System.exit(0)`.
11. **SQL built by string concatenation.** Both helpers used
    `_ID + "= '" + id + "'"`. The repository uses bound parameters everywhere.
12. **The seek bar timer outlived its screen.** A 100 ms `Handler` loop (`oneTimeOnly` was even a
    `static` field shared across instances) was never cancelled. Position now comes from the
    player's status subscription.
13. **Over-broad manifest permissions.** `WRITE_CALENDAR`, `WRITE_EXTERNAL_STORAGE` and
    `RECEIVE_BOOT_COMPLETED` were declared although nothing in the app writes a calendar, writes to
    external storage or listens for boot. The rewrite requests only audio and video read access
    (Android 13+ granular permissions).

## Improvements

* **One source of truth for playback.** `SongService` lived in the Activity layer and the UI kept
  its own mirrored booleans (`statusPlayingSong`, `statusShuffle`, `statusRepeat`, `paused`,
  `playbackPaused`). The player context owns the queue, index and modes; screens only observe.
* **Playback survives navigation.** Audio keeps playing across screens and in the background, with
  Android lock screen / notification controls from `setActiveForLockScreen`.
* **URL audio gets the same treatment as device audio.** The original played a URL with a disposable
  `SimpleExoPlayer` that died with the Activity; now the whole saved list becomes the queue, so
  next/previous, shuffle, repeat and background playback all work for streaming too.
* **Real shuffle and repeat.** Shuffle builds a proper play order (Fisher-Yates, current track kept
  first) and repeat cycles `off → all → one`. The original toggled an icon and did nothing.
* **Two contexts instead of one.** Controls (stable callbacks) are separate from playback state, so
  screens with only buttons do not re-render every 500 ms.
* **Duplicate screens collapsed.** The audio and video URL lists/forms were four near-identical
  Activities; they are one parameterised route plus `kind`.
* **Proper list states.** Loading, empty, permission-denied and error states with actions, instead
  of a Snackbar over an empty list.
* **Input validation that survives.** Errors are computed per submit, plus a URL scheme check, and a
  "discard changes?" confirmation.
* **TypeScript end to end**, including `strict`, verified with `tsc --noEmit`.

---

## Verifications performed

Run in this workspace, all passing:

| Check | Command | Result |
| --- | --- | --- |
| Types | `npx tsc --noEmit` | exit 0, no diagnostics |
| Lint | `npx eslint .` | exit 0, 0 problems |
| Expo health | `npx expo-doctor` | 20/20 checks passed |
| Bundle | `npx expo export --platform android` | exit 0, route manifest and all `src/app` routes present in the bundle |

Not verified: **anything that needs a device or emulator.** Playback, media permission prompts,
lock screen controls and the runtime SQLite migrations were never executed. Please run
`npx expo run:android` and check those.

---

## Known deviations and limitations

* **No video thumbnails.** `MovieRawAdapter` rendered a `MediaStore.Video.Thumbnails` bitmap per row.
  The cross-platform equivalent needs a video player instance per item, and `expo-video-thumbnails`
  is deprecated, so the list shows a styled placeholder tile with duration and resolution instead.
  Follow-up path: one shared `createVideoPlayer` + `player.generateThumbnailsAsync()` rendered with
  `expo-image`.
* **No artist names.** The device audio list shows duration instead of the artist. `expo-media-library`
  exposes `filename`, `duration` and dimensions but no title/artist, so titles are derived from file
  names (`My_Song.mp3` → `My Song`). The original read `MediaStore.Audio.Media.ARTIST`.
* **DASH and SmoothStreaming are Android-only.** `expo-video` supports them via a `contentType`
  hint, which `inferContentType` supplies, but they are not available on iOS.
* **The ExoPlayer offline-download layer was dropped.** `DownloadTracker`,
  `OneMediaDownloadService` and `start_download_dialog.xml` were scaffolding: `toggleDownload()` is
  never called anywhere in the original app, so there was no way to begin a download. Only
  `getOfflineStreamKeys()` was reached, to filter already-downloaded streams. `expo-video`'s
  `useCaching` source option is the natural replacement if downloads are wanted.
* **Hardware back does not warn about unsaved edits.** The header back button and Cancel do; the
  Android system back gesture exits the form directly.
* **UI copy is English**, matching the dominant language of the original labels. Its confirm dialogs
  were Indonesian ("Batal", "Apakah anda ingin membatalkan perubahan pada form?").
* **The app lives in `mobile/`**, with the Android project kept at the root for reference.

## Possible next steps

1. Promote `mobile/` to the repository root and archive the Android project, if the rewrite is to
   become the primary app.
2. Video thumbnails via `generateThumbnailsAsync` + `expo-image`.
3. Search and sort controls on the device lists.
4. Localisation (English/Indonesian) with `expo-localization`.
5. Intercept hardware back on the edit form with `usePreventRemove`.
