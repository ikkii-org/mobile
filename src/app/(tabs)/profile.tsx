import React from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Card } from "../../components/ui/Card";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../contexts/ToastContext";
import { MOCK_PROFILE, MOCK_USER } from "../../mockData";

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

export default function ProfileScreen() {
    const router = useRouter();
    const { showToast } = useToast();
    const profile = MOCK_PROFILE;
    const user = MOCK_USER;

    const handleCopyWallet = async () => {
        try {
            await Clipboard.setStringAsync(user.walletKey);
            showToast("Wallet address copied!", "success");
        } catch {
            showToast("Failed to copy", "error");
        }
    };

    const handleLogout = () => {
        Alert.alert("Logout", "Are you sure you want to log out?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Logout",
                style: "destructive",
                onPress: () => {
                    // TODO: Replace with real logout → authAPI.logout()
                    showToast("Logged out", "info");
                    router.replace("/onboarding");
                },
            },
        ]);
    };

    const netPL =
        (profile.portfolio?.totalStakeWon ?? 0) - (profile.portfolio?.totalStakeLost ?? 0);
    const rankDiff =
        (profile.portfolio?.previousRank ?? 0) - (profile.portfolio?.currentRank ?? 0);

    return (
        <View className="flex-1 bg-[#0A0A0F]">
            <StatusBar style="light" />
            <ScrollView
                className="flex-1"
                contentContainerClassName="px-5 pt-16 pb-10"
                showsVerticalScrollIndicator={false}
            >
                {/* Avatar + Username */}
                <View className="items-center mb-6">
                    <Avatar username={user.username} size="lg" rank={profile.portfolio?.currentRank} />
                    <Text className="text-white text-2xl font-black mt-4">{user.username}</Text>
                    <Pressable
                        onPress={handleCopyWallet}
                        className="flex-row items-center gap-2 mt-2 bg-[#1A1A2E] px-4 py-2 rounded-full border border-[#2A2B45]"
                    >
                        <Text className="text-[#94A3B8] text-xs font-mono">
                            {user.walletKey.slice(0, 6)}…{user.walletKey.slice(-6)}
                        </Text>
                        <Ionicons name="copy-outline" size={14} color="#64748B" />
                    </Pressable>
                </View>

                {/* Rank + Win Rate Highlight */}
                {profile.portfolio && (
                    <Card className="mb-4">
                        <View className="flex-row items-center justify-around">
                            <View className="items-center">
                                <View className="flex-row items-center gap-1">
                                    <Text className="text-white text-3xl font-black">
                                        #{profile.portfolio.currentRank}
                                    </Text>
                                    {rankDiff !== 0 && (
                                        <View className="flex-row items-center">
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
                                <Text className="text-[#64748B] text-xs mt-1">Global Rank</Text>
                            </View>
                            <View className="w-px h-10 bg-[#2A2B45]" />
                            <View className="items-center">
                                <Text className="text-white text-3xl font-black">
                                    {profile.winPercentage.toFixed(1)}%
                                </Text>
                                <Text className="text-[#64748B] text-xs mt-1">Win Rate</Text>
                            </View>
                        </View>
                    </Card>
                )}

                {/* Stats Grid */}
                <View className="flex-row gap-3 mb-3">
                    <StatBox label="Wins" value={String(profile.wins)} color="#10B981" />
                    <StatBox label="Losses" value={String(profile.losses)} color="#EF4444" />
                </View>

                {profile.portfolio && (
                    <>
                        <View className="flex-row gap-3 mb-3">
                            <StatBox
                                label="Total Won"
                                value={`${profile.portfolio.totalStakeWon.toLocaleString()}`}
                                color="#10B981"
                            />
                            <StatBox
                                label="Total Lost"
                                value={`${profile.portfolio.totalStakeLost.toLocaleString()}`}
                                color="#EF4444"
                            />
                        </View>
                        <View className="flex-row gap-3 mb-6">
                            <StatBox
                                label="Net P&L"
                                value={`${netPL >= 0 ? "+" : ""}${netPL.toLocaleString()}`}
                                color={netPL >= 0 ? "#10B981" : "#EF4444"}
                            />
                            <StatBox
                                label="SOL Balance"
                                value={`${profile.portfolio.solanaBalance.toFixed(2)}`}
                                color="#A78BFA"
                            />
                        </View>
                    </>
                )}

                {/* Actions */}
                <Button
                    title="Edit Avatar"
                    onPress={() => showToast("Avatar editor coming soon", "info")}
                    variant="secondary"
                />
                <View className="mt-3">
                    <Button title="Logout" onPress={handleLogout} variant="danger" />
                </View>

                <Text className="text-[#3A3B55] text-xs text-center mt-8">
                    Member since {new Date(user.createdAt).toLocaleDateString()}
                </Text>
            </ScrollView>
        </View>
    );
}
