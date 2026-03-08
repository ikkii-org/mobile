import React, { useEffect, useState } from "react";
import { Pressable, Text, View, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Duel } from "../types";
import { Avatar } from "./ui/Avatar";
import { COMMON_TOKENS, SUPPORTED_GAMES } from "../constants";
import { GAME_ICONS } from "../assets/games";
import { useTheme } from "../contexts/ThemeContext";

interface DuelCardProps {
    duel: Duel;
    currentUsername?: string;
    games?: import("../types").Game[];
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

const STATUS_LABEL: Record<string, string> = {
    OPEN: "OPEN",
    ACTIVE: "LIVE",
    DISPUTED: "DISPUTE",
    SETTLED: "SETTLED",
    CANCELLED: "VOID",
};

export function DuelCard({ duel, currentUsername, games, onPress, onAction, variant = "full" }: DuelCardProps) {
    const theme = useTheme();
    const [timeLeft, setTimeLeft] = useState(getTimeRemaining(duel.expiresAt));

    const isMyDuel = duel.player1Username === currentUsername || duel.player2Username === currentUsername;
    const opponent = duel.player1Username === currentUsername ? duel.player2Username : duel.player1Username;
    const displayUser = isMyDuel ? (opponent ?? null) : duel.player1Username;
    const tokenSymbol = getTokenSymbol(duel.tokenMint);
    const isWin = duel.status === "SETTLED" && duel.winnerUsername === currentUsername;
    const isLoss = isMyDuel && duel.status === "SETTLED" && duel.winnerUsername !== currentUsername && duel.winnerUsername !== null;
    const isOpen = duel.status === "OPEN" && duel.player1Username !== currentUsername;
    const isActive = duel.status === "ACTIVE";

    const accentColor: string = theme[STATUS_COLOR_KEY[duel.status] ?? "grey"] as string;
    const glowColor: string = theme[STATUS_GLOW_KEY[duel.status] ?? "accentGlow"] as string;
    const statusIcon = STATUS_ICON[duel.status] ?? "help-circle";
    const statusLabel = STATUS_LABEL[duel.status] ?? duel.status;

    useEffect(() => {
        if (duel.status === "SETTLED" || duel.status === "CANCELLED") return;
        const interval = setInterval(() => setTimeLeft(getTimeRemaining(duel.expiresAt)), 30_000);
        return () => clearInterval(interval);
    }, [duel.expiresAt, duel.status]);

    const dbGame = games?.find((g) => g.id === duel.gameId);

    // If no gameId, it's a generic custom wager. Otherwise fallback to the DB name (or Clash Royale for the demo).
    const gameName = !duel.gameId
        ? "Custom Game"
        : (dbGame?.name || "Clash Royale");

    const linkedGame = gameName ? SUPPORTED_GAMES.find((g) => g.name === gameName) : null;

    // ─── COMPACT VARIANT ─── (carousel / grid — fixed width, vertical)
    if (variant === "compact") {
        return (
            <Pressable
                onPress={onPress}
                style={({ pressed }) => ({
                    width: 168,
                    backgroundColor: theme.bgCard,
                    borderWidth: 1,
                    borderColor: pressed ? theme.borderStrong : theme.border,
                    borderRadius: 12,
                    overflow: "hidden",
                    opacity: pressed ? 0.9 : 1,
                })}
            >
                {/* Top status bar — neon edge */}
                <View style={{
                    height: 2,
                    backgroundColor: accentColor,
                }} />

                <View style={{ padding: 11 }}>
                    {/* Status row */}
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <View style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 4,
                            backgroundColor: accentColor + "10",
                            borderRadius: 4,
                            paddingHorizontal: 5,
                            paddingVertical: 2,
                        }}>
                            <View style={{
                                width: 4,
                                height: 4,
                                borderRadius: 1,
                                backgroundColor: accentColor,
                            }} />
                            <Text style={{ color: accentColor, fontSize: 8, fontWeight: "900", letterSpacing: 1.5 }}>
                                {statusLabel}
                            </Text>
                        </View>
                        {duel.status !== "SETTLED" && duel.status !== "CANCELLED" && (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                                <Ionicons name="time-outline" size={8} color={theme.textMuted} />
                                <Text style={{ color: theme.textMuted, fontSize: 8, fontWeight: "700", letterSpacing: 0.3 }}>
                                    {timeLeft}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Hero stake amount */}
                    <View style={{ alignItems: "center", marginBottom: 10 }}>
                        {gameName && GAME_ICONS[gameName] ? (
                            <Image
                                source={GAME_ICONS[gameName]}
                                style={{ width: 16, height: 16, marginBottom: 4 }}
                                resizeMode="contain"
                            />
                        ) : linkedGame ? (
                            <Image
                                source={{ uri: linkedGame.icon }}
                                style={{ width: 16, height: 16, marginBottom: 4 }}
                                resizeMode="contain"
                            />
                        ) : (
                            <Text style={{ color: theme.textSecondary, fontSize: 8, fontWeight: "800", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 2 }}>
                                {gameName}
                            </Text>
                        )}
                        <Text style={{
                            color: theme.textPrimary,
                            fontSize: 26,
                            fontWeight: "900",
                            letterSpacing: -1,
                        }}>
                            {duel.stakeAmount}
                        </Text>
                        <View style={{
                            backgroundColor: theme.accentBg,
                            borderRadius: 4,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            marginTop: 3,
                            borderWidth: 1,
                            borderColor: theme.borderGlow,
                        }}>
                            <Text style={{ color: theme.accentLight, fontWeight: "900", fontSize: 8, letterSpacing: 1.2 }}>
                                {tokenSymbol}
                            </Text>
                        </View>
                    </View>

                    {/* Divider line */}
                    <View style={{
                        height: 1,
                        backgroundColor: theme.divider,
                        marginBottom: 8,
                    }} />

                    {/* Players row */}
                    {isActive && duel.player2Username ? (
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 8 }}>
                            <Avatar username={duel.player1Username} size="xs" />
                            <Text style={{ color: theme.accent, fontSize: 8, fontWeight: "900", letterSpacing: 2 }}>VS</Text>
                            <Avatar username={duel.player2Username} size="xs" />
                        </View>
                    ) : (
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, marginBottom: 8 }}>
                            <Avatar username={displayUser ?? duel.player1Username} size="xs" />
                            <Text
                                style={{ color: theme.textSecondary, fontSize: 10, fontWeight: "700", maxWidth: 85 }}
                                numberOfLines={1}
                            >
                                {displayUser ?? "Waiting..."}
                            </Text>
                        </View>
                    )}

                    {/* Bottom action/result */}
                    {isOpen && onAction && (
                        <Pressable
                            onPress={(e) => { e.stopPropagation(); onAction(); }}
                            style={({ pressed }) => ({
                                backgroundColor: pressed ? theme.accentLight : theme.accent,
                                paddingVertical: 6,
                                borderRadius: 6,
                                alignItems: "center",
                            })}
                        >
                            <Text style={{ color: theme.textInverse, fontSize: 9, fontWeight: "900", letterSpacing: 1.5 }}>
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
                            backgroundColor: theme.green + "10",
                            paddingVertical: 5,
                            borderRadius: 6,
                            borderWidth: 1,
                            borderColor: theme.green + "30",
                        }}>
                            <Ionicons name="trophy" size={10} color={theme.green} />
                            <Text style={{ color: theme.green, fontSize: 9, fontWeight: "900", letterSpacing: 1 }}>WIN</Text>
                        </View>
                    )}
                    {isLoss && (
                        <View style={{
                            alignItems: "center",
                            backgroundColor: theme.red + "10",
                            paddingVertical: 5,
                            borderRadius: 6,
                            borderWidth: 1,
                            borderColor: theme.red + "30",
                        }}>
                            <Text style={{ color: theme.red, fontSize: 9, fontWeight: "900", letterSpacing: 1 }}>LOSS</Text>
                        </View>
                    )}
                </View>
            </Pressable>
        );
    }

    // ─── FULL VARIANT ─── (list cards — horizontal layout)
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => ({
                backgroundColor: theme.bgCard,
                borderWidth: 1,
                borderColor: pressed ? theme.borderStrong : theme.border,
                borderRadius: 12,
                marginBottom: 8,
                overflow: "hidden",
                opacity: pressed ? 0.9 : 1,
            })}
        >
            <View style={{ flexDirection: "row" }}>
                {/* Left accent stripe — neon indicator */}
                <View style={{ width: 3, backgroundColor: accentColor, borderTopLeftRadius: 12, borderBottomLeftRadius: 12 }} />

                <View style={{ flex: 1, padding: 12 }}>
                    {/* Game & Status Row */}
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            {gameName && GAME_ICONS[gameName] ? (
                                <Image
                                    source={GAME_ICONS[gameName]}
                                    style={{ width: 14, height: 14 }}
                                    resizeMode="contain"
                                />
                            ) : linkedGame && (
                                <Image
                                    source={{ uri: linkedGame.icon }}
                                    style={{ width: 14, height: 14 }}
                                    resizeMode="contain"
                                />
                            )}
                            <Text style={{ color: theme.textSecondary, fontSize: 10, fontWeight: "800", letterSpacing: 0.5, textTransform: "uppercase" }}>
                                {gameName}
                            </Text>
                        </View>
                        {/* Status chip */}
                        <View style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 4,
                            backgroundColor: accentColor + "10",
                            borderWidth: 1,
                            borderColor: accentColor + "30",
                            borderRadius: 5,
                            paddingHorizontal: 7,
                            paddingVertical: 3,
                        }}>
                            <View style={{ width: 4, height: 4, borderRadius: 1, backgroundColor: accentColor }} />
                            <Text style={{ color: accentColor, fontSize: 8, fontWeight: "900", letterSpacing: 1.2 }}>
                                {statusLabel}
                            </Text>
                        </View>
                    </View>

                    {/* Players row */}
                    {duel.player2Username ? (
                        /* P1 vs P2 row */
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 7 }}>
                                <Avatar username={duel.player1Username} size="xs" />
                                <Text
                                    style={{ color: theme.textPrimary, fontWeight: "700", fontSize: 12, letterSpacing: 0.2 }}
                                    numberOfLines={1}
                                >
                                    {duel.player1Username}
                                </Text>
                            </View>

                            {/* VS chip */}
                            <View style={{
                                backgroundColor: theme.accentBg,
                                borderWidth: 1,
                                borderColor: theme.borderGlow,
                                borderRadius: 5,
                                paddingHorizontal: 7,
                                paddingVertical: 2,
                                marginHorizontal: 6,
                            }}>
                                <Text style={{ color: theme.accent, fontWeight: "900", fontSize: 8, letterSpacing: 2 }}>
                                    VS
                                </Text>
                            </View>

                            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 7 }}>
                                <Text
                                    style={{ color: theme.textPrimary, fontWeight: "700", fontSize: 12, letterSpacing: 0.2 }}
                                    numberOfLines={1}
                                >
                                    {duel.player2Username}
                                </Text>
                                <Avatar username={duel.player2Username} size="xs" />
                            </View>
                        </View>
                    ) : (
                        /* Single user row */
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                            <Avatar username={displayUser ?? duel.player1Username} size="xs" />
                            <View style={{ flex: 1, marginLeft: 8 }}>
                                <Text
                                    style={{ color: theme.textPrimary, fontWeight: "700", fontSize: 13, letterSpacing: 0.2 }}
                                    numberOfLines={1}
                                >
                                    {isMyDuel ? (displayUser ?? "Waiting...") : duel.player1Username}
                                </Text>
                                {!isMyDuel && !duel.player2Username && (
                                    <Text style={{ color: theme.textMuted, fontSize: 9, marginTop: 1, letterSpacing: 0.3 }}>
                                        Open challenge
                                    </Text>
                                )}
                            </View>
                        </View>
                    )}

                    {/* Bottom row: stake | timer/result | action */}
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        {/* Stake */}
                        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
                            <Text style={{ color: theme.textPrimary, fontWeight: "900", fontSize: 18, letterSpacing: -0.5 }}>
                                {duel.stakeAmount}
                            </Text>
                            <View style={{
                                backgroundColor: theme.accentBg,
                                borderRadius: 4,
                                paddingHorizontal: 5,
                                paddingVertical: 1,
                                borderWidth: 1,
                                borderColor: theme.borderGlow,
                            }}>
                                <Text style={{ color: theme.accentLight, fontWeight: "900", fontSize: 8, letterSpacing: 0.8 }}>
                                    {tokenSymbol}
                                </Text>
                            </View>
                        </View>

                        {/* Right: timer / result / action */}
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            {duel.status !== "SETTLED" && duel.status !== "CANCELLED" && (
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                                    <Ionicons name="time-outline" size={9} color={theme.textMuted} />
                                    <Text style={{ color: theme.textMuted, fontSize: 9, fontWeight: "700", letterSpacing: 0.3 }}>
                                        {timeLeft}
                                    </Text>
                                </View>
                            )}

                            {isWin && (
                                <View style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 4,
                                    backgroundColor: theme.green + "10",
                                    paddingHorizontal: 8,
                                    paddingVertical: 4,
                                    borderRadius: 5,
                                    borderWidth: 1,
                                    borderColor: theme.green + "30",
                                }}>
                                    <Ionicons name="trophy" size={9} color={theme.green} />
                                    <Text style={{ color: theme.green, fontSize: 9, fontWeight: "900", letterSpacing: 0.8 }}>WIN</Text>
                                </View>
                            )}

                            {isLoss && (
                                <View style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 4,
                                    backgroundColor: theme.red + "10",
                                    paddingHorizontal: 8,
                                    paddingVertical: 4,
                                    borderRadius: 5,
                                    borderWidth: 1,
                                    borderColor: theme.red + "30",
                                }}>
                                    <Text style={{ color: theme.red, fontSize: 9, fontWeight: "900", letterSpacing: 0.8 }}>LOSS</Text>
                                </View>
                            )}

                            {isOpen && onAction && (
                                <Pressable
                                    onPress={(e) => { e.stopPropagation(); onAction(); }}
                                    style={({ pressed }) => ({
                                        backgroundColor: pressed ? theme.accentLight : theme.accent,
                                        paddingHorizontal: 14,
                                        paddingVertical: 6,
                                        borderRadius: 6,
                                    })}
                                >
                                    <Text style={{ color: theme.textInverse, fontSize: 9, fontWeight: "900", letterSpacing: 1.5 }}>
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
