import { Connection, clusterApiUrl, PublicKey } from "@solana/web3.js";

const CLUSTER = (process.env.EXPO_PUBLIC_SOLANA_CLUSTER as "devnet" | "mainnet-beta") || "devnet";

export const CONNECTION = new Connection(clusterApiUrl(CLUSTER), "confirmed");

export const PROGRAM_ID = new PublicKey(
    process.env.EXPO_PUBLIC_ESCROW_PROGRAM_ID || "7rP4rHKBqnYGB2UgpeRtd9f3FZ1PHwfc4iPVhWRv9UP4"
);

export function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
    return Promise.race([
        promise,
        new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(message)), ms)
        ),
    ]);
}
