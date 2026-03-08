import React, { useState, useEffect, useCallback } from "react";
import { FlatList, Pressable, RefreshControl, Text, View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Avatar } from "../../components/ui/Avatar";
import { Card } from "../../components/ui/Card";
import { leaderboardAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import type { LeaderboardEntry } from "../../types";

// Gold / Silver / Bronze (universal medal colors)
const RANK_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];

function RankChangeIndicator({ current, previous }: { current: number; previous: number }) {
    const theme = useTheme();
    const diff = previous - current;
    if (diff === 0) {
        return <Text style={{ color: theme.textMuted, fontSize: 10 }}>—</Text>;
    }
    if (diff > 0) {
        return (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                <Ionicons name="arrow-up" size={9} color={theme.green} />
                <Text style={{ color: theme.green, fontSize: 9, fontWeight: "800" }}>{diff}</Text>
            </View>
        );
    }
    return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
            <Ionicons name="arrow-down" size={9} color={theme.red} />
            <Text style={{ color: theme.red, fontSize: 9, fontWeight: "800" }}>{Math.abs(diff)}</Text>
        </View>
    );
}

// ─── HEIGHT-STACKED PODIUM ───
function Podium({ entries, currentUsername }: { entries: LeaderboardEntry[]; currentUsername: string }) {
    const theme = useTheme();
    const router = useRouter();

    // Reorder for visual podium: [2nd, 1st, 3rd]
    const ordered: (LeaderboardEntry | null)[] = [
        entries.find((e) => e.rank === 2) ?? null,
        entries.find((e) => e.rank === 1) ?? null,
        entries.find((e) => e.rank === 3) ?? null,
    ];
    const podiumHeights = [90, 120, 70];
    const crownLabels = ["2ND", "1ST", "3RD"];

    return (
        <View style={{
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "center",
            paddingHorizontal: 20,
            gap: 8,
            marginBottom: 6,
        }}>
            {ordered.map((entry, i) => {
                if (!entry) return <View key={i} style={{ flex: 1 }} />;
                const medalColor = RANK_COLORS[entry.rank - 1];
                const isCurrent = entry.username === currentUsername;
                const height = podiumHeights[i];

                return (
                    <Pressable
                        key={entry.userId}
                        onPress={() => router.push(`/user/${entry.username}`)}
                        style={{
                            flex: 1,
                            alignItems: "center",
                        }}
                    >
                        {/* Avatar + crown */}
                        <View style={{ alignItems: "center", marginBottom: 8 }}>
                            {entry.rank === 1 && (
                                <Ionicons name="trophy" size={20} color={RANK_COLORS[0]} style={{ marginBottom: 2 }} />
                            )}
                            <View style={{
                                borderRadius: 30,
                                padding: 2,
                                borderWidth: 2,
                                borderColor: isCurrent ? theme.borderNeon : medalColor + "60",
                            }}>
                                <Avatar username={entry.username} size={entry.rank === 1 ? "md" : "sm"} pfp={entry.pfp} />
                            </View>
                            <Text
                                style={{
                                    color: isCurrent ? theme.accentLight : theme.textPrimary,
                                    fontWeight: "800",
                                    fontSize: 11,
                                    marginTop: 5,
                                    textAlign: "center",
                                    letterSpacing: 0.3,
                                }}
                                numberOfLines={1}
                            >
                                {entry.username}
                            </Text>
                        </View>

                        {/* Podium bar */}
                        <View style={{
                            width: "100%",
                            height,
                            borderTopLeftRadius: 10,
                            borderTopRightRadius: 10,
                            backgroundColor: medalColor + "18",
                            borderWidth: 1,
                            borderBottomWidth: 0,
                            borderColor: medalColor + "35",
                            alignItems: "center",
                            justifyContent: "flex-start",
                            paddingTop: 10,
                            overflow: "hidden",
                        }}>
                            {/* Top accent line */}
                            <View style={{
                                position: "absolute",
                                top: 0,
                                left: "20%",
                                right: "20%",
                                height: 2,
                                backgroundColor: medalColor + "70",
                                borderBottomLeftRadius: 1,
                                borderBottomRightRadius: 1,
                            }} />
                            <Text style={{
                                color: medalColor,
                                fontSize: 9,
                                fontWeight: "900",
                                letterSpacing: 2,
                                marginTop: 4,
                            }}>
                                {crownLabels[i]}
                            </Text>
                            <Text style={{
                                color: theme.green,
                                fontSize: 12,
                                fontWeight: "900",
                                marginTop: 4,
                                letterSpacing: -0.3,
                            }}>
                                {entry.totalStakeWon.toLocaleString()}
                            </Text>
                            <Text style={{ color: theme.textMuted, fontSize: 9, marginTop: 2, fontWeight: "600" }}>
                                {entry.winPercentage.toFixed(1)}%
                            </Text>
                        </View>
                    </Pressable>
                );
            })}
        </View>
    );
}

// ─── Card-based leaderboard row ───
function LeaderboardCard({ entry, isCurrentUser }: { entry: LeaderboardEntry; isCurrentUser: boolean }) {
    const theme = useTheme();
    const router = useRouter();

    return (
        <Pressable
            onPress={() => router.push(`/user/${entry.username}`)}
            style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                marginHorizontal: 20,
                marginBottom: 8,
                padding: 12,
                backgroundColor: isCurrentUser ? theme.accentBg : theme.bgCard,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: isCurrentUser ? theme.borderNeon : theme.border,
                opacity: pressed ? 0.9 : 1,
            })}
        >
            {/* Rank */}
            <View style={{
                width: 30,
                height: 30,
                borderRadius: 7,
                backgroundColor: theme.bgMuted,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 10,
            }}>
                <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: "900" }}>
                    {entry.rank}
                </Text>
            </View>

            <Avatar username={entry.username} size="sm" pfp={entry.pfp} />

            <View style={{ flex: 1, marginLeft: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text
                        style={{
                            fontSize: 13,
                            fontWeight: "800",
                            color: isCurrentUser ? theme.accentLight : theme.textPrimary,
                            letterSpacing: 0.3,
                        }}
                        numberOfLines={1}
                    >
                        {entry.username}
                    </Text>
                    {isCurrentUser && (
                        <View style={{
                            backgroundColor: theme.accent + "25",
                            borderRadius: 5,
                            paddingHorizontal: 5,
                            paddingVertical: 1,
                            borderWidth: 1,
                            borderColor: theme.borderNeon,
                        }}>
                            <Text style={{ color: theme.accentLight, fontSize: 7, fontWeight: "900", letterSpacing: 1.5 }}>
                                YOU
                            </Text>
                        </View>
                    )}
                </View>
                <Text style={{ color: theme.textMuted, fontSize: 10, marginTop: 2, fontWeight: "600" }}>
                    {entry.wins}W – {entry.losses}L
                </Text>
            </View>

            <View style={{ alignItems: "flex-end", gap: 3 }}>
                <Text style={{ color: theme.green, fontSize: 12, fontWeight: "900", letterSpacing: -0.3 }}>
                    {entry.totalStakeWon.toLocaleString()}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Text style={{ color: theme.textMuted, fontSize: 9, fontWeight: "700" }}>
                        {entry.winPercentage.toFixed(1)}%
                    </Text>
                    <RankChangeIndicator current={entry.currentRank} previous={entry.previousRank} />
                </View>
            </View>
        </Pressable>
    );
}

export default function LeaderboardScreen() {
    const { user } = useAuth();
    const theme = useTheme();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

    const fetchLeaderboard = useCallback(async () => {
        try {
            const res = await leaderboardAPI.getList();
            setEntries(res.leaderboard);
        } catch (err) {
            console.error("Leaderboard fetch failed:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

    const myEntry = entries.find((e) => e.username === user?.username);
    const top3 = entries.filter((e) => e.rank <= 3);
    const rest = entries.filter((e) => e.rank > 3);
    const onRefresh = () => { setRefreshing(true); fetchLeaderboard(); };

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: "center", justifyContent: "center" }}>
                <StatusBar style="dark" />
                <ActivityIndicator size="large" color={theme.accent} />
            </View>
        );
    }

    const ListHeader = () => (
        <>
            {/* Header */}
            <View style={{ paddingHorizontal: 20, paddingTop: 64, paddingBottom: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={{ width: 4, height: 28, backgroundColor: theme.accent, borderRadius: 2, marginRight: 12 }} />
                    <View>
                        <Text style={{
                            color: theme.textPrimary,
                            fontSize: 26,
                            fontWeight: "900",
                            letterSpacing: 2,
                        }}>
                            RANKINGS
                        </Text>
                        <Text style={{ color: theme.textMuted, fontSize: 11, letterSpacing: 0.5, marginTop: 2 }}>
                            Top duelers on Ikkii Arena
                        </Text>
                    </View>
                </View>
            </View>

            {/* Podium */}
            {top3.length > 0 && (
                <View style={{ marginTop: 12, marginBottom: 10 }}>
                    <Podium entries={top3} currentUsername={user?.username ?? ""} />
                </View>
            )}

            {/* My Rank Card (if not in top 3) */}
            {myEntry && myEntry.rank > 3 && (
                <View style={{ paddingHorizontal: 20, marginBottom: 14 }}>
                    <Card
                        noPadding
                        style={{
                            backgroundColor: theme.bgGlass,
                            borderRadius: 12,
                            borderColor: theme.borderNeon,
                        }}
                    >
                        <View style={{
                            flexDirection: "row",
                            alignItems: "center",
                            padding: 14,
                        }}>
                            {/* Rank number */}
                            <View style={{
                                width: 44,
                                height: 44,
                                borderRadius: 10,
                                backgroundColor: theme.accentBg,
                                alignItems: "center",
                                justifyContent: "center",
                                borderWidth: 1,
                                borderColor: theme.borderNeon,
                                marginRight: 12,
                            }}>
                                <Text style={{ color: theme.accentLight, fontSize: 16, fontWeight: "900" }}>
                                    #{myEntry.rank}
                                </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{
                                    color: theme.accentLight,
                                    fontSize: 9,
                                    fontWeight: "800",
                                    letterSpacing: 2,
                                    textTransform: "uppercase",
                                }}>
                                    Your Rank
                                </Text>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 3 }}>
                                    <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: "600" }}>
                                        {myEntry.wins}W – {myEntry.losses}L
                                    </Text>
                                    <RankChangeIndicator
                                        current={myEntry.currentRank}
                                        previous={myEntry.previousRank}
                                    />
                                </View>
                            </View>
                            <View style={{ alignItems: "flex-end" }}>
                                <Text style={{ color: theme.textPrimary, fontSize: 20, fontWeight: "900", letterSpacing: -0.5 }}>
                                    {myEntry.winPercentage.toFixed(1)}%
                                </Text>
                                <Text style={{
                                    color: theme.textMuted,
                                    fontSize: 8,
                                    letterSpacing: 2,
                                    textTransform: "uppercase",
                                    fontWeight: "700",
                                    marginTop: 1,
                                }}>
                                    Win Rate
                                </Text>
                            </View>
                        </View>
                    </Card>
                </View>
            )}

            {/* All Players section header — bar + dot */}
            <View style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 20,
                paddingBottom: 10,
                marginTop: 4,
            }}>
                <View style={{ width: 12, height: 2, backgroundColor: theme.accent, borderRadius: 1, marginRight: 4 }} />
                <View style={{ width: 4, height: 4, borderRadius: 1, backgroundColor: theme.accent, marginRight: 8 }} />
                <Text style={{
                    color: theme.textPrimary, fontSize: 11, fontWeight: "800",
                    letterSpacing: 2, textTransform: "uppercase", flex: 1,
                }}>
                    All Players
                </Text>
                <View style={{
                    backgroundColor: theme.bgMuted, borderWidth: 1, borderColor: theme.border,
                    borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2,
                }}>
                    <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: "700" }}>
                        {entries.length}
                    </Text>
                </View>
            </View>
        </>
    );

    return (
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <StatusBar style="dark" />
            <FlatList
                data={rest}
                keyExtractor={(item) => item.userId}
                renderItem={({ item }) => (
                    <LeaderboardCard
                        entry={item}
                        isCurrentUser={item.username === user?.username}
                    />
                )}
                ListHeaderComponent={<ListHeader />}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.accent}
                        colors={[theme.accent]}
                    />
                }
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}
