/**
 * Palette carried over from the original Android app
 * (`app/src/main/res/values/colors.xml`), extended with the few extra
 * tones the React Native screens need (borders, muted text, states).
 */
export const colors = {
  /** colorPrimary */
  primary: '#0B0225',
  /** colorPrimaryLight */
  primaryLight: '#312D4D',
  /** colorPrimaryDark */
  primaryDark: '#000000',
  /** colorAccent */
  accent: '#FF7700',
  /** textClr - the cyan used for (almost) all text in the original app */
  text: '#0FFFFF',

  /** Screen background */
  background: '#0B0225',
  /** Cards and list rows */
  surface: '#312D4D',
  /** Slightly darker surface used for nested/inset blocks */
  surfaceMuted: '#241F3D',
  /** Hairlines between rows */
  border: '#463F63',
  /** Secondary text (artists, durations, urls) */
  textMuted: '#9C93C7',
  /** Destructive actions */
  danger: '#FF5C5C',
  /** Positive confirmations */
  success: '#4CD97B',
  /** Backdrop behind modals/full screen players */
  overlay: 'rgba(0, 0, 0, 0.55)',
} as const;

export type AppColor = keyof typeof colors;
