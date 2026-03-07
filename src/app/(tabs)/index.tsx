import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useWallet } from "../../components/WalletProvider";
import { DuelCard } from "../../components/DuelCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { duelsAPI } from "../../services/api";
import type { Duel } from "../../types";

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

    // Carousel duels = active + disputed (the "live" ones)
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
                <View style={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 6 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <View>
                            <Text style={{
                                color: theme.textPrimary,
                                fontSize: 28,
                                fontWeight: "900",
                                letterSpacing: 4,
                                textShadowColor: theme.accentGlow,
                                textShadowOffset: { width: 0, height: 0 },
                                textShadowRadius: 14,
                            }}>
                                IKKII
                            </Text>
                            <Text style={{
                                color: theme.textMuted,
                                fontSize: 9,
                                marginTop: 1,
                                letterSpacing: 2,
                                fontWeight: "700",
                                textTransform: "uppercase",
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
                                borderRadius: 100,
                                paddingHorizontal: 12,
                                paddingVertical: 7,
                            }}>
                                <Ionicons name="flash" size={11} color={theme.accentLight} />
                                <Text style={{ color: theme.accentLight, fontSize: 11, fontWeight: "800" }}>
                                    {balanceSol.toFixed(2)} SOL
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* ═══ DASHBOARD STATS ROW ═══ */}
                <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 20, marginTop: 14, marginBottom: 6 }}>
                    {[
                        { label: "Open", value: openDuels.length, icon: "radio-button-on" as keyof typeof Ionicons.glyphMap, color: theme.blue },
                        { label: "Live", value: liveDuels.length, icon: "flash" as keyof typeof Ionicons.glyphMap, color: theme.green },
                        { label: "Settled", value: settledDuels.length, icon: "checkmark-circle" as keyof typeof Ionicons.glyphMap, color: theme.amber },
                    ].map((item) => (
                        <View
                            key={item.label}
                            style={{
                                flex: 1,
                                backgroundColor: theme.bgCard,
                                borderWidth: 1,
                                borderColor: theme.border,
                                borderRadius: 14,
                                paddingVertical: 12,
                                paddingHorizontal: 10,
                                alignItems: "center",
                            }}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 4 }}>
                                <Ionicons name={item.icon} size={12} color={item.color} />
                                <Text style={{ color: item.color, fontSize: 20, fontWeight: "900" }}>
                                    {item.value}
                                </Text>
                            </View>
                            <Text style={{
                                color: theme.textMuted,
                                fontSize: 9,
                                fontWeight: "700",
                                letterSpacing: 1,
                                textTransform: "uppercase",
                            }}>
                                {item.label}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* ═══ LIVE DUELS CAROUSEL ═══ */}
                {liveDuels.length > 0 && (
                    <View style={{ marginTop: 18 }}>
                        {/* Section header */}
                        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, marginBottom: 12 }}>
                            <View style={{
                                width: 6,
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: theme.green,
                                shadowColor: theme.greenGlow,
                                shadowOpacity: 0.9,
                                shadowRadius: 6,
                                shadowOffset: { width: 0, height: 0 },
                                marginRight: 8,
                            }} />
                            <Text style={{
                                color: theme.textPrimary,
                                fontSize: 12,
                                fontWeight: "800",
                                letterSpacing: 1.2,
                                textTransform: "uppercase",
                                flex: 1,
                            }}>
                                Live Duels
                            </Text>
                            <View style={{
                                backgroundColor: theme.green + "18",
                                borderWidth: 1,
                                borderColor: theme.green + "35",
                                borderRadius: 100,
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                            }}>
                                <Text style={{ color: theme.green, fontSize: 10, fontWeight: "800" }}>
                                    {liveDuels.length}
                                </Text>
                            </View>
                        </View>

                        {/* Horizontal scroll carousel */}
                        <FlatList
                            data={liveDuels}
                            keyExtractor={(item) => item.id}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
                            renderItem={({ item }) => (
                                <DuelCard
                                    duel={item}
                                    currentUsername={currentUser}
                                    onPress={() => router.push(`/duel/${item.id}`)}
                                    onAction={() => router.push(`/duel/${item.id}`)}
                                    variant="compact"
                                />
                            )}
                        />
                    </View>
                )}

                {/* ═══ OPEN CHALLENGES ─ 2-column grid ═══ */}
                <View style={{ marginTop: 22, paddingHorizontal: 20 }}>
                    {/* Section header */}
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                        <View style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: theme.blue,
                            shadowColor: theme.blue,
                            shadowOpacity: 0.9,
                            shadowRadius: 6,
                            shadowOffset: { width: 0, height: 0 },
                            marginRight: 8,
                        }} />
                        <Text style={{
                            color: theme.textPrimary,
                            fontSize: 12,
                            fontWeight: "800",
                            letterSpacing: 1.2,
                            textTransform: "uppercase",
                            flex: 1,
                        }}>
                            Open Challenges
                        </Text>
                        <View style={{
                            backgroundColor: theme.blue + "18",
                            borderWidth: 1,
                            borderColor: theme.blue + "35",
                            borderRadius: 100,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                        }}>
                            <Text style={{ color: theme.blue, fontSize: 10, fontWeight: "800" }}>
                                {openDuels.length}
                            </Text>
                        </View>
                    </View>

                    {openDuels.length > 0 ? (
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                            {openDuels.map((duel) => (
                                <View key={duel.id} style={{ width: "48%" }}>
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

                {/* ═══ RECENT RESULTS ─ compact list ═══ */}
                <View style={{ marginTop: 22, paddingHorizontal: 20 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                        <View style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: theme.amber,
                            shadowColor: theme.amber,
                            shadowOpacity: 0.9,
                            shadowRadius: 6,
                            shadowOffset: { width: 0, height: 0 },
                            marginRight: 8,
                        }} />
                        <Text style={{
                            color: theme.textPrimary,
                            fontSize: 12,
                            fontWeight: "800",
                            letterSpacing: 1.2,
                            textTransform: "uppercase",
                            flex: 1,
                        }}>
                            Recent Results
                        </Text>
                        <View style={{
                            backgroundColor: theme.amber + "18",
                            borderWidth: 1,
                            borderColor: theme.amber + "35",
                            borderRadius: 100,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                        }}>
                            <Text style={{ color: theme.amber, fontSize: 10, fontWeight: "800" }}>
                                {settledDuels.length}
                            </Text>
                        </View>
                    </View>

                    {settledDuels.length > 0 ? (
                        settledDuels.map((duel) => (
                            <DuelCard
                                key={duel.id}
                                duel={duel}
                                currentUsername={currentUser}
                                onPress={() => router.push(`/duel/${duel.id}`)}
                                variant="full"
                            />
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
