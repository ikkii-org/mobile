// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
    id: string;
    username: string;
    walletKey: string;
    pfp: string | null;
    wins: number;
    losses: number;
    createdAt: string;
    updatedAt: string;
}

// ─── Player Profile ──────────────────────────────────────────────────────────

export interface PlayerPortfolio {
    solanaBalance: number;
    currentRank: number;
    previousRank: number;
    totalStakeWon: number;
    totalStakeLost: number;
}

export interface PlayerProfile {
    userId: string;
    username: string;
    pfp: string | null;
    wins: number;
    losses: number;
    winPercentage: number;
    portfolio: PlayerPortfolio | null;
}

// ─── Game ────────────────────────────────────────────────────────────────────

export interface Game {
    id: string;
    name: string;
    icon: string | null;
    apiBaseUrl: string | null;
}

export interface GameProfile {
    id: string;
    userId: string;
    gameId: string;
    gameName: string;
    playerId: string | null;
    rank: string | null;
    stats: Record<string, unknown> | null;
}

export interface LinkGameAccountRequest {
    gameName: string;
    playerId: string;
    /** CR only — career total wins (verified with ±5 tolerance) */
    claimedWins?: number;
    /** CR only — personal best challenge wins (exact match) */
    claimedChallengeMaxWins?: number;
}

export interface SyncGameProfileRequest {
    gameName: string;
}

// ─── Duel ────────────────────────────────────────────────────────────────────

export type DuelStatus = "OPEN" | "ACTIVE" | "DISPUTED" | "SETTLED" | "CANCELLED";

export interface Duel {
    id: string;
    status: DuelStatus;
    player1Username: string;
    player2Username: string | null;
    player1Id: string;
    player2Id: string | null;
    winnerUsername: string | null;
    winnerId: string | null;
    player1SubmittedWinner: string | null;
    player2SubmittedWinner: string | null;
    stakeAmount: number;
    tokenMint: string;
    gameId: string | null;
    player1GameProfileId: string | null;
    player2GameProfileId: string | null;
    txSignature: string | null;
    expiresAt: string;
    createdAt: string;
}

// ─── Wallet / Escrow ─────────────────────────────────────────────────────────

export interface Wallet {
    id: string;
    userId: string;
    token: string;
    availableBalance: string;
    lockedBalance: string;
}

export type TransactionType = "STAKE" | "REWARD" | "WITHDRAW" | "CLAIM" | "DEPOSIT";
export type TransactionStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface Transaction {
    id: string;
    type: TransactionType;
    amount: number;
    date: string;
    status: TransactionStatus;
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
    rank: number;
    userId: string;
    username: string;
    pfp: string | null;
    wins: number;
    losses: number;
    winPercentage: number;
    totalStakeWon: number;
    totalStakeLost: number;
    currentRank: number;
    previousRank: number;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthResponse {
    token: string;
    user: User;
}

export interface SignupRequest {
    username: string;
    walletKey: string;
    password: string;
    pfp?: string;
}

export interface LoginRequest {
    username: string;
    password: string;
}

// ─── API Requests ────────────────────────────────────────────────────────────

export interface CreateDuelRequest {
    username: string;
    stakeAmount: number;          // human-readable (e.g. 1.0 USDC) — stored in DB
    stakeAmountSmallest: number;  // smallest unit (e.g. 1000000 micro-USDC) — used for on-chain verification
    tokenMint: string;
    gameId?: string;
    expiresInMs?: number;
    txSignature: string;
    duelId: string;
}

export interface JoinDuelRequest {
    username: string;
    txSignature: string;
}

export interface SubmitResultRequest {
    username: string;
    winnerUsername: string;
}

export interface CancelDuelRequest {
    username: string;
    txSignature: string;
}

export interface DepositRequest {
    amount: number;
    txSignature?: string;  // on-chain tx signature — server verifies before crediting
}

export interface WithdrawRequest {
    amount: number;
    walletAddress: string; // user's Solana public key — server sends tokens here
}

export interface CreateWalletRequest {
    userId: string;
    token: string;
}

export interface UpdatePfpRequest {
    pfp: string;
}
