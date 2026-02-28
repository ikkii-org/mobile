import { API_BASE_URL } from "../constants";
import type {
    AuthResponse,
    CancelDuelRequest,
    CreateDuelRequest,
    CreateWalletRequest,
    DepositRequest,
    Duel,
    JoinDuelRequest,
    LeaderboardEntry,
    LoginRequest,
    PlayerProfile,
    SignupRequest,
    SubmitResultRequest,
    UpdatePfpRequest,
    User,
    Wallet,
    WithdrawRequest,
} from "../types";

// ─── Token Storage (set by AuthContext) ──────────────────────────────────────

let _getToken: (() => string | null) | null = null;
let _onUnauthorized: (() => void) | null = null;

export function setApiTokenProvider(getToken: () => string | null) {
    _getToken = getToken;
}

export function setUnauthorizedHandler(handler: () => void) {
    _onUnauthorized = handler;
}

// ─── Fetch Wrapper ───────────────────────────────────────────────────────────

async function apiFetch<T>(
    path: string,
    options: RequestInit = {},
    requiresAuth = true
): Promise<T> {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
    };

    if (requiresAuth && _getToken) {
        const token = _getToken();
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
    }

    const res = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
    });

    if (res.status === 401 && _onUnauthorized) {
        _onUnauthorized();
        throw new Error("Session expired. Please log in again.");
    }

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
            (body as { message?: string }).message ||
            `Request failed (${res.status})`
        );
    }

    return res.json() as Promise<T>;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authAPI = {
    signup: (data: SignupRequest) =>
        apiFetch<AuthResponse>("/auth/signup", {
            method: "POST",
            body: JSON.stringify(data),
        }, false),

    login: (data: LoginRequest) =>
        apiFetch<AuthResponse>("/auth/login", {
            method: "POST",
            body: JSON.stringify(data),
        }, false),

    logout: () =>
        apiFetch<{ message: string }>("/auth/logout", { method: "POST" }),
};

// ─── Users ───────────────────────────────────────────────────────────────────

export const usersAPI = {
    getById: (id: string) =>
        apiFetch<{ player: User }>(`/users/${id}`),

    getProfile: (username: string) =>
        apiFetch<{ profile: PlayerProfile }>(`/users/${username}/profile`),

    updatePfp: (username: string, data: UpdatePfpRequest) =>
        apiFetch<{ player: User }>(`/users/${username}/pfp`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),
};

// ─── Duels ───────────────────────────────────────────────────────────────────

export const duelsAPI = {
    create: (data: CreateDuelRequest) =>
        apiFetch<{ duel: Duel }>("/duels", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    getById: (id: string) =>
        apiFetch<{ duel: Duel }>(`/duels/${id}`),

    join: (id: string, data: JoinDuelRequest) =>
        apiFetch<{ duel: Duel }>(`/duels/${id}/join`, {
            method: "POST",
            body: JSON.stringify(data),
        }),

    submitResult: (id: string, data: SubmitResultRequest) =>
        apiFetch<{ duel: Duel; resolved: boolean }>(`/duels/${id}/result`, {
            method: "POST",
            body: JSON.stringify(data),
        }),

    cancel: (id: string, data: CancelDuelRequest) =>
        apiFetch<{ duel: Duel }>(`/duels/${id}/cancel`, {
            method: "POST",
            body: JSON.stringify(data),
        }),

    cleanup: () =>
        apiFetch<{ cancelledCount: number }>("/duels/cleanup", { method: "POST" }),
};

// ─── Escrow / Wallet ─────────────────────────────────────────────────────────

export const escrowAPI = {
    createWallet: (data: CreateWalletRequest) =>
        apiFetch<{ wallet: Wallet }>("/escrow/wallets", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    getWallet: (userId: string) =>
        apiFetch<{ wallet: Wallet }>(`/escrow/wallets/${userId}`),

    deposit: (userId: string, data: DepositRequest) =>
        apiFetch<{ wallet: Wallet }>(`/escrow/wallets/${userId}/deposit`, {
            method: "POST",
            body: JSON.stringify(data),
        }),

    withdraw: (userId: string, data: WithdrawRequest) =>
        apiFetch<{ wallet: Wallet }>(`/escrow/wallets/${userId}/withdraw`, {
            method: "POST",
            body: JSON.stringify(data),
        }),

    lock: (userId: string, data: { amount: number }) =>
        apiFetch<{ wallet: Wallet }>(`/escrow/wallets/${userId}/lock`, {
            method: "POST",
            body: JSON.stringify(data),
        }),

    unlock: (userId: string, data: { amount: number }) =>
        apiFetch<{ wallet: Wallet }>(`/escrow/wallets/${userId}/unlock`, {
            method: "POST",
            body: JSON.stringify(data),
        }),

    transfer: (data: { loserUserId: string; winnerUserId: string; amount: number }) =>
        apiFetch<{ success: boolean }>("/escrow/transfer", {
            method: "POST",
            body: JSON.stringify(data),
        }),
};

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export const leaderboardAPI = {
    getList: (limit = 50) =>
        apiFetch<{ leaderboard: LeaderboardEntry[]; count: number }>(
            `/leaderboard?limit=${limit}`
        ),

    getEntry: (username: string) =>
        apiFetch<{ entry: LeaderboardEntry }>(`/leaderboard/${username}`),

    refresh: () =>
        apiFetch<{ success: boolean; message: string }>("/leaderboard/refresh", {
            method: "POST",
        }),
};

// ─── Verification ────────────────────────────────────────────────────────────

export const verificationAPI = {
    verify: (duelId: string) =>
        apiFetch<{ result: unknown }>(`/verification/duels/${duelId}`, {
            method: "POST",
        }),
};

// ─── Health ──────────────────────────────────────────────────────────────────

export const healthAPI = {
    check: () =>
        apiFetch<{ status: string; timestamp: string }>("/health", {}, false),
};
