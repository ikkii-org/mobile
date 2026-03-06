import React, { useEffect, useState, useCallback } from "react";
import { Pressable, ScrollView, Text, View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Badge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { useToast } from "../../contexts/ToastContext";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { COMMON_TOKENS, DUEL_POLL_INTERVAL_MS, SUPPORTED_GAMES } from "../../constants";
import { duelsAPI, verificationAPI, gameProfileAPI, usersAPI } from "../../services/api";
import type { Duel, GameProfile, User } from "../../types";
import { useWallet } from "../../components/WalletProvider";
import { transact, Web3MobileWallet } from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import { Connection, PublicKey, Transaction, clusterApiUrl } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { buildJoinEscrowInstructions, buildCancelEscrowInstructions, isNativeSol } from "../../utils/ikkiEscrow";

const CONNECTION = new Connection(clusterApiUrl("devnet"), "confirmed");

const STATUS_COLORS: Record<string, string> = {
    OPEN: "#3B82F6",
    ACTIVE: "#10B981",
    DISPUTED: "#EF4444",
    SETTLED: "#F59E0B",
    CANCELLED: "#374151",
};

function getTokenSymbol(mint: string) {
    const token = COMMON_TOKENS.find((t) => t.mint === mint);
    return token?.symbol ?? mint.slice(0, 6) + "…";
}

function getTokenDecimals(symbol: string): number {
    if (symbol === "SOL") return 1_000_000_000;
    return 1_000_000;
}

function getTimeRemaining(expiresAt: string): string {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Expired";
    const hrs = Math.floor(diff / (60 * 60 * 1000));
    const mins = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    const secs = Math.floor((diff % (60 * 1000)) / 1000);
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
}

export default function DuelDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { showToast } = useToast();
    const { user } = useAuth();
    const wallet = useWallet();
    const theme = useTheme();
    const currentUser = user?.username ?? "";

    const [duel, setDuel] = useState<Duel | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showResultModal, setShowResultModal] = useState(false);
    const [timeLeft, setTimeLeft] = useState("");
    const [linkedProfiles, setLinkedProfiles] = useState<GameProfile[]>([]);
    const [player1Data, setPlayer1Data] = useState<User | null>(null);
    const [player2Data, setPlayer2Data] = useState<User | null>(null);

    const fetchDuel = useCallback(async () => {
        try {
            const res = await duelsAPI.getById(id);
            setDuel(res.duel);
        } catch (err: any) {
            console.error("Failed to fetch duel:", err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchDuel();
        const interval = setInterval(fetchDuel, DUEL_POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [fetchDuel]);

    // Fetch linked game profiles to resolve game names
    useEffect(() => {
        gameProfileAPI.getAll()
            .then((res) => setLinkedProfiles(res.profiles))
            .catch((err) => console.warn("Failed to fetch game profiles:", err));
    }, []);

    // Fetch player data for avatars (pfp)
    useEffect(() => {
        if (!duel) return;
        const fetchPlayers = async () => {
            const promises: Promise<void>[] = [
                usersAPI.getById(duel.player1Id)
                    .then((res) => setPlayer1Data(res.player))
                    .catch((err) => console.warn("Failed to fetch player1 data:", err)),
            ];
            if (duel.player2Id) {
                promises.push(
                    usersAPI.getById(duel.player2Id)
                        .then((res) => setPlayer2Data(res.player))
                        .catch((err) => console.warn("Failed to fetch player2 data:", err))
                );
            }
            await Promise.all(promises);
        };
        fetchPlayers();
    }, [duel?.player1Id, duel?.player2Id]);

    useEffect(() => {
        if (!duel || duel.status === "CANCELLED" || duel.status === "SETTLED") return;
        const update = () => setTimeLeft(getTimeRemaining(duel.expiresAt));
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [duel]);

    if (loading && !duel) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: "center", justifyContent: "center" }}>
                <StatusBar style={theme.isDark ? "light" : "dark"} />
                <ActivityIndicator size="large" color={theme.accent} />
            </View>
        );
    }

    if (!duel) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
                <StatusBar style={theme.isDark ? "light" : "dark"} />
                <Ionicons name="alert-circle-outline" size={48} color={theme.textMuted} />
                <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: "800", marginTop: 12, marginBottom: 6 }}>
                    Duel Not Found
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 13, textAlign: "center", marginBottom: 24 }}>
                    This duel may have been cancelled or doesn't exist.
                </Text>
                <Button title="Go Back" onPress={() => router.back()} variant="secondary" fullWidth={false} />
            </View>
        );
    }

    const isPlayer1 = duel.player1Username === currentUser;
    const isPlayer2 = duel.player2Username === currentUser;
    const isParticipant = isPlayer1 || isPlayer2;
    const isCreator = isPlayer1;
    const opponent = isPlayer1 ? duel.player2Username : duel.player1Username;
    const tokenSymbol = getTokenSymbol(duel.tokenMint);
    const statusColor = STATUS_COLORS[duel.status] ?? theme.grey;

    // Resolve game name from duel's gameId
    const duelGameName = (() => {
        if (!duel.gameId) return null;
        const fromProfile = linkedProfiles.find((p) => p.gameId === duel.gameId);
        if (fromProfile) return fromProfile.gameName;
        // Fallback: no match found (user might not have that game linked)
        return null;
    })();
    const duelGameInfo = duelGameName
        ? SUPPORTED_GAMES.find((g) => g.name === duelGameName)
        : null;

    const handleJoin = async () => {
        if (!currentUser || !duel) return;
        if (!wallet.publicKey) {
            showToast("Please connect your wallet first", "error");
            return;
        }

        setActionLoading(true);
        try {
            const tokenMint = new PublicKey(duel.tokenMint);
            const tokenSym = getTokenSymbol(duel.tokenMint);
            const decimals = getTokenDecimals(tokenSym);
            const stakeAmtSmallest = Math.round(duel.stakeAmount * decimals);

            if (isNativeSol(tokenMint)) {
                const lamports = await CONNECTION.getBalance(wallet.publicKey);
                const FEE_RESERVE = 10_000_000;
                if (lamports < stakeAmtSmallest + FEE_RESERVE) {
                    const balanceHuman = (lamports / decimals).toFixed(4);
                    throw new Error(
                        `Insufficient SOL balance. You have ${balanceHuman} SOL but need at least ${duel.stakeAmount} SOL (plus ~0.01 SOL for fees).`
                    );
                }
            } else {
                const playerAta = getAssociatedTokenAddressSync(tokenMint, wallet.publicKey, false);
                const ataInfo = await CONNECTION.getAccountInfo(playerAta);
                if (!ataInfo) {
                    throw new Error(
                        `You don't have a ${tokenSym} token account. Please fund your wallet with at least ${duel.stakeAmount} ${tokenSym} on devnet.`
                    );
                }
                const balanceRes = await CONNECTION.getTokenAccountBalance(playerAta);
                const balanceSmallest = Number(balanceRes.value.amount);
                if (balanceSmallest < stakeAmtSmallest) {
                    const balanceHuman = (balanceSmallest / decimals).toFixed(6);
                    throw new Error(
                        `Insufficient ${tokenSym} balance. You have ${balanceHuman} but need at least ${duel.stakeAmount}.`
                    );
                }
            }

            const instructions = buildJoinEscrowInstructions(
                duel.id,
                tokenMint,
                wallet.publicKey,
                stakeAmtSmallest,
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

            if (!txSignature) throw new Error("Transaction failed or was rejected");

            await CONNECTION.confirmTransaction({ signature: txSignature, ...latestBlockhash }, "confirmed");
            const res = await duelsAPI.join(duel.id, { username: currentUser, txSignature });
            setDuel(res.duel);
            showToast("Joined duel! Get ready to compete.", "success");
        } catch (err: any) {
            console.error("Join error:", err);
            showToast(err.message || "Failed to join duel", "error");
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!currentUser || !duel) return;
        if (!wallet.publicKey) {
            showToast("Please connect your wallet first", "error");
            return;
        }

        setActionLoading(true);
        try {
            const tokenMint = new PublicKey(duel.tokenMint);
            const instructions = buildCancelEscrowInstructions(duel.id, tokenMint, wallet.publicKey);
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

            if (!txSignature) throw new Error("Cancel transaction failed or was rejected");

            await CONNECTION.confirmTransaction({ signature: txSignature, ...latestBlockhash }, "confirmed");
            await duelsAPI.cancel(duel.id, { username: currentUser, txSignature });
            showToast("Duel cancelled", "info");
            router.back();
        } catch (err: any) {
            console.error("Cancel error:", err);
            showToast(err.message || "Failed to cancel duel", "error");
            setActionLoading(false);
        }
    };

    const handleSubmitResult = async (iWon: boolean) => {
        if (!currentUser) return;
        if (!opponent) {
            showToast("Cannot submit result — opponent has not joined yet", "error");
            return;
        }
        setActionLoading(true);
        try {
            const winner = iWon ? currentUser : opponent;
            const res = await duelsAPI.submitResult(duel.id, { username: currentUser, winnerUsername: winner });
            setDuel(res.duel);
            if (res.resolved) {
                showToast("Duel settled successfully!", "success");
            } else if (res.duel.status === "DISPUTED") {
                showToast("Duel marked as disputed.", "info");
            } else {
                showToast("Result submitted. Waiting for opponent.", "success");
            }
        } catch (err: any) {
            showToast(err.message || "Failed to submit result", "error");
        } finally {
            setActionLoading(false);
            setShowResultModal(false);
        }
    };

    const handleVerify = async () => {
        setActionLoading(true);
        try {
            const { result } = await verificationAPI.verify(duel.id);
            if (result.verified) {
                showToast(`Verified! Winner: ${result.winnerUsername}`, "success");
            } else {
                showToast(result.reason || "Could not auto-verify this duel", "info");
            }
            fetchDuel();
        } catch (err: any) {
            showToast(err.message || "Failed to request verification", "error");
        } finally {
            setActionLoading(false);
        }
    };

    const handleUnwrapSol = async () => {
        if (!wallet.publicKey) return;
        setActionLoading(true);
        try {
            const { buildUnwrapSolInstruction } = await import("../../utils/ikkiEscrow");
            const unwrapIx = buildUnwrapSolInstruction(wallet.publicKey, wallet.publicKey);
            const latestBlockhash = await CONNECTION.getLatestBlockhash();
            const tx = new Transaction({ feePayer: wallet.publicKey, ...latestBlockhash }).add(unwrapIx);

            let txSignature = "";
            await transact(async (w: Web3MobileWallet) => {
                await w.authorize({
                    cluster: "devnet",
                    identity: { name: "Ikkii", uri: "https://ikkii.app", icon: "favicon.ico" },
                });
                const [sig] = await w.signAndSendTransactions({ transactions: [tx] });
                txSignature = sig;
            });

            await CONNECTION.confirmTransaction({ signature: txSignature, ...latestBlockhash }, "confirmed");
            showToast("SOL claimed to your wallet!", "success");
        } catch (err: any) {
            console.error("Unwrap SOL error:", err);
            showToast(err.message || "Failed to claim SOL", "error");
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <StatusBar style={theme.isDark ? "light" : "dark"} />
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 64, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Back button */}
                <Pressable
                    onPress={() => router.back()}
                    style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}
                >
                    <Ionicons name="chevron-back" size={20} color={theme.accentLight} />
                    <Text style={{ color: theme.accentLight, fontSize: 13, fontWeight: "700", letterSpacing: 0.5 }}>
                        BACK
                    </Text>
                </Pressable>

                {/* Status bar + ID */}
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                    <Badge status={duel.status} />
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        {/* Game badge */}
                        {(duelGameInfo || duel.gameId) && (
                            <View style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 4,
                                backgroundColor: theme.accentBg,
                                borderRadius: 8,
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderWidth: 1,
                                borderColor: theme.borderGlow,
                            }}>
                                <Ionicons
                                    name={(duelGameInfo?.ionicon ?? "game-controller-outline") as keyof typeof Ionicons.glyphMap}
                                    size={11}
                                    color={theme.accentLight}
                                />
                                <Text style={{ color: theme.accentLight, fontSize: 10, fontWeight: "700" }}>
                                    {duelGameInfo?.name ?? "Game Duel"}
                                </Text>
                            </View>
                        )}
                        <Text style={{ color: theme.textMuted, fontSize: 11, fontFamily: "monospace" }}>
                            #{duel.id.slice(0, 8)}
                        </Text>
                    </View>
                </View>

                {/* Players VS Card */}
                <View style={{
                    backgroundColor: theme.bgCard,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: theme.border,
                    marginBottom: 12,
                    overflow: "hidden",
                }}>
                    <View style={{ height: 3, backgroundColor: statusColor }} />
                    <View style={{ padding: 20 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                            {/* Player 1 */}
                            <Pressable onPress={() => router.push(`/user/${duel.player1Username}`)} style={{ flex: 1, alignItems: "center" }}>
                                <Avatar username={duel.player1Username} pfp={player1Data?.pfp} size="md" />
                                <Text style={{ color: theme.textPrimary, fontSize: 14, fontWeight: "800", marginTop: 8 }}>
                                    {duel.player1Username}
                                </Text>
                                <Text style={{ color: theme.textMuted, fontSize: 10, marginTop: 2, letterSpacing: 1, textTransform: "uppercase" }}>
                                    Creator
                                </Text>
                                {duel.winnerUsername === duel.player1Username && (
                                    <View style={{
                                        marginTop: 6,
                                        backgroundColor: theme.amber + "20",
                                        borderRadius: 20,
                                        paddingHorizontal: 10,
                                        paddingVertical: 3,
                                        borderWidth: 1,
                                        borderColor: theme.amber + "50",
                                    }}>
                                        <Text style={{ color: theme.amber, fontSize: 10, fontWeight: "800", letterSpacing: 1 }}>
                                            WINNER
                                        </Text>
                                    </View>
                                )}
                            </Pressable>

                            {/* VS */}
                            <View style={{ alignItems: "center", marginHorizontal: 16 }}>
                                <View style={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: 26,
                                    backgroundColor: theme.accentBg,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderWidth: 1,
                                    borderColor: theme.accent + "60",
                                    shadowColor: theme.accent,
                                    shadowOpacity: 0.4,
                                    shadowRadius: 10,
                                    shadowOffset: { width: 0, height: 0 },
                                    elevation: 8,
                                }}>
                                    <Text style={{ color: theme.accentLight, fontSize: 14, fontWeight: "900", letterSpacing: 1 }}>
                                        VS
                                    </Text>
                                </View>
                                <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center", gap: 4 }}>
                                    <Text style={{ color: theme.green, fontSize: 13, fontWeight: "900" }}>
                                        {duel.player2Username ? duel.stakeAmount * 2 : duel.stakeAmount}
                                    </Text>
                                    <Text style={{ color: theme.accentLight, fontSize: 11, fontWeight: "700" }}>
                                        {tokenSymbol}
                                    </Text>
                                </View>
                                <Text style={{ color: theme.textMuted, fontSize: 9, letterSpacing: 1, textTransform: "uppercase", marginTop: 1 }}>
                                    POT
                                </Text>
                            </View>

                            {/* Player 2 */}
                            <View style={{ flex: 1, alignItems: "center" }}>
                                {duel.player2Username ? (
                                    <Pressable onPress={() => router.push(`/user/${duel.player2Username}`)} style={{ alignItems: "center" }}>
                                        <Avatar username={duel.player2Username} pfp={player2Data?.pfp} size="md" />
                                        <Text style={{ color: theme.textPrimary, fontSize: 14, fontWeight: "800", marginTop: 8 }}>
                                            {duel.player2Username}
                                        </Text>
                                        <Text style={{ color: theme.textMuted, fontSize: 10, marginTop: 2, letterSpacing: 1, textTransform: "uppercase" }}>
                                            Challenger
                                        </Text>
                                        {duel.winnerUsername === duel.player2Username && (
                                            <View style={{
                                                marginTop: 6,
                                                backgroundColor: theme.amber + "20",
                                                borderRadius: 20,
                                                paddingHorizontal: 10,
                                                paddingVertical: 3,
                                                borderWidth: 1,
                                                borderColor: theme.amber + "50",
                                            }}>
                                                <Text style={{ color: theme.amber, fontSize: 10, fontWeight: "800", letterSpacing: 1 }}>
                                                    WINNER
                                                </Text>
                                            </View>
                                        )}
                                    </Pressable>
                                ) : (
                                    <>
                                        <View style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: 22,
                                            backgroundColor: theme.bgMuted,
                                            alignItems: "center",
                                            justifyContent: "center",
                                            borderWidth: 1.5,
                                            borderColor: theme.borderStrong,
                                            borderStyle: "dashed",
                                        }}>
                                            <Ionicons name="help" size={20} color={theme.textMuted} />
                                        </View>
                                        <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 8, fontStyle: "italic" }}>
                                            Waiting...
                                        </Text>
                                    </>
                                )}
                            </View>
                        </View>
                    </View>
                </View>

                {/* Stake Info Card */}
                <View style={{
                    backgroundColor: theme.bgCard,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: theme.border,
                    marginBottom: 12,
                    overflow: "hidden",
                }}>
                    <View style={{ height: 2, backgroundColor: theme.accent }} />
                    <View style={{ padding: 16 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                            <Text style={{ color: theme.textMuted, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", fontWeight: "700" }}>
                                STAKE
                            </Text>
                            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
                                <Text style={{ color: theme.textPrimary, fontSize: 26, fontWeight: "900" }}>
                                    {duel.stakeAmount}
                                </Text>
                                <Text style={{ color: theme.accentLight, fontSize: 14, fontWeight: "700" }}>
                                    {tokenSymbol}
                                </Text>
                            </View>
                        </View>

                        {duel.status !== "SETTLED" && duel.status !== "CANCELLED" && (
                            <View style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                paddingTop: 10,
                                borderTopWidth: 1,
                                borderTopColor: theme.border,
                            }}>
                                <Text style={{ color: theme.textMuted, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", fontWeight: "700" }}>
                                    {timeLeft === "Expired" ? "STATUS" : "TIME LEFT"}
                                </Text>
                                <Text style={{
                                    fontSize: 14,
                                    fontWeight: "700",
                                    color: timeLeft === "Expired" ? theme.red : theme.textPrimary,
                                    fontVariant: ["tabular-nums"],
                                }}>
                                    {timeLeft}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Meta Card */}
                <View style={{
                    backgroundColor: theme.bgCard,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: theme.border,
                    marginBottom: 24,
                    padding: 14,
                }}>
                    {(duelGameInfo || duel.gameId) && (
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                            <Text style={{ color: theme.textMuted, fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase" }}>GAME</Text>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                                <Ionicons
                                    name={(duelGameInfo?.ionicon ?? "game-controller-outline") as keyof typeof Ionicons.glyphMap}
                                    size={12}
                                    color={theme.accentLight}
                                />
                                <Text style={{ color: theme.accentLight, fontSize: 11, fontWeight: "700" }}>
                                    {duelGameInfo?.name ?? "Game Duel"}
                                </Text>
                            </View>
                        </View>
                    )}
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <Text style={{ color: theme.textMuted, fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase" }}>TOKEN</Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 11, fontFamily: "monospace" }}>
                            {duel.tokenMint.slice(0, 12)}…{duel.tokenMint.slice(-6)}
                        </Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <Text style={{ color: theme.textMuted, fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase" }}>CREATED</Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 11 }}>
                            {new Date(duel.createdAt).toLocaleString()}
                        </Text>
                    </View>
                    {duel.txSignature && (
                        <View style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginTop: 8,
                            paddingTop: 8,
                            borderTopWidth: 1,
                            borderTopColor: theme.border,
                        }}>
                            <Text style={{ color: theme.textMuted, fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase" }}>TX SIG</Text>
                            <Text style={{ color: theme.textSecondary, fontSize: 10, fontFamily: "monospace" }}>
                                {duel.txSignature.slice(0, 16)}…
                            </Text>
                        </View>
                    )}
                </View>

                {/* Contextual Actions */}
                {duel.status === "OPEN" && !isParticipant && (
                    <Button
                        title="Join Duel"
                        onPress={handleJoin}
                        loading={actionLoading}
                        size="lg"
                        icon={<Ionicons name="flash" size={16} color={theme.textInverse} />}
                    />
                )}
                {duel.status === "OPEN" && isCreator && (
                    <Button
                        title="Cancel Duel"
                        onPress={handleCancel}
                        loading={actionLoading}
                        variant="danger"
                        size="lg"
                    />
                )}
                {duel.status === "ACTIVE" && isParticipant && (
                    <Button
                        title="Submit Result"
                        onPress={() => setShowResultModal(true)}
                        size="lg"
                        icon={<Ionicons name="trophy" size={16} color={theme.textInverse} />}
                    />
                )}
                {duel.status === "DISPUTED" && isParticipant && (
                    <Button
                        title="Request Verification"
                        onPress={handleVerify}
                        loading={actionLoading}
                        variant="secondary"
                        size="lg"
                        icon={<Ionicons name="shield-checkmark-outline" size={16} color={theme.accentLight} />}
                    />
                )}

                {duel.status === "SETTLED" && (
                    <View style={{
                        backgroundColor: theme.bgCard,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: theme.amber + "40",
                        overflow: "hidden",
                    }}>
                        <View style={{ height: 3, backgroundColor: theme.amber }} />
                        <View style={{ padding: 20, alignItems: "center" }}>
                            <View style={{
                                width: 56,
                                height: 56,
                                borderRadius: 28,
                                backgroundColor: theme.amber + "20",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: 12,
                                borderWidth: 1,
                                borderColor: theme.amber + "40",
                            }}>
                                <Ionicons name="trophy" size={28} color={theme.amber} />
                            </View>
                            <Text style={{ color: theme.amber, fontSize: 18, fontWeight: "900", letterSpacing: 1 }}>
                                {duel.winnerUsername?.toUpperCase()} WINS
                            </Text>
                            <Text style={{ color: theme.textMuted, fontSize: 13, marginTop: 4 }}>
                                {duel.stakeAmount * 2} {tokenSymbol} claimed
                            </Text>
                            {duel.winnerUsername === currentUser && isNativeSol(new PublicKey(duel.tokenMint)) && (
                                <View style={{ marginTop: 16, width: "100%" }}>
                                    <Button
                                        title="Claim SOL"
                                        onPress={handleUnwrapSol}
                                        loading={actionLoading}
                                        variant="primary"
                                        size="lg"
                                        icon={<Ionicons name="download-outline" size={16} color={theme.textInverse} />}
                                    />
                                    <Text style={{ color: theme.textMuted, fontSize: 11, textAlign: "center", marginTop: 6 }}>
                                        Convert winnings from wSOL to native SOL
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {duel.status === "CANCELLED" && (
                    <View style={{
                        backgroundColor: theme.bgCard,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: theme.border,
                        overflow: "hidden",
                    }}>
                        <View style={{ height: 3, backgroundColor: theme.grey }} />
                        <View style={{ padding: 20, alignItems: "center" }}>
                            <Ionicons name="close-circle" size={36} color={theme.grey} />
                            <Text style={{ color: theme.textMuted, fontSize: 14, fontWeight: "700", marginTop: 8, letterSpacing: 1, textTransform: "uppercase" }}>
                                Duel Cancelled
                            </Text>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Result Submission Modal */}
            <Modal
                visible={showResultModal}
                onClose={() => setShowResultModal(false)}
                title="Submit Result"
            >
                <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 20 }}>
                    Who won this duel? Both players must agree on the result.
                </Text>
                <View style={{ gap: 10 }}>
                    <Button
                        title="I Won"
                        onPress={() => handleSubmitResult(true)}
                        loading={actionLoading}
                        variant="primary"
                        size="lg"
                        icon={<Ionicons name="trophy" size={16} color={theme.textInverse} />}
                    />
                    <Button
                        title="Opponent Won"
                        onPress={() => handleSubmitResult(false)}
                        loading={actionLoading}
                        variant="secondary"
                        size="lg"
                    />
                </View>
            </Modal>
        </View>
    );
}
