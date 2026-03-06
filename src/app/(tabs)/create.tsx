import React, { useState, useEffect, useCallback } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    View,
    ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../contexts/ToastContext";
import { useAuth } from "../../contexts/AuthContext";
import { useWallet } from "../../components/WalletProvider";
import { useTheme } from "../../contexts/ThemeContext";
import { duelsAPI, gameProfileAPI } from "../../services/api";
import { COMMON_TOKENS, EXPIRATION_PRESETS, SUPPORTED_GAMES } from "../../constants";
import type { GameProfile } from "../../types";
import { transact, Web3MobileWallet } from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import { Connection, PublicKey, Transaction, clusterApiUrl } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { buildCreateEscrowInstructions, isNativeSol } from "../../utils/ikkiEscrow";
import * as Crypto from "expo-crypto";

const CONNECTION = new Connection(clusterApiUrl("devnet"), "confirmed");

function getTokenDecimals(symbol: string): number {
    if (symbol === "SOL") return 1_000_000_000;
    return 1_000_000;
}

// Step definitions — Game is step 0
const STEPS = [
    { key: "game", label: "Game", icon: "game-controller-outline" as keyof typeof Ionicons.glyphMap },
    { key: "stake", label: "Stake", icon: "cash-outline" as keyof typeof Ionicons.glyphMap },
    { key: "token", label: "Token", icon: "logo-bitcoin" as keyof typeof Ionicons.glyphMap },
    { key: "timer", label: "Duration", icon: "time-outline" as keyof typeof Ionicons.glyphMap },
    { key: "confirm", label: "Confirm", icon: "checkmark-circle-outline" as keyof typeof Ionicons.glyphMap },
] as const;

export default function CreateDuelScreen() {
    const router = useRouter();
    const { showToast } = useToast();
    const { user } = useAuth();
    const wallet = useWallet();
    const theme = useTheme();

    const [step, setStep] = useState(0);
    const [selectedGameIdx, setSelectedGameIdx] = useState<number | null>(null);
    const [linkedProfiles, setLinkedProfiles] = useState<GameProfile[]>([]);
    const [profilesLoading, setProfilesLoading] = useState(true);
    const [stakeAmount, setStakeAmount] = useState("");
    const [selectedToken, setSelectedToken] = useState(0);
    const [customMint, setCustomMint] = useState("");
    const [useCustomMint, setUseCustomMint] = useState(false);
    const [selectedExpiry, setSelectedExpiry] = useState(2);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Fetch user's linked game profiles on mount
    const fetchLinkedProfiles = useCallback(async () => {
        try {
            const res = await gameProfileAPI.getAll();
            setLinkedProfiles(res.profiles);
        } catch (err) {
            console.error("Failed to fetch game profiles:", err);
        } finally {
            setProfilesLoading(false);
        }
    }, []);

    useEffect(() => { fetchLinkedProfiles(); }, [fetchLinkedProfiles]);

    /** Get the linked profile for a given game name, if any */
    const getLinkedProfile = (gameName: string): GameProfile | undefined =>
        linkedProfiles.find((p) => p.gameName === gameName);

    /** Get the selected game's info */
    const selectedGame = selectedGameIdx !== null ? SUPPORTED_GAMES[selectedGameIdx] : null;
    const selectedGameProfile = selectedGame ? getLinkedProfile(selectedGame.name) : undefined;

    const validate = (): boolean => {
        const errs: Record<string, string> = {};
        const amount = parseFloat(stakeAmount);
        if (!stakeAmount || isNaN(amount) || amount <= 0) {
            errs.stakeAmount = "Enter a valid positive amount";
        }
        if (useCustomMint && !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(customMint)) {
            errs.customMint = "Invalid Solana token address";
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleCreate = async () => {
        if (!validate() || !user) return;
        if (!wallet.publicKey) {
            showToast("Please connect your wallet first", "error");
            return;
        }

        setLoading(true);

        try {
            const tokenMintStr = useCustomMint ? customMint : COMMON_TOKENS[selectedToken].mint;
            const tokenMint = new PublicKey(tokenMintStr);
            const stakeAmt = parseFloat(stakeAmount);
            const expiryMs = EXPIRATION_PRESETS[selectedExpiry].ms;
            const tokenSymbol = useCustomMint ? "CUSTOM" : COMMON_TOKENS[selectedToken].symbol;
            const decimals = getTokenDecimals(tokenSymbol);
            const stakeAmtSmallest = Math.round(stakeAmt * decimals);
            const duelId = Crypto.randomUUID();

            if (isNativeSol(tokenMint)) {
                const lamports = await CONNECTION.getBalance(wallet.publicKey);
                const FEE_RESERVE = 10_000_000;
                if (lamports < stakeAmtSmallest + FEE_RESERVE) {
                    const balanceHuman = (lamports / decimals).toFixed(4);
                    throw new Error(
                        `Insufficient SOL balance. You have ${balanceHuman} SOL but need at least ${stakeAmt} SOL (plus ~0.01 SOL for fees).`
                    );
                }
            } else {
                const playerAta = getAssociatedTokenAddressSync(tokenMint, wallet.publicKey, false);
                const ataInfo = await CONNECTION.getAccountInfo(playerAta);
                if (!ataInfo) {
                    throw new Error(
                        `You don't have a ${tokenSymbol} token account. Please fund your wallet with at least ${stakeAmt} ${tokenSymbol} on devnet.`
                    );
                }
                const balanceRes = await CONNECTION.getTokenAccountBalance(playerAta);
                const balanceSmallest = Number(balanceRes.value.amount);
                if (balanceSmallest < stakeAmtSmallest) {
                    const balanceHuman = (balanceSmallest / decimals).toFixed(6);
                    throw new Error(
                        `Insufficient ${tokenSymbol} balance. You have ${balanceHuman} but need at least ${stakeAmt}.`
                    );
                }
            }

            const instructions = buildCreateEscrowInstructions(
                duelId, stakeAmtSmallest, expiryMs, tokenMint, wallet.publicKey
            );
            const latestBlockhash = await CONNECTION.getLatestBlockhash();
            const tx = new Transaction({ feePayer: wallet.publicKey, ...latestBlockhash });
            for (const ix of instructions) tx.add(ix);

            let txSignature = "";
            await transact(async (w: Web3MobileWallet) => {
                await w.authorize({
                    cluster: "devnet",
                    identity: { name: "Ikkii", uri: "https://ikkii.app", icon: "favicon.ico" },
                });
                const [sig] = await w.signAndSendTransactions({ transactions: [tx] });
                txSignature = sig;
            });

            if (!txSignature) throw new Error("Transaction failed or was rejected by wallet");

            showToast("Confirming transaction...", "info");
            const confirmation = await CONNECTION.confirmTransaction(
                { signature: txSignature, ...latestBlockhash }, "confirmed"
            );
            if (confirmation.value.err) {
                throw new Error(`Transaction failed on-chain: ${JSON.stringify(confirmation.value.err)}`);
            }

            const { duel } = await duelsAPI.create({
                username: user.username,
                stakeAmount: stakeAmt,
                stakeAmountSmallest: stakeAmtSmallest,
                tokenMint: tokenMintStr,
                gameId: selectedGameProfile?.gameId,
                expiresInMs: expiryMs,
                txSignature,
                duelId,
            });

            showToast("Duel created! Waiting for opponent...", "success");
            router.push(`/duel/${duel.id}`);
        } catch (err: any) {
            console.error("Create error:", err);
            showToast(err.message || "Failed to create duel", "error");
        } finally {
            setLoading(false);
        }
    };

    const tokenSymbolDisplay = useCustomMint ? "TOKEN" : COMMON_TOKENS[selectedToken].symbol;
    const potentialWin = stakeAmount ? (parseFloat(stakeAmount) * 2).toFixed(2) : "0";

    const canAdvance = () => {
        if (step === 0) return true; // Game step is optional — user can skip or select
        if (step === 1) {
            const amount = parseFloat(stakeAmount);
            return stakeAmount && !isNaN(amount) && amount > 0;
        }
        if (step === 2) return !useCustomMint || /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(customMint);
        return true;
    };

    const goNext = () => {
        if (step < STEPS.length - 1) setStep(step + 1);
    };
    const goBack = () => {
        if (step > 0) setStep(step - 1);
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <StatusBar style={theme.isDark ? "light" : "dark"} />
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                {/* ═══ HEADER ═══ */}
                <View style={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 8 }}>
                    <Text style={{
                        color: theme.textPrimary,
                        fontSize: 26,
                        fontWeight: "900",
                        letterSpacing: 1,
                    }}>
                        Create Duel
                    </Text>
                    <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 3, letterSpacing: 0.2 }}>
                        Stake crypto, challenge anyone on the arena
                    </Text>
                </View>

                {/* ═══ STEP PROGRESS BAR ═══ */}
                <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        {STEPS.map((s, i) => (
                            <React.Fragment key={s.key}>
                                {/* Step circle */}
                                <Pressable
                                    onPress={() => { if (i <= step) setStep(i); }}
                                    style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 16,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        backgroundColor: i <= step ? theme.accent : theme.bgCard,
                                        borderWidth: 1.5,
                                        borderColor: i <= step ? theme.borderGlow : theme.border,
                                        shadowColor: i === step ? theme.accentGlow : "transparent",
                                        shadowOpacity: i === step ? 0.7 : 0,
                                        shadowRadius: 8,
                                        shadowOffset: { width: 0, height: 0 },
                                    }}
                                >
                                    {i < step ? (
                                        <Ionicons name="checkmark" size={14} color={theme.textInverse} />
                                    ) : (
                                        <Ionicons name={s.icon} size={13} color={i === step ? theme.textInverse : theme.textMuted} />
                                    )}
                                </Pressable>
                                {/* Connector line */}
                                {i < STEPS.length - 1 && (
                                    <View style={{
                                        flex: 1,
                                        height: 2,
                                        borderRadius: 1,
                                        backgroundColor: i < step ? theme.accent : theme.border,
                                    }} />
                                )}
                            </React.Fragment>
                        ))}
                    </View>
                    {/* Step labels below */}
                    <View style={{ flexDirection: "row", marginTop: 6 }}>
                        {STEPS.map((s, i) => (
                            <Text
                                key={s.key}
                                style={{
                                    flex: 1,
                                    textAlign: i === 0 ? "left" : i === STEPS.length - 1 ? "right" : "center",
                                    fontSize: 9,
                                    fontWeight: i === step ? "800" : "600",
                                    color: i <= step ? theme.accentLight : theme.textMuted,
                                    letterSpacing: 0.5,
                                }}
                            >
                                {s.label}
                            </Text>
                        ))}
                    </View>
                </View>

                {/* ═══ STEP CONTENT ═══ */}
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Glass card container for each step */}
                    <View style={{
                        backgroundColor: theme.bgGlass,
                        borderWidth: 1,
                        borderColor: theme.borderGlow,
                        borderRadius: 20,
                        overflow: "hidden",
                        shadowColor: theme.accentGlow,
                        shadowOpacity: 0.15,
                        shadowRadius: 16,
                        shadowOffset: { width: 0, height: 4 },
                        elevation: 4,
                    }}>
                        {/* Accent bar */}
                        <View style={{ height: 2, backgroundColor: theme.accent }} />

                        <View style={{ padding: 20 }}>
                            {/* ── Step 0: Game Selection ── */}
                            {step === 0 && (
                                <View>
                                    <Text style={{
                                        color: theme.textPrimary,
                                        fontSize: 16,
                                        fontWeight: "800",
                                        marginBottom: 4,
                                    }}>
                                        Choose a game
                                    </Text>
                                    <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 20 }}>
                                        Select a game for auto-verification, or skip for a custom duel
                                    </Text>

                                    {profilesLoading ? (
                                        <View style={{ alignItems: "center", paddingVertical: 24 }}>
                                            <ActivityIndicator size="small" color={theme.accent} />
                                        </View>
                                    ) : (
                                        <View style={{ gap: 10 }}>
                                            {/* "No game" option */}
                                            <Pressable
                                                onPress={() => setSelectedGameIdx(null)}
                                                style={{
                                                    flexDirection: "row",
                                                    alignItems: "center",
                                                    padding: 14,
                                                    borderRadius: 14,
                                                    borderWidth: 1.5,
                                                    borderColor: selectedGameIdx === null ? theme.borderGlow : theme.border,
                                                    backgroundColor: selectedGameIdx === null ? theme.accentBg : theme.bgCard,
                                                    shadowColor: selectedGameIdx === null ? theme.accentGlow : "transparent",
                                                    shadowOpacity: selectedGameIdx === null ? 0.5 : 0,
                                                    shadowRadius: 10,
                                                    shadowOffset: { width: 0, height: 0 },
                                                }}
                                            >
                                                <View style={{
                                                    width: 38, height: 38, borderRadius: 19,
                                                    backgroundColor: selectedGameIdx === null ? theme.accent + "30" : theme.bgMuted,
                                                    alignItems: "center", justifyContent: "center", marginRight: 12,
                                                }}>
                                                    <Ionicons
                                                        name="flash-outline"
                                                        size={16}
                                                        color={selectedGameIdx === null ? theme.accentLight : theme.textSecondary}
                                                    />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{
                                                        fontWeight: "800", fontSize: 14,
                                                        color: selectedGameIdx === null ? theme.accentLight : theme.textPrimary,
                                                    }}>
                                                        Custom Duel
                                                    </Text>
                                                    <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>
                                                        No game — manual result submission
                                                    </Text>
                                                </View>
                                                {selectedGameIdx === null && (
                                                    <Ionicons name="checkmark-circle" size={20} color={theme.accentLight} />
                                                )}
                                            </Pressable>

                                            {/* Game cards */}
                                            {SUPPORTED_GAMES.map((game, i) => {
                                                const isSelected = selectedGameIdx === i;
                                                const linked = getLinkedProfile(game.name);
                                                const isLive = game.status === "live";
                                                const isDisabled = !isLive;

                                                return (
                                                    <Pressable
                                                        key={game.name}
                                                        onPress={() => { if (!isDisabled) setSelectedGameIdx(i); }}
                                                        style={{
                                                            flexDirection: "row",
                                                            alignItems: "center",
                                                            padding: 14,
                                                            borderRadius: 14,
                                                            borderWidth: 1.5,
                                                            borderColor: isSelected ? theme.borderGlow : theme.border,
                                                            backgroundColor: isSelected ? theme.accentBg : theme.bgCard,
                                                            opacity: isDisabled ? 0.45 : 1,
                                                            shadowColor: isSelected ? theme.accentGlow : "transparent",
                                                            shadowOpacity: isSelected ? 0.5 : 0,
                                                            shadowRadius: 10,
                                                            shadowOffset: { width: 0, height: 0 },
                                                        }}
                                                    >
                                                        <View style={{
                                                            width: 38, height: 38, borderRadius: 19,
                                                            backgroundColor: isSelected ? theme.accent + "30" : theme.bgMuted,
                                                            alignItems: "center", justifyContent: "center", marginRight: 12,
                                                        }}>
                                                            <Ionicons
                                                                name={game.ionicon as keyof typeof Ionicons.glyphMap}
                                                                size={16}
                                                                color={isSelected ? theme.accentLight : theme.textSecondary}
                                                            />
                                                        </View>
                                                        <View style={{ flex: 1 }}>
                                                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                                                <Text style={{
                                                                    fontWeight: "800", fontSize: 14,
                                                                    color: isSelected ? theme.accentLight : theme.textPrimary,
                                                                }}>
                                                                    {game.name}
                                                                </Text>
                                                                {!isLive && (
                                                                    <View style={{
                                                                        backgroundColor: theme.amber + "20",
                                                                        borderRadius: 6,
                                                                        paddingHorizontal: 6,
                                                                        paddingVertical: 2,
                                                                        borderWidth: 1,
                                                                        borderColor: theme.amber + "40",
                                                                    }}>
                                                                        <Text style={{ color: theme.amber, fontSize: 8, fontWeight: "800", letterSpacing: 0.5 }}>
                                                                            SOON
                                                                        </Text>
                                                                    </View>
                                                                )}
                                                            </View>
                                                            <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>
                                                                {linked
                                                                    ? `Linked: ${linked.playerId ?? "—"}`
                                                                    : isLive
                                                                        ? "Not linked — link in Profile"
                                                                        : "Coming soon"
                                                                }
                                                            </Text>
                                                        </View>
                                                        {isSelected && (
                                                            <Ionicons name="checkmark-circle" size={20} color={theme.accentLight} />
                                                        )}
                                                    </Pressable>
                                                );
                                            })}
                                        </View>
                                    )}

                                    {/* Warning if game selected but no linked profile */}
                                    {selectedGame && selectedGame.status === "live" && !selectedGameProfile && (
                                        <View style={{
                                            marginTop: 14,
                                            flexDirection: "row",
                                            alignItems: "center",
                                            gap: 8,
                                            backgroundColor: theme.amber + "12",
                                            borderRadius: 10,
                                            padding: 12,
                                            borderWidth: 1,
                                            borderColor: theme.amber + "25",
                                        }}>
                                            <Ionicons name="warning-outline" size={16} color={theme.amber} />
                                            <Text style={{ color: theme.amber, fontSize: 11, flex: 1, lineHeight: 16 }}>
                                                Link your {selectedGame.name} account in Profile for auto-verification. You can still create the duel without it.
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}

                            {/* ── Step 1: Stake Amount ── */}
                            {step === 1 && (
                                <View>
                                    <Text style={{
                                        color: theme.textPrimary,
                                        fontSize: 16,
                                        fontWeight: "800",
                                        marginBottom: 4,
                                    }}>
                                        How much do you want to stake?
                                    </Text>
                                    <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 20 }}>
                                        Both players put up equal amounts
                                    </Text>

                                    <Input
                                        label="Stake Amount"
                                        placeholder="0.00"
                                        value={stakeAmount}
                                        onChangeText={setStakeAmount}
                                        keyboardType="numeric"
                                        error={errors.stakeAmount}
                                    />

                                    {/* Quick-pick amounts */}
                                    <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                                        {["0.1", "0.5", "1", "5"].map((amt) => (
                                            <Pressable
                                                key={amt}
                                                onPress={() => setStakeAmount(amt)}
                                                style={{
                                                    flex: 1,
                                                    paddingVertical: 10,
                                                    borderRadius: 10,
                                                    alignItems: "center",
                                                    backgroundColor: stakeAmount === amt ? theme.accentBg : theme.bgCard,
                                                    borderWidth: 1,
                                                    borderColor: stakeAmount === amt ? theme.borderGlow : theme.border,
                                                }}
                                            >
                                                <Text style={{
                                                    color: stakeAmount === amt ? theme.accentLight : theme.textSecondary,
                                                    fontSize: 13,
                                                    fontWeight: "700",
                                                }}>
                                                    {amt}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </View>

                                    {/* Potential win preview */}
                                    {stakeAmount && parseFloat(stakeAmount) > 0 && (
                                        <View style={{
                                            marginTop: 16,
                                            flexDirection: "row",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: 6,
                                            backgroundColor: theme.badgeActiveBg,
                                            borderRadius: 10,
                                            paddingVertical: 10,
                                            borderWidth: 1,
                                            borderColor: theme.green + "25",
                                        }}>
                                            <Ionicons name="trophy" size={14} color={theme.green} />
                                            <Text style={{ color: theme.green, fontSize: 13, fontWeight: "800" }}>
                                                Win {potentialWin} {tokenSymbolDisplay}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}

                            {/* ── Step 2: Token Selection ── */}
                            {step === 2 && (
                                <View>
                                    <Text style={{
                                        color: theme.textPrimary,
                                        fontSize: 16,
                                        fontWeight: "800",
                                        marginBottom: 4,
                                    }}>
                                        Choose your token
                                    </Text>
                                    <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 20 }}>
                                        Select the token you want to stake
                                    </Text>

                                    {/* Token selection cards — vertical, larger */}
                                    <View style={{ gap: 10 }}>
                                        {COMMON_TOKENS.map((token, i) => {
                                            const isSelected = !useCustomMint && selectedToken === i;
                                            return (
                                                <Pressable
                                                    key={token.symbol}
                                                    onPress={() => { setSelectedToken(i); setUseCustomMint(false); }}
                                                    style={{
                                                        flexDirection: "row",
                                                        alignItems: "center",
                                                        padding: 14,
                                                        borderRadius: 14,
                                                        borderWidth: 1.5,
                                                        borderColor: isSelected ? theme.borderGlow : theme.border,
                                                        backgroundColor: isSelected ? theme.accentBg : theme.bgCard,
                                                        shadowColor: isSelected ? theme.accentGlow : "transparent",
                                                        shadowOpacity: isSelected ? 0.5 : 0,
                                                        shadowRadius: 10,
                                                        shadowOffset: { width: 0, height: 0 },
                                                    }}
                                                >
                                                    {/* Token icon circle */}
                                                    <View style={{
                                                        width: 38,
                                                        height: 38,
                                                        borderRadius: 19,
                                                        backgroundColor: isSelected ? theme.accent + "30" : theme.bgMuted,
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        marginRight: 12,
                                                    }}>
                                                        <Text style={{
                                                            fontSize: 14,
                                                            fontWeight: "900",
                                                            color: isSelected ? theme.accentLight : theme.textSecondary,
                                                        }}>
                                                            {token.symbol.charAt(0)}
                                                        </Text>
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={{
                                                            fontWeight: "800",
                                                            fontSize: 14,
                                                            color: isSelected ? theme.accentLight : theme.textPrimary,
                                                        }}>
                                                            {token.symbol}
                                                        </Text>
                                                        <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>
                                                            {token.name}
                                                        </Text>
                                                    </View>
                                                    {isSelected && (
                                                        <Ionicons name="checkmark-circle" size={20} color={theme.accentLight} />
                                                    )}
                                                </Pressable>
                                            );
                                        })}
                                    </View>

                                    {/* Custom mint toggle */}
                                    <Pressable
                                        onPress={() => setUseCustomMint(!useCustomMint)}
                                        style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            gap: 8,
                                            marginTop: 14,
                                            paddingVertical: 6,
                                        }}
                                    >
                                        <Ionicons
                                            name={useCustomMint ? "checkbox" : "square-outline"}
                                            size={18}
                                            color={useCustomMint ? theme.accent : theme.textMuted}
                                        />
                                        <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                                            Use custom token mint
                                        </Text>
                                    </Pressable>

                                    {useCustomMint && (
                                        <View style={{ marginTop: 8 }}>
                                            <Input
                                                label="Custom Token Mint Address"
                                                placeholder="Base58 encoded address"
                                                value={customMint}
                                                onChangeText={setCustomMint}
                                                autoCapitalize="none"
                                                error={errors.customMint}
                                            />
                                        </View>
                                    )}
                                </View>
                            )}

                            {/* ── Step 3: Duration ── */}
                            {step === 3 && (
                                <View>
                                    <Text style={{
                                        color: theme.textPrimary,
                                        fontSize: 16,
                                        fontWeight: "800",
                                        marginBottom: 4,
                                    }}>
                                        Set duel duration
                                    </Text>
                                    <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 20 }}>
                                        How long should the duel stay open?
                                    </Text>

                                    <View style={{ gap: 8 }}>
                                        {EXPIRATION_PRESETS.map((preset, i) => {
                                            const isSelected = selectedExpiry === i;
                                            return (
                                                <Pressable
                                                    key={preset.label}
                                                    onPress={() => setSelectedExpiry(i)}
                                                    style={{
                                                        flexDirection: "row",
                                                        alignItems: "center",
                                                        justifyContent: "space-between",
                                                        paddingHorizontal: 16,
                                                        paddingVertical: 13,
                                                        borderRadius: 12,
                                                        borderWidth: 1.5,
                                                        borderColor: isSelected ? theme.borderGlow : theme.border,
                                                        backgroundColor: isSelected ? theme.accentBg : theme.bgCard,
                                                        shadowColor: isSelected ? theme.accentGlow : "transparent",
                                                        shadowOpacity: isSelected ? 0.4 : 0,
                                                        shadowRadius: 8,
                                                        shadowOffset: { width: 0, height: 0 },
                                                    }}
                                                >
                                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                                                        <Ionicons
                                                            name="time-outline"
                                                            size={16}
                                                            color={isSelected ? theme.accentLight : theme.textMuted}
                                                        />
                                                        <Text style={{
                                                            fontSize: 14,
                                                            fontWeight: "700",
                                                            color: isSelected ? theme.accentLight : theme.textPrimary,
                                                        }}>
                                                            {preset.label}
                                                        </Text>
                                                    </View>
                                                    {isSelected && (
                                                        <Ionicons name="checkmark-circle" size={18} color={theme.accentLight} />
                                                    )}
                                                </Pressable>
                                            );
                                        })}
                                    </View>
                                </View>
                            )}

                            {/* ── Step 4: Confirm ── */}
                            {step === 4 && (
                                <View>
                                    <Text style={{
                                        color: theme.textPrimary,
                                        fontSize: 16,
                                        fontWeight: "800",
                                        marginBottom: 16,
                                    }}>
                                        Review your duel
                                    </Text>

                                    {/* Summary rows */}
                                    {[
                                        { label: "Game", value: selectedGame?.name ?? "Custom Duel", color: theme.accentLight },
                                        { label: "Your Stake", value: `${stakeAmount || "0"} ${tokenSymbolDisplay}`, color: theme.textPrimary },
                                        { label: "Total Pot", value: `${potentialWin} ${tokenSymbolDisplay}`, color: theme.green },
                                        { label: "Token", value: tokenSymbolDisplay, color: theme.accentLight },
                                        { label: "Duration", value: EXPIRATION_PRESETS[selectedExpiry].label, color: theme.textPrimary },
                                    ].map((row, i) => (
                                        <View key={i} style={{
                                            flexDirection: "row",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            paddingVertical: 12,
                                            borderBottomWidth: i < 4 ? 1 : 0,
                                            borderBottomColor: theme.border,
                                        }}>
                                            <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                                                {row.label}
                                            </Text>
                                            <Text style={{ color: row.color, fontSize: 14, fontWeight: "800" }}>
                                                {row.value}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>

                    {/* ═══ NAVIGATION BUTTONS ═══ */}
                    <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
                        {step > 0 && (
                            <View style={{ flex: 1 }}>
                                <Button
                                    title="Back"
                                    onPress={goBack}
                                    variant="secondary"
                                    icon={<Ionicons name="arrow-back" size={15} color={theme.accentLight} />}
                                />
                            </View>
                        )}
                        <View style={{ flex: step > 0 ? 1 : undefined, width: step === 0 ? "100%" : undefined }}>
                            {step < STEPS.length - 1 ? (
                                <Button
                                    title="Continue"
                                    onPress={goNext}
                                    variant="primary"
                                    disabled={!canAdvance()}
                                />
                            ) : (
                                <Button
                                    title="Create Duel"
                                    onPress={handleCreate}
                                    loading={loading}
                                    size="lg"
                                />
                            )}
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
