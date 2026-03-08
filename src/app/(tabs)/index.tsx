import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useWallet } from "../../components/WalletProvider";
import { DuelCard } from "../../components/DuelCard";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { duelsAPI } from "../../services/api";
import type { Duel } from "../../types";

/** Reusable futuristic section header */
function SectionHeader({ label, count, color, theme }: {
    label: string; count: number; color: string; theme: ReturnType<typeof useTheme>;
}) {
    return (
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            {/* Decorative bar + dot */}
            <View style={{ flexDirection: "row", alignItems: "center", marginRight: 8 }}>
                <View style={{
                    width: 12,
                    height: 2,
                    backgroundColor: color,
                    borderRadius: 1,
                }} />
                <View style={{
                    width: 4,
                    height: 4,
                    borderRadius: 1,
                    backgroundColor: color,
                    marginLeft: 2,
                }} />
            </View>
            <Text style={{
                color: theme.textPrimary,
                fontSize: 11,
                fontWeight: "900",
                letterSpacing: 2,
                textTransform: "uppercase",
                flex: 1,
            }}>
                {label}
            </Text>
            <View style={{
                backgroundColor: color + "12",
                borderWidth: 1,
                borderColor: color + "25",
                borderRadius: 4,
                paddingHorizontal: 7,
                paddingVertical: 2,
            }}>
                <Text style={{ color, fontSize: 9, fontWeight: "900", letterSpacing: 0.5 }}>
                    {count}
                </Text>
            </View>
        </View>
    );
}

export default function HomeScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { balanceSol } = useWallet();
    const theme = useTheme();
    const currentUser = user?.username ?? "";

    const [openDuels, setOpenDuels] = useState<Duel[]>([]);
    const [activeDuels, setActiveDuels] = useState<Duel[]>([]);
    const [disputedDuels, setDisputedDuels] = useState<Duel[]>([]);
    const [settledDuels, setSettledDuels] = useState<Duel[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchDuels = useCallback(async () => {
        try {
            const [open, active, disputed, settled] = await Promise.all([
                duelsAPI.getByStatus("OPEN"),
                duelsAPI.getByStatus("ACTIVE"),
                duelsAPI.getByStatus("DISPUTED"),
                duelsAPI.getByStatus("SETTLED"),
            ]);
            setOpenDuels(open.duels);
            setActiveDuels(
                active.duels.filter(
                    (d) => d.player1Username === currentUser || d.player2Username === currentUser
                )
            );
            setDisputedDuels(disputed.duels);
            setSettledDuels(settled.duels);
        } catch (err) {
            console.error("Failed to fetch duels:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentUser]);

    useEffect(() => { fetchDuels(); }, [fetchDuels]);

    useFocusEffect(useCallback(() => { fetchDuels(); }, [fetchDuels]));

    const onRefresh = () => { setRefreshing(true); fetchDuels(); };

    const liveDuels = [...activeDuels, ...disputedDuels];

    if (loading) {
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
                contentContainerStyle={{ paddingBottom: 32 }}
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
                <View style={{ paddingHorizontal: 20, paddingTop: 58, paddingBottom: 4 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <View>
                            {/* Brand mark with geometric accent */}
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <View style={{
                                    width: 4,
                                    height: 28,
                                    backgroundColor: theme.accent,
                                    borderRadius: 2,
                                }} />
                                <Text style={{
                                    color: theme.textPrimary,
                                    fontSize: 28,
                                    fontWeight: "900",
                                    letterSpacing: 6,
                                }}>
                                    IKKII
                                </Text>
                            </View>
                            <Text style={{
                                color: theme.textMuted,
                                fontSize: 9,
                                marginTop: 3,
                                letterSpacing: 3,
                                fontWeight: "800",
                                textTransform: "uppercase",
                                marginLeft: 12,
                            }}>
                                Crypto Dueling Arena
                            </Text>
                        </View>

                        {/* SOL balance pill */}
                        {balanceSol !== null && (
                            <View style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 5,
                                backgroundColor: theme.accentBg,
                                borderWidth: 1,
                                borderColor: theme.borderStrong,
                                borderRadius: 6,
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                            }}>
                                <Ionicons name="flash" size={10} color={theme.accent} />
                                <Text style={{ color: theme.accent, fontSize: 11, fontWeight: "900", letterSpacing: 0.3 }}>
                                    {balanceSol.toFixed(2)}
                                </Text>
                                <Text style={{ color: theme.textMuted, fontSize: 9, fontWeight: "700" }}>
                                    SOL
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* ═══ STATS ROW ═══ */}
                <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 20, marginTop: 16, marginBottom: 6 }}>
                    {[
                        { label: "OPEN", value: openDuels.length, icon: "radio-button-on" as keyof typeof Ionicons.glyphMap, color: theme.blue },
                        { label: "LIVE", value: liveDuels.length, icon: "flash" as keyof typeof Ionicons.glyphMap, color: theme.green },
                        { label: "SETTLED", value: settledDuels.length, icon: "checkmark-circle" as keyof typeof Ionicons.glyphMap, color: theme.amber },
                    ].map((item) => (
                        <Card
                            key={item.label}
                            noFill
                            noPadding
                            style={{
                                flex: 1,
                                borderRadius: 10,
                                paddingVertical: 12,
                                paddingHorizontal: 8,
                                alignItems: "center",
                            }}
                        >
                            {/* Top neon line indicator */}
                            <View style={{
                                position: "absolute",
                                top: 0,
                                left: 12,
                                right: 12,
                                height: 2,
                                backgroundColor: item.color,
                                borderBottomLeftRadius: 2,
                                borderBottomRightRadius: 2,
                            }} />
                            <Text style={{ color: item.color, fontSize: 22, fontWeight: "900", letterSpacing: -1 }}>
                                {item.value}
                            </Text>
                            <Text style={{
                                color: theme.textMuted,
                                fontSize: 8,
                                fontWeight: "800",
                                letterSpacing: 2,
                                textTransform: "uppercase",
                                marginTop: 3,
                            }}>
                                {item.label}
                            </Text>
                        </Card>
                    ))}
                </View>

                {/* ═══ LIVE DUELS CAROUSEL ═══ */}
                {liveDuels.length > 0 && (
                    <View style={{ marginTop: 20 }}>
                        <View style={{ paddingHorizontal: 20 }}>
                            <SectionHeader
                                label="Live Duels"
                                count={liveDuels.length}
                                color={theme.green}
                                theme={theme}
                            />
                        </View>

                        <FlatList
                            data={liveDuels}
                            keyExtractor={(item) => item.id}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
                            renderItem={({ item }) => (
                                <View style={{ paddingRight: 10 }}>
                                    <DuelCard
                                        duel={item}
                                        currentUsername={currentUser}
                                        onPress={() => router.push(`/duel/${item.id}`)}
                                        onAction={() => router.push(`/duel/${item.id}`)}
                                        variant="compact"
                                    />
                                </View>
                            )}
                        />
                    </View>
                )}

                {/* ═══ OPEN CHALLENGES — 2-column grid ═══ */}
                <View style={{ marginTop: 22, paddingHorizontal: 20 }}>
                    <SectionHeader
                        label="Open Challenges"
                        count={openDuels.length}
                        color={theme.blue}
                        theme={theme}
                    />

                    {openDuels.length > 0 ? (
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                            {openDuels.map((duel) => (
                                <View key={duel.id} style={{ width: "48%", marginBottom: 10 }}>
                                    <DuelCard
                                        duel={duel}
                                        currentUsername={currentUser}
                                        onPress={() => router.push(`/duel/${duel.id}`)}
                                        onAction={() => router.push(`/duel/${duel.id}`)}
                                        variant="compact"
                                    />
                                </View>
                            ))}
                        </View>
                    ) : (
                        <EmptyState
                            icon="flash-outline"
                            title="No open challenges"
                            subtitle="Be the first to throw down"
                        />
                    )}
                </View>

                {/* ═══ RECENT RESULTS ═══ */}
                <View style={{ marginTop: 22, paddingHorizontal: 20 }}>
                    <SectionHeader
                        label="Recent Results"
                        count={settledDuels.length}
                        color={theme.amber}
                        theme={theme}
                    />

                    {settledDuels.length > 0 ? (
                        settledDuels.map((duel) => (
                            <View key={duel.id} style={{ marginBottom: 12 }}>
                                <DuelCard
                                    duel={duel}
                                    currentUsername={currentUser}
                                    onPress={() => router.push(`/duel/${duel.id}`)}
                                    variant="full"
                                />
                            </View>
                        ))
                    ) : (
                        <EmptyState
                            icon="time-outline"
                            title="No results yet"
                            subtitle="Completed duels will appear here"
                        />
                    )}
                </View>
            </ScrollView>
        </View>
    );
}
