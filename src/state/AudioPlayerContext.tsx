import {
  requestNotificationPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';

import { APP_NAME } from '../constants';
import type { AudioTrack, RepeatMode } from '../types/media';

/**
 * Shared audio player state.
 *
 * This one provider replaces `SongService` plus the pile of loose booleans in
 * `RawAudioActivity` (`statusPlayingSong`, `statusShuffle`, `statusRepeat`,
 * `paused`, `playbackPaused`, `oneTimeOnly`, ...). The service lived in the
 * Activity layer, so the UI had to hand-sync its own copy of the player state;
 * here the player *is* the single source of truth and every screen observes it.
 *
 * Responsibilities ported from the service:
 *  - queue + next/previous navigation
 *  - play / pause / stop / seek
 *  - shuffle and repeat
 *  - background playback (audio mode + lock screen controls), which takes the
 *    place of the hand-rolled `Notification` + `MediaSession` code
 *
 * Two contexts are exposed on purpose: `AudioControlsContext` only carries
 * stable callbacks, so screens that just need buttons do not re-render on
 * every 500 ms position tick.
 */

interface AudioControls {
  /** Loads `tracks` as the current queue and starts playing. */
  playQueue: (tracks: AudioTrack[], startIndex?: number) => void;
  togglePlayPause: () => void;
  playNext: () => void;
  playPrevious: () => void;
  stop: () => void;
  seekTo: (seconds: number) => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
}

interface AudioPlayback {
  currentTrack: AudioTrack | null;
  queue: AudioTrack[];
  isPlaying: boolean;
  isBuffering: boolean;
  isLoaded: boolean;
  positionSec: number;
  durationSec: number;
  shuffleEnabled: boolean;
  repeatMode: RepeatMode;
  error: string | null;
}

const AudioControlsContext = createContext<AudioControls | null>(null);
const AudioPlaybackContext = createContext<AudioPlayback | null>(null);

/** Fisher-Yates on a copy of `indices`. */
function shuffled(indices: number[]): number[] {
  const result = [...indices];

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  // A single player for the whole app lifetime; sources are swapped with
  // `replace()` so playback survives navigating between screens.
  const player = useAudioPlayer(null, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);

  const [queue, setQueue] = useState<AudioTrack[]>([]);
  /** Play order over `queue`, e.g. `[3, 0, 9, 1]` when shuffle is on. */
  const [order, setOrder] = useState<number[]>([]);
  /** Position inside `order` (not inside `queue`). */
  const [orderIndex, setOrderIndex] = useState(0);
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');

  // Refs mirror the state so callbacks and player event handlers always read
  // the newest values without being re-created on every state change.
  const queueRef = useRef<AudioTrack[]>(queue);
  const orderRef = useRef<number[]>(order);
  const orderIndexRef = useRef(orderIndex);
  const repeatModeRef = useRef<RepeatMode>(repeatMode);
  const playingRef = useRef(status.playing);
  const positionRef = useRef(status.currentTime);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    orderRef.current = order;
  }, [order]);

  useEffect(() => {
    orderIndexRef.current = orderIndex;
  }, [orderIndex]);

  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);

  useEffect(() => {
    playingRef.current = status.playing;
  }, [status.playing]);

  useEffect(() => {
    positionRef.current = status.currentTime;
  }, [status.currentTime]);

  /* ------------------------------------------------------------------ audio mode */

  useEffect(() => {
    void (async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          // Required for the lock screen controls to bind to this player.
          interruptionMode: 'doNotMix',
          allowsRecording: false,
        });

        if (Platform.OS === 'android') {
          // Throws on other platforms, hence the explicit platform check.
          await requestNotificationPermissionsAsync();
        }
      } catch {
        // Background playback is a nice-to-have; foreground playback still works.
      }
    })();
  }, []);

  /* --------------------------------------------------------------- queue control */

  const startPlaybackAt = useCallback(
    (orderPosition: number) => {
      const track = queueRef.current[orderRef.current[orderPosition]];

      if (!track) {
        return;
      }

      orderIndexRef.current = orderPosition;
      setOrderIndex(orderPosition);

      player.replace({ uri: track.uri, name: track.title });
      player.play();
    },
    [player]
  );

  const playQueue = useCallback(
    (tracks: AudioTrack[], startIndex = 0) => {
      if (tracks.length === 0) {
        return;
      }

      const safeStart = Math.min(Math.max(startIndex, 0), tracks.length - 1);
      const allIndices = tracks.map((_, index) => index);

      let nextOrder = allIndices;
      let nextPosition = safeStart;

      if (shuffleEnabled) {
        nextOrder = [safeStart, ...shuffled(allIndices.filter((i) => i !== safeStart))];
        nextPosition = 0;
      }

      queueRef.current = tracks;
      orderRef.current = nextOrder;
      setQueue(tracks);
      setOrder(nextOrder);

      startPlaybackAt(nextPosition);
    },
    [shuffleEnabled, startPlaybackAt]
  );

  const playNext = useCallback(
    (fromAutoAdvance = false) => {
      const currentOrder = orderRef.current;

      if (currentOrder.length === 0) {
        return;
      }

      const nextPosition = orderIndexRef.current + 1;

      if (nextPosition < currentOrder.length) {
        startPlaybackAt(nextPosition);
        return;
      }

      if (fromAutoAdvance && repeatModeRef.current === 'off') {
        // End of the queue: park on the first track instead of looping.
        player.pause();
        void player.seekTo(0);
        orderIndexRef.current = 0;
        setOrderIndex(0);
        return;
      }

      startPlaybackAt(0);
    },
    [player, startPlaybackAt]
  );

  const playPrevious = useCallback(() => {
    const currentOrder = orderRef.current;

    if (currentOrder.length === 0) {
      return;
    }

    // Same convention as most players: restart the track when past 3 seconds.
    if (positionRef.current > 3) {
      void player.seekTo(0);
      return;
    }

    const previousPosition = orderIndexRef.current - 1;
    startPlaybackAt(previousPosition < 0 ? currentOrder.length - 1 : previousPosition);
  }, [player, startPlaybackAt]);

  const togglePlayPause = useCallback(() => {
    if (queueRef.current.length === 0) {
      return;
    }

    if (playingRef.current) {
      player.pause();
      return;
    }

    player.play();
  }, [player]);

  const stop = useCallback(() => {
    player.pause();
    void player.seekTo(0);

    try {
      player.clearLockScreenControls();
    } catch {
      // Nothing to clear when the platform never registered controls.
    }

    orderIndexRef.current = 0;
    setOrderIndex(0);
  }, [player]);

  const seekTo = useCallback(
    (seconds: number) => {
      if (!Number.isFinite(seconds) || seconds < 0) {
        return;
      }

      void player.seekTo(seconds);
    },
    [player]
  );

  const toggleShuffle = useCallback(() => {
    setShuffleEnabled((enabled) => {
      const next = !enabled;
      const currentQueueIndex = orderRef.current[orderIndexRef.current] ?? 0;
      const allIndices = queueRef.current.map((_, index) => index);

      const nextOrder = next
        ? [currentQueueIndex, ...shuffled(allIndices.filter((i) => i !== currentQueueIndex))]
        : allIndices;

      orderRef.current = nextOrder;
      orderIndexRef.current = 0;
      setOrder(nextOrder);
      setOrderIndex(0);

      return next;
    });
  }, []);

  const cycleRepeatMode = useCallback(() => {
    setRepeatMode((mode) => (mode === 'off' ? 'all' : mode === 'all' ? 'one' : 'off'));
  }, []);

  /* ----------------------------------------------------------------- auto advance */

  const finishedHandledRef = useRef(false);

  useEffect(() => {
    // Subscribing to the player's own event stream means the advance happens
    // from a native event callback rather than a render-effect cascade.
    const subscription = player.addListener('playbackStatusUpdate', (update) => {
      if (!update.didJustFinish) {
        finishedHandledRef.current = false;
        return;
      }

      if (finishedHandledRef.current) {
        return;
      }

      finishedHandledRef.current = true;

      if (repeatModeRef.current === 'one') {
        void player.seekTo(0);
        player.play();
        return;
      }

      playNext(true);
    });

    return () => {
      subscription.remove();
    };
  }, [playNext, player]);

  /* --------------------------------------------------------------- current track */

  const currentTrack = useMemo<AudioTrack | null>(() => {
    const queueIndex = order[orderIndex];

    return queueIndex === undefined ? null : (queue[queueIndex] ?? null);
  }, [order, orderIndex, queue]);

  // Keep the lock screen / media notification in sync with the current track.
  useEffect(() => {
    if (!currentTrack) {
      return;
    }

    try {
      player.setActiveForLockScreen(true, {
        title: currentTrack.title,
        artist: APP_NAME,
      });
    } catch {
      // Lock screen metadata is best-effort.
    }
  }, [currentTrack, player]);

  /* -------------------------------------------------------------------- contexts */

  const controlsValue = useMemo<AudioControls>(
    () => ({
      playQueue,
      togglePlayPause,
      playNext: () => playNext(false),
      playPrevious,
      stop,
      seekTo,
      toggleShuffle,
      cycleRepeatMode,
    }),
    [
      cycleRepeatMode,
      playNext,
      playPrevious,
      playQueue,
      seekTo,
      stop,
      togglePlayPause,
      toggleShuffle,
    ]
  );

  const playbackValue = useMemo<AudioPlayback>(
    () => ({
      currentTrack,
      queue,
      isPlaying: status.playing,
      isBuffering: status.isBuffering,
      isLoaded: status.isLoaded,
      positionSec: status.currentTime ?? 0,
      durationSec: status.duration > 0 ? status.duration : (currentTrack?.durationSec ?? 0),
      shuffleEnabled,
      repeatMode,
      error: status.error ?? null,
    }),
    [currentTrack, queue, repeatMode, shuffleEnabled, status]
  );

  return (
    <AudioControlsContext.Provider value={controlsValue}>
      <AudioPlaybackContext.Provider value={playbackValue}>
        {children}
      </AudioPlaybackContext.Provider>
    </AudioControlsContext.Provider>
  );
}

/** Stable player commands. */
export function useAudioControls(): AudioControls {
  const context = useContext(AudioControlsContext);

  if (!context) {
    throw new Error('useAudioControls must be used inside <AudioPlayerProvider>.');
  }

  return context;
}

/** Live playback state (updates roughly every 500 ms while playing). */
export function useAudioPlayback(): AudioPlayback {
  const context = useContext(AudioPlaybackContext);

  if (!context) {
    throw new Error('useAudioPlayback must be used inside <AudioPlayerProvider>.');
  }

  return context;
}
