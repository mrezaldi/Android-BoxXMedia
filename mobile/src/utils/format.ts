/**
 * Formatting helpers.
 *
 * The original app rendered times as `"%d min, %d sec"`. We use the far more
 * conventional `m:ss` / `h:mm:ss` clock format instead, and derive a display
 * title from the file name because the cross-platform media library API does
 * not expose a trustworthy title/artist field.
 */

/** Formats a duration in seconds as `m:ss`, or `h:mm:ss` past one hour. */
export function formatDuration(totalSeconds: number | null | undefined): string {
  const seconds = Number(totalSeconds);

  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '0:00';
  }

  const whole = Math.floor(seconds);
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const secs = whole % 60;

  const paddedSecs = String(secs).padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${paddedSecs}`;
  }

  return `${minutes}:${paddedSecs}`;
}

/**
 * Turns a media file name into something readable:
 * `My_Song.mp3` -> `My Song`.
 */
export function formatMediaTitle(fileName: string | null | undefined): string {
  if (!fileName) {
    return 'Untitled';
  }

  const withoutExtension = fileName.replace(/\.[^./\\]+$/, '');
  const spaced = withoutExtension.replace(/[_]+/g, ' ').trim();

  return spaced.length > 0 ? spaced : 'Untitled';
}
