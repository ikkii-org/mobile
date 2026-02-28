import React, { useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { EmptyState } from "../../components/ui/EmptyState";
import { useToast } from "../../contexts/ToastContext";
import { MOCK_WALLET, MOCK_TRANSACTIONS } from "../../mockData";
import type { Transaction } from "../../types";

function formatBalance(val: string): string {
    return parseFloat(val).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

const TX_ICONS: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
    STAKE: { icon: "lock-closed", color: "#F59E0B" },
    REWARD: { icon: "trophy", color: "#10B981" },
    WITHDRAW: { icon: "arrow-up", color: "#EF4444" },
    CLAIM: { icon: "gift", color: "#8B5CF6" },
};

function TransactionRow({ tx }: { tx: Transaction }) {
    const style = TX_ICONS[tx.type] ?? { icon: "help-circle" as const, color: "#94A3B8" };
    const isPositive = tx.amount > 0;

    return (
        <View className="flex-row items-center py-3 border-b border-[#1E2030]">
            <View
                className="w-9 h-9 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: style.color + "20" }}
            >
                <Ionicons name={style.icon} size={16} color={style.color} />
            </View>
            <View className="flex-1">
                <Text className="text-white text-sm font-semibold">{tx.type}</Text>
                <Text className="text-[#64748B] text-[11px] mt-0.5">
                    {new Date(tx.date).toLocaleDateString()}
                </Text>
            </View>
            <Text
                className={`text-sm font-bold ${isPositive ? "text-[#10B981]" : "text-[#EF4444]"}`}
            >
                {isPositive ? "+" : ""}
                {tx.amount.toLocaleString()} SKR
            </Text>
        </View>
    );
}

export default function WalletScreen() {
    const { showToast } = useToast();
    const [refreshing, setRefreshing] = useState(false);
    const [showDeposit, setShowDeposit] = useState(false);
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [amount, setAmount] = useState("");

    const available = parseFloat(MOCK_WALLET.availableBalance);
    const locked = parseFloat(MOCK_WALLET.lockedBalance);
    const total = available + locked;

    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    };

    const handleDeposit = () => {
        // TODO: Replace with real API call → escrowAPI.deposit(...)
        showToast(`Deposited ${amount} SKR`, "success");
        setShowDeposit(false);
        setAmount("");
    };

    const handleWithdraw = () => {
        const parsed = parseFloat(amount);
        if (parsed > available) {
            showToast("Insufficient balance", "error");
            return;
        }
        // TODO: Replace with real API call → escrowAPI.withdraw(...)
        showToast(`Withdrawn ${amount} SKR`, "success");
        setShowWithdraw(false);
        setAmount("");
    };

    return (
        <View className="flex-1 bg-[#0A0A0F]">
            <StatusBar style="light" />

            <ScrollView
                className="flex-1"
                contentContainerClassName="px-5 pt-16 pb-10"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" colors={["#8B5CF6"]} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <Text className="text-white text-2xl font-black mb-1">Wallet</Text>
                <Text className="text-[#64748B] text-sm mb-6">Manage your escrow balance</Text>

                {/* Balance Card */}
                <Card className="mb-4">
                    <Text className="text-[#64748B] text-xs uppercase tracking-widest mb-2 font-semibold">
                        Total Balance
                    </Text>
                    <View className="flex-row items-baseline gap-2 mb-4">
                        <Text className="text-white text-4xl font-black">
                            {formatBalance(total.toString())}
                        </Text>
                        <Text className="text-[#8B5CF6] text-base font-bold">SKR</Text>
                    </View>

                    <View className="flex-row gap-3">
                        <View className="flex-1 bg-[#0D0E1A] rounded-xl p-3 border border-[#1E2030]">
                            <Text className="text-[#64748B] text-[10px] uppercase tracking-wider font-semibold">
                                Available
                            </Text>
                            <Text className="text-[#10B981] text-lg font-bold mt-1">
                                {formatBalance(MOCK_WALLET.availableBalance)}
                            </Text>
                        </View>
                        <View className="flex-1 bg-[#0D0E1A] rounded-xl p-3 border border-[#1E2030]">
                            <Text className="text-[#64748B] text-[10px] uppercase tracking-wider font-semibold">
                                Locked in Duels
                            </Text>
                            <Text className="text-[#F59E0B] text-lg font-bold mt-1">
                                {formatBalance(MOCK_WALLET.lockedBalance)}
                            </Text>
                        </View>
                    </View>
                </Card>

                {/* Actions */}
                <View className="flex-row gap-3 mb-8">
                    <View className="flex-1">
                        <Button
                            title="Deposit"
                            onPress={() => setShowDeposit(true)}
                            variant="primary"
                        />
                    </View>
                    <View className="flex-1">
                        <Button
                            title="Withdraw"
                            onPress={() => setShowWithdraw(true)}
                            variant="secondary"
                        />
                    </View>
                </View>

                {/* Transaction History */}
                <Text className="text-white text-lg font-bold mb-3">Recent Activity</Text>
                {MOCK_TRANSACTIONS.length > 0 ? (
                    <Card noPadding className="px-4">
                        {MOCK_TRANSACTIONS.map((tx) => (
                            <TransactionRow key={tx.id} tx={tx} />
                        ))}
                    </Card>
                ) : (
                    <EmptyState
                        icon="receipt-outline"
                        title="No transactions yet"
                        subtitle="Your activity will appear here"
                    />
                )}
            </ScrollView>

            {/* Deposit Modal */}
            <Modal
                visible={showDeposit}
                onClose={() => { setShowDeposit(false); setAmount(""); }}
                title="Deposit Tokens"
                confirmText="Deposit"
                onConfirm={handleDeposit}
            >
                <Text className="text-[#94A3B8] text-sm mb-4">
                    Add SKR tokens to your escrow wallet
                </Text>
                <Input
                    label="Amount"
                    placeholder="0.00"
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                />
            </Modal>

            {/* Withdraw Modal */}
            <Modal
                visible={showWithdraw}
                onClose={() => { setShowWithdraw(false); setAmount(""); }}
                title="Withdraw Tokens"
                confirmText="Withdraw"
                onConfirm={handleWithdraw}
                confirmVariant="danger"
            >
                <Text className="text-[#94A3B8] text-sm mb-2">
                    Withdraw SKR to your Solana wallet
                </Text>
                <Text className="text-[#64748B] text-xs mb-4">
                    Max available: {formatBalance(MOCK_WALLET.availableBalance)} SKR
                </Text>
                <Input
                    label="Amount"
                    placeholder="0.00"
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                />
            </Modal>
        </View>
    );
}
