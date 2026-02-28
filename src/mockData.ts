/**
 * Mock data for UI development.
 * Replace these with real API calls when integrating with the backend.
 * Each mock function mirrors the shape of the corresponding API response.
 */

import type {
    Duel,
    LeaderboardEntry,
    PlayerProfile,
    Transaction,
    User,
    Wallet,
} from "./types";

// ─── Current Mock User ───────────────────────────────────────────────────────

export const MOCK_USER: User = {
    id: "u-001",
    username: "cryptoking",
    walletKey: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    pfp: null,
    wins: 24,
    losses: 11,
    createdAt: "2025-12-01T10:00:00Z",
    updatedAt: "2026-02-28T12:00:00Z",
};

// ─── Mock Duels ──────────────────────────────────────────────────────────────

export const MOCK_OPEN_DUELS: Duel[] = [
    {
        id: "d-101",
        status: "OPEN",
        player1Username: "phantom_slayer",
        player2Username: null,
        player1Id: "u-010",
        player2Id: null,
        winnerUsername: null,
        winnerId: null,
        player1SubmittedWinner: null,
        player2SubmittedWinner: null,
        stakeAmount: 50,
        tokenMint: "SKRtoken111111111111111111111111111111111111",
        gameId: null,
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    },
    {
        id: "d-102",
        status: "OPEN",
        player1Username: "sol_warrior",
        player2Username: null,
        player1Id: "u-011",
        player2Id: null,
        winnerUsername: null,
        winnerId: null,
        player1SubmittedWinner: null,
        player2SubmittedWinner: null,
        stakeAmount: 100,
        tokenMint: "So11111111111111111111111111111111111111112",
        gameId: null,
        expiresAt: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    },
    {
        id: "d-103",
        status: "OPEN",
        player1Username: "nft_queen",
        player2Username: null,
        player1Id: "u-012",
        player2Id: null,
        winnerUsername: null,
        winnerId: null,
        player1SubmittedWinner: null,
        player2SubmittedWinner: null,
        stakeAmount: 25,
        tokenMint: "SKRtoken111111111111111111111111111111111111",
        gameId: null,
        expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
];

export const MOCK_ACTIVE_DUELS: Duel[] = [
    {
        id: "d-201",
        status: "ACTIVE",
        player1Username: "cryptoking",
        player2Username: "defi_master",
        player1Id: "u-001",
        player2Id: "u-013",
        winnerUsername: null,
        winnerId: null,
        player1SubmittedWinner: null,
        player2SubmittedWinner: null,
        stakeAmount: 75,
        tokenMint: "SKRtoken111111111111111111111111111111111111",
        gameId: null,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
    {
        id: "d-202",
        status: "ACTIVE",
        player1Username: "block_ninja",
        player2Username: "cryptoking",
        player1Id: "u-014",
        player2Id: "u-001",
        winnerUsername: null,
        winnerId: null,
        player1SubmittedWinner: null,
        player2SubmittedWinner: null,
        stakeAmount: 200,
        tokenMint: "So11111111111111111111111111111111111111112",
        gameId: null,
        expiresAt: new Date(Date.now() + 1.5 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
];

export const MOCK_DISPUTED_DUELS: Duel[] = [
    {
        id: "d-301",
        status: "DISPUTED",
        player1Username: "cryptoking",
        player2Username: "rug_puller",
        player1Id: "u-001",
        player2Id: "u-015",
        winnerUsername: null,
        winnerId: null,
        player1SubmittedWinner: "cryptoking",
        player2SubmittedWinner: "rug_puller",
        stakeAmount: 150,
        tokenMint: "SKRtoken111111111111111111111111111111111111",
        gameId: null,
        expiresAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
];

export const MOCK_SETTLED_DUELS: Duel[] = [
    {
        id: "d-401",
        status: "SETTLED",
        player1Username: "cryptoking",
        player2Username: "noob_trader",
        player1Id: "u-001",
        player2Id: "u-016",
        winnerUsername: "cryptoking",
        winnerId: "u-001",
        player1SubmittedWinner: "cryptoking",
        player2SubmittedWinner: "cryptoking",
        stakeAmount: 100,
        tokenMint: "SKRtoken111111111111111111111111111111111111",
        gameId: null,
        expiresAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: "d-402",
        status: "SETTLED",
        player1Username: "whale_fin",
        player2Username: "cryptoking",
        player1Id: "u-017",
        player2Id: "u-001",
        winnerUsername: "whale_fin",
        winnerId: "u-017",
        player1SubmittedWinner: "whale_fin",
        player2SubmittedWinner: "whale_fin",
        stakeAmount: 500,
        tokenMint: "So11111111111111111111111111111111111111112",
        gameId: null,
        expiresAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
];

// ─── Mock Wallet ─────────────────────────────────────────────────────────────

export const MOCK_WALLET: Wallet = {
    id: "w-001",
    userId: "u-001",
    token: "SKRtoken111111111111111111111111111111111111",
    availableBalance: "1250.500000",
    lockedBalance: "275.000000",
};

export const MOCK_TRANSACTIONS: Transaction[] = [
    { id: "t-1", type: "REWARD", amount: 100, date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), status: "SUCCESS" },
    { id: "t-2", type: "STAKE", amount: -75, date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), status: "SUCCESS" },
    { id: "t-3", type: "WITHDRAW", amount: -200, date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), status: "SUCCESS" },
    { id: "t-4", type: "STAKE", amount: -200, date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), status: "SUCCESS" },
    { id: "t-5", type: "CLAIM", amount: 500, date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), status: "SUCCESS" },
];

// ─── Mock Profile ────────────────────────────────────────────────────────────

export const MOCK_PROFILE: PlayerProfile = {
    userId: "u-001",
    username: "cryptoking",
    pfp: null,
    wins: 24,
    losses: 11,
    winPercentage: 68.6,
    portfolio: {
        solanaBalance: 12.5,
        currentRank: 7,
        previousRank: 9,
        totalStakeWon: 4250,
        totalStakeLost: 1800,
    },
};

// ─── Mock Leaderboard ────────────────────────────────────────────────────────

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
    { rank: 1, userId: "u-020", username: "alpha_chad", pfp: null, wins: 89, losses: 12, winPercentage: 88.1, totalStakeWon: 25000, totalStakeLost: 3200, currentRank: 1, previousRank: 1 },
    { rank: 2, userId: "u-021", username: "sol_empress", pfp: null, wins: 76, losses: 18, winPercentage: 80.9, totalStakeWon: 19500, totalStakeLost: 4100, currentRank: 2, previousRank: 3 },
    { rank: 3, userId: "u-022", username: "defi_dragon", pfp: null, wins: 65, losses: 20, winPercentage: 76.5, totalStakeWon: 16800, totalStakeLost: 5200, currentRank: 3, previousRank: 2 },
    { rank: 4, userId: "u-023", username: "moon_walker", pfp: null, wins: 58, losses: 22, winPercentage: 72.5, totalStakeWon: 14200, totalStakeLost: 5800, currentRank: 4, previousRank: 5 },
    { rank: 5, userId: "u-024", username: "web3_wizard", pfp: null, wins: 52, losses: 25, winPercentage: 67.5, totalStakeWon: 11800, totalStakeLost: 6100, currentRank: 5, previousRank: 4 },
    { rank: 6, userId: "u-025", username: "chain_breaker", pfp: null, wins: 47, losses: 28, winPercentage: 62.7, totalStakeWon: 9500, totalStakeLost: 6800, currentRank: 6, previousRank: 8 },
    { rank: 7, userId: "u-001", username: "cryptoking", pfp: null, wins: 24, losses: 11, winPercentage: 68.6, totalStakeWon: 4250, totalStakeLost: 1800, currentRank: 7, previousRank: 9 },
    { rank: 8, userId: "u-026", username: "token_titan", pfp: null, wins: 41, losses: 32, winPercentage: 56.2, totalStakeWon: 7800, totalStakeLost: 7200, currentRank: 8, previousRank: 7 },
    { rank: 9, userId: "u-027", username: "nft_ninja", pfp: null, wins: 38, losses: 35, winPercentage: 52.1, totalStakeWon: 6200, totalStakeLost: 6800, currentRank: 9, previousRank: 6 },
    { rank: 10, userId: "u-028", username: "block_baron", pfp: null, wins: 33, losses: 30, winPercentage: 52.4, totalStakeWon: 5400, totalStakeLost: 5100, currentRank: 10, previousRank: 11 },
];
