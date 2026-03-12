export const Colors = {
  // Background
  background: "#020617",
  backgroundSecondary: "#0f172a",
  card: "#0f172a",
  cardBorder: "#1e293b",

  // Primary
  primary: "#38bdf8",
  primaryDark: "#0284c7",
  primaryLight: "#7dd3fc",

  // Text
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#475569",

  // Flight Categories
  vfr: "#22c55e",       // Green
  mvfr: "#3b82f6",      // Blue
  ifr: "#ef4444",       // Red
  lifr: "#a855f7",      // Purple
  unknown: "#6b7280",   // Gray

  // Status
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#38bdf8",

  // Weather
  sunny: "#fbbf24",
  cloudy: "#94a3b8",
  rainy: "#60a5fa",
  snowy: "#e2e8f0",
  stormy: "#8b5cf6",

  // UI
  border: "#1e293b",
  inputBackground: "#0f172a",
  placeholder: "#475569",
  white: "#ffffff",
  black: "#000000",
};

export const FlightCategoryColors = {
  VFR: Colors.vfr,
  MVFR: Colors.mvfr,
  IFR: Colors.ifr,
  LIFR: Colors.lifr,
  UNKNOWN: Colors.unknown,
};

export const FlightCategoryDescriptions = {
  VFR: "Visual Flight Rules — Clear conditions",
  MVFR: "Marginal VFR — Use caution",
  IFR: "Instrument Flight Rules — Low visibility",
  LIFR: "Low IFR — Dangerous conditions",
  UNKNOWN: "Flight category unknown",
};