import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../../components/ui/Card";
import { Avatar } from "../../components/ui/Avatar";
import { MOCK_LEADERBOARD } from "../../mockData";

function StatBox({
    label,
    value,
    color = "#FFFFFF",
}: {
    label: string;
    value: string;
    color?: string;
}) {
    return (
        <View className="flex-1 bg-[#0D0E1A] rounded-xl p-3 border border-[#1E2030] items-center">
            <Text className="text-lg font-bold" style={{ color }}>
                {value}
            </Text>
            <Text className="text-[#64748B] text-[10px] uppercase tracking-wider mt-1 font-semibold">
                {label}
            </Text>
        </View>
    );
}

export default function UserProfileScreen() {
    const { username } = useLocalSearchParams<{ username: string }>();
    const router = useRouter();

    // TODO: Replace with real API call → usersAPI.getProfile(username)
    const entry = MOCK_LEADERBOARD.find((e) => e.username === username);

    if (!entry) {
        return (
            <View className="flex-1 bg-[#0A0A0F] items-center justify-center px-6">
                <StatusBar style="light" />
                <Text className="text-white text-lg font-bold mb-2">Player Not Found</Text>
                <Text className="text-[#64748B] text-sm text-center mb-6">
                    Could not find this player's profile.
                </Text>
                <Pressable onPress={() => router.back()} className="bg-[#1E2030] px-6 py-3 rounded-xl">
                    <Text className="text-[#A78BFA] text-sm font-semibold">Go Back</Text>
                </Pressable>
            </View>
        );
    }

    const rankDiff = entry.previousRank - entry.currentRank;

    return (
        <View className="flex-1 bg-[#0A0A0F]">
            <StatusBar style="light" />
            <ScrollView
                className="flex-1"
                contentContainerClassName="px-5 pt-16 pb-10"
                showsVerticalScrollIndicator={false}
            >
                {/* Back */}
                <Pressable onPress={() => router.back()} className="flex-row items-center gap-1 mb-6">
                    <Ionicons name="chevron-back" size={20} color="#8B5CF6" />
                    <Text className="text-[#8B5CF6] text-sm font-semibold">Back</Text>
                </Pressable>

                {/* Avatar + Name */}
                <View className="items-center mb-6">
                    <Avatar username={entry.username} size="lg" rank={entry.rank} />
                    <Text className="text-white text-2xl font-black mt-4">{entry.username}</Text>
                    <View className="flex-row items-center gap-2 mt-2">
                        <View className="bg-[#1A1A2E] px-3 py-1 rounded-full border border-[#2A2B45]">
                            <Text className="text-[#A78BFA] text-xs font-bold">Rank #{entry.rank}</Text>
                        </View>
                        {rankDiff !== 0 && (
                            <View className="flex-row items-center gap-0.5">
                                <Ionicons
                                    name={rankDiff > 0 ? "arrow-up" : "arrow-down"}
                                    size={14}
                                    color={rankDiff > 0 ? "#10B981" : "#EF4444"}
                                />
                                <Text
                                    className="text-xs font-bold"
                                    style={{ color: rankDiff > 0 ? "#10B981" : "#EF4444" }}
                                >
                                    {Math.abs(rankDiff)}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Win Rate */}
                <Card className="mb-4">
                    <View className="items-center py-2">
                        <Text className="text-white text-3xl font-black">
                            {entry.winPercentage.toFixed(1)}%
                        </Text>
                        <Text className="text-[#64748B] text-xs mt-1">Win Rate</Text>
                    </View>
                </Card>

                {/* Stats */}
                <View className="flex-row gap-3 mb-3">
                    <StatBox label="Wins" value={String(entry.wins)} color="#10B981" />
                    <StatBox label="Losses" value={String(entry.losses)} color="#EF4444" />
                </View>
                <View className="flex-row gap-3 mb-6">
                    <StatBox
                        label="Total Won"
                        value={entry.totalStakeWon.toLocaleString()}
                        color="#10B981"
                    />
                    <StatBox
                        label="Total Lost"
                        value={entry.totalStakeLost.toLocaleString()}
                        color="#EF4444"
                    />
                </View>
            </ScrollView>
        </View>
    );
}
