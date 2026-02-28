import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { useToast } from "../../contexts/ToastContext";
import { COMMON_TOKENS } from "../../constants";
import {
    MOCK_OPEN_DUELS,
    MOCK_ACTIVE_DUELS,
    MOCK_DISPUTED_DUELS,
    MOCK_SETTLED_DUELS,
    MOCK_USER,
} from "../../mockData";
import type { Duel } from "../../types";

function getTokenSymbol(mint: string) {
    const token = COMMON_TOKENS.find((t) => t.mint === mint);
    return token?.symbol ?? mint.slice(0, 6) + "…";
}

function getTimeRemaining(expiresAt: string): string {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Expired";
    const hrs = Math.floor(diff / (60 * 60 * 1000));
    const mins = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    const secs = Math.floor((diff % (60 * 1000)) / 1000);
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
}

function findDuel(id: string): Duel | undefined {
    const all = [...MOCK_OPEN_DUELS, ...MOCK_ACTIVE_DUELS, ...MOCK_DISPUTED_DUELS, ...MOCK_SETTLED_DUELS];
    return all.find((d) => d.id === id);
}

export default function DuelDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { showToast } = useToast();
    const [showResultModal, setShowResultModal] = useState(false);
    const [timeLeft, setTimeLeft] = useState("");

    const duel = findDuel(id);
    const currentUser = MOCK_USER.username;

    useEffect(() => {
        if (!duel) return;
        const update = () => setTimeLeft(getTimeRemaining(duel.expiresAt));
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [duel]);

    if (!duel) {
        return (
            <View className="flex-1 bg-[#0A0A0F] items-center justify-center px-6">
                <StatusBar style="light" />
                <Text className="text-white text-lg font-bold mb-2">Duel Not Found</Text>
                <Text className="text-[#64748B] text-sm text-center mb-6">
                    This duel may have been cancelled or doesn't exist.
                </Text>
                <Button title="Go Back" onPress={() => router.back()} variant="secondary" fullWidth={false} />
            </View>
        );
    }

    const isPlayer1 = duel.player1Username === currentUser;
    const isPlayer2 = duel.player2Username === currentUser;
    const isParticipant = isPlayer1 || isPlayer2;
    const isCreator = isPlayer1;
    const opponent = isPlayer1 ? duel.player2Username : duel.player1Username;
    const tokenSymbol = getTokenSymbol(duel.tokenMint);

    const handleJoin = () => {
        // TODO: Replace with real API call → duelsAPI.join(...)
        showToast("Joined duel! Get ready to compete.", "success");
    };

    const handleCancel = () => {
        // TODO: Replace with real API call → duelsAPI.cancel(...)
        showToast("Duel cancelled", "info");
        router.back();
    };

    const handleSubmitResult = (iWon: boolean) => {
        // TODO: Replace with real API call → duelsAPI.submitResult(...)
        const winner = iWon ? currentUser : opponent;
        showToast(`Result submitted: ${winner} won`, "success");
        setShowResultModal(false);
    };

    const handleVerify = () => {
        // TODO: Replace with real API call → verificationAPI.verify(...)
        showToast("Verification requested", "info");
    };

    return (
        <View className="flex-1 bg-[#0A0A0F]">
            <StatusBar style="light" />
            <ScrollView
                className="flex-1"
                contentContainerClassName="px-5 pt-16 pb-10"
                showsVerticalScrollIndicator={false}
            >
                {/* Back button */}
                <Pressable onPress={() => router.back()} className="flex-row items-center gap-1 mb-6">
                    <Ionicons name="chevron-back" size={20} color="#8B5CF6" />
                    <Text className="text-[#8B5CF6] text-sm font-semibold">Back</Text>
                </Pressable>

                {/* Status + ID */}
                <View className="flex-row items-center justify-between mb-6">
                    <Badge status={duel.status} />
                    <Text className="text-[#64748B] text-xs font-mono">
                        {duel.id.slice(0, 8)}…
                    </Text>
                </View>

                {/* Players Card */}
                <Card className="mb-4">
                    <View className="flex-row items-center justify-between">
                        {/* Player 1 */}
                        <View className="flex-1 items-center">
                            <Avatar username={duel.player1Username} size="md" />
                            <Text className="text-white text-sm font-bold mt-2">{duel.player1Username}</Text>
                            <Text className="text-[#64748B] text-[10px] mt-0.5">Creator</Text>
                            {duel.winnerUsername === duel.player1Username && (
                                <Text className="text-base mt-1">🏆</Text>
                            )}
                        </View>

                        {/* VS */}
                        <View className="items-center mx-4">
                            <View className="w-12 h-12 rounded-full bg-[#8B5CF6]/20 items-center justify-center border border-[#8B5CF6]/40">
                                <Text className="text-[#A78BFA] text-xs font-black">VS</Text>
                            </View>
                        </View>

                        {/* Player 2 */}
                        <View className="flex-1 items-center">
                            {duel.player2Username ? (
                                <>
                                    <Avatar username={duel.player2Username} size="md" />
                                    <Text className="text-white text-sm font-bold mt-2">
                                        {duel.player2Username}
                                    </Text>
                                    <Text className="text-[#64748B] text-[10px] mt-0.5">Challenger</Text>
                                    {duel.winnerUsername === duel.player2Username && (
                                        <Text className="text-base mt-1">🏆</Text>
                                    )}
                                </>
                            ) : (
                                <>
                                    <View className="w-11 h-11 rounded-full bg-[#1E2030] items-center justify-center border border-dashed border-[#3A3B55]">
                                        <Ionicons name="help" size={20} color="#64748B" />
                                    </View>
                                    <Text className="text-[#64748B] text-xs mt-2 italic">Waiting…</Text>
                                </>
                            )}
                        </View>
                    </View>
                </Card>

                {/* Stake Info */}
                <Card className="mb-4">
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-[#64748B] text-xs uppercase tracking-widest font-semibold">
                            Stake
                        </Text>
                        <View className="flex-row items-baseline gap-1">
                            <Text className="text-white text-2xl font-black">{duel.stakeAmount}</Text>
                            <Text className="text-[#8B5CF6] text-sm font-bold">{tokenSymbol}</Text>
                        </View>
                    </View>

                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-[#64748B] text-xs uppercase tracking-widest font-semibold">
                            Total Pot
                        </Text>
                        <Text className="text-[#10B981] text-lg font-bold">
                            {duel.player2Username ? duel.stakeAmount * 2 : duel.stakeAmount} {tokenSymbol}
                        </Text>
                    </View>

                    {duel.status !== "SETTLED" && duel.status !== "CANCELLED" && (
                        <View className="flex-row items-center justify-between">
                            <Text className="text-[#64748B] text-xs uppercase tracking-widest font-semibold">
                                {timeLeft === "Expired" ? "Expired" : "Time Left"}
                            </Text>
                            <Text
                                className={`text-base font-bold ${timeLeft === "Expired" ? "text-[#EF4444]" : "text-white"
                                    }`}
                            >
                                {timeLeft}
                            </Text>
                        </View>
                    )}
                </Card>

                {/* Meta */}
                <Card className="mb-6">
                    <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-[#64748B] text-xs">Token Mint</Text>
                        <Text className="text-[#94A3B8] text-xs font-mono" numberOfLines={1}>
                            {duel.tokenMint.slice(0, 12)}…{duel.tokenMint.slice(-6)}
                        </Text>
                    </View>
                    <View className="flex-row items-center justify-between">
                        <Text className="text-[#64748B] text-xs">Created</Text>
                        <Text className="text-[#94A3B8] text-xs">
                            {new Date(duel.createdAt).toLocaleString()}
                        </Text>
                    </View>
                </Card>

                {/* Contextual Actions */}
                {duel.status === "OPEN" && !isCreator && (
                    <Button title="Join Duel ⚔️" onPress={handleJoin} size="lg" />
                )}
                {duel.status === "OPEN" && isCreator && (
                    <Button title="Cancel Duel" onPress={handleCancel} variant="danger" size="lg" />
                )}
                {duel.status === "ACTIVE" && isParticipant && (
                    <Button title="Submit Result" onPress={() => setShowResultModal(true)} size="lg" />
                )}
                {duel.status === "DISPUTED" && isParticipant && (
                    <Button title="Request Verification" onPress={handleVerify} variant="secondary" size="lg" />
                )}
                {duel.status === "SETTLED" && (
                    <Card>
                        <View className="items-center py-2">
                            <Text className="text-2xl mb-2">🏆</Text>
                            <Text className="text-[#FCD34D] text-lg font-bold">
                                {duel.winnerUsername} won!
                            </Text>
                            <Text className="text-[#64748B] text-sm mt-1">
                                {duel.stakeAmount * 2} {tokenSymbol} claimed
                            </Text>
                        </View>
                    </Card>
                )}
                {duel.status === "CANCELLED" && (
                    <Card>
                        <View className="items-center py-2">
                            <Ionicons name="close-circle" size={32} color="#6B7280" />
                            <Text className="text-[#9CA3AF] text-base font-semibold mt-2">
                                Duel Cancelled
                            </Text>
                        </View>
                    </Card>
                )}
            </ScrollView>

            {/* Result Submission Modal */}
            <Modal
                visible={showResultModal}
                onClose={() => setShowResultModal(false)}
                title="Submit Result"
            >
                <Text className="text-[#94A3B8] text-sm mb-6">
                    Who won this duel? Both players must agree on the result.
                </Text>
                <View className="gap-3">
                    <Button
                        title="🎉  I Won"
                        onPress={() => handleSubmitResult(true)}
                        variant="primary"
                        size="lg"
                    />
                    <Button
                        title="Opponent Won"
                        onPress={() => handleSubmitResult(false)}
                        variant="secondary"
                        size="lg"
                    />
                </View>
            </Modal>
        </View>
    );
}
