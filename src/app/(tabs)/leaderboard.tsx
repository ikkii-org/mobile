import React, { useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../../components/ui/Card";
import { Avatar } from "../../components/ui/Avatar";
import { MOCK_LEADERBOARD, MOCK_USER } from "../../mockData";
import type { LeaderboardEntry } from "../../types";

const RANK_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];

function RankChangeIndicator({ current, previous }: { current: number; previous: number }) {
    const diff = previous - current;
    if (diff === 0) return <Text className="text-[#64748B] text-xs">—</Text>;
    if (diff > 0) {
        return (
            <View className="flex-row items-center gap-0.5">
                <Ionicons name="arrow-up" size={12} color="#10B981" />
                <Text className="text-[#10B981] text-xs font-bold">{diff}</Text>
            </View>
        );
    }
    return (
        <View className="flex-row items-center gap-0.5">
            <Ionicons name="arrow-down" size={12} color="#EF4444" />
            <Text className="text-[#EF4444] text-xs font-bold">{Math.abs(diff)}</Text>
        </View>
    );
}

function LeaderboardRow({ entry, isCurrentUser }: { entry: LeaderboardEntry; isCurrentUser: boolean }) {
    const isTop3 = entry.rank <= 3;
    const rankColor = isTop3 ? RANK_COLORS[entry.rank - 1] : "#94A3B8";

    return (
        <View
            className={`flex-row items-center py-3.5 px-4 border-b border-[#1E2030] ${isCurrentUser ? "bg-[#8B5CF6]/10" : ""
                }`}
        >
            {/* Rank */}
            <View className="w-8 items-center mr-3">
                {isTop3 ? (
                    <Text className="text-lg">{entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉"}</Text>
                ) : (
                    <Text className="text-[#94A3B8] text-sm font-bold">#{entry.rank}</Text>
                )}
            </View>

            {/* Avatar + Name */}
            <Avatar username={entry.username} size="sm" />
            <View className="flex-1 ml-3">
                <View className="flex-row items-center gap-2">
                    <Text
                        className={`text-sm font-semibold ${isCurrentUser ? "text-[#A78BFA]" : "text-white"}`}
                        numberOfLines={1}
                    >
                        {entry.username}
                    </Text>
                    {isCurrentUser && (
                        <View className="bg-[#8B5CF6]/30 px-2 py-0.5 rounded-full">
                            <Text className="text-[#A78BFA] text-[9px] font-bold">YOU</Text>
                        </View>
                    )}
                </View>
                <Text className="text-[#64748B] text-[11px] mt-0.5">
                    {entry.wins}W - {entry.losses}L ({entry.winPercentage.toFixed(1)}%)
                </Text>
            </View>

            {/* Stats */}
            <View className="items-end">
                <Text className="text-[#10B981] text-xs font-bold">
                    {entry.totalStakeWon.toLocaleString()} SKR
                </Text>
                <RankChangeIndicator current={entry.currentRank} previous={entry.previousRank} />
            </View>
        </View>
    );
}

export default function LeaderboardScreen() {
    const [refreshing, setRefreshing] = useState(false);

    const myEntry = MOCK_LEADERBOARD.find((e) => e.username === MOCK_USER.username);

    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    };

    return (
        <View className="flex-1 bg-[#0A0A0F]">
            <StatusBar style="light" />

            <View className="px-5 pt-16 pb-4">
                <Text className="text-white text-2xl font-black mb-1">Leaderboard</Text>
                <Text className="text-[#64748B] text-sm">Top duelers on Ikkii</Text>
            </View>

            {/* My Rank Card */}
            {myEntry && (
                <View className="px-5 mb-4">
                    <Card>
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center gap-3">
                                <View className="w-14 h-14 rounded-2xl bg-[#8B5CF6]/20 items-center justify-center border border-[#8B5CF6]/40">
                                    <Text className="text-[#A78BFA] text-xl font-black">#{myEntry.rank}</Text>
                                </View>
                                <View>
                                    <Text className="text-white text-base font-bold">Your Rank</Text>
                                    <View className="flex-row items-center gap-2 mt-0.5">
                                        <Text className="text-[#64748B] text-xs">
                                            {myEntry.wins}W - {myEntry.losses}L
                                        </Text>
                                        <RankChangeIndicator
                                            current={myEntry.currentRank}
                                            previous={myEntry.previousRank}
                                        />
                                    </View>
                                </View>
                            </View>
                            <View className="items-end">
                                <Text className="text-white text-lg font-bold">
                                    {myEntry.winPercentage.toFixed(1)}%
                                </Text>
                                <Text className="text-[#64748B] text-[10px] mt-0.5">Win Rate</Text>
                            </View>
                        </View>
                    </Card>
                </View>
            )}

            {/* Leaderboard List */}
            <FlatList
                data={MOCK_LEADERBOARD}
                keyExtractor={(item) => item.userId}
                renderItem={({ item }) => (
                    <LeaderboardRow
                        entry={item}
                        isCurrentUser={item.username === MOCK_USER.username}
                    />
                )}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" colors={["#8B5CF6"]} />
                }
                className="flex-1"
                contentContainerClassName="pb-4"
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}
