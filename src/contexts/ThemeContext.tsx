import React, { createContext, useContext, useState, useCallback } from "react";
import * as SecureStore from "expo-secure-store";

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
    accent: string;         // #8B5CF6
    accentLight: string;    // lighter for text on dark bg
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
    isDark: boolean;
}

// ---------------------------------------------------------------------------
// Dark theme — deep space glassmorphism
// ---------------------------------------------------------------------------
const DARK: ThemeTokens = {
    bg: "#050508",
    bgDeep: "#020204",

    bgCard: "rgba(255,255,255,0.05)",
    bgCardAlt: "rgba(255,255,255,0.03)",
    bgInput: "rgba(255,255,255,0.06)",
    bgMuted: "rgba(255,255,255,0.04)",
    bgGlass: "rgba(255,255,255,0.07)",

    border: "rgba(255,255,255,0.09)",
    borderStrong: "rgba(255,255,255,0.15)",
    borderGlow: "rgba(139,92,246,0.45)",

    textPrimary: "#F1F0FF",
    textSecondary: "#9B97C0",
    textMuted: "#4D4A6B",
    textInverse: "#FFFFFF",

    accent: "#8B5CF6",
    accentLight: "#A78BFA",
    accentBg: "rgba(139,92,246,0.12)",
    accentGlow: "rgba(139,92,246,0.35)",

    green: "#22D3A5",
    greenGlow: "rgba(34,211,165,0.30)",
    red: "#F43F5E",
    redGlow: "rgba(244,63,94,0.30)",
    amber: "#FBBF24",
    blue: "#60A5FA",
    grey: "#3D3A52",

    badgeOpenBg: "rgba(96,165,250,0.12)",
    badgeActiveBg: "rgba(34,211,165,0.12)",
    badgeDisputedBg: "rgba(244,63,94,0.12)",
    badgeSettledBg: "rgba(251,191,36,0.12)",
    badgeCancelledBg: "rgba(100,100,120,0.12)",

    btnDangerBg: "rgba(244,63,94,0.15)",
    btnDangerBorder: "#F43F5E",
    btnDangerText: "#F87171",
    btnSecondaryBorder: "rgba(255,255,255,0.15)",

    tabBarBg: "rgba(8,6,20,0.92)",
    tabBarBorder: "rgba(255,255,255,0.07)",
    tabBarActive: "#A78BFA",
    tabBarInactive: "#3D3A52",

    shadow: "#000000",
    overlay: "rgba(0,0,0,0.75)",
    isDark: true,
};

// ---------------------------------------------------------------------------
// Light theme — frosted glass on white
// ---------------------------------------------------------------------------
const LIGHT: ThemeTokens = {
    bg: "#F0EFFC",
    bgDeep: "#E8E7F7",

    bgCard: "rgba(255,255,255,0.80)",
    bgCardAlt: "rgba(255,255,255,0.60)",
    bgInput: "rgba(255,255,255,0.90)",
    bgMuted: "rgba(139,92,246,0.06)",
    bgGlass: "rgba(255,255,255,0.92)",

    border: "rgba(139,92,246,0.12)",
    borderStrong: "rgba(139,92,246,0.22)",
    borderGlow: "rgba(139,92,246,0.40)",

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
    isDark: false,
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export type FlatTheme = ThemeTokens & { toggleTheme: () => void };

const ThemeContext = createContext<FlatTheme>({
    ...LIGHT,
    toggleTheme: () => {},
});

const STORAGE_KEY = "ikkii_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [mode, setMode] = useState<"light" | "dark">("dark");

    React.useEffect(() => {
        SecureStore.getItemAsync(STORAGE_KEY).then((saved) => {
            if (saved === "dark" || saved === "light") setMode(saved);
        });
    }, []);

    const toggleTheme = useCallback(() => {
        setMode((prev) => {
            const next = prev === "dark" ? "light" : "dark";
            SecureStore.setItemAsync(STORAGE_KEY, next);
            return next;
        });
    }, []);

    const tokens = mode === "dark" ? DARK : LIGHT;
    const value: FlatTheme = { ...tokens, toggleTheme };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

// Returns flat tokens + toggleTheme.
// Usage: const theme = useTheme(); then theme.bg, theme.isDark, theme.toggleTheme()
export function useTheme(): FlatTheme {
    return useContext(ThemeContext);
}
