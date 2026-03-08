import React, { useEffect, useState, useCallback } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { Connection, PublicKey, Transaction, clusterApiUrl } from "@solana/web3.js";
import { transact, Web3MobileWallet } from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";

import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { useToast } from "../../contexts/ToastContext";
import { useAuth } from "../../contexts/AuthContext";
import { useWallet } from "../../components/WalletProvider";
import { useTheme, ThemeTokens } from "../../contexts/ThemeContext";
import { escrowAPI } from "../../services/api";
import { buildUnwrapSolInstruction } from "../../utils/ikkiEscrow";
import type { Wallet, Transaction as TxType } from "../../types";

const CONNECTION = new Connection(clusterApiUrl("devnet"), "confirmed");

function formatBalance(val: string | number): string {
    const num = typeof val === "string" ? parseFloat(val) : val;
    return (num || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function getTxIcon(type: string, theme: ThemeTokens): { icon: keyof typeof Ionicons.glyphMap; color: string; glow: string } {
    const map: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; glow: string }> = {
        STAKE: { icon: "lock-closed", color: theme.amber, glow: theme.amber + "30" },
        REWARD: { icon: "trophy", color: theme.green, glow: theme.greenGlow },
        WITHDRAW: { icon: "arrow-up", color: theme.red, glow: theme.redGlow },
        DEPOSIT: { icon: "arrow-down", color: theme.green, glow: theme.greenGlow },
        CLAIM: { icon: "gift", color: theme.accentLight, glow: theme.accentGlow },
    };
    return map[type] ?? { icon: "help-circle", color: theme.grey, glow: "transparent" };
}

// ─── Ring Chart Component (SVG-free, RN Views) ───
function RingChart({ usdc, sol, size }: { usdc: number; sol: number; size: number }) {
    const theme = useTheme();
    // Static 50/50 split for aesthetic since USDC and SOL have different values
    const usdcPct = 0.5;
    const solPct = 0.5;
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
            {/* USDC segment */}
            <View style={{
                position: "absolute",
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: ringWidth,
                borderColor: "transparent",
                borderTopColor: theme.blue,
                borderRightColor: usdcPct > 0.25 ? theme.blue : "transparent",
                borderBottomColor: usdcPct > 0.5 ? theme.blue : "transparent",
                borderLeftColor: usdcPct > 0.75 ? theme.blue : "transparent",
                transform: [{ rotate: "-45deg" }],
            }} />
            {/* SOL segment */}
            <View style={{
                position: "absolute",
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: ringWidth,
                borderColor: "transparent",
                borderTopColor: theme.accentLight,
                borderRightColor: solPct > 0.25 ? theme.accentLight : "transparent",
                borderBottomColor: solPct > 0.5 ? theme.accentLight : "transparent",
                borderLeftColor: solPct > 0.75 ? theme.accentLight : "transparent",
                transform: [{ rotate: `${-45 + usdcPct * 360}deg` }],
            }} />
            {/* Center content */}
            <View style={{ alignItems: "center" }}>
                <Text style={{ color: theme.textPrimary, fontSize: size * 0.13, fontWeight: "900", letterSpacing: -0.5 }}>
                    {formatBalance(usdc)}
                </Text>
                <Text style={{ color: theme.blue, fontSize: size * 0.06, fontWeight: "800", letterSpacing: 1, marginTop: -2 }}>
                    USDC
                </Text>

                <View style={{ width: size * 0.3, height: 1, backgroundColor: theme.divider, marginVertical: 6 }} />

                <Text style={{ color: theme.textPrimary, fontSize: size * 0.13, fontWeight: "900", letterSpacing: -0.5 }}>
                    {formatBalance(sol)}
                </Text>
                <Text style={{ color: theme.accentLight, fontSize: size * 0.06, fontWeight: "800", letterSpacing: 1, marginTop: -2 }}>
                    SOL
                </Text>
            </View>
        </View>
    );
}

function TransactionRow({ tx }: { tx: TxType }) {
    const theme = useTheme();
    const style = getTxIcon(tx.type, theme);
    const isPositive = tx.amount > 0;

    return (
        <Card noFill noPadding style={{
            borderRadius: 10,
            marginBottom: 6,
        }}>
            <View style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 12,
                paddingHorizontal: 14,
            }}>
                {/* Vertical accent bar */}
                <View style={{
                    position: "absolute",
                    left: 0,
                    top: 8,
                    bottom: 8,
                    width: 3,
                    backgroundColor: style.color + "60",
                    borderTopRightRadius: 2,
                    borderBottomRightRadius: 2,
                }} />
                {/* Icon */}
                <View style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10,
                    marginLeft: 6,
                    backgroundColor: style.color + "15",
                    borderWidth: 1,
                    borderColor: style.color + "30",
                }}>
                    <Ionicons name={style.icon} size={14} color={style.color} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.textPrimary, fontSize: 12, fontWeight: "800", letterSpacing: 0.5 }}>
                        {tx.type}
                    </Text>
                    <Text style={{ color: theme.textMuted, fontSize: 10, marginTop: 1, fontFamily: "monospace" }}>
                        {new Date(tx.date).toLocaleDateString()}
                    </Text>
                </View>
                <Text style={{
                    fontSize: 13,
                    fontWeight: "900",
                    color: isPositive ? theme.green : theme.red,
                    letterSpacing: -0.3,
                }}>
                    {isPositive ? "+" : ""}{tx.amount.toLocaleString()} USDC
                </Text>
            </View>
        </Card>
    );
}

export default function WalletScreen() {
    const { showToast } = useToast();
    const { user } = useAuth();
    const { balanceSol, balanceWsol, balanceUsdc, publicKey, refreshBalance } = useWallet();
    const theme = useTheme();

    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [transactions, setTransactions] = useState<TxType[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [claimLoading, setClaimLoading] = useState(false);

    const available = wallet ? parseFloat(wallet.availableBalance) : 0;
    const locked = wallet ? parseFloat(wallet.lockedBalance) : 0;
    const total = available + locked;

    const fetchWallet = useCallback(async () => {
        if (!user) return;
        try {
            const res = await escrowAPI.getWallet(user.id);
            setWallet(res.wallet);

            const txRes = await escrowAPI.getTransactions(user.id);
            setTransactions(txRes.transactions.map((tx: any) => ({
                id: tx.id,
                type: tx.transactionType,
                amount: parseFloat(tx.amount),
                date: tx.createdAt,
                status: tx.transactionStatus,
            })));
        } catch (err: any) {
            console.error("Failed to fetch wallet:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    useEffect(() => { fetchWallet(); }, [fetchWallet]);

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchWallet(), refreshBalance()]);
        setRefreshing(false);
    };



    const handleClaimWsol = async () => {
        if (!publicKey) {
            showToast("Wallet not connected", "error");
            return;
        }
        setClaimLoading(true);
        try {
            const ownerPk = new PublicKey(publicKey);
            const unwrapIx = buildUnwrapSolInstruction(ownerPk, ownerPk);
            const latestBlockhash = await CONNECTION.getLatestBlockhash();
            const tx = new Transaction({ feePayer: ownerPk, ...latestBlockhash }).add(unwrapIx);

            let txSignature = "";
            await transact(async (w: Web3MobileWallet) => {
                await w.authorize({
                    cluster: "devnet",
                    identity: { name: "Ikkii", uri: "https://ikkii.app", icon: "favicon.ico" },
                });
                const [sig] = await w.signAndSendTransactions({ transactions: [tx] });
                txSignature = sig;
            });

            await CONNECTION.confirmTransaction({ signature: txSignature, ...latestBlockhash }, "confirmed");
            // Record the claim on the vault page
            if (user) escrowAPI.recordTransaction(user.id, { type: "CLAIM", amount: balanceWsol ?? 0 }).catch(() => { });
            showToast("SOL claimed to your wallet!", "success");
            await refreshBalance();
        } catch (err: any) {
            console.error("Claim wSOL error:", err);
            showToast(err.message || "Failed to claim SOL", "error");
        } finally {
            setClaimLoading(false);
        }
    };

    if (loading && !wallet) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: "center", justifyContent: "center" }}>
                <StatusBar style="dark" />
                <ActivityIndicator size="large" color={theme.accent} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <StatusBar style="dark" />

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
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <View style={{ width: 4, height: 28, backgroundColor: theme.accent, borderRadius: 2, marginRight: 12 }} />
                        <View>
                            <Text style={{
                                color: theme.textPrimary,
                                fontSize: 26,
                                fontWeight: "900",
                                letterSpacing: 2,
                            }}>
                                VAULT
                            </Text>
                            <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2, letterSpacing: 0.5 }}>
                                Escrow balances & on-chain assets
                            </Text>
                        </View>
                    </View>
                </View>

                {/* ═══ HERO: Ring Chart Dashboard ═══ */}
                <Card
                    noPadding
                    tabLabel="VAULT"
                    style={{
                        marginHorizontal: 20,
                        marginTop: 16,
                        backgroundColor: theme.bgGlass,
                        borderColor: theme.borderNeon,
                    }}
                >
                    <View style={{ padding: 22, alignItems: "center" }}>
                        {/* Ring chart */}
                        <RingChart usdc={balanceUsdc || 0} sol={balanceSol || 0} size={150} />

                        {/* Tech divider */}
                        <View style={{ width: "60%", height: 1, backgroundColor: theme.divider, marginTop: 18, marginBottom: 14 }} />

                        {/* Legend row below chart — square dots */}
                        <View style={{ flexDirection: "row", gap: 20 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                <View style={{ width: 6, height: 6, borderRadius: 1, backgroundColor: theme.blue }} />
                                <Text style={{ color: theme.textSecondary, fontSize: 10, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" }}>
                                    Wallet USDC
                                </Text>
                            </View>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                <View style={{ width: 6, height: 6, borderRadius: 1, backgroundColor: theme.accentLight }} />
                                <Text style={{ color: theme.textSecondary, fontSize: 10, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" }}>
                                    Wallet SOL
                                </Text>
                            </View>
                        </View>
                    </View>
                </Card>


                {/* ═══ wSOL CLAIMABLE BANNER ═══ */}
                {balanceWsol != null && balanceWsol > 0 && (
                    <Card
                        noPadding
                        accent={theme.green}
                        style={{
                            marginHorizontal: 20,
                            marginTop: 14,
                            backgroundColor: theme.green + "12",
                            borderColor: theme.green + "35",
                            borderRadius: 12,
                        }}
                    >
                        <View style={{ padding: 16 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                                <View style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 8,
                                    backgroundColor: theme.green + "20",
                                    borderWidth: 1,
                                    borderColor: theme.green + "40",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginRight: 10,
                                }}>
                                    <Ionicons name="gift" size={16} color={theme.green} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{
                                        color: theme.green,
                                        fontSize: 9,
                                        fontWeight: "800",
                                        letterSpacing: 2,
                                        textTransform: "uppercase",
                                    }}>
                                        Claimable Winnings
                                    </Text>
                                    <Text style={{
                                        color: theme.textPrimary,
                                        fontSize: 20,
                                        fontWeight: "900",
                                        marginTop: 2,
                                        letterSpacing: -0.5,
                                    }}>
                                        {balanceWsol.toFixed(4)} SOL
                                    </Text>
                                </View>
                            </View>
                            <Text style={{
                                color: theme.textMuted,
                                fontSize: 11,
                                marginBottom: 12,
                                lineHeight: 16,
                            }}>
                                You have wrapped SOL from duel winnings. Claim to unwrap it into your wallet as native SOL.
                            </Text>
                            <Pressable
                                onPress={handleClaimWsol}
                                disabled={claimLoading}
                                style={{
                                    backgroundColor: theme.green,
                                    borderRadius: 8,
                                    paddingVertical: 11,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexDirection: "row",
                                    gap: 6,
                                    opacity: claimLoading ? 0.6 : 1,
                                }}
                            >
                                {claimLoading ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Ionicons name="wallet" size={15} color="#FFFFFF" />
                                        <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>
                                            CLAIM TO WALLET
                                        </Text>
                                    </>
                                )}
                            </Pressable>
                        </View>
                    </Card>
                )}

                {/* ═══ ASSET GRID (2x2) ═══ */}
                <View style={{ paddingHorizontal: 20, marginTop: 18 }}>
                    {/* SectionHeader: bar + dot pattern */}
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                        <View style={{ width: 12, height: 2, backgroundColor: theme.accent, borderRadius: 1, marginRight: 4 }} />
                        <View style={{ width: 4, height: 4, borderRadius: 1, backgroundColor: theme.accent, marginRight: 8 }} />
                        <Text style={{
                            color: theme.textPrimary, fontSize: 11, fontWeight: "800",
                            letterSpacing: 2, textTransform: "uppercase", flex: 1,
                        }}>
                            Assets
                        </Text>
                    </View>

                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                        {[
                            { label: "Wallet USDC", value: balanceUsdc !== null ? formatBalance(balanceUsdc) : "0.00", icon: "card" as keyof typeof Ionicons.glyphMap, color: theme.blue },
                            { label: "Wallet SOL", value: balanceSol !== null ? balanceSol.toFixed(2) : "0.00", icon: "wallet-outline" as keyof typeof Ionicons.glyphMap, color: theme.accentLight },
                        ].map((asset) => (
                            <Card
                                key={asset.label}
                                noFill
                                noPadding
                                style={{
                                    width: "48%",
                                    borderRadius: 12,
                                }}
                            >
                                {/* Top accent line */}
                                <View style={{ alignItems: "center" }}>
                                    <View style={{ width: "40%", height: 2, backgroundColor: asset.color + "50", borderBottomLeftRadius: 1, borderBottomRightRadius: 1 }} />
                                </View>
                                <View style={{ padding: 14 }}>
                                    <View style={{
                                        width: 28, height: 28, borderRadius: 7,
                                        backgroundColor: asset.color + "18", borderWidth: 1, borderColor: asset.color + "30",
                                        alignItems: "center", justifyContent: "center", marginBottom: 8,
                                    }}>
                                        <Ionicons name={asset.icon} size={13} color={asset.color} />
                                    </View>
                                    <Text style={{ color: asset.color, fontSize: 16, fontWeight: "900", letterSpacing: -0.5 }}>
                                        {asset.value}
                                    </Text>
                                    <Text style={{
                                        color: theme.textMuted, fontSize: 9, letterSpacing: 2,
                                        textTransform: "uppercase", fontWeight: "700", marginTop: 3,
                                    }}>
                                        {asset.label}
                                    </Text>
                                </View>
                            </Card>
                        ))}
                    </View>
                </View>

                {/* ═══ RECENT ACTIVITY ═══ */}
                <View style={{ paddingHorizontal: 20, marginTop: 22 }}>
                    {/* SectionHeader: bar + dot pattern */}
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                        <View style={{ width: 12, height: 2, backgroundColor: theme.accent, borderRadius: 1, marginRight: 4 }} />
                        <View style={{ width: 4, height: 4, borderRadius: 1, backgroundColor: theme.accent, marginRight: 8 }} />
                        <Text style={{
                            color: theme.textPrimary, fontSize: 11, fontWeight: "800",
                            letterSpacing: 2, textTransform: "uppercase",
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


        </View>
    );
}
