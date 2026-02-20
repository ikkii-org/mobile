import { Duel } from "../models/duel.model";
import { randomUUID } from "crypto";

// In-memory store for MVP (replace with database later)
const duels = new Map<string, Duel>();

export async function createDuel(
    player1: string,
    stakeAmount: number,
    tokenMint: string,
    expiresInMs: number = 30 * 60 * 1000 // 30 min default
): Promise<Duel> {
    // Validation
    if (!player1) {
        throw new Error("Player wallet address is required");
    }
    if (stakeAmount <= 0) {
        throw new Error("Stake amount must be greater than 0");
    }
    if (!tokenMint) {
        throw new Error("Token mint is required");
    }

    const duel: Duel = {
        id: randomUUID(),
        player1,
        player2: "",
        stakeAmount,
        tokenMint,
        status: "OPEN",
        expiresAt: new Date(Date.now() + expiresInMs),
        createdAt: new Date(),
    };

    duels.set(duel.id, duel);

    // TODO: Call escrow service to lock player1's stake on-chain

    return duel;
}

export async function joinDuel(duelId: string, player2: string): Promise<Duel> {
    const duel = duels.get(duelId);
    if (!duel) {
        throw new Error("Duel not found");
    }
    if (duel.status !== "OPEN") {
        throw new Error("Duel is not open for joining");
    }
    if (duel.player1 === player2) {
        throw new Error("Player cannot join their own duel");
    }

    duel.player2 = player2;
    duel.status = "ACTIVE";
    duels.set(duel.id, duel);
    return duel;
}

export async function submitResult(
    duelId: string,
    player: string,
    claimedWinner: string
): Promise<{ duel: Duel; resolved: boolean }> {
    const duel = duels.get(duelId);
    if (!duel) {
        throw new Error("Duel not found");
    }
    if (duel.status !== "ACTIVE") {
        throw new Error("Duel is not active");
    }
    if (player !== duel.player1 && player !== duel.player2) {
        throw new Error("Only participants can submit results");
    }
    if (claimedWinner !== duel.player1 && claimedWinner !== duel.player2) {
        throw new Error("Winner must be one of the duel participants");
    }

    // Record submission
    if (player === duel.player1) {
        if (duel.player1SubmittedWinner) {
            throw new Error("Player 1 has already submitted a result");
        }
        duel.player1SubmittedWinner = claimedWinner;
    } else {
        if (duel.player2SubmittedWinner) {
            throw new Error("Player 2 has already submitted a result");
        }
        duel.player2SubmittedWinner = claimedWinner;
    }

    duels.set(duel.id, duel);

    // Check if both players have submitted
    if (duel.player1SubmittedWinner && duel.player2SubmittedWinner) {
        if (duel.player1SubmittedWinner === duel.player2SubmittedWinner) {
            // Both agree → resolve immediately
            duel.winner = duel.player1SubmittedWinner;
            duel.status = "SETTLED";
            duels.set(duel.id, duel);
            // TODO: Call escrow service to pay out winner
            return { duel, resolved: true };
        } else {
            // Disagreement → mark as disputed for API verification
            duel.status = "DISPUTED";
            duels.set(duel.id, duel);
            // TODO: Trigger verification.service to check via game API
            return { duel, resolved: false };
        }
    }

    // Waiting for other player's submission
    return { duel, resolved: false };
}

// Helper for testing/debugging
export function getDuelStore(): Map<string, Duel> {
    return duels;
}
