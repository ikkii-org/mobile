import React, { createContext, useContext } from "react";

// ---------------------------------------------------------------------------
// Token definitions
// ---------------------------------------------------------------------------

export interface ThemeTokens {
    // Page background
    bg: string;
    bgDeep: string;         // deeper layer behind cards

    // Glass card surfaces (semi-transparent for glassmorphism)
    bgCard: string;         // primary card surface
    bgCardAlt: string;      // elevated / nested card
    bgInput: string;        // input field background
    bgMuted: string;        // subtle section / pill background
    bgGlass: string;        // strong glass surface (modals, hero sections)

    // Borders (semi-transparent for glass look)
    border: string;
    borderStrong: string;
    borderGlow: string;     // accent-tinted border for highlighted cards

    // Text
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textInverse: string;

    // Accent — purple brand
    accent: string;
    accentLight: string;    // darker shade for text
    accentBg: string;       // translucent tint
    accentGlow: string;     // glow shadow color (with alpha)

    // Status / semantic colors
    green: string;
    greenGlow: string;
    red: string;
    redGlow: string;
    amber: string;
    blue: string;
    grey: string;

    // Badge backgrounds
    badgeOpenBg: string;
    badgeActiveBg: string;
    badgeDisputedBg: string;
    badgeSettledBg: string;
    badgeCancelledBg: string;

    // Button variants
    btnDangerBg: string;
    btnDangerBorder: string;
    btnDangerText: string;
    btnSecondaryBorder: string;

    // Tab bar
    tabBarBg: string;
    tabBarBorder: string;
    tabBarActive: string;
    tabBarInactive: string;

    // Misc
    shadow: string;
    overlay: string;
}

// ---------------------------------------------------------------------------
// Light theme — frosted glass on white (only theme)
// ---------------------------------------------------------------------------
const THEME: ThemeTokens = {
    bg: "#F0EFFC",
    bgDeep: "#E8E7F7",

    bgCard: "rgba(255,255,255,0.75)",
    bgCardAlt: "rgba(255,255,255,0.55)",
    bgInput: "rgba(255,255,255,0.85)",
    bgMuted: "rgba(139,92,246,0.06)",
    bgGlass: "rgba(255,255,255,0.82)",

    border: "rgba(139,92,246,0.14)",
    borderStrong: "rgba(139,92,246,0.24)",
    borderGlow: "rgba(139,92,246,0.35)",

    textPrimary: "#1A1730",
    textSecondary: "#5B5680",
    textMuted: "#9B97C0",
    textInverse: "#FFFFFF",

    accent: "#7C3AED",
    accentLight: "#6D28D9",
    accentBg: "rgba(124,58,237,0.10)",
    accentGlow: "rgba(124,58,237,0.25)",

    green: "#059669",
    greenGlow: "rgba(5,150,105,0.20)",
    red: "#E11D48",
    redGlow: "rgba(225,29,72,0.20)",
    amber: "#D97706",
    blue: "#2563EB",
    grey: "#9B97C0",

    badgeOpenBg: "rgba(37,99,235,0.10)",
    badgeActiveBg: "rgba(5,150,105,0.10)",
    badgeDisputedBg: "rgba(225,29,72,0.10)",
    badgeSettledBg: "rgba(217,119,6,0.10)",
    badgeCancelledBg: "rgba(155,151,192,0.10)",

    btnDangerBg: "rgba(225,29,72,0.10)",
    btnDangerBorder: "#E11D48",
    btnDangerText: "#BE123C",
    btnSecondaryBorder: "rgba(124,58,237,0.25)",

    tabBarBg: "rgba(240,239,252,0.95)",
    tabBarBorder: "rgba(139,92,246,0.12)",
    tabBarActive: "#7C3AED",
    tabBarInactive: "#9B97C0",

    shadow: "rgba(139,92,246,0.15)",
    overlay: "rgba(0,0,0,0.45)",
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ThemeContext = createContext<ThemeTokens>(THEME);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    return (
        <ThemeContext.Provider value={THEME}>
            {children}
        </ThemeContext.Provider>
    );
}

// Returns flat theme tokens.
// Usage: const theme = useTheme(); then theme.bg, theme.accent, etc.
export function useTheme(): ThemeTokens {
    return useContext(ThemeContext);
}
