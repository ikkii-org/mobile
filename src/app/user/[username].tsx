import React, { useState, useEffect, useCallback } from "react";
import { Image, Pressable, ScrollView, Text, View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../../components/ui/Card";
import { Avatar } from "../../components/ui/Avatar";
import { useTheme } from "../../contexts/ThemeContext";
import { usersAPI, leaderboardAPI } from "../../services/api";
import { SUPPORTED_GAMES } from "../../constants";
import type { PlayerProfile, LeaderboardEntry, GameProfile } from "../../types";

function StatBox({
    label,
    value,
    color,
}: {
    label: string;
    value: string;
    color: string;
}) {
    const theme = useTheme();
    return (
        <Card noFill style={{
            flex: 1,
            alignItems: "center",
            padding: 12,
        }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color }}>
                {value}
            </Text>
            <Text style={{
                color: theme.textMuted,
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: 1.5,
                marginTop: 4,
                fontWeight: "600",
            }}>
                {label}
            </Text>
        </Card>
    );
}

export default function UserProfileScreen() {
    const { username } = useLocalSearchParams<{ username: string }>();
    const router = useRouter();
    const theme = useTheme();

    const [profile, setProfile] = useState<PlayerProfile | null>(null);
    const [rankEntry, setRankEntry] = useState<LeaderboardEntry | null>(null);
    const [gameProfiles, setGameProfiles] = useState<GameProfile[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchProfile = useCallback(async () => {
        const [profileRes, rankRes, gameRes] = await Promise.allSettled([
            usersAPI.getProfile(username),
            leaderboardAPI.getEntry(username),
            usersAPI.getGameProfiles(username),
        ]);
        if (profileRes.status === "fulfilled") {
            setProfile(profileRes.value.profile);
        } else {
            console.warn("Failed to fetch user profile:", profileRes.reason);
        }
        if (rankRes.status === "fulfilled") {
            setRankEntry(rankRes.value.entry);
        } else {
            console.warn("Failed to fetch leaderboard entry:", rankRes.reason);
        }
        if (gameRes.status === "fulfilled") {
            setGameProfiles(gameRes.value.profiles);
        } else {
            console.warn("Failed to fetch game profiles:", gameRes.reason);
        }
        setLoading(false);
    }, [username]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: "center", justifyContent: "center" }}>
                <StatusBar style="dark" />
                <ActivityIndicator size="large" color={theme.accent} />
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
                <StatusBar style="dark" />
                <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
                    Player Not Found
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 14, textAlign: "center", marginBottom: 24 }}>
                    Could not find this player's profile.
                </Text>
                <Pressable
                    onPress={() => router.back()}
                    style={{
                        backgroundColor: theme.bgCard,
                        paddingHorizontal: 24,
                        paddingVertical: 12,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: theme.border,
                    }}
                >
                    <Text style={{ color: theme.accentLight, fontSize: 14, fontWeight: "600" }}>Go Back</Text>
                </Pressable>
            </View>
        );
    }

    const rank = rankEntry?.currentRank ?? profile.portfolio?.currentRank ?? 0;
    const prevRank = rankEntry?.previousRank ?? profile.portfolio?.previousRank ?? 0;
    const rankDiff = prevRank - rank;

    return (
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <StatusBar style="dark" />
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 64, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Back */}
                <Pressable
                    onPress={() => router.back()}
                    style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 24 }}
                >
                    <Ionicons name="chevron-back" size={20} color={theme.accent} />
                    <Text style={{ color: theme.accent, fontSize: 14, fontWeight: "600" }}>Back</Text>
                </Pressable>

                {/* Avatar + Name */}
                <View style={{ alignItems: "center", marginBottom: 24 }}>
                    <Avatar username={profile.username} size="lg" rank={rank} pfp={profile.pfp} />
                    <Text style={{ color: theme.textPrimary, fontSize: 24, fontWeight: "900", marginTop: 16 }}>
                        {profile.username}
                    </Text>
                    {rank > 0 && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
                            <View style={{
                                backgroundColor: theme.bgGlass,
                                paddingHorizontal: 12,
                                paddingVertical: 4,
                                borderRadius: 100,
                                borderWidth: 1,
                                borderColor: theme.borderStrong,
                            }}>
                                <Text style={{ color: theme.accentLight, fontSize: 12, fontWeight: "700" }}>
                                    Rank #{rank}
                                </Text>
                            </View>
                            {rankDiff !== 0 && (
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                                    <Ionicons
                                        name={rankDiff > 0 ? "arrow-up" : "arrow-down"}
                                        size={14}
                                        color={rankDiff > 0 ? theme.green : theme.red}
                                    />
                                    <Text style={{
                                        fontSize: 12,
                                        fontWeight: "700",
                                        color: rankDiff > 0 ? theme.green : theme.red,
                                    }}>
                                        {Math.abs(rankDiff)}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                {/* Win Rate */}
                <Card style={{ marginBottom: 16 }}>
                    <View style={{ alignItems: "center", paddingVertical: 8 }}>
                        <Text style={{ color: theme.textPrimary, fontSize: 32, fontWeight: "900" }}>
                            {profile.winPercentage.toFixed(1)}%
                        </Text>
                        <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 4 }}>Win Rate</Text>
                    </View>
                </Card>

                {/* Duel Stats */}
                <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
                    <StatBox label="Wins" value={String(profile.wins)} color={theme.green} />
                    <StatBox label="Losses" value={String(profile.losses)} color={theme.red} />
                </View>

                {(profile.portfolio || rankEntry) && (
                    <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
                        <StatBox
                            label="Total Won"
                            value={(rankEntry?.totalStakeWon ?? profile.portfolio?.totalStakeWon ?? 0).toLocaleString()}
                            color={theme.green}
                        />
                        <StatBox
                            label="Total Lost"
                            value={(rankEntry?.totalStakeLost ?? profile.portfolio?.totalStakeLost ?? 0).toLocaleString()}
                            color={theme.red}
                        />
                    </View>
                )}

                {/* Game Accounts */}
                {gameProfiles.length > 0 && (
                    <View style={{ marginBottom: 24 }}>
                        {/* Section header */}
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                            <View style={{ width: 12, height: 2, backgroundColor: theme.accent, borderRadius: 1, marginRight: 4 }} />
                            <View style={{ width: 4, height: 4, borderRadius: 1, backgroundColor: theme.accent, marginRight: 8 }} />
                            <Text style={{
                                color: theme.textPrimary, fontSize: 11, fontWeight: "800",
                                letterSpacing: 2, textTransform: "uppercase",
                            }}>
                                Game Accounts
                            </Text>
                        </View>

                        <View style={{ gap: 8 }}>
                            {gameProfiles.map((gp) => {
                                const linkedGame = SUPPORTED_GAMES.find((g) => g.name === gp.gameName);
                                const stats = gp.stats as { trophies?: number; bestTrophies?: number; clan?: string; expLevel?: number } | null;
                                return (
                                    <Card
                                        key={gp.id}
                                        noFill
                                        noPadding
                                        style={{ borderRadius: 12, borderColor: theme.borderNeon }}
                                    >
                                        {/* Top accent line */}
                                        <View style={{ alignItems: "center" }}>
                                            <View style={{ width: "30%", height: 2, backgroundColor: theme.accentNeon, borderBottomLeftRadius: 1, borderBottomRightRadius: 1 }} />
                                        </View>

                                        <View style={{ flexDirection: "row", alignItems: "center", padding: 14 }}>
                                            {/* Game icon */}
                                            <View style={{
                                                width: 36, height: 36, borderRadius: 8,
                                                backgroundColor: theme.accent + "18",
                                                borderWidth: 1,
                                                borderColor: theme.accent + "30",
                                                alignItems: "center", justifyContent: "center",
                                                marginRight: 12, overflow: "hidden",
                                            }}>
                                                {linkedGame ? (
                                                    <Image
                                                        source={{ uri: linkedGame.icon }}
                                                        style={{ width: 28, height: 28, borderRadius: 4 }}
                                                        resizeMode="contain"
                                                    />
                                                ) : (
                                                    <Ionicons name="game-controller-outline" size={16} color={theme.accentLight} />
                                                )}
                                            </View>

                                            {/* Info */}
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ color: theme.textPrimary, fontSize: 13, fontWeight: "800", letterSpacing: 0.3 }}>
                                                    {gp.gameName}
                                                </Text>
                                                <Text style={{ color: theme.green, fontSize: 10, fontWeight: "700", marginTop: 2 }}>
                                                    {gp.playerId ?? "Linked"}
                                                    {gp.rank ? ` · ${gp.rank}` : ""}
                                                </Text>
                                                {stats?.clan && (
                                                    <Text style={{ color: theme.textMuted, fontSize: 9, marginTop: 1 }}>
                                                        {stats.clan}
                                                    </Text>
                                                )}
                                            </View>

                                            {/* Trophy stats */}
                                            {(stats?.trophies !== undefined || stats?.bestTrophies !== undefined) && (
                                                <View style={{ alignItems: "flex-end", gap: 4 }}>
                                                    {stats?.trophies !== undefined && (
                                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                                            <Ionicons name="trophy" size={11} color={theme.amber} />
                                                            <Text style={{ color: theme.amber, fontSize: 12, fontWeight: "900" }}>
                                                                {stats.trophies.toLocaleString()}
                                                            </Text>
                                                        </View>
                                                    )}
                                                    {stats?.bestTrophies !== undefined && (
                                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                                            <Ionicons name="trophy-outline" size={10} color={theme.textMuted} />
                                                            <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: "700" }}>
                                                                {stats.bestTrophies.toLocaleString()} max
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                            )}
                                        </View>
                                    </Card>
                                );
                            })}
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
