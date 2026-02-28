import React, { useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { DuelCard } from "../../components/DuelCard";
import { EmptyState } from "../../components/ui/EmptyState";
import {
    MOCK_OPEN_DUELS,
    MOCK_ACTIVE_DUELS,
    MOCK_DISPUTED_DUELS,
    MOCK_SETTLED_DUELS,
    MOCK_USER,
} from "../../mockData";

function SectionHeader({ title, count }: { title: string; count: number }) {
    return (
        <View className="flex-row items-center gap-2 mb-3 mt-6">
            <Text className="text-white text-lg font-bold">{title}</Text>
            <View className="bg-[#1E2030] px-2.5 py-0.5 rounded-full">
                <Text className="text-[#94A3B8] text-xs font-bold">{count}</Text>
            </View>
        </View>
    );
}

export default function HomeScreen() {
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);

    const currentUser = MOCK_USER.username;

    const onRefresh = () => {
        setRefreshing(true);
        // TODO: Replace with real API fetch
        setTimeout(() => setRefreshing(false), 1000);
    };

    return (
        <View className="flex-1 bg-[#0A0A0F]">
            <StatusBar style="light" />

            {/* Header */}
            <View className="px-5 pt-16 pb-4">
                <View className="flex-row items-center justify-between">
                    <View>
                        <Text className="text-white text-2xl font-black tracking-wide">IKKII</Text>
                        <Text className="text-[#64748B] text-xs mt-0.5">Find your next duel</Text>
                    </View>
                    <View className="flex-row items-center gap-2 bg-[#1A1A2E] border border-[#2A2B45] rounded-full px-3 py-1.5">
                        <View className="w-2 h-2 rounded-full bg-[#10B981]" />
                        <Text className="text-[#10B981] text-xs font-bold">Live</Text>
                    </View>
                </View>
            </View>

            <ScrollView
                className="flex-1 px-5"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#8B5CF6"
                        colors={["#8B5CF6"]}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Open Duels */}
                <SectionHeader title="Open Duels" count={MOCK_OPEN_DUELS.length} />
                {MOCK_OPEN_DUELS.length > 0 ? (
                    MOCK_OPEN_DUELS.map((duel) => (
                        <DuelCard
                            key={duel.id}
                            duel={duel}
                            currentUsername={currentUser}
                            onPress={() => router.push(`/duel/${duel.id}`)}
                            onAction={() => router.push(`/duel/${duel.id}`)}
                        />
                    ))
                ) : (
                    <EmptyState
                        icon="search-outline"
                        title="No open duels"
                        subtitle="Be the first to create one!"
                    />
                )}

                {/* My Active Duels */}
                <SectionHeader title="My Active Duels" count={MOCK_ACTIVE_DUELS.length} />
                {MOCK_ACTIVE_DUELS.length > 0 ? (
                    MOCK_ACTIVE_DUELS.map((duel) => (
                        <DuelCard
                            key={duel.id}
                            duel={duel}
                            currentUsername={currentUser}
                            onPress={() => router.push(`/duel/${duel.id}`)}
                            onAction={() => router.push(`/duel/${duel.id}`)}
                        />
                    ))
                ) : (
                    <EmptyState
                        icon="game-controller-outline"
                        title="No active duels"
                        subtitle="Join or create a duel to get started"
                    />
                )}

                {/* Disputed */}
                {MOCK_DISPUTED_DUELS.length > 0 && (
                    <>
                        <SectionHeader title="Disputed" count={MOCK_DISPUTED_DUELS.length} />
                        {MOCK_DISPUTED_DUELS.map((duel) => (
                            <DuelCard
                                key={duel.id}
                                duel={duel}
                                currentUsername={currentUser}
                                onPress={() => router.push(`/duel/${duel.id}`)}
                                onAction={() => router.push(`/duel/${duel.id}`)}
                            />
                        ))}
                    </>
                )}

                {/* Recent Results */}
                <SectionHeader title="Recent Results" count={MOCK_SETTLED_DUELS.length} />
                {MOCK_SETTLED_DUELS.length > 0 ? (
                    MOCK_SETTLED_DUELS.map((duel) => (
                        <DuelCard
                            key={duel.id}
                            duel={duel}
                            currentUsername={currentUser}
                            onPress={() => router.push(`/duel/${duel.id}`)}
                        />
                    ))
                ) : (
                    <EmptyState
                        icon="time-outline"
                        title="No recent results"
                        subtitle="Your duel history will appear here"
                    />
                )}

                <View className="h-8" />
            </ScrollView>
        </View>
    );
}
