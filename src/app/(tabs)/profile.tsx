import React, { useState, useEffect, useCallback } from "react";
import { Alert, Pressable, ScrollView, Text, View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import { Avatar } from "../../components/ui/Avatar";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../contexts/ToastContext";
import { useAuth } from "../../contexts/AuthContext";
import { useWallet } from "../../components/WalletProvider";
import { useTheme } from "../../contexts/ThemeContext";
import { usersAPI, gameProfileAPI } from "../../services/api";
import { SUPPORTED_GAMES } from "../../constants";
import type { PlayerProfile, GameProfile } from "../../types";

export default function ProfileScreen() {
    const router = useRouter();
    const { showToast } = useToast();
    const { user, logout } = useAuth();
    const { balanceSol } = useWallet();
    const theme = useTheme();

    const [profile, setProfile] = useState<PlayerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [avatarLoading, setAvatarLoading] = useState(false);

    // Game profile state
    const [gameProfiles, setGameProfiles] = useState<GameProfile[]>([]);
    const [gameProfilesLoading, setGameProfilesLoading] = useState(true);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkGameName, setLinkGameName] = useState("");
    const [linkPlayerId, setLinkPlayerId] = useState("");
    const [linkLoading, setLinkLoading] = useState(false);
    const [syncingGame, setSyncingGame] = useState<string | null>(null);

    const fetchProfile = useCallback(async () => {
        if (!user) return;
        try {
            const res = await usersAPI.getProfile(user.username);
            setProfile(res.profile);
        } catch (err) {
            console.error("Failed to fetch profile:", err);
        } finally {
            setLoading(false);
        }
    }, [user?.username]);

    useEffect(() => { fetchProfile(); }, [fetchProfile]);

    // Fetch game profiles
    const fetchGameProfiles = useCallback(async () => {
        try {
            const res = await gameProfileAPI.getAll();
            setGameProfiles(res.profiles);
        } catch (err) {
            console.error("Failed to fetch game profiles:", err);
        } finally {
            setGameProfilesLoading(false);
        }
    }, []);

    useEffect(() => { fetchGameProfiles(); }, [fetchGameProfiles]);

    const handleCopyWallet = async () => {
        if (!user) return;
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
                onPress: async () => {
                    await logout();
                    showToast("Logged out", "info");
                    router.replace("/onboarding");
                },
            },
        ]);
    };

    const handlePickAvatar = async () => {
        if (!user) return;
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
                base64: true,
            });
            if (result.canceled || !result.assets?.[0]?.base64) return;

            const asset = result.assets[0];
            const mimeType = asset.mimeType ?? "image/jpeg";
            const dataUri = `data:${mimeType};base64,${asset.base64}`;

            setAvatarLoading(true);
            await usersAPI.updatePfp(user.username, { pfp: dataUri });
            showToast("Avatar updated!", "success");
            fetchProfile();
        } catch (err: any) {
            showToast(err.message || "Failed to update avatar", "error");
        } finally {
            setAvatarLoading(false);
        }
    };

    const handleOpenLinkModal = (gameName: string) => {
        setLinkGameName(gameName);
        setLinkPlayerId("");
        setShowLinkModal(true);
    };

    const handleLinkGame = async () => {
        const trimmed = linkPlayerId.trim();
        if (!trimmed) { showToast("Please enter your player ID", "error"); return; }
        setLinkLoading(true);
        try {
            await gameProfileAPI.link({ gameName: linkGameName, playerId: trimmed });
            showToast(`${linkGameName} account linked!`, "success");
            setShowLinkModal(false);
            setLinkPlayerId("");
            // Fetch only the updated profile instead of re-fetching all
            const { profile: updated } = await gameProfileAPI.getByGame(linkGameName);
            setGameProfiles((prev) => {
                const exists = prev.some((p) => p.gameName === linkGameName);
                if (exists) return prev.map((p) => p.gameName === linkGameName ? updated : p);
                return [...prev, updated];
            });
        } catch (err: any) {
            showToast(err.message || "Failed to link account", "error");
        } finally {
            setLinkLoading(false);
        }
    };

    const handleSyncGame = async (gameName: string) => {
        setSyncingGame(gameName);
        try {
            await gameProfileAPI.sync({ gameName });
            showToast(`${gameName} stats synced!`, "success");
            // Fetch only the updated profile instead of re-fetching all
            const { profile: updated } = await gameProfileAPI.getByGame(gameName);
            setGameProfiles((prev) => prev.map((p) => p.gameName === gameName ? updated : p));
        } catch (err: any) {
            showToast(err.message || "Failed to sync stats", "error");
        } finally {
            setSyncingGame(null);
        }
    };

    const getLinkedProfile = (gameName: string): GameProfile | undefined =>
        gameProfiles.find((p) => p.gameName === gameName);

    if (loading || !user || !profile) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: "center", justifyContent: "center" }}>
                <StatusBar style={theme.isDark ? "light" : "dark"} />
                <ActivityIndicator size="large" color={theme.accent} />
            </View>
        );
    }

    const netPL = (profile.portfolio?.totalStakeWon ?? 0) - (profile.portfolio?.totalStakeLost ?? 0);
    const rankDiff = (profile.portfolio?.previousRank ?? 0) - (profile.portfolio?.currentRank ?? 0);
    const currentRank = profile.portfolio?.currentRank;
    const totalDuels = profile.wins + profile.losses;

    return (
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <StatusBar style={theme.isDark ? "light" : "dark"} />
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
                {/* ═══ PROFILE HERO BANNER ═══ */}
                <View style={{
                    backgroundColor: theme.bgGlass,
                    marginHorizontal: 20,
                    marginTop: 64,
                    borderRadius: 22,
                    borderWidth: 1.5,
                    borderColor: theme.borderGlow,
                    overflow: "hidden",
                    shadowColor: theme.accentGlow,
                    shadowOpacity: 0.3,
                    shadowRadius: 20,
                    shadowOffset: { width: 0, height: 6 },
                    elevation: 8,
                }}>
                    {/* Gradient-like accent bar */}
                    <View style={{ height: 3, backgroundColor: theme.accent }} />

                    {/* Top section: avatar left, name + wallet right */}
                    <View style={{ flexDirection: "row", padding: 18, paddingBottom: 14 }}>
                        <Pressable
                            onPress={handlePickAvatar}
                            disabled={avatarLoading}
                            style={{ position: "relative" }}
                        >
                            <View style={{
                                borderRadius: 40,
                                padding: 2,
                                borderWidth: 2,
                                borderColor: theme.borderGlow,
                                shadowColor: theme.accentGlow,
                                shadowOpacity: 0.6,
                                shadowRadius: 12,
                                shadowOffset: { width: 0, height: 0 },
                            }}>
                                <Avatar username={user.username} size="lg" rank={currentRank} pfp={profile.pfp} />
                            </View>
                            {/* Pencil edit badge */}
                            <View style={{
                                position: "absolute",
                                bottom: 0,
                                right: 0,
                                width: 24,
                                height: 24,
                                borderRadius: 12,
                                backgroundColor: theme.accent,
                                alignItems: "center",
                                justifyContent: "center",
                                borderWidth: 2,
                                borderColor: theme.bgGlass,
                                shadowColor: theme.accentGlow,
                                shadowOpacity: 0.5,
                                shadowRadius: 4,
                                shadowOffset: { width: 0, height: 1 },
                            }}>
                                {avatarLoading ? (
                                    <ActivityIndicator size={10} color={theme.textInverse} />
                                ) : (
                                    <Ionicons name="pencil" size={12} color={theme.textInverse} />
                                )}
                            </View>
                        </Pressable>

                        <View style={{ flex: 1, marginLeft: 14, justifyContent: "center" }}>
                            <Text style={{
                                color: theme.textPrimary,
                                fontSize: 20,
                                fontWeight: "900",
                                letterSpacing: 0.5,
                            }}>
                                {user.username}
                            </Text>
                            {/* Wallet pill */}
                            <Pressable
                                onPress={handleCopyWallet}
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 5,
                                    marginTop: 6,
                                    alignSelf: "flex-start",
                                    backgroundColor: theme.bgMuted,
                                    paddingHorizontal: 10,
                                    paddingVertical: 5,
                                    borderRadius: 100,
                                    borderWidth: 1,
                                    borderColor: theme.borderStrong,
                                }}
                            >
                                <Text style={{ color: theme.textMuted, fontSize: 10, fontFamily: "monospace" }}>
                                    {user.walletKey.slice(0, 5)}…{user.walletKey.slice(-4)}
                                </Text>
                                <Ionicons name="copy-outline" size={10} color={theme.textMuted} />
                            </Pressable>
                            <Text style={{ color: theme.textMuted, fontSize: 10, marginTop: 6 }}>
                                Member since {new Date(user.createdAt).toLocaleDateString()}
                            </Text>
                        </View>
                    </View>

                    {/* Stat strip — inline within hero */}
                    {profile.portfolio && (
                        <View style={{
                            flexDirection: "row",
                            borderTopWidth: 1,
                            borderTopColor: theme.border,
                            marginHorizontal: 18,
                            paddingVertical: 14,
                        }}>
                            {/* Rank */}
                            <View style={{ flex: 1, alignItems: "center" }}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                                    <Text style={{ color: theme.accentLight, fontSize: 22, fontWeight: "900" }}>
                                        #{currentRank}
                                    </Text>
                                    {rankDiff !== 0 && (
                                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                                            <Ionicons
                                                name={rankDiff > 0 ? "arrow-up" : "arrow-down"}
                                                size={11}
                                                color={rankDiff > 0 ? theme.green : theme.red}
                                            />
                                            <Text style={{
                                                fontSize: 10, fontWeight: "800",
                                                color: rankDiff > 0 ? theme.green : theme.red,
                                            }}>
                                                {Math.abs(rankDiff)}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={{
                                    color: theme.textMuted, fontSize: 8, letterSpacing: 1.2,
                                    textTransform: "uppercase", marginTop: 2, fontWeight: "700",
                                }}>
                                    Rank
                                </Text>
                            </View>

                            <View style={{ width: 1, height: 32, backgroundColor: theme.border, alignSelf: "center" }} />

                            {/* Win rate */}
                            <View style={{ flex: 1, alignItems: "center" }}>
                                <Text style={{ color: theme.textPrimary, fontSize: 22, fontWeight: "900" }}>
                                    {profile.winPercentage.toFixed(1)}%
                                </Text>
                                <Text style={{
                                    color: theme.textMuted, fontSize: 8, letterSpacing: 1.2,
                                    textTransform: "uppercase", marginTop: 2, fontWeight: "700",
                                }}>
                                    Win Rate
                                </Text>
                            </View>

                            <View style={{ width: 1, height: 32, backgroundColor: theme.border, alignSelf: "center" }} />

                            {/* Total duels */}
                            <View style={{ flex: 1, alignItems: "center" }}>
                                <Text style={{ color: theme.textPrimary, fontSize: 22, fontWeight: "900" }}>
                                    {totalDuels}
                                </Text>
                                <Text style={{
                                    color: theme.textMuted, fontSize: 8, letterSpacing: 1.2,
                                    textTransform: "uppercase", marginTop: 2, fontWeight: "700",
                                }}>
                                    Duels
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* ═══ PERFORMANCE DASHBOARD ═══ */}
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
                            Performance
                        </Text>
                    </View>

                    {/* Win/Loss bar */}
                    <View style={{
                        backgroundColor: theme.bgCard,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: theme.border,
                        padding: 14,
                        marginBottom: 10,
                    }}>
                        {/* W/L visual bar */}
                        <View style={{ flexDirection: "row", height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 10 }}>
                            <View style={{
                                flex: profile.wins || 0.5,
                                backgroundColor: theme.green,
                                borderTopLeftRadius: 3,
                                borderBottomLeftRadius: 3,
                            }} />
                            <View style={{
                                flex: profile.losses || 0.5,
                                backgroundColor: theme.red,
                                borderTopRightRadius: 3,
                                borderBottomRightRadius: 3,
                            }} />
                        </View>
                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.green }} />
                                <Text style={{ color: theme.textSecondary, fontSize: 11 }}>Wins</Text>
                                <Text style={{ color: theme.green, fontSize: 13, fontWeight: "900" }}>{profile.wins}</Text>
                            </View>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.red }} />
                                <Text style={{ color: theme.textSecondary, fontSize: 11 }}>Losses</Text>
                                <Text style={{ color: theme.red, fontSize: 13, fontWeight: "900" }}>{profile.losses}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Stats grid: 2x2 */}
                    {profile.portfolio && (
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                            {[
                                {
                                    label: "Total Won",
                                    value: profile.portfolio.totalStakeWon.toLocaleString(),
                                    color: theme.green,
                                    glow: theme.greenGlow,
                                    icon: "arrow-up-circle" as keyof typeof Ionicons.glyphMap,
                                },
                                {
                                    label: "Total Lost",
                                    value: profile.portfolio.totalStakeLost.toLocaleString(),
                                    color: theme.red,
                                    glow: theme.redGlow,
                                    icon: "arrow-down-circle" as keyof typeof Ionicons.glyphMap,
                                },
                                {
                                    label: "Net P&L",
                                    value: `${netPL >= 0 ? "+" : ""}${netPL.toLocaleString()}`,
                                    color: netPL >= 0 ? theme.green : theme.red,
                                    glow: netPL >= 0 ? theme.greenGlow : theme.redGlow,
                                    icon: "stats-chart" as keyof typeof Ionicons.glyphMap,
                                },
                                {
                                    label: "SOL Balance",
                                    value: balanceSol !== null ? balanceSol.toFixed(2) : (profile.portfolio.solanaBalance ?? 0).toFixed(2),
                                    color: theme.accentLight,
                                    glow: theme.accentGlow,
                                    icon: "wallet-outline" as keyof typeof Ionicons.glyphMap,
                                },
                            ].map((stat) => (
                                <View
                                    key={stat.label}
                                    style={{
                                        width: "48%",
                                        backgroundColor: theme.bgCard,
                                        borderRadius: 14,
                                        padding: 14,
                                        borderWidth: 1,
                                        borderColor: theme.border,
                                        shadowColor: stat.glow,
                                        shadowOpacity: 0.3,
                                        shadowRadius: 6,
                                        shadowOffset: { width: 0, height: 2 },
                                        elevation: 3,
                                    }}
                                >
                                    <View style={{
                                        width: 28, height: 28, borderRadius: 8,
                                        backgroundColor: stat.color + "18", borderWidth: 1,
                                        borderColor: stat.color + "30", alignItems: "center",
                                        justifyContent: "center", marginBottom: 8,
                                    }}>
                                        <Ionicons name={stat.icon} size={14} color={stat.color} />
                                    </View>
                                    <Text style={{
                                        fontSize: 16, fontWeight: "900", color: stat.color, letterSpacing: -0.3,
                                    }}>
                                        {stat.value}
                                    </Text>
                                    <Text style={{
                                        color: theme.textMuted, fontSize: 9, textTransform: "uppercase",
                                        letterSpacing: 1.2, marginTop: 3, fontWeight: "700",
                                    }}>
                                        {stat.label}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* ═══ GAME ACCOUNTS SECTION ═══ */}
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
                            Game Accounts
                        </Text>
                    </View>

                    {gameProfilesLoading ? (
                        <View style={{
                            backgroundColor: theme.bgCard, borderRadius: 14, borderWidth: 1,
                            borderColor: theme.border, padding: 24, alignItems: "center",
                        }}>
                            <ActivityIndicator size="small" color={theme.accent} />
                        </View>
                    ) : (
                        <View style={{ gap: 8 }}>
                            {SUPPORTED_GAMES.map((game) => {
                                const linked = getLinkedProfile(game.name);
                                const isLive = game.status === "live";
                                const isSyncing = syncingGame === game.name;

                                return (
                                    <View
                                        key={game.name}
                                        style={{
                                            backgroundColor: theme.bgCard,
                                            borderRadius: 14,
                                            borderWidth: 1,
                                            borderColor: linked ? theme.borderGlow : theme.border,
                                            overflow: "hidden",
                                            opacity: isLive ? 1 : 0.5,
                                        }}
                                    >
                                        <View style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            padding: 14,
                                        }}>
                                            {/* Game icon */}
                                            <View style={{
                                                width: 36, height: 36, borderRadius: 10,
                                                backgroundColor: linked ? theme.accent + "18" : theme.bgMuted,
                                                borderWidth: 1,
                                                borderColor: linked ? theme.accent + "30" : theme.borderStrong,
                                                alignItems: "center", justifyContent: "center", marginRight: 12,
                                            }}>
                                                <Ionicons
                                                    name={game.ionicon as keyof typeof Ionicons.glyphMap}
                                                    size={16}
                                                    color={linked ? theme.accentLight : theme.textMuted}
                                                />
                                            </View>

                                            {/* Game info */}
                                            <View style={{ flex: 1 }}>
                                                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                                    <Text style={{
                                                        color: theme.textPrimary, fontSize: 13, fontWeight: "700",
                                                    }}>
                                                        {game.name}
                                                    </Text>
                                                    {!isLive && (
                                                        <View style={{
                                                            backgroundColor: theme.amber + "20",
                                                            borderRadius: 6,
                                                            paddingHorizontal: 5,
                                                            paddingVertical: 1,
                                                            borderWidth: 1,
                                                            borderColor: theme.amber + "40",
                                                        }}>
                                                            <Text style={{ color: theme.amber, fontSize: 7, fontWeight: "800", letterSpacing: 0.5 }}>
                                                                SOON
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                                {linked ? (
                                                    <View style={{ marginTop: 3 }}>
                                                        <Text style={{ color: theme.green, fontSize: 10, fontWeight: "700" }}>
                                                            {linked.playerId ?? "Linked"}
                                                            {linked.rank ? ` · ${linked.rank}` : ""}
                                                        </Text>
                                                        {linked.stats && (() => {
                                                            const stats = linked.stats as { trophies?: number; clan?: string };
                                                            return stats.trophies !== undefined ? (
                                                                <Text style={{ color: theme.textMuted, fontSize: 9, marginTop: 1 }}>
                                                                    {stats.trophies} trophies
                                                                    {stats.clan ? ` · ${stats.clan}` : ""}
                                                                </Text>
                                                            ) : null;
                                                        })()}
                                                    </View>
                                                ) : (
                                                    <Text style={{ color: theme.textMuted, fontSize: 10, marginTop: 2 }}>
                                                        {isLive ? "Not linked" : "Coming soon"}
                                                    </Text>
                                                )}
                                            </View>

                                            {/* Actions */}
                                            {isLive && (
                                                <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                                                    {linked && (
                                                        <Pressable
                                                            onPress={() => handleSyncGame(game.name)}
                                                            disabled={isSyncing}
                                                            style={{
                                                                width: 30, height: 30, borderRadius: 8,
                                                                backgroundColor: theme.accentBg,
                                                                borderWidth: 1,
                                                                borderColor: theme.borderGlow,
                                                                alignItems: "center", justifyContent: "center",
                                                            }}
                                                        >
                                                            {isSyncing ? (
                                                                <ActivityIndicator size={12} color={theme.accentLight} />
                                                            ) : (
                                                                <Ionicons name="sync-outline" size={13} color={theme.accentLight} />
                                                            )}
                                                        </Pressable>
                                                    )}
                                                    <Pressable
                                                        onPress={() => handleOpenLinkModal(game.name)}
                                                        style={{
                                                            width: 30, height: 30, borderRadius: 8,
                                                            backgroundColor: linked ? theme.bgMuted : theme.accent + "20",
                                                            borderWidth: 1,
                                                            borderColor: linked ? theme.borderStrong : theme.accent + "40",
                                                            alignItems: "center", justifyContent: "center",
                                                        }}
                                                    >
                                                        <Ionicons
                                                            name={linked ? "create-outline" : "link-outline"}
                                                            size={13}
                                                            color={linked ? theme.textMuted : theme.accentLight}
                                                        />
                                                    </Pressable>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </View>

                {/* ═══ SETTINGS SECTION ═══ */}
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
                            Settings
                        </Text>
                    </View>

                    {/* Theme Toggle — card row */}
                    <Pressable
                        onPress={theme.toggleTheme}
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            backgroundColor: theme.bgCard,
                            borderRadius: 14,
                            borderWidth: 1,
                            borderColor: theme.border,
                            paddingHorizontal: 14,
                            paddingVertical: 13,
                            marginBottom: 8,
                        }}
                    >
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                            <View style={{
                                width: 30, height: 30, borderRadius: 8,
                                backgroundColor: theme.accentBg, borderWidth: 1,
                                borderColor: theme.borderGlow, alignItems: "center",
                                justifyContent: "center",
                            }}>
                                <Ionicons
                                    name={theme.isDark ? "moon" : "sunny"}
                                    size={14}
                                    color={theme.accentLight}
                                />
                            </View>
                            <View>
                                <Text style={{ color: theme.textPrimary, fontSize: 13, fontWeight: "700" }}>
                                    {theme.isDark ? "Dark Mode" : "Light Mode"}
                                </Text>
                                <Text style={{ color: theme.textMuted, fontSize: 10, marginTop: 1 }}>
                                    Tap to switch
                                </Text>
                            </View>
                        </View>

                        {/* Toggle track */}
                        <View style={{
                            width: 40, height: 24, borderRadius: 12,
                            backgroundColor: theme.isDark ? theme.accent : theme.border,
                            justifyContent: "center", paddingHorizontal: 3,
                            shadowColor: theme.isDark ? theme.accentGlow : "transparent",
                            shadowOpacity: 0.5, shadowRadius: 6,
                            shadowOffset: { width: 0, height: 0 },
                        }}>
                            <View style={{
                                width: 18, height: 18, borderRadius: 9,
                                backgroundColor: theme.textInverse,
                                alignSelf: theme.isDark ? "flex-end" : "flex-start",
                            }} />
                        </View>
                    </Pressable>

                    {/* Logout — card row */}
                    <Pressable
                        onPress={handleLogout}
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: theme.btnDangerBg,
                            borderRadius: 14,
                            borderWidth: 1,
                            borderColor: theme.btnDangerBorder + "30",
                            paddingHorizontal: 14,
                            paddingVertical: 13,
                        }}
                    >
                        <View style={{
                            width: 30, height: 30, borderRadius: 8,
                            backgroundColor: theme.red + "18", borderWidth: 1,
                            borderColor: theme.red + "30", alignItems: "center",
                            justifyContent: "center", marginRight: 10,
                        }}>
                            <Ionicons name="log-out-outline" size={14} color={theme.btnDangerText} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: theme.btnDangerText, fontSize: 13, fontWeight: "700" }}>
                                Logout
                            </Text>
                            <Text style={{ color: theme.red + "80", fontSize: 10, marginTop: 1 }}>
                                Sign out of your account
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={theme.btnDangerText} />
                    </Pressable>
                </View>
            </ScrollView>

            {/* Link Game Account Modal */}
            <Modal
                visible={showLinkModal}
                onClose={() => { setShowLinkModal(false); setLinkPlayerId(""); }}
                title={`Link ${linkGameName}`}
                confirmText={getLinkedProfile(linkGameName) ? "Update" : "Link Account"}
                onConfirm={handleLinkGame}
                loading={linkLoading}
            >
                <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 16 }}>
                    {getLinkedProfile(linkGameName)
                        ? `Update your ${linkGameName} player ID.`
                        : `Enter your ${linkGameName} player ID to enable auto-verification for duels.`
                    }
                </Text>
                <Input
                    label={SUPPORTED_GAMES.find((g) => g.name === linkGameName)?.playerIdLabel ?? "Player ID"}
                    placeholder={SUPPORTED_GAMES.find((g) => g.name === linkGameName)?.playerIdPlaceholder ?? "Enter player ID"}
                    value={linkPlayerId}
                    onChangeText={setLinkPlayerId}
                    autoCapitalize="none"
                />
            </Modal>
        </View>
    );
}
