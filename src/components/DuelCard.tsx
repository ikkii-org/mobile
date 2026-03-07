import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Duel } from "../types";
import { Avatar } from "./ui/Avatar";
import { COMMON_TOKENS } from "../constants";
import { useTheme } from "../contexts/ThemeContext";

interface DuelCardProps {
    duel: Duel;
    currentUsername?: string;
    onPress: () => void;
    onAction?: () => void;
    /** "compact" for horizontal carousel cards, "full" for list/detail cards */
    variant?: "compact" | "full";
}

function getTokenSymbol(mint: string) {
    const token = COMMON_TOKENS.find((t) => t.mint === mint);
    return token?.symbol ?? mint.slice(0, 6) + "…";
}

function getTimeRemaining(expiresAt: string): string {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Expired";
    const hrs = Math.floor(diff / (60 * 60 * 1000));
    const mins = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
}

const STATUS_GLOW_KEY: Record<string, "greenGlow" | "redGlow" | "accentGlow"> = {
    OPEN: "accentGlow",
    ACTIVE: "greenGlow",
    DISPUTED: "redGlow",
    SETTLED: "accentGlow",
    CANCELLED: "accentGlow",
};

const STATUS_COLOR_KEY: Record<string, "blue" | "green" | "red" | "amber" | "grey"> = {
    OPEN: "blue",
    ACTIVE: "green",
    DISPUTED: "red",
    SETTLED: "amber",
    CANCELLED: "grey",
};

const STATUS_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
    OPEN: "radio-button-on",
    ACTIVE: "flash",
    DISPUTED: "warning",
    SETTLED: "checkmark-circle",
    CANCELLED: "close-circle",
};

export function DuelCard({ duel, currentUsername, onPress, onAction, variant = "full" }: DuelCardProps) {
    const theme = useTheme();
    const [timeLeft, setTimeLeft] = useState(getTimeRemaining(duel.expiresAt));

    const isMyDuel = duel.player1Username === currentUsername || duel.player2Username === currentUsername;
    const opponent = duel.player1Username === currentUsername ? duel.player2Username : duel.player1Username;
    const displayUser = isMyDuel ? (opponent ?? null) : duel.player1Username;
    const tokenSymbol = getTokenSymbol(duel.tokenMint);
    const isWin = duel.status === "SETTLED" && duel.winnerUsername === currentUsername;
    const isLoss = duel.status === "SETTLED" && duel.winnerUsername !== currentUsername && duel.winnerUsername !== null;
    const isOpen = duel.status === "OPEN" && duel.player1Username !== currentUsername;
    const isActive = duel.status === "ACTIVE";

    const accentColor: string = theme[STATUS_COLOR_KEY[duel.status] ?? "grey"] as string;
    const glowColor: string = theme[STATUS_GLOW_KEY[duel.status] ?? "accentGlow"] as string;
    const statusIcon = STATUS_ICON[duel.status] ?? "help-circle";

    useEffect(() => {
        if (duel.status === "SETTLED" || duel.status === "CANCELLED") return;
        const interval = setInterval(() => setTimeLeft(getTimeRemaining(duel.expiresAt)), 30_000);
        return () => clearInterval(interval);
    }, [duel.expiresAt, duel.status]);

    // ─── COMPACT VARIANT ─── (carousel / grid cards — fixed width, vertical layout)
    if (variant === "compact") {
        return (
            <Pressable
                onPress={onPress}
                style={({ pressed }) => ({
                    width: 172,
                    backgroundColor: theme.bgCard,
                    borderWidth: 1,
                    borderColor: pressed ? theme.borderStrong : theme.border,
                    borderRadius: 16,
                    overflow: "hidden",
                    opacity: pressed ? 0.92 : 1,
                })}
            >
                {/* Status color bar */}
                <View style={{ height: 2, backgroundColor: accentColor, opacity: 0.85 }} />

                <View style={{ padding: 12 }}>
                    {/* Top: Status icon + timer */}
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <Ionicons name={statusIcon} size={10} color={accentColor} />
                            <Text style={{ color: accentColor, fontSize: 9, fontWeight: "800", letterSpacing: 0.8 }}>
                                {duel.status}
                            </Text>
                        </View>
                        {duel.status !== "SETTLED" && duel.status !== "CANCELLED" && (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                                <Ionicons name="time-outline" size={9} color={theme.textMuted} />
                                <Text style={{ color: theme.textMuted, fontSize: 9, fontWeight: "600" }}>
                                    {timeLeft}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Center: Stake amount — hero number */}
                    <View style={{ alignItems: "center", marginBottom: 10 }}>
                        <Text style={{
                            color: theme.textPrimary,
                            fontSize: 24,
                            fontWeight: "900",
                            letterSpacing: -0.5,
                        }}>
                            {duel.stakeAmount}
                        </Text>
                        <View style={{
                            backgroundColor: theme.accentBg,
                            borderRadius: 6,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            marginTop: 3,
                            borderWidth: 1,
                            borderColor: theme.borderGlow,
                        }}>
                            <Text style={{ color: theme.accentLight, fontWeight: "800", fontSize: 9, letterSpacing: 0.8 }}>
                                {tokenSymbol}
                            </Text>
                        </View>
                    </View>

                    {/* Players row */}
                    {isActive && duel.player2Username ? (
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 8 }}>
                            <Avatar username={duel.player1Username} size="xs" />
                            <Text style={{ color: theme.accentLight, fontSize: 9, fontWeight: "900" }}>VS</Text>
                            <Avatar username={duel.player2Username} size="xs" />
                        </View>
                    ) : (
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 8 }}>
                            <Avatar username={displayUser ?? duel.player1Username} size="xs" />
                            <Text
                                style={{ color: theme.textSecondary, fontSize: 10, fontWeight: "700", maxWidth: 90 }}
                                numberOfLines={1}
                            >
                                {displayUser ?? "Open..."}
                            </Text>
                        </View>
                    )}

                    {/* Bottom: action or result */}
                    {isOpen && onAction && (
                        <Pressable
                            onPress={(e) => { e.stopPropagation(); onAction(); }}
                            style={({ pressed }) => ({
                                backgroundColor: pressed ? theme.accentLight : theme.accent,
                                paddingVertical: 6,
                                borderRadius: 8,
                                alignItems: "center",
                            })}
                        >
                            <Text style={{ color: theme.textInverse, fontSize: 10, fontWeight: "800", letterSpacing: 0.8 }}>
                                JOIN
                            </Text>
                        </Pressable>
                    )}
                    {isWin && (
                        <View style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 4,
                            backgroundColor: theme.badgeActiveBg,
                            paddingVertical: 5,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: theme.green + "40",
                        }}>
                            <Ionicons name="trophy" size={10} color={theme.green} />
                            <Text style={{ color: theme.green, fontSize: 10, fontWeight: "800" }}>WIN</Text>
                        </View>
                    )}
                    {isLoss && (
                        <View style={{
                            alignItems: "center",
                            backgroundColor: theme.badgeDisputedBg,
                            paddingVertical: 5,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: theme.red + "40",
                        }}>
                            <Text style={{ color: theme.red, fontSize: 10, fontWeight: "800" }}>LOSS</Text>
                        </View>
                    )}
                </View>
            </Pressable>
        );
    }

    // ─── FULL VARIANT ─── (list cards — horizontal layout, betting-app style)
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => ({
                backgroundColor: theme.bgCard,
                borderWidth: 1,
                borderColor: pressed ? theme.borderStrong : theme.border,
                borderRadius: 16,
                marginBottom: 10,
                overflow: "hidden",
                opacity: pressed ? 0.92 : 1,
            })}
        >
            {/* Left accent stripe */}
            <View style={{ flexDirection: "row" }}>
                <View style={{ width: 3, backgroundColor: accentColor, opacity: 0.85 }} />

                <View style={{ flex: 1, padding: 12 }}>
                    {/* Top row: players vs layout OR single user row */}
                    {isActive && duel.player2Username ? (
                        /* ─── Active duel: P1 vs P2 row ─── */
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                            {/* Player 1 */}
                            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Avatar username={duel.player1Username} size="xs" />
                                <Text
                                    style={{ color: theme.textPrimary, fontWeight: "700", fontSize: 12 }}
                                    numberOfLines={1}
                                >
                                    {duel.player1Username}
                                </Text>
                            </View>

                            {/* VS chip */}
                            <View style={{
                                backgroundColor: theme.bgMuted,
                                borderWidth: 1,
                                borderColor: theme.borderGlow,
                                borderRadius: 8,
                                paddingHorizontal: 8,
                                paddingVertical: 3,
                                marginHorizontal: 6,
                            }}>
                                <Text style={{ color: theme.accentLight, fontWeight: "900", fontSize: 9, letterSpacing: 1.5 }}>
                                    VS
                                </Text>
                            </View>

                            {/* Player 2 */}
                            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                                <Text
                                    style={{ color: theme.textPrimary, fontWeight: "700", fontSize: 12 }}
                                    numberOfLines={1}
                                >
                                    {duel.player2Username}
                                </Text>
                                <Avatar username={duel.player2Username} size="xs" />
                            </View>
                        </View>
                    ) : (
                        /* ─── Non-active: single user row ─── */
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                            <Avatar username={displayUser ?? duel.player1Username} size="xs" />
                            <View style={{ flex: 1, marginLeft: 8 }}>
                                <Text
                                    style={{ color: theme.textPrimary, fontWeight: "700", fontSize: 13 }}
                                    numberOfLines={1}
                                >
                                    {isMyDuel ? (displayUser ?? "Waiting...") : duel.player1Username}
                                </Text>
                                {!isMyDuel && !duel.player2Username && (
                                    <Text style={{ color: theme.textMuted, fontSize: 10, fontStyle: "italic", marginTop: 1 }}>
                                        Open challenge
                                    </Text>
                                )}
                            </View>

                            {/* Status chip */}
                            <View style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 4,
                                backgroundColor: accentColor + "15",
                                borderWidth: 1,
                                borderColor: accentColor + "35",
                                borderRadius: 100,
                                paddingHorizontal: 8,
                                paddingVertical: 3,
                            }}>
                                <Ionicons name={statusIcon} size={9} color={accentColor} />
                                <Text style={{ color: accentColor, fontSize: 9, fontWeight: "800", letterSpacing: 0.5 }}>
                                    {duel.status}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Bottom row: stake | timer/result | action */}
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        {/* Left: stake */}
                        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
                            <Text style={{ color: theme.textPrimary, fontWeight: "900", fontSize: 18, letterSpacing: -0.3 }}>
                                {duel.stakeAmount}
                            </Text>
                            <View style={{
                                backgroundColor: theme.accentBg,
                                borderRadius: 5,
                                paddingHorizontal: 5,
                                paddingVertical: 1,
                                borderWidth: 1,
                                borderColor: theme.borderGlow,
                            }}>
                                <Text style={{ color: theme.accentLight, fontWeight: "800", fontSize: 9, letterSpacing: 0.5 }}>
                                    {tokenSymbol}
                                </Text>
                            </View>
                        </View>

                        {/* Right: timer / result / action */}
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            {/* Timer */}
                            {duel.status !== "SETTLED" && duel.status !== "CANCELLED" && (
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                                    <Ionicons name="time-outline" size={10} color={theme.textMuted} />
                                    <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: "600" }}>
                                        {timeLeft}
                                    </Text>
                                </View>
                            )}

                            {/* WIN pill */}
                            {isWin && (
                                <View style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 4,
                                    backgroundColor: theme.badgeActiveBg,
                                    paddingHorizontal: 8,
                                    paddingVertical: 4,
                                    borderRadius: 100,
                                    borderWidth: 1,
                                    borderColor: theme.green + "50",
                                }}>
                                    <Ionicons name="trophy" size={10} color={theme.green} />
                                    <Text style={{ color: theme.green, fontSize: 10, fontWeight: "800" }}>WIN</Text>
                                </View>
                            )}

                            {/* LOSS pill */}
                            {isLoss && (
                                <View style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 4,
                                    backgroundColor: theme.badgeDisputedBg,
                                    paddingHorizontal: 8,
                                    paddingVertical: 4,
                                    borderRadius: 100,
                                    borderWidth: 1,
                                    borderColor: theme.red + "50",
                                }}>
                                    <Text style={{ color: theme.red, fontSize: 10, fontWeight: "800" }}>LOSS</Text>
                                </View>
                            )}

                            {/* JOIN button */}
                            {isOpen && onAction && (
                                <Pressable
                                    onPress={(e) => { e.stopPropagation(); onAction(); }}
                                    style={({ pressed }) => ({
                                        backgroundColor: pressed ? theme.accentLight : theme.accent,
                                        paddingHorizontal: 14,
                                        paddingVertical: 6,
                                        borderRadius: 8,
                                    })}
                                >
                                    <Text style={{ color: theme.textInverse, fontSize: 10, fontWeight: "800", letterSpacing: 0.8 }}>
                                        JOIN
                                    </Text>
                                </Pressable>
                            )}
                        </View>
                    </View>
                </View>
            </View>
        </Pressable>
    );
}
