import React, { useState, useEffect, useCallback } from "react";
import {
    Image,
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
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { useToast } from "../../contexts/ToastContext";
import { useAuth } from "../../contexts/AuthContext";
import { useWallet } from "../../components/WalletProvider";
import { useTheme } from "../../contexts/ThemeContext";
import { duelsAPI, gameProfileAPI, escrowAPI } from "../../services/api";
import { COMMON_TOKENS, EXPIRATION_PRESETS, SUPPORTED_GAMES } from "../../constants";
import type { GameProfile } from "../../types";
import { GAME_ICONS } from "../../assets/games";
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

const STEPS = [
    { key: "game", label: "Game", icon: "game-controller-outline" as keyof typeof Ionicons.glyphMap },
    { key: "stake", label: "Stake", icon: "cash-outline" as keyof typeof Ionicons.glyphMap },
    { key: "token", label: "Token", icon: "custom-sol" as any },
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

    useFocusEffect(useCallback(() => { fetchLinkedProfiles(); }, [fetchLinkedProfiles]));

    const getLinkedProfile = (gameName: string): GameProfile | undefined =>
        linkedProfiles.find((p) => p.gameName === gameName);

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
            // Record the stake on the vault
            escrowAPI.recordTransaction(user.id, { type: "STAKE", amount: stakeAmt, duelId }).catch(() => { });

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
        if (step === 0) {
            // If a game is selected (not "Custom Duel") and it's live, require a linked profile
            if (selectedGame && selectedGame.status === "live" && !selectedGameProfile) {
                return false;
            }
            return true;
        }
        if (step === 1) {
            const amount = parseFloat(stakeAmount);
            return stakeAmount && !isNaN(amount) && amount > 0;
        }
        if (step === 2) return !useCustomMint || /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(customMint);
        return true;
    };

    const goNext = () => {
        // Block advancing from game step if a live game is selected without a linked profile
        if (step === 0 && selectedGame && selectedGame.status === "live" && !selectedGameProfile) {
            showToast("Link your game in profile first", "error");
            router.push("/(tabs)/profile");
            return;
        }
        if (step < STEPS.length - 1) setStep(step + 1);
    };
    const goBack = () => {
        if (step > 0) setStep(step - 1);
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <StatusBar style="dark" />
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                {/* ═══ HEADER ═══ */}
                <View style={{ paddingHorizontal: 20, paddingTop: 58, paddingBottom: 8 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <View style={{
                            width: 4,
                            height: 24,
                            backgroundColor: theme.accent,
                            borderRadius: 2,
                        }} />
                        <View>
                            <Text style={{
                                color: theme.textPrimary,
                                fontSize: 24,
                                fontWeight: "900",
                                letterSpacing: 2,
                            }}>
                                CREATE DUEL
                            </Text>
                            <Text style={{ color: theme.textMuted, fontSize: 10, marginTop: 2, letterSpacing: 1.5, fontWeight: "600" }}>
                                STAKE CRYPTO, CHALLENGE ANYONE
                            </Text>
                        </View>
                    </View>
                </View>

                {/* ═══ STEP PROGRESS BAR ═══ */}
                <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 0 }}>
                        {STEPS.map((s, i) => (
                            <React.Fragment key={s.key}>
                                {/* Step node */}
                                <Pressable
                                    onPress={() => { if (i <= step) setStep(i); }}
                                    style={{
                                        width: 30,
                                        height: 30,
                                        borderRadius: 8,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        backgroundColor: i <= step ? theme.accent : theme.bgCard,
                                        borderWidth: 1.5,
                                        borderColor: i <= step ? theme.accentNeon : theme.border,
                                    }}
                                >
                                    {i < step ? (
                                        <Ionicons name="checkmark" size={13} color={theme.textInverse} />
                                    ) : s.icon === "custom-sol" ? (
                                        <Image
                                            source={require("../../../assets/sol.png")}
                                            style={{ width: 14, height: 14, tintColor: i === step ? theme.textInverse : theme.textMuted }}
                                            resizeMode="contain"
                                        />
                                    ) : (
                                        <Ionicons name={s.icon} size={12} color={i === step ? theme.textInverse : theme.textMuted} />
                                    )}
                                </Pressable>
                                {/* Connector */}
                                {i < STEPS.length - 1 && (
                                    <View style={{
                                        flex: 1,
                                        height: 2,
                                        backgroundColor: i < step ? theme.accent : theme.border,
                                        marginHorizontal: 2,
                                    }} />
                                )}
                            </React.Fragment>
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
                    {/* Panel container */}
                    <Card
                        noPadding
                        style={{
                            backgroundColor: theme.bgGlass,
                            borderColor: theme.borderStrong,
                        }}
                    >
                        <View style={{ padding: 18 }}>
                            {/* ── Step 0: Game Selection ── */}
                            {step === 0 && (
                                <View>
                                    <Text style={{
                                        color: theme.textPrimary,
                                        fontSize: 15,
                                        fontWeight: "900",
                                        letterSpacing: 0.5,
                                        marginBottom: 3,
                                    }}>
                                        Choose a game
                                    </Text>
                                    <Text style={{ color: theme.textMuted, fontSize: 11, marginBottom: 18, letterSpacing: 0.3 }}>
                                        Select a game for auto-verification, or skip for a custom duel
                                    </Text>

                                    {profilesLoading ? (
                                        <View style={{ alignItems: "center", paddingVertical: 24 }}>
                                            <ActivityIndicator size="small" color={theme.accent} />
                                        </View>
                                    ) : (
                                        <View style={{ gap: 8 }}>
                                            {/* "No game" option */}
                                            <Pressable
                                                onPress={() => setSelectedGameIdx(null)}
                                                style={{
                                                    flexDirection: "row",
                                                    alignItems: "center",
                                                    padding: 12,
                                                    borderRadius: 10,
                                                    borderWidth: 1.5,
                                                    borderColor: selectedGameIdx === null ? theme.borderNeon : theme.border,
                                                    backgroundColor: selectedGameIdx === null ? theme.accentBg : theme.bgCard,
                                                }}
                                            >
                                                <View style={{
                                                    width: 36, height: 36, borderRadius: 10,
                                                    backgroundColor: selectedGameIdx === null ? theme.accent + "20" : theme.bgMuted,
                                                    alignItems: "center", justifyContent: "center", marginRight: 10,
                                                }}>
                                                    <Ionicons
                                                        name="flash-outline"
                                                        size={15}
                                                        color={selectedGameIdx === null ? theme.accent : theme.textSecondary}
                                                    />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{
                                                        fontWeight: "800", fontSize: 13, letterSpacing: 0.3,
                                                        color: selectedGameIdx === null ? theme.accent : theme.textPrimary,
                                                    }}>
                                                        Custom Duel
                                                    </Text>
                                                    <Text style={{ color: theme.textMuted, fontSize: 10, marginTop: 2 }}>
                                                        No game — manual result submission
                                                    </Text>
                                                </View>
                                                {selectedGameIdx === null && (
                                                    <Ionicons name="checkmark-circle" size={18} color={theme.accent} />
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
                                                            padding: 12,
                                                            borderRadius: 10,
                                                            borderWidth: 1.5,
                                                            borderColor: isSelected ? theme.borderNeon : theme.border,
                                                            backgroundColor: isSelected ? theme.accentBg : theme.bgCard,
                                                            opacity: isDisabled ? 0.4 : 1,
                                                        }}
                                                    >
                                                        <View style={{
                                                            width: 36, height: 36, borderRadius: 10,
                                                            backgroundColor: isSelected ? theme.accent + "20" : theme.bgMuted,
                                                            alignItems: "center", justifyContent: "center", marginRight: 10,
                                                            overflow: "hidden",
                                                        }}>
                                                            {GAME_ICONS[game.name] ? (
                                                                <Image
                                                                    source={GAME_ICONS[game.name]}
                                                                    style={{ width: 28, height: 28, borderRadius: 4 }}
                                                                    resizeMode="contain"
                                                                />
                                                            ) : (
                                                                <Ionicons
                                                                    name={game.ionicon as keyof typeof Ionicons.glyphMap}
                                                                    size={15}
                                                                    color={isSelected ? theme.accent : theme.textSecondary}
                                                                />
                                                            )}
                                                        </View>
                                                        <View style={{ flex: 1 }}>
                                                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                                                <Text style={{
                                                                    fontWeight: "800", fontSize: 13, letterSpacing: 0.3,
                                                                    color: isSelected ? theme.accent : theme.textPrimary,
                                                                }}>
                                                                    {game.name}
                                                                </Text>
                                                                {!isLive && (
                                                                    <View style={{
                                                                        backgroundColor: theme.amber + "15",
                                                                        borderRadius: 4,
                                                                        paddingHorizontal: 5,
                                                                        paddingVertical: 1,
                                                                        borderWidth: 1,
                                                                        borderColor: theme.amber + "30",
                                                                    }}>
                                                                        <Text style={{ color: theme.amber, fontSize: 7, fontWeight: "900", letterSpacing: 1 }}>
                                                                            SOON
                                                                        </Text>
                                                                    </View>
                                                                )}
                                                            </View>
                                                            <Text style={{ color: theme.textMuted, fontSize: 10, marginTop: 2 }}>
                                                                {linked
                                                                    ? `Linked: ${linked.playerId ?? "—"}`
                                                                    : isLive
                                                                        ? "Not linked — link in Profile"
                                                                        : "Coming soon"
                                                                }
                                                            </Text>
                                                        </View>
                                                        {isSelected && (
                                                            <Ionicons name="checkmark-circle" size={18} color={theme.accent} />
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
                                            backgroundColor: theme.amber + "08",
                                            borderRadius: 8,
                                            padding: 12,
                                            borderWidth: 1,
                                            borderColor: theme.amber + "20",
                                        }}>
                                            <Ionicons name="warning-outline" size={14} color={theme.amber} />
                                            <Text style={{ color: theme.amber, fontSize: 10, flex: 1, lineHeight: 15 }}>
                                                Link your {selectedGame.name} account in Profile for auto-verification.
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
                                        fontSize: 15,
                                        fontWeight: "900",
                                        letterSpacing: 0.5,
                                        marginBottom: 3,
                                    }}>
                                        How much to stake?
                                    </Text>
                                    <Text style={{ color: theme.textMuted, fontSize: 11, marginBottom: 18 }}>
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
                                    <View style={{ flexDirection: "row", gap: 6, marginTop: 8 }}>
                                        {["0.1", "0.5", "1", "5"].map((amt) => (
                                            <Pressable
                                                key={amt}
                                                onPress={() => setStakeAmount(amt)}
                                                style={{
                                                    flex: 1,
                                                    paddingVertical: 10,
                                                    borderRadius: 8,
                                                    alignItems: "center",
                                                    backgroundColor: stakeAmount === amt ? theme.accentBg : theme.bgCard,
                                                    borderWidth: 1,
                                                    borderColor: stakeAmount === amt ? theme.borderNeon : theme.border,
                                                }}
                                            >
                                                <Text style={{
                                                    color: stakeAmount === amt ? theme.accent : theme.textSecondary,
                                                    fontSize: 13,
                                                    fontWeight: "800",
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
                                            backgroundColor: theme.green + "08",
                                            borderRadius: 8,
                                            paddingVertical: 10,
                                            borderWidth: 1,
                                            borderColor: theme.green + "20",
                                        }}>
                                            <Ionicons name="trophy" size={13} color={theme.green} />
                                            <Text style={{ color: theme.green, fontSize: 12, fontWeight: "900", letterSpacing: 0.3 }}>
                                                Win {potentialWin} SOL/USDC
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
                                        fontSize: 15,
                                        fontWeight: "900",
                                        letterSpacing: 0.5,
                                        marginBottom: 3,
                                    }}>
                                        Choose your token
                                    </Text>
                                    <Text style={{ color: theme.textMuted, fontSize: 11, marginBottom: 18 }}>
                                        Select the token you want to stake
                                    </Text>

                                    <View style={{ gap: 8 }}>
                                        {COMMON_TOKENS.map((token, i) => {
                                            const isSelected = !useCustomMint && selectedToken === i;
                                            return (
                                                <Pressable
                                                    key={token.symbol}
                                                    onPress={() => { setSelectedToken(i); setUseCustomMint(false); }}
                                                    style={{
                                                        flexDirection: "row",
                                                        alignItems: "center",
                                                        padding: 12,
                                                        borderRadius: 10,
                                                        borderWidth: 1.5,
                                                        borderColor: isSelected ? theme.borderNeon : theme.border,
                                                        backgroundColor: isSelected ? theme.accentBg : theme.bgCard,
                                                    }}
                                                >
                                                    <View style={{
                                                        width: 36,
                                                        height: 36,
                                                        borderRadius: 10,
                                                        backgroundColor: isSelected ? theme.accent + "20" : theme.bgMuted,
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        marginRight: 10,
                                                    }}>
                                                        <Text style={{
                                                            fontSize: 13,
                                                            fontWeight: "900",
                                                            color: isSelected ? theme.accent : theme.textSecondary,
                                                            letterSpacing: 1,
                                                        }}>
                                                            {token.symbol.charAt(0)}
                                                        </Text>
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={{
                                                            fontWeight: "800",
                                                            fontSize: 13,
                                                            letterSpacing: 0.3,
                                                            color: isSelected ? theme.accent : theme.textPrimary,
                                                        }}>
                                                            {token.symbol}
                                                        </Text>
                                                        <Text style={{ color: theme.textMuted, fontSize: 10, marginTop: 2 }}>
                                                            {token.name}
                                                        </Text>
                                                    </View>
                                                    {isSelected && (
                                                        <Ionicons name="checkmark-circle" size={18} color={theme.accent} />
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
                                            gap: 7,
                                            marginTop: 14,
                                            paddingVertical: 6,
                                        }}
                                    >
                                        <Ionicons
                                            name={useCustomMint ? "checkbox" : "square-outline"}
                                            size={16}
                                            color={useCustomMint ? theme.accent : theme.textMuted}
                                        />
                                        <Text style={{ color: theme.textSecondary, fontSize: 11, letterSpacing: 0.2 }}>
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
                                        fontSize: 15,
                                        fontWeight: "900",
                                        letterSpacing: 0.5,
                                        marginBottom: 3,
                                    }}>
                                        Set duel duration
                                    </Text>
                                    <Text style={{ color: theme.textMuted, fontSize: 11, marginBottom: 18 }}>
                                        How long should the duel stay open?
                                    </Text>

                                    <View style={{ gap: 6 }}>
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
                                                        paddingHorizontal: 14,
                                                        paddingVertical: 12,
                                                        borderRadius: 10,
                                                        borderWidth: 1.5,
                                                        borderColor: isSelected ? theme.borderNeon : theme.border,
                                                        backgroundColor: isSelected ? theme.accentBg : theme.bgCard,
                                                    }}
                                                >
                                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                                        <View style={{
                                                            width: 4,
                                                            height: 14,
                                                            borderRadius: 2,
                                                            backgroundColor: isSelected ? theme.accent : theme.border,
                                                        }} />
                                                        <Text style={{
                                                            fontSize: 13,
                                                            fontWeight: "700",
                                                            letterSpacing: 0.3,
                                                            color: isSelected ? theme.accent : theme.textPrimary,
                                                        }}>
                                                            {preset.label}
                                                        </Text>
                                                    </View>
                                                    {isSelected && (
                                                        <Ionicons name="checkmark-circle" size={16} color={theme.accent} />
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
                                        fontSize: 15,
                                        fontWeight: "900",
                                        letterSpacing: 0.5,
                                        marginBottom: 16,
                                    }}>
                                        Review your duel
                                    </Text>

                                    {[
                                        { label: "Game", value: selectedGame?.name ?? "Custom Duel", color: theme.accent },
                                        { label: "Your Stake", value: `${stakeAmount || "0"} ${tokenSymbolDisplay}`, color: theme.textPrimary },
                                        { label: "Total Pot", value: `${potentialWin} ${tokenSymbolDisplay}`, color: theme.green },
                                        { label: "Token", value: tokenSymbolDisplay, color: theme.accent },
                                        { label: "Duration", value: EXPIRATION_PRESETS[selectedExpiry].label, color: theme.textPrimary },
                                    ].map((row, i) => (
                                        <View key={i} style={{
                                            flexDirection: "row",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            paddingVertical: 11,
                                            borderBottomWidth: i < 4 ? 1 : 0,
                                            borderBottomColor: theme.divider,
                                        }}>
                                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                                <View style={{
                                                    width: 3,
                                                    height: 12,
                                                    borderRadius: 1,
                                                    backgroundColor: row.color,
                                                }} />
                                                <Text style={{ color: theme.textSecondary, fontSize: 12, letterSpacing: 0.3 }}>
                                                    {row.label}
                                                </Text>
                                            </View>
                                            <Text style={{ color: row.color, fontSize: 13, fontWeight: "900", letterSpacing: 0.3 }}>
                                                {row.value}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    </Card>

                    {/* ═══ NAVIGATION BUTTONS ═══ */}
                    <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
                        {step > 0 && (
                            <View style={{ flex: 1 }}>
                                <Button
                                    title="Back"
                                    onPress={goBack}
                                    variant="secondary"
                                    size={step === STEPS.length - 1 ? "lg" : "md"}
                                    icon={<Ionicons name="arrow-back" size={14} color={theme.accentLight} />}
                                />
                            </View>
                        )}
                        <View style={{ flex: 1 }}>
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
