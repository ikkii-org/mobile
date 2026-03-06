import React, { useEffect, useState, useCallback } from "react";
import { RefreshControl, ScrollView, Text, View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { EmptyState } from "../../components/ui/EmptyState";
import { useToast } from "../../contexts/ToastContext";
import { useAuth } from "../../contexts/AuthContext";
import { useWallet } from "../../components/WalletProvider";
import { useTheme, FlatTheme } from "../../contexts/ThemeContext";
import { escrowAPI } from "../../services/api";
import type { Wallet, Transaction } from "../../types";

function formatBalance(val: string | number): string {
    const num = typeof val === "string" ? parseFloat(val) : val;
    return (num || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function getTxIcon(type: string, theme: FlatTheme): { icon: keyof typeof Ionicons.glyphMap; color: string; glow: string } {
    const map: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; glow: string }> = {
        STAKE:    { icon: "lock-closed", color: theme.amber,       glow: theme.amber + "30" },
        REWARD:   { icon: "trophy",      color: theme.green,       glow: theme.greenGlow },
        WITHDRAW: { icon: "arrow-up",    color: theme.red,         glow: theme.redGlow },
        CLAIM:    { icon: "gift",        color: theme.accentLight, glow: theme.accentGlow },
    };
    return map[type] ?? { icon: "help-circle", color: theme.grey, glow: "transparent" };
}

// ─── Ring Chart Component (SVG-free, RN Views) ───
function RingChart({ available, locked, size }: { available: number; locked: number; size: number }) {
    const theme = useTheme();
    const total = available + locked;
    const availPct = total > 0 ? available / total : 0.5;
    const lockedPct = total > 0 ? locked / total : 0.5;
    const ringWidth = 8;

    return (
        <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
            {/* Background ring */}
            <View style={{
                position: "absolute",
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: ringWidth,
                borderColor: theme.bgCard,
            }} />
            {/* Available segment (top-right arc visual) */}
            <View style={{
                position: "absolute",
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: ringWidth,
                borderColor: "transparent",
                borderTopColor: theme.green,
                borderRightColor: availPct > 0.25 ? theme.green : "transparent",
                borderBottomColor: availPct > 0.5 ? theme.green : "transparent",
                borderLeftColor: availPct > 0.75 ? theme.green : "transparent",
                transform: [{ rotate: "-45deg" }],
            }} />
            {/* Locked segment (complementary) */}
            <View style={{
                position: "absolute",
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: ringWidth,
                borderColor: "transparent",
                borderTopColor: theme.amber,
                borderRightColor: lockedPct > 0.25 ? theme.amber : "transparent",
                borderBottomColor: lockedPct > 0.5 ? theme.amber : "transparent",
                borderLeftColor: lockedPct > 0.75 ? theme.amber : "transparent",
                transform: [{ rotate: `${-45 + availPct * 360}deg` }],
            }} />
            {/* Center content */}
            <View style={{ alignItems: "center" }}>
                <Text style={{ color: theme.textPrimary, fontSize: size * 0.16, fontWeight: "900" }}>
                    {formatBalance(total)}
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: size * 0.07, fontWeight: "700", letterSpacing: 1, marginTop: 2 }}>
                    USDC
                </Text>
            </View>
        </View>
    );
}

function TransactionRow({ tx }: { tx: Transaction }) {
    const theme = useTheme();
    const style = getTxIcon(tx.type, theme);
    const isPositive = tx.amount > 0;

    return (
        <View style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 12,
            paddingHorizontal: 14,
            marginBottom: 6,
            backgroundColor: theme.bgCard,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.border,
        }}>
            {/* Icon */}
            <View style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 10,
                backgroundColor: style.color + "15",
                borderWidth: 1,
                borderColor: style.color + "30",
            }}>
                <Ionicons name={style.icon} size={14} color={style.color} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ color: theme.textPrimary, fontSize: 12, fontWeight: "700" }}>
                    {tx.type}
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 10, marginTop: 1 }}>
                    {new Date(tx.date).toLocaleDateString()}
                </Text>
            </View>
            <Text style={{
                fontSize: 13,
                fontWeight: "800",
                color: isPositive ? theme.green : theme.red,
            }}>
                {isPositive ? "+" : ""}{tx.amount.toLocaleString()} USDC
            </Text>
        </View>
    );
}

export default function WalletScreen() {
    const { showToast } = useToast();
    const { user } = useAuth();
    const { balanceSol, balanceUsdc } = useWallet();
    const theme = useTheme();

    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showDeposit, setShowDeposit] = useState(false);
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [amount, setAmount] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const available = wallet ? parseFloat(wallet.availableBalance) : 0;
    const locked = wallet ? parseFloat(wallet.lockedBalance) : 0;
    const total = available + locked;

    const fetchWallet = useCallback(async () => {
        if (!user) return;
        try {
            const res = await escrowAPI.getWallet(user.id);
            setWallet(res.wallet);
            setTransactions([]);
        } catch (err: any) {
            console.error("Failed to fetch wallet:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    useEffect(() => { fetchWallet(); }, [fetchWallet]);

    const onRefresh = () => { setRefreshing(true); fetchWallet(); };

    const handleDeposit = async () => {
        if (!user) return;
        const parsed = parseFloat(amount);
        if (isNaN(parsed) || parsed <= 0) { showToast("Invalid amount", "error"); return; }
        setActionLoading(true);
        try {
            const res = await escrowAPI.deposit(user.id, { amount: parsed });
            setWallet(res.wallet);
            showToast(`Deposited ${amount} USDC`, "success");
            setShowDeposit(false);
            setAmount("");
        } catch (err: any) {
            showToast(err.message || "Failed to deposit", "error");
        } finally {
            setActionLoading(false);
        }
    };

    const handleWithdraw = async () => {
        if (!user) return;
        const parsed = parseFloat(amount);
        if (isNaN(parsed) || parsed <= 0) { showToast("Invalid amount", "error"); return; }
        if (parsed > available) { showToast("Insufficient balance", "error"); return; }
        setActionLoading(true);
        try {
            const res = await escrowAPI.withdraw(user.id, { amount: parsed });
            setWallet(res.wallet);
            showToast(`Withdrawn ${amount} USDC`, "success");
            setShowWithdraw(false);
            setAmount("");
        } catch (err: any) {
            showToast(err.message || "Failed to withdraw", "error");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading && !wallet) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: "center", justifyContent: "center" }}>
                <StatusBar style={theme.isDark ? "light" : "dark"} />
                <ActivityIndicator size="large" color={theme.accent} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <StatusBar style={theme.isDark ? "light" : "dark"} />

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.accent}
                        colors={[theme.accent]}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* ═══ HEADER ═══ */}
                <View style={{ paddingHorizontal: 20, paddingTop: 64, paddingBottom: 4 }}>
                    <Text style={{
                        color: theme.textPrimary,
                        fontSize: 26,
                        fontWeight: "900",
                        letterSpacing: 2,
                    }}>
                        VAULT
                    </Text>
                    <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2, letterSpacing: 0.2 }}>
                        Escrow balances & on-chain assets
                    </Text>
                </View>

                {/* ═══ HERO: Ring Chart Dashboard ═══ */}
                <View style={{
                    marginHorizontal: 20,
                    marginTop: 16,
                    backgroundColor: theme.bgGlass,
                    borderRadius: 22,
                    borderWidth: 1,
                    borderColor: theme.borderGlow,
                    overflow: "hidden",
                    shadowColor: theme.accentGlow,
                    shadowOpacity: 0.3,
                    shadowRadius: 20,
                    shadowOffset: { width: 0, height: 6 },
                    elevation: 8,
                }}>
                    <View style={{ height: 3, backgroundColor: theme.accent }} />
                    <View style={{ padding: 22, alignItems: "center" }}>
                        {/* Ring chart */}
                        <RingChart available={available} locked={locked} size={150} />

                        {/* Legend row below chart */}
                        <View style={{ flexDirection: "row", gap: 20, marginTop: 16 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.green }} />
                                <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "600" }}>
                                    Available
                                </Text>
                                <Text style={{ color: theme.green, fontSize: 11, fontWeight: "800" }}>
                                    {formatBalance(available)}
                                </Text>
                            </View>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.amber }} />
                                <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "600" }}>
                                    Locked
                                </Text>
                                <Text style={{ color: theme.amber, fontSize: 11, fontWeight: "800" }}>
                                    {formatBalance(locked)}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* ═══ ACTION BUTTONS ═══ */}
                <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 20, marginTop: 14 }}>
                    <View style={{ flex: 1 }}>
                        <Button
                            title="Deposit"
                            onPress={() => setShowDeposit(true)}
                            variant="primary"
                            icon={<Ionicons name="arrow-down" size={15} color={theme.textInverse} />}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Button
                            title="Withdraw"
                            onPress={() => setShowWithdraw(true)}
                            variant="secondary"
                            icon={<Ionicons name="arrow-up" size={15} color={theme.accentLight} />}
                        />
                    </View>
                </View>

                {/* ═══ ASSET GRID (2x2) ═══ */}
                <View style={{ paddingHorizontal: 20, marginTop: 18 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                        <View style={{
                            width: 6, height: 6, borderRadius: 3, backgroundColor: theme.accent,
                            shadowColor: theme.accentGlow, shadowOpacity: 0.9, shadowRadius: 6,
                            shadowOffset: { width: 0, height: 0 }, marginRight: 8,
                        }} />
                        <Text style={{
                            color: theme.textPrimary, fontSize: 12, fontWeight: "800",
                            letterSpacing: 1.2, textTransform: "uppercase",
                        }}>
                            Assets
                        </Text>
                    </View>

                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                        {[
                            { label: "Available", value: formatBalance(available), icon: "checkmark-circle" as keyof typeof Ionicons.glyphMap, color: theme.green, glow: theme.greenGlow },
                            { label: "Locked", value: formatBalance(locked), icon: "lock-closed" as keyof typeof Ionicons.glyphMap, color: theme.amber, glow: theme.amber + "30" },
                            { label: "Wallet USDC", value: balanceUsdc !== null ? formatBalance(balanceUsdc) : "0.00", icon: "card" as keyof typeof Ionicons.glyphMap, color: theme.blue, glow: theme.blue + "30" },
                            { label: "SOL", value: balanceSol !== null ? balanceSol.toFixed(2) : "0.00", icon: "logo-bitcoin" as keyof typeof Ionicons.glyphMap, color: theme.accentLight, glow: theme.accentGlow },
                        ].map((asset) => (
                            <View
                                key={asset.label}
                                style={{
                                    width: "48%",
                                    backgroundColor: theme.bgCard,
                                    borderRadius: 14,
                                    padding: 14,
                                    borderWidth: 1,
                                    borderColor: theme.border,
                                    shadowColor: asset.glow,
                                    shadowOpacity: 0.3,
                                    shadowRadius: 6,
                                    shadowOffset: { width: 0, height: 2 },
                                    elevation: 3,
                                }}
                            >
                                <View style={{
                                    width: 28, height: 28, borderRadius: 8,
                                    backgroundColor: asset.color + "18", borderWidth: 1, borderColor: asset.color + "30",
                                    alignItems: "center", justifyContent: "center", marginBottom: 8,
                                }}>
                                    <Ionicons name={asset.icon} size={13} color={asset.color} />
                                </View>
                                <Text style={{ color: asset.color, fontSize: 16, fontWeight: "900", letterSpacing: -0.3 }}>
                                    {asset.value}
                                </Text>
                                <Text style={{
                                    color: theme.textMuted, fontSize: 9, letterSpacing: 1.2,
                                    textTransform: "uppercase", fontWeight: "700", marginTop: 3,
                                }}>
                                    {asset.label}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* ═══ RECENT ACTIVITY ═══ */}
                <View style={{ paddingHorizontal: 20, marginTop: 22 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                        <View style={{
                            width: 6, height: 6, borderRadius: 3, backgroundColor: theme.accent,
                            shadowColor: theme.accentGlow, shadowOpacity: 0.9, shadowRadius: 6,
                            shadowOffset: { width: 0, height: 0 }, marginRight: 8,
                        }} />
                        <Text style={{
                            color: theme.textPrimary, fontSize: 12, fontWeight: "800",
                            letterSpacing: 1.2, textTransform: "uppercase",
                        }}>
                            Recent Activity
                        </Text>
                    </View>

                    {transactions.length > 0 ? (
                        transactions.map((tx) => (
                            <TransactionRow key={tx.id} tx={tx} />
                        ))
                    ) : (
                        <EmptyState
                            icon="receipt-outline"
                            title="No transactions yet"
                            subtitle="Your activity will appear here"
                        />
                    )}
                </View>
            </ScrollView>

            {/* Deposit Modal */}
            <Modal
                visible={showDeposit}
                onClose={() => { setShowDeposit(false); setAmount(""); }}
                title="Deposit Tokens"
                confirmText="Deposit"
                onConfirm={handleDeposit}
                loading={actionLoading}
            >
                <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 16 }}>
                    Add USDC tokens to your escrow wallet
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
                loading={actionLoading}
            >
                <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 6 }}>
                    Withdraw USDC to your Solana wallet
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 11, marginBottom: 16 }}>
                    Max available: {formatBalance(available)} USDC
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
