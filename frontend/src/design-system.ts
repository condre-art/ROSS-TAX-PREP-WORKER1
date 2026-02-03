/**
 * Ross Tax Prep & Bookkeeping - Design System
 * Complete branding, colors, typography, and component specifications
 */

export const BRAND = {
  name: "Ross Tax Prep & Bookkeeping",
  shortName: "Ross Tax",
  tagline: "Professional Tax & Bookkeeping Services",
  ein: "33-4891499",
  phone: "(512) 489-6749",
  email: "info@rosstaxprepandbookkeeping.com",
  website: "https://www.rosstaxprepandbookkeeping.com",
  address: "2509 Cody Poe Rd, Killeen, TX 76549"
};

export const COLORS = {
  // Primary Brand Colors
  navy: {
    50: "#f0f4f9",
    100: "#d9e4f0",
    200: "#b3c9e1",
    300: "#8caed2",
    400: "#6693c3",
    500: "#4078b4",  // Primary Navy
    600: "#2f5a8f",
    700: "#1f3d6a",
    800: "#0f2145",
    900: "#051220"
  },
  
  // Accent Colors
  gold: {
    50: "#fef9f0",
    100: "#fce8ce",
    200: "#fad69c",
    300: "#f7c46a",
    400: "#f5b238",
    500: "#f3a006",  // Primary Gold
    600: "#d18d04",
    700: "#ae7a03",
    800: "#8b6702",
    900: "#685401"
  },
  
  // Secondary Colors
  grey: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827"
  },
  
  // Status Colors
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
  
  // Neutral
  white: "#ffffff",
  black: "#000000",
  
  // Functional
  background: "#f9fafb",
  surface: "#ffffff",
  border: "#e5e7eb",
  text: {
    primary: "#111827",
    secondary: "#6b7280",
    tertiary: "#9ca3af",
    light: "#ffffff"
  }
};

export const TYPOGRAPHY = {
  fontFamily: {
    sans: "'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif",
    serif: "'Georgia', serif",
    mono: "'Courier New', monospace"
  },
  
  fontSize: {
    xs: "12px",
    sm: "14px",
    base: "16px",
    lg: "18px",
    xl: "20px",
    "2xl": "24px",
    "3xl": "30px",
    "4xl": "36px"
  },
  
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800
  },
  
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2
  }
};

export const SPACING = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  "2xl": "48px",
  "3xl": "64px"
};

export const SHADOWS = {
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
  "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
};

export const BORDERS = {
  radius: {
    none: "0",
    sm: "2px",
    md: "4px",
    lg: "8px",
    xl: "12px",
    full: "9999px"
  },
  
  width: {
    thin: "1px",
    normal: "2px",
    thick: "3px"
  }
};

export const COMPONENTS = {
  button: {
    primary: {
      bg: COLORS.navy[500],
      text: COLORS.white,
      hover: COLORS.navy[600],
      active: COLORS.navy[700]
    },
    secondary: {
      bg: COLORS.gold[500],
      text: COLORS.navy[900],
      hover: COLORS.gold[600],
      active: COLORS.gold[700]
    },
    outline: {
      bg: "transparent",
      text: COLORS.navy[500],
      border: COLORS.navy[500],
      hover: COLORS.navy[50]
    }
  },
  
  card: {
    bg: COLORS.white,
    border: COLORS.border,
    shadow: SHADOWS.md,
    borderRadius: BORDERS.radius.lg
  },
  
  input: {
    bg: COLORS.white,
    border: COLORS.border,
    focusBorder: COLORS.navy[500],
    placeholder: COLORS.grey[400],
    text: COLORS.text.primary
  }
};

export const BREAKPOINTS = {
  xs: "320px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px"
};

export const Z_INDEX = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  backdrop: 1040,
  modal: 1050,
  tooltip: 1060
};
