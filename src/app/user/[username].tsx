import React, { useState, useEffect, useCallback } from "react";
import { Pressable, ScrollView, Text, View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../../components/ui/Card";
import { Avatar } from "../../components/ui/Avatar";
import { useTheme } from "../../contexts/ThemeContext";
import { usersAPI, leaderboardAPI } from "../../services/api";
import type { PlayerProfile, LeaderboardEntry } from "../../types";

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
    const [loading, setLoading] = useState(true);

    const fetchProfile = useCallback(async () => {
        const [profileRes, rankRes] = await Promise.allSettled([
            usersAPI.getProfile(username),
            leaderboardAPI.getEntry(username),
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
                    <Avatar username={profile.username} size="lg" rank={rank} />
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

                {/* Stats */}
                <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
                    <StatBox label="Wins" value={String(profile.wins)} color={theme.green} />
                    <StatBox label="Losses" value={String(profile.losses)} color={theme.red} />
                </View>

                {(profile.portfolio || rankEntry) && (
                    <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
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
            </ScrollView>
        </View>
    );
}
