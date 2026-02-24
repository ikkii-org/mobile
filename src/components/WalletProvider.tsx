import {
    transact,
    Web3MobileWallet,
} from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import { clusterApiUrl, Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import React, {
    createContext,
    useCallback,
    useContext,
    useState,
} from "react";
import { Alert } from "react-native";

// ─── Connection ───────────────────────────────────────────────────────────────

const CONNECTION = new Connection(clusterApiUrl("devnet"), "confirmed");

// ─── Types ───────────────────────────────────────────────────────────────────

interface WalletContextState {
    connected: boolean;
    publicKey: PublicKey | null;
    balanceSol: number | null;
    loadingBalance: boolean;
    connect: () => Promise<void>;
    disconnect: () => void;
    refreshBalance: () => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const WalletContext = createContext<WalletContextState>({
    connected: false,
    publicKey: null,
    balanceSol: null,
    loadingBalance: false,
    connect: async () => { },
    disconnect: () => { },
    refreshBalance: async () => { },
});

// ─── App identity shown to wallets ───────────────────────────────────────────

const APP_IDENTITY = {
    name: "Ikkii",
    uri: "https://ikkii.app",
    icon: "favicon.ico",
};

// ─── Provider ────────────────────────────────────────────────────────────────

export function WalletProvider({ children }: { children: React.ReactNode }) {
    const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
    const [authToken, setAuthToken] = useState<string | null>(null);
    const [balanceSol, setBalanceSol] = useState<number | null>(null);
    const [loadingBalance, setLoadingBalance] = useState(false);

    const fetchBalance = useCallback(async (pk: PublicKey) => {
        setLoadingBalance(true);
        try {
            const lamports = await CONNECTION.getBalance(pk);
            console.log("[Wallet] balance lamports:", lamports);
            setBalanceSol(lamports / LAMPORTS_PER_SOL);
        } catch (err) {
            console.error("[Wallet] getBalance error:", err);
            Alert.alert("Balance fetch failed", err instanceof Error ? err.message : String(err));
            setBalanceSol(null);
        } finally {
            setLoadingBalance(false);
        }
    }, []);

    const connect = useCallback(async () => {
        try {
            await transact(async (wallet: Web3MobileWallet) => {
                const authResult = await wallet.authorize({
                    cluster: "devnet",
                    identity: APP_IDENTITY,
                    ...(authToken ? { auth_token: authToken } : {}),
                });

                // accounts[0].address is base64-encoded — decode to bytes first
                const addressBytes = Buffer.from(
                    authResult.accounts[0].address,
                    "base64"
                );
                const pk = new PublicKey(addressBytes);
                setPublicKey(pk);
                setAuthToken(authResult.auth_token);

                // Fetch balance right after auth (awaited so errors surface)
                await fetchBalance(pk);
            });
        } catch (error: unknown) {
            const msg =
                error instanceof Error ? error.message : "Unknown error occurred";
            Alert.alert("Wallet connection failed", msg);
        }
    }, [authToken, fetchBalance]);

    const disconnect = useCallback(() => {
        setPublicKey(null);
        setAuthToken(null);
        setBalanceSol(null);
    }, []);

    const refreshBalance = useCallback(async () => {
        if (publicKey) await fetchBalance(publicKey);
    }, [publicKey, fetchBalance]);

    return (
        <WalletContext.Provider
            value={{
                connected: publicKey !== null,
                publicKey,
                balanceSol,
                loadingBalance,
                connect,
                disconnect,
                refreshBalance,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useWallet() {
    return useContext(WalletContext);
}
