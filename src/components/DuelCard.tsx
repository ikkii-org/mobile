import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { Duel } from "../types";
import { Badge } from "./ui/Badge";
import { Avatar } from "./ui/Avatar";
import { COMMON_TOKENS } from "../constants";

interface DuelCardProps {
    duel: Duel;
    currentUsername?: string;
    onPress: () => void;
    onAction?: () => void;
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
    if (hrs > 0) return `${hrs}h ${mins}m left`;
    return `${mins}m left`;
}

function getActionLabel(duel: Duel, currentUsername?: string): string | null {
    if (duel.status === "OPEN" && duel.player1Username !== currentUsername) return "Join";
    if (duel.status === "ACTIVE") return "Submit Result";
    if (duel.status === "DISPUTED") return "Verify";
    return null;
}

export function DuelCard({ duel, currentUsername, onPress, onAction }: DuelCardProps) {
    const [timeLeft, setTimeLeft] = useState(getTimeRemaining(duel.expiresAt));
    const opponent =
        duel.player1Username === currentUsername ? duel.player2Username : duel.player1Username;
    const actionLabel = getActionLabel(duel, currentUsername);
    const tokenSymbol = getTokenSymbol(duel.tokenMint);
    const isWin = duel.status === "SETTLED" && duel.winnerUsername === currentUsername;
    const isLoss = duel.status === "SETTLED" && duel.winnerUsername !== currentUsername && duel.winnerUsername !== null;

    useEffect(() => {
        if (duel.status === "SETTLED" || duel.status === "CANCELLED") return;
        const interval = setInterval(() => {
            setTimeLeft(getTimeRemaining(duel.expiresAt));
        }, 30_000);
        return () => clearInterval(interval);
    }, [duel.expiresAt, duel.status]);

    return (
        <Pressable
            onPress={onPress}
            className="bg-[#1A1A2E] border border-[#2A2B45] rounded-2xl p-4 mb-3 active:opacity-80"
        >
            {/* Top row: opponent + status */}
            <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-3 flex-1">
                    <Avatar username={opponent ?? duel.player1Username} size="sm" />
                    <View className="flex-1">
                        <Text className="text-white font-semibold text-sm" numberOfLines={1}>
                            {opponent ?? "Waiting for opponent..."}
                        </Text>
                        {duel.status !== "SETTLED" && duel.status !== "CANCELLED" && (
                            <Text className="text-[#64748B] text-[11px] mt-0.5">{timeLeft}</Text>
                        )}
                    </View>
                </View>
                <Badge status={duel.status} />
            </View>

            {/* Bottom row: stake + action */}
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-baseline gap-1">
                    <Text className="text-white font-bold text-lg">{duel.stakeAmount}</Text>
                    <Text className="text-[#8B5CF6] text-xs font-semibold">{tokenSymbol}</Text>
                </View>

                {isWin && (
                    <View className="flex-row items-center gap-1 bg-[#064E3B] px-3 py-1.5 rounded-full border border-[#10B981]">
                        <Text className="text-[12px]">🏆</Text>
                        <Text className="text-[#34D399] text-xs font-bold">Won</Text>
                    </View>
                )}
                {isLoss && (
                    <View className="flex-row items-center gap-1 bg-[#7F1D1D] px-3 py-1.5 rounded-full border border-[#EF4444]">
                        <Text className="text-[#FCA5A5] text-xs font-bold">Lost</Text>
                    </View>
                )}

                {actionLabel && onAction && (
                    <Pressable
                        onPress={(e) => {
                            e.stopPropagation();
                            onAction();
                        }}
                        className="bg-[#8B5CF6] px-4 py-2 rounded-xl active:opacity-80"
                    >
                        <Text className="text-white text-xs font-bold">{actionLabel}</Text>
                    </Pressable>
                )}
            </View>
        </Pressable>
    );
}
