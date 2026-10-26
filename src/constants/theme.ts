import { Platform, StatusBar as RNStatusBar } from 'react-native';

export type ColorTheme = {
  isDark: boolean;
  primary: string;           // Light: #14382C (Deep Forest), Dark: #2D6A4F (Apple Emerald Accent)
  primaryDark: string;
  secondary: string;         // Light: #52B788 (Soft Sage), Dark: #52B788 (Vibrant Sage)
  mintBg: string;            // Light: #D8F3DC, Dark: #1A3328 (Widget Accent Tint)
  mintBorder: string;        // Light: #B7E4C7, Dark: #28543E

  surface: string;           // Main Canvas: Light #F4F6F4 (Warm Alabaster), Dark #121214 (Apple Dark Charcoal Grey)
  card: string;              // Cards/Modules: Light #FFFFFF, Dark #1C1C1E (Apple System Secondary Dark Grey)
  border: string;            // Dividers/Hairlines: Light #E5E9E7, Dark #2C2C2E (Apple Dark Hairline Grey)
  chipBg: string;            // Unselected items: Light #F4F6F4, Dark #242426 (Apple Elevated Dark Grey)

  widgetBg: string;          // Widget Hero Surface: Light #14382C, Dark #132E22 (Apple Dark Green Widget)
  widgetBorder: string;      // Widget Hero Border: Light transparent, Dark #24523F (Emerald Hairline Border)

  textPrimary: string;       // Light #111827, Dark #FFFFFF (Crisp Apple White)
  textSecondary: string;     // Light #4B5563, Dark #8E8E93 (Apple Neutral Cool Gray, NOT green)
  textMuted: string;         // Light #9CA3AF, Dark #636366 (Apple Tertiary Gray)
  textOnDark: string;        // #FFFFFF
  textOnDarkDim: string;     // Light: rgba(196, 235, 217, 0.8), Dark: rgba(220, 240, 230, 0.75)

  incomeText: string;        // Light #1A7A45, Dark #30D158 (Apple System Green)
  incomeBg: string;          // Light #F0FAF4, Dark #14241B (Apple Dark Charcoal with Green Tint)
  incomeBorder: string;      // Light #B7E4C7, Dark #1F422C

  expenseText: string;       // Light #C53030, Dark #FF453A (Apple System Red)
  expenseBg: string;         // Light #FFF5F5, Dark #261616 (Apple Dark Charcoal with Red Tint)
  expenseBorder: string;     // Light #FED7D7, Dark #482020

  warningText: string;       // Light #D97706, Dark #FFD60A (Apple System Yellow)
  warningBg: string;         // Light #FEF3C7, Dark #262214
  warningBorder: string;     // Light #FDE68A, Dark #483C1D
};

export const LIGHT_COLORS: ColorTheme = {
  isDark: false,
  primary: '#14382C',         // Deep Forest
  primaryDark: '#002218',
  secondary: '#52B788',       // Soft Sage
  mintBg: '#D8F3DC',          // Mint Frost
  mintBorder: '#B7E4C7',

  surface: '#F4F6F4',         // Warm Alabaster
  card: '#FFFFFF',            // Crisp White
  border: '#E5E9E7',          // Hairline Border
  chipBg: '#F4F6F4',

  widgetBg: '#14382C',        // Deep Forest Hero Widget
  widgetBorder: 'transparent',

  textPrimary: '#111827',     // Dark Slate Charcoal
  textSecondary: '#4B5563',   // Slate Subdued
  textMuted: '#9CA3AF',
  textOnDark: '#FFFFFF',
  textOnDarkDim: 'rgba(196, 235, 217, 0.8)',

  incomeText: '#1A7A45',
  incomeBg: '#F0FAF4',
  incomeBorder: '#B7E4C7',

  expenseText: '#C53030',
  expenseBg: '#FFF5F5',
  expenseBorder: '#FED7D7',

  warningText: '#D97706',
  warningBg: '#FEF3C7',
  warningBorder: '#FDE68A',
};

// Apple-inspired Dark Grey + Dark Green Widgets
export const DARK_COLORS: ColorTheme = {
  isDark: true,
  primary: '#2D6A4F',         // Apple Emerald Accent for Primary Buttons
  primaryDark: '#1B4332',
  secondary: '#52B788',       // Vibrant Sage Green
  mintBg: '#1A3328',          // Widget Accent Tint (Dark Green)
  mintBorder: '#28543E',

  surface: '#121214',         // Apple Dark Charcoal Grey (Main Background)
  card: '#1C1C1E',            // Apple System Secondary Dark Grey (Card Modules)
  border: '#2C2C2E',          // Apple Hairline Dark Grey Border
  chipBg: '#242426',          // Apple Elevated Tertiary Dark Grey

  widgetBg: '#132E22',        // Apple-style Dark Green Hero Widget
  widgetBorder: '#24523F',    // Subtle Emerald Hairline Border

  textPrimary: '#FFFFFF',     // Crisp High-Contrast White
  textSecondary: '#8E8E93',   // Apple Neutral System Gray (Clean, neutral)
  textMuted: '#636366',       // Apple Tertiary Gray
  textOnDark: '#FFFFFF',
  textOnDarkDim: 'rgba(220, 240, 230, 0.75)',

  incomeText: '#30D158',      // Apple System Green
  incomeBg: '#14241B',        // Dark Charcoal with subtle green tone
  incomeBorder: '#1F422C',

  expenseText: '#FF453A',     // Apple System Red
  expenseBg: '#261616',        // Dark Charcoal with subtle red tone
  expenseBorder: '#482020',

  warningText: '#FFD60A',     // Apple System Yellow
  warningBg: '#262214',
  warningBorder: '#483C1D',
};

export const COLORS = LIGHT_COLORS;

export function getThemeColors(isDark: boolean): ColorTheme {
  return isDark ? DARK_COLORS : LIGHT_COLORS;
}

export const LAYOUT = {
  statusBarHeight: Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 44,
  bottomSafeHeight: Platform.OS === 'ios' ? 34 : 0,
  tabHeight: 56,
  screenGutter: 16,
} as const;

export const SHADOWS = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  modal: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
} as const;
