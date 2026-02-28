import type { DuelStatus } from "./types";

// ─── API ─────────────────────────────────────────────────────────────────────

export const API_BASE_URL = "https://api.ikkii.gg";

// ─── Theme Colors ────────────────────────────────────────────────────────────

export const COLORS = {
    // Backgrounds
    bgPrimary: "#0A0A0F",
    bgSecondary: "#13131A",
    bgCard: "#1A1A2E",
    bgInput: "#0D0E1A",
    bgElevated: "#1E2030",

    // Accents
    purple: "#8B5CF6",
    purpleLight: "#A78BFA",
    purpleDark: "#6D28D9",
    cyan: "#06B6D4",
    neonPurple: "#9945FF",

    // Status
    success: "#10B981",
    successDark: "#064E3B",
    danger: "#EF4444",
    dangerDark: "#7F1D1D",
    warning: "#F59E0B",
    warningDark: "#78350F",
    info: "#3B82F6",
    infoDark: "#1E3A5F",

    // Neutrals
    white: "#FFFFFF",
    textPrimary: "#F1F5F9",
    textSecondary: "#94A3B8",
    textMuted: "#64748B",
    border: "#2A2B45",
    borderLight: "#3A3B55",

    // Rank medals
    gold: "#FFD700",
    silver: "#C0C0C0",
    bronze: "#CD7F32",
} as const;

// ─── Duel Status Colors ──────────────────────────────────────────────────────

export const STATUS_COLORS: Record<DuelStatus, { bg: string; text: string; border: string }> = {
    OPEN: { bg: "#1E3A5F", text: "#60A5FA", border: "#3B82F6" },
    ACTIVE: { bg: "#064E3B", text: "#34D399", border: "#10B981" },
    DISPUTED: { bg: "#7F1D1D", text: "#FCA5A5", border: "#EF4444" },
    SETTLED: { bg: "#78350F", text: "#FCD34D", border: "#F59E0B" },
    CANCELLED: { bg: "#1F2937", text: "#9CA3AF", border: "#6B7280" },
};

// ─── Common Tokens ───────────────────────────────────────────────────────────

export const COMMON_TOKENS = [
    { symbol: "SKR", name: "Solana Karrier", mint: "SKRtoken111111111111111111111111111111111111" },
    { symbol: "SOL", name: "Solana", mint: "So11111111111111111111111111111111111111112" },
    { symbol: "USDC", name: "USD Coin", mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
] as const;

// ─── Expiration Presets ──────────────────────────────────────────────────────

export const EXPIRATION_PRESETS = [
    { label: "15 min", ms: 15 * 60 * 1000 },
    { label: "30 min", ms: 30 * 60 * 1000 },
    { label: "1 hour", ms: 60 * 60 * 1000 },
    { label: "2 hours", ms: 2 * 60 * 60 * 1000 },
    { label: "6 hours", ms: 6 * 60 * 60 * 1000 },
    { label: "12 hours", ms: 12 * 60 * 60 * 1000 },
    { label: "24 hours", ms: 24 * 60 * 60 * 1000 },
] as const;

// ─── Validation ──────────────────────────────────────────────────────────────

export const REGEX = {
    username: /^[a-zA-Z0-9_]{3,20}$/,
    solanaAddress: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
} as const;

// ─── Polling ─────────────────────────────────────────────────────────────────

export const DUEL_POLL_INTERVAL_MS = 15_000;
