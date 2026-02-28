import React, { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { useToast } from "../../contexts/ToastContext";
import { COMMON_TOKENS, EXPIRATION_PRESETS } from "../../constants";

export default function CreateDuelScreen() {
    const router = useRouter();
    const { showToast } = useToast();

    const [stakeAmount, setStakeAmount] = useState("");
    const [selectedToken, setSelectedToken] = useState(0);
    const [customMint, setCustomMint] = useState("");
    const [useCustomMint, setUseCustomMint] = useState(false);
    const [selectedExpiry, setSelectedExpiry] = useState(2); // default: 1 hour
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = (): boolean => {
        const errs: Record<string, string> = {};
        const amount = parseFloat(stakeAmount);
        if (!stakeAmount || isNaN(amount) || amount <= 0) {
            errs.stakeAmount = "Enter a valid positive amount";
        }
        if (useCustomMint && !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(customMint)) {
            errs.customMint = "Invalid Solana token address";
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleCreate = () => {
        if (!validate()) return;
        setLoading(true);

        // TODO: Replace with real API call → duelsAPI.create(...)
        setTimeout(() => {
            setLoading(false);
            showToast("Duel created! Waiting for opponent…", "success");
            router.push("/(tabs)");
        }, 1500);
    };

    return (
        <View className="flex-1 bg-[#0A0A0F]">
            <StatusBar style="light" />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <ScrollView
                    className="flex-1"
                    contentContainerClassName="px-5 pt-16 pb-10"
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <Text className="text-white text-2xl font-black mb-1">Create Duel</Text>
                    <Text className="text-[#64748B] text-sm mb-8">
                        Set your stake and challenge anyone
                    </Text>

                    {/* Stake Amount */}
                    <Input
                        label="Stake Amount"
                        placeholder="0.00"
                        value={stakeAmount}
                        onChangeText={setStakeAmount}
                        keyboardType="numeric"
                        error={errors.stakeAmount}
                    />

                    {/* Token Selector */}
                    <Text className="text-[#94A3B8] text-xs uppercase tracking-widest mb-3 ml-1 font-semibold">
                        Token
                    </Text>
                    <View className="flex-row gap-2 mb-2">
                        {COMMON_TOKENS.map((token, i) => (
                            <Pressable
                                key={token.symbol}
                                onPress={() => {
                                    setSelectedToken(i);
                                    setUseCustomMint(false);
                                }}
                                className={`flex-1 py-3 px-3 rounded-xl items-center border ${!useCustomMint && selectedToken === i
                                        ? "bg-[#8B5CF6]/20 border-[#8B5CF6]"
                                        : "bg-[#0D0E1A] border-[#1E2030]"
                                    }`}
                            >
                                <Text
                                    className={`font-bold text-sm ${!useCustomMint && selectedToken === i
                                            ? "text-[#A78BFA]"
                                            : "text-[#94A3B8]"
                                        }`}
                                >
                                    {token.symbol}
                                </Text>
                                <Text className="text-[#64748B] text-[10px] mt-0.5">{token.name}</Text>
                            </Pressable>
                        ))}
                    </View>

                    <Pressable
                        onPress={() => setUseCustomMint(!useCustomMint)}
                        className="flex-row items-center gap-2 mb-4 py-2"
                    >
                        <Ionicons
                            name={useCustomMint ? "checkbox" : "square-outline"}
                            size={18}
                            color={useCustomMint ? "#8B5CF6" : "#64748B"}
                        />
                        <Text className="text-[#94A3B8] text-xs">Use custom token mint</Text>
                    </Pressable>

                    {useCustomMint && (
                        <Input
                            label="Custom Token Mint Address"
                            placeholder="Base58 encoded address"
                            value={customMint}
                            onChangeText={setCustomMint}
                            autoCapitalize="none"
                            error={errors.customMint}
                        />
                    )}

                    {/* Expiration */}
                    <Text className="text-[#94A3B8] text-xs uppercase tracking-widest mb-3 ml-1 font-semibold mt-2">
                        Expires In
                    </Text>
                    <View className="flex-row flex-wrap gap-2 mb-8">
                        {EXPIRATION_PRESETS.map((preset, i) => (
                            <Pressable
                                key={preset.label}
                                onPress={() => setSelectedExpiry(i)}
                                className={`px-4 py-2.5 rounded-xl border ${selectedExpiry === i
                                        ? "bg-[#8B5CF6]/20 border-[#8B5CF6]"
                                        : "bg-[#0D0E1A] border-[#1E2030]"
                                    }`}
                            >
                                <Text
                                    className={`text-xs font-semibold ${selectedExpiry === i ? "text-[#A78BFA]" : "text-[#94A3B8]"
                                        }`}
                                >
                                    {preset.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    {/* Summary Card */}
                    <Card className="mb-6">
                        <Text className="text-[#64748B] text-xs uppercase tracking-widest mb-3 font-semibold">
                            Duel Summary
                        </Text>
                        <View className="flex-row justify-between mb-2">
                            <Text className="text-[#94A3B8] text-sm">Stake</Text>
                            <Text className="text-white text-sm font-bold">
                                {stakeAmount || "0"} {COMMON_TOKENS[selectedToken].symbol}
                            </Text>
                        </View>
                        <View className="flex-row justify-between mb-2">
                            <Text className="text-[#94A3B8] text-sm">Potential Win</Text>
                            <Text className="text-[#10B981] text-sm font-bold">
                                {stakeAmount ? (parseFloat(stakeAmount) * 2).toFixed(2) : "0"}{" "}
                                {COMMON_TOKENS[selectedToken].symbol}
                            </Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-[#94A3B8] text-sm">Duration</Text>
                            <Text className="text-white text-sm font-bold">
                                {EXPIRATION_PRESETS[selectedExpiry].label}
                            </Text>
                        </View>
                    </Card>

                    <Button
                        title="Create Duel ⚔️"
                        onPress={handleCreate}
                        loading={loading}
                        size="lg"
                    />
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
