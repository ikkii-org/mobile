import React, { createContext, useContext } from "react";

// ---------------------------------------------------------------------------
// Token definitions — futuristic light theme
// ---------------------------------------------------------------------------

export interface ThemeTokens {
    // Page background
    bg: string;
    bgDeep: string;         // deeper layer behind cards

    // Card surfaces (layered glass for depth)
    bgCard: string;         // primary card surface
    bgCardAlt: string;      // elevated / nested card
    bgInput: string;        // input field background
    bgMuted: string;        // subtle section / pill background
    bgGlass: string;        // strong glass surface (modals, hero sections)
    bgPanel: string;        // futuristic panel overlay (slightly tinted)

    // Borders
    border: string;
    borderStrong: string;
    borderGlow: string;     // accent-tinted border for highlighted cards
    borderNeon: string;     // bright neon edge for active/focused elements

    // Text
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textInverse: string;
    textGlow: string;       // accent-tinted text for hero numbers

    // Accent — purple brand
    accent: string;
    accentLight: string;    // darker shade for text
    accentBg: string;       // translucent tint
    accentGlow: string;     // glow shadow color (with alpha)
    accentNeon: string;     // bright neon accent for indicators

    // Cyber teal — secondary futuristic accent
    cyan: string;
    cyanGlow: string;
    cyanBg: string;

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

    // Decorative / futuristic
    scanline: string;       // faint horizontal line overlay
    gridLine: string;       // subtle grid pattern color
    divider: string;        // section divider with tech feel

    // Misc
    shadow: string;
    overlay: string;
}

// ---------------------------------------------------------------------------
// Futuristic light theme — crisp glass with neon accents
// ---------------------------------------------------------------------------
const THEME: ThemeTokens = {
    bg: "#EEEDF8",
    bgDeep: "#E4E3F2",

    bgCard: "rgba(255,255,255,0.72)",
    bgCardAlt: "rgba(255,255,255,0.50)",
    bgInput: "rgba(255,255,255,0.80)",
    bgMuted: "rgba(124,58,237,0.05)",
    bgGlass: "rgba(255,255,255,0.78)",
    bgPanel: "rgba(124,58,237,0.03)",

    border: "rgba(124,58,237,0.12)",
    borderStrong: "rgba(124,58,237,0.22)",
    borderGlow: "rgba(124,58,237,0.35)",
    borderNeon: "rgba(124,58,237,0.55)",

    textPrimary: "#16132B",
    textSecondary: "#514D73",
    textMuted: "#928EB5",
    textInverse: "#FFFFFF",
    textGlow: "#7C3AED",

    accent: "#7C3AED",
    accentLight: "#6D28D9",
    accentBg: "rgba(124,58,237,0.08)",
    accentGlow: "rgba(124,58,237,0.25)",
    accentNeon: "rgba(124,58,237,0.65)",

    cyan: "#06B6D4",
    cyanGlow: "rgba(6,182,212,0.20)",
    cyanBg: "rgba(6,182,212,0.08)",

    green: "#059669",
    greenGlow: "rgba(5,150,105,0.20)",
    red: "#E11D48",
    redGlow: "rgba(225,29,72,0.20)",
    amber: "#D97706",
    blue: "#2563EB",
    grey: "#928EB5",

    badgeOpenBg: "rgba(37,99,235,0.08)",
    badgeActiveBg: "rgba(5,150,105,0.08)",
    badgeDisputedBg: "rgba(225,29,72,0.08)",
    badgeSettledBg: "rgba(217,119,6,0.08)",
    badgeCancelledBg: "rgba(155,151,192,0.08)",

    btnDangerBg: "rgba(225,29,72,0.08)",
    btnDangerBorder: "#E11D48",
    btnDangerText: "#BE123C",
    btnSecondaryBorder: "rgba(124,58,237,0.25)",

    tabBarBg: "rgba(238,237,248,0.96)",
    tabBarBorder: "rgba(124,58,237,0.10)",
    tabBarActive: "#7C3AED",
    tabBarInactive: "#928EB5",

    scanline: "rgba(124,58,237,0.03)",
    gridLine: "rgba(124,58,237,0.06)",
    divider: "rgba(124,58,237,0.10)",

    shadow: "rgba(124,58,237,0.12)",
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
