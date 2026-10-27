/** Spacing scale (dp). Mirrors the original `dimens.xml` values and extends them. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** Corner radii. `cardCornerRadius="8dp"` in the original layouts. */
export const radius = {
  sm: 6,
  md: 8,
  lg: 14,
  xl: 20,
  pill: 999,
} as const;

/** Type scale (sp). */
export const fontSize = {
  caption: 12,
  body: 15,
  bodyLarge: 17,
  heading: 20,
  title: 24,
  hero: 34,
} as const;
