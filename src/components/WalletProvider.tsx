import {
    transact,
    Web3MobileWallet,
} from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import { clusterApiUrl, Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";
import { Alert } from "react-native";
import { getAssociatedTokenAddressSync, NATIVE_MINT } from "@solana/spl-token";
import { useAuth } from "../contexts/AuthContext";
import { COMMON_TOKENS } from "../constants";

// ─── Connection ───────────────────────────────────────────────────────────────

const CONNECTION = new Connection(clusterApiUrl("devnet"), "confirmed");

// ─── App identity shown to wallets ───────────────────────────────────────────

export const APP_IDENTITY = {
    name: "Ikkii",
    uri: "https://ikkii.app",
    icon: "favicon.ico",
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface WalletContextState {
    connected: boolean;
    publicKey: PublicKey | null;
    authToken: string | null;
    balanceSol: number | null;
    balanceWsol: number | null;
    balanceUsdc: number | null;
    loadingBalance: boolean;
    connect: () => Promise<void>;
    disconnect: () => void;
    refreshBalance: () => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const WalletContext = createContext<WalletContextState>({
    connected: false,
    publicKey: null,
    authToken: null,
    balanceSol: null,
    balanceWsol: null,
    balanceUsdc: null,
    loadingBalance: false,
    connect: async () => { },
    disconnect: () => { },
    refreshBalance: async () => { },
});

// ─── Provider ────────────────────────────────────────────────────────────────

export function WalletProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();

    const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
    const [authToken, setAuthToken] = useState<string | null>(null);
    const [balanceSol, setBalanceSol] = useState<number | null>(null);
    const [balanceWsol, setBalanceWsol] = useState<number | null>(null);
    const [balanceUsdc, setBalanceUsdc] = useState<number | null>(null);
    const [loadingBalance, setLoadingBalance] = useState(false);

    const fetchBalance = useCallback(async (pk: PublicKey) => {
        setLoadingBalance(true);
        try {
            // Fetch native SOL
            const lamports = await CONNECTION.getBalance(pk);
            setBalanceSol(lamports / LAMPORTS_PER_SOL);

            // Fetch wSOL (wrapped SOL sitting in ATA — e.g. unclaimed duel winnings)
            const wsolAta = getAssociatedTokenAddressSync(NATIVE_MINT, pk, false);
            try {
                const wsolBal = await CONNECTION.getTokenAccountBalance(wsolAta);
                setBalanceWsol(wsolBal.value.uiAmount ?? 0);
            } catch {
                // wSOL ATA doesn't exist — no unclaimed winnings
                setBalanceWsol(0);
            }

            // Fetch USDC
            const usdcMint = new PublicKey(COMMON_TOKENS.find(t => t.symbol === "USDC")!.mint);
            const ata = getAssociatedTokenAddressSync(usdcMint, pk, true);
            try {
                const bal = await CONNECTION.getTokenAccountBalance(ata);
                setBalanceUsdc(bal.value.uiAmount);
            } catch {
                // ATA might not exist yet
                setBalanceUsdc(0);
            }
        } catch (err) {
            console.error("[Wallet] getBalance error:", err);
            setBalanceSol(null);
            setBalanceWsol(null);
            setBalanceUsdc(null);
        } finally {
            setLoadingBalance(false);
        }
    }, []);

    // Auto-set public key from authenticated user's registered wallet key
    useEffect(() => {
        if (user?.walletKey) {
            try {
                const pk = new PublicKey(user.walletKey);
                setPublicKey(pk);
                fetchBalance(pk);
            } catch (e) {
                console.error("Invalid user wallet key:", e);
            }
        } else {
            setPublicKey(null);
            setBalanceSol(null);
            setBalanceWsol(null);
            setBalanceUsdc(null);
        }
    }, [user?.walletKey, fetchBalance]);

    /**
     * connect() — Used during SIGNUP when no user record exists yet.
     * Authorizes with MWA, stores authToken, and sets publicKey from the wallet.
     * After login, publicKey is overwritten by user.walletKey from the DB.
     */
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

                setAuthToken(authResult.auth_token);
                // Set publicKey from wallet — needed during signup before a user record exists
                setPublicKey(pk);
                // Kick off balance fetch in background
                fetchBalance(pk);
            });
        } catch (error: unknown) {
            const msg =
                error instanceof Error ? error.message : "Unknown error occurred";
            Alert.alert("Wallet connection failed", msg);
        }
    }, [authToken, fetchBalance]);

    const disconnect = useCallback(() => {
        setAuthToken(null);
        // Only clear publicKey if no authenticated user (i.e., during signup flow)
        if (!user?.walletKey) {
            setPublicKey(null);
            setBalanceSol(null);
            setBalanceWsol(null);
            setBalanceUsdc(null);
        }
    }, [user?.walletKey]);

    const refreshBalance = useCallback(async () => {
        if (publicKey) await fetchBalance(publicKey);
    }, [publicKey, fetchBalance]);

    return (
        <WalletContext.Provider
            value={{
                connected: publicKey !== null,
                publicKey,
                authToken,
                balanceSol,
                balanceWsol,
                balanceUsdc,
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
