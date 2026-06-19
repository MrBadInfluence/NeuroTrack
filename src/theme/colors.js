// NeuroTrack color palette — matches the web app exactly
export const colors = {
  // Base
  white: '#ffffff',
  black: '#000000',

  // Slate (backgrounds, text, borders)
  slate50:  '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',
  slate900: '#0f172a',

  // Indigo (Dashboard / Seizure Tracker)
  indigo50:  '#eef2ff',
  indigo100: '#e0e7ff',
  indigo200: '#c7d2fe',
  indigo400: '#818cf8',
  indigo500: '#6366f1',
  indigo600: '#4f46e5',
  indigo700: '#4338ca',
  indigo900: '#312e81',

  // Purple (Seizure Tracker accent)
  purple50:  '#faf5ff',
  purple100: '#f3e8ff',
  purple200: '#e9d5ff',
  purple500: '#a855f7',
  purple600: '#9333ea',
  purple700: '#7e22ce',

  // Emerald / Teal (Medications)
  emerald50:  '#ecfdf5',
  emerald100: '#d1fae5',
  emerald200: '#a7f3d0',
  emerald500: '#10b981',
  emerald600: '#059669',
  emerald700: '#047857',
  teal100:    '#ccfbf1',
  teal500:    '#14b8a6',
  teal600:    '#0d9488',
  teal700:    '#0f766e',
  teal900:    '#134e4a',
  cyan50:     '#ecfeff',

  // Amber / Orange (Reminders)
  amber50:   '#fffbeb',
  amber100:  '#fef3c7',
  amber200:  '#fde68a',
  amber300:  '#fcd34d',
  amber400:  '#fbbf24',
  amber500:  '#f59e0b',
  amber600:  '#d97706',
  amber700:  '#b45309',
  amber800:  '#92400e',
  amber900:  '#78350f',
  orange50:  '#fff7ed',
  orange500: '#f97316',
  orange600: '#ea580c',

  // Rose / Pink (Total Seizures stat)
  rose500: '#f43f5e',
  pink500: '#ec4899',
  rose50:  '#fff1f2',
  pink50:  '#fdf2f8',

  // Green (success / adherence)
  green50:   '#f0fdf4',
  green100:  '#dcfce7',
  green200:  '#bbf7d0',
  green600:  '#16a34a',
  green700:  '#15803d',
  green800:  '#166534',
  green900:  '#14532d',

  // Red (errors / severe / delete)
  red50:  '#fef2f2',
  red100: '#fee2e2',
  red200: '#fecaca',
  red600: '#dc2626',
  red700: '#b91c1c',
};

/**
 * Returns semantic color tokens for the current theme.
 * Use these for any value that must change between light and dark mode;
 * keep static layout values (padding, radius, flex) in StyleSheet.create.
 */
export function getTheme(isDark) {
  if (isDark) {
    return {
      // Surfaces
      surface:       '#1e293b',   // card / sheet background
      surfaceAlt:    '#0f172a',   // input / depressed background
      surfaceRaised: '#334155',   // drag handle, elevated element
      // Borders
      border:        '#334155',   // card outer border
      borderLight:   '#1e293b',   // subtle inner border
      // Text
      text:          '#f1f5f9',   // primary
      textMuted:     '#94a3b8',   // secondary
      textFaint:     '#64748b',   // tertiary / placeholder
      // Inputs
      inputBorder:   '#475569',
      // Nav chrome
      handleBg:      'rgba(255,255,255,0.08)',
      // Page-level LinearGradient backgrounds
      bgGradient:          ['#0f172a', '#1a1040', '#12082a'],
      bgGradientEmerald:   ['#0f172a', '#052013', '#041a14'],
      bgGradientAmber:     ['#0f172a', '#1c1205', '#180d00'],
      // Dashboard card-level gradient backgrounds (replaces pale light tints)
      cardGradientIndigo:  ['#1e1b4b', '#2d1b69'],
      cardGradientGreen:   ['#052a14', '#0b2a1a'],
      cardGradientAmber:   ['#291a04', '#1c1005'],
      cardGradientTeal:    ['#042a2a', '#041a1a'],
      cardBorderIndigo:    '#3730a3',
      cardBorderGreen:     '#166534',
      cardBorderAmber:     '#78350f',
      cardBorderTeal:      '#0f766e',
    };
  }
  return {
    surface:       '#ffffff',
    surfaceAlt:    '#ffffff',
    surfaceRaised: '#f8fafc',
    border:        '#f1f5f9',
    borderLight:   '#f1f5f9',
    text:          '#0f172a',
    textMuted:     '#64748b',
    textFaint:     '#94a3b8',
    inputBorder:   '#e2e8f0',
    handleBg:      'rgba(255,255,255,0.7)',
    bgGradient:          ['#f8fafc', '#eef2ff', '#faf5ff'],
    bgGradientEmerald:   ['#f8fafc', '#ecfdf5', '#f0fdfa'],
    bgGradientAmber:     ['#f8fafc', '#fffbeb', '#fff7ed'],
    cardGradientIndigo:  ['#eef2ff', '#faf5ff'],
    cardGradientGreen:   ['#f0fdf4', '#ecfdf5'],
    cardGradientAmber:   ['#fffbeb', '#fff7ed'],
    cardGradientTeal:    ['#ecfeff', '#f0fdfa'],
    cardBorderIndigo:    '#c7d2fe',
    cardBorderGreen:     '#bbf7d0',
    cardBorderAmber:     '#fde68a',
    cardBorderTeal:      '#a5f3fc',
  };
}

// Gradient pairs used throughout the app (for expo-linear-gradient)
export const gradients = {
  indigo:  ['#6366f1', '#a855f7'],   // Dashboard header / seizure
  emerald: ['#10b981', '#14b8a6'],   // Medications
  amber:   ['#f59e0b', '#f97316'],   // Reminders
  rose:    ['#f43f5e', '#ec4899'],   // Total seizures stat
  teal:    ['#14b8a6', '#06b6d4'],   // Today's doses card
  blue:    ['#6366f1', '#3b82f6'],   // Dashboard onboarding slide
  violet:  ['#8b5cf6', '#6366f1'],   // Seizure tracker onboarding
  green:   ['#10b981', '#14b8a6'],   // Perfect adherence
  bgSlate:   ['#f8fafc', '#eef2ff', '#faf5ff'],  // Dashboard / Seizure / Profile page bg (slate→indigo→purple)
  bgEmerald: ['#f8fafc', '#ecfdf5', '#f0fdfa'],  // Medications page bg (slate→emerald→teal)
  bgAmber:   ['#f8fafc', '#fffbeb', '#fff7ed'],   // Reminders page bg (slate→amber→orange)
};
