import React, { useState, useEffect, useCallback } from "react";
import { Alert, Image, Pressable, ScrollView, Text, View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import { Avatar } from "../../components/ui/Avatar";
import { Card } from "../../components/ui/Card";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../contexts/ToastContext";
import { useAuth } from "../../contexts/AuthContext";
import { useWallet } from "../../components/WalletProvider";
import { useTheme } from "../../contexts/ThemeContext";
import { usersAPI, gameProfileAPI, leaderboardAPI } from "../../services/api";
import { SUPPORTED_GAMES } from "../../constants";
import { GAME_ICONS } from "../../assets/games";
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
    const [linkClaimedWins, setLinkClaimedWins] = useState("");
    const [linkClaimedChallengeMaxWins, setLinkClaimedChallengeMaxWins] = useState("");
    const [linkLoading, setLinkLoading] = useState(false);
    const [syncingGame, setSyncingGame] = useState<string | null>(null);
    const [liveRank, setLiveRank] = useState<number | null>(null);

    // Logout Modal state
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const fetchProfile = useCallback(async () => {
        if (!user) return;
        try {
            const [profileRes, rankRes] = await Promise.allSettled([
                usersAPI.getProfile(user.username),
                leaderboardAPI.getEntry(user.username),
            ]);
            if (profileRes.status === "fulfilled") setProfile(profileRes.value.profile);
            if (rankRes.status === "fulfilled") {
                const entry = rankRes.value.entry;
                const rank = entry?.rank || entry?.currentRank || null;
                setLiveRank(rank && rank > 0 ? rank : null);
            }
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
        setShowLogoutModal(true);
    };

    const handleConfirmLogout = async () => {
        setShowLogoutModal(false);
        await logout();
        showToast("Logged out", "info");
        router.replace("/onboarding");
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
        setLinkClaimedWins("");
        setLinkClaimedChallengeMaxWins("");
        setShowLinkModal(true);
    };

    const handleLinkGame = async () => {
        const trimmed = linkPlayerId.trim();
        if (!trimmed) { showToast("Please enter your player ID", "error"); return; }

        // Clash Royale requires the two ownership-verification fields
        const isCR = linkGameName === "Clash Royale";
        let claimedWins: number | undefined;
        let claimedChallengeMaxWins: number | undefined;
        if (isCR) {
            const winsRaw = linkClaimedWins.trim();
            const challengeRaw = linkClaimedChallengeMaxWins.trim();
            if (!winsRaw || !challengeRaw) {
                showToast("Please fill in both verification fields", "error");
                return;
            }
            claimedWins = parseInt(winsRaw, 10);
            claimedChallengeMaxWins = parseInt(challengeRaw, 10);
            if (isNaN(claimedWins) || isNaN(claimedChallengeMaxWins)) {
                showToast("Wins must be whole numbers", "error");
                return;
            }
        }

        setLinkLoading(true);
        try {
            await gameProfileAPI.link({
                gameName: linkGameName,
                playerId: trimmed,
                ...(isCR && { claimedWins, claimedChallengeMaxWins }),
            });
            showToast(`${linkGameName} account linked!`, "success");
            setShowLinkModal(false);
            setLinkPlayerId("");
            setLinkClaimedWins("");
            setLinkClaimedChallengeMaxWins("");
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
                <StatusBar style="dark" />
                <ActivityIndicator size="large" color={theme.accent} />
            </View>
        );
    }

    const netPL = (profile.portfolio?.totalStakeWon ?? 0) - (profile.portfolio?.totalStakeLost ?? 0);
    const rankDiff = (profile.portfolio?.previousRank ?? 0) - (profile.portfolio?.currentRank ?? 0);
    const currentRank = (liveRank && liveRank > 0) ? liveRank : (profile.portfolio?.currentRank && profile.portfolio.currentRank > 0 ? profile.portfolio.currentRank : null);
    const totalDuels = profile.wins + profile.losses;

    return (
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <StatusBar style="dark" />
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
                {/* ═══ PROFILE HERO BANNER ═══ */}
                <Card
                    noPadding
                    tabLabel="PROFILE"
                    style={{
                        backgroundColor: theme.bgGlass,
                        marginHorizontal: 20,
                        marginTop: 64,
                        borderColor: theme.borderNeon,
                    }}
                >

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
                                borderColor: theme.borderNeon,
                            }}>
                                <Avatar username={user.username} size="lg" rank={currentRank ?? undefined} pfp={profile.pfp} />
                            </View>
                            {/* Pencil edit badge */}
                            <View style={{
                                position: "absolute",
                                bottom: 0,
                                right: 0,
                                width: 24,
                                height: 24,
                                borderRadius: 7,
                                backgroundColor: theme.accent,
                                alignItems: "center",
                                justifyContent: "center",
                                borderWidth: 2,
                                borderColor: theme.bgGlass,
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
                                    borderRadius: 6,
                                    borderWidth: 1,
                                    borderColor: theme.border,
                                }}
                            >
                                <Text style={{ color: theme.textMuted, fontSize: 10, fontFamily: "monospace", letterSpacing: 0.5 }}>
                                    {user.walletKey.slice(0, 5)}…{user.walletKey.slice(-4)}
                                </Text>
                                <Ionicons name="copy-outline" size={10} color={theme.textMuted} />
                            </Pressable>
                            <Text style={{ color: theme.textMuted, fontSize: 10, marginTop: 6, letterSpacing: 0.3 }}>
                                Member since {new Date(user.createdAt).toLocaleDateString()}
                            </Text>
                        </View>
                    </View>

                    {/* Stat strip — inline within hero */}
                    {profile.portfolio && (
                        <View style={{
                            flexDirection: "row",
                            borderTopWidth: 1,
                            borderTopColor: theme.divider,
                            marginHorizontal: 18,
                            paddingVertical: 14,
                        }}>
                            {/* Rank */}
                            <View style={{ flex: 1, alignItems: "center" }}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                                    <Text style={{ color: theme.accentLight, fontSize: 22, fontWeight: "900", letterSpacing: -0.5 }}>
                                        {currentRank ? `#${currentRank}` : "—"}
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
                                    color: theme.textMuted, fontSize: 8, letterSpacing: 2,
                                    textTransform: "uppercase", marginTop: 2, fontWeight: "700",
                                }}>
                                    Rank
                                </Text>
                            </View>

                            <View style={{ width: 1, height: 32, backgroundColor: theme.divider, alignSelf: "center" }} />

                            {/* Win rate */}
                            <View style={{ flex: 1, alignItems: "center" }}>
                                <Text style={{ color: theme.textPrimary, fontSize: 22, fontWeight: "900", letterSpacing: -0.5 }}>
                                    {profile.winPercentage.toFixed(1)}%
                                </Text>
                                <Text style={{
                                    color: theme.textMuted, fontSize: 8, letterSpacing: 2,
                                    textTransform: "uppercase", marginTop: 2, fontWeight: "700",
                                }}>
                                    Win Rate
                                </Text>
                            </View>

                            <View style={{ width: 1, height: 32, backgroundColor: theme.divider, alignSelf: "center" }} />

                            {/* Total duels */}
                            <View style={{ flex: 1, alignItems: "center" }}>
                                <Text style={{ color: theme.textPrimary, fontSize: 22, fontWeight: "900", letterSpacing: -0.5 }}>
                                    {totalDuels}
                                </Text>
                                <Text style={{
                                    color: theme.textMuted, fontSize: 8, letterSpacing: 2,
                                    textTransform: "uppercase", marginTop: 2, fontWeight: "700",
                                }}>
                                    Duels
                                </Text>
                            </View>
                        </View>
                    )}
                </Card>

                {/* ═══ PERFORMANCE DASHBOARD ═══ */}
                <View style={{ paddingHorizontal: 20, marginTop: 18 }}>
                    {/* SectionHeader: bar + dot */}
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                        <View style={{ width: 12, height: 2, backgroundColor: theme.accent, borderRadius: 1, marginRight: 4 }} />
                        <View style={{ width: 4, height: 4, borderRadius: 1, backgroundColor: theme.accent, marginRight: 8 }} />
                        <Text style={{
                            color: theme.textPrimary, fontSize: 11, fontWeight: "800",
                            letterSpacing: 2, textTransform: "uppercase",
                        }}>
                            Performance
                        </Text>
                    </View>

                    {/* ── W/L Line Graph ── */}
                    <Card noFill noPadding style={{ borderRadius: 14, overflow: "hidden", marginBottom: 2 }}>
                        <View style={{ height: 2, backgroundColor: theme.accent + "60" }} />
                        <View style={{ padding: 16 }}>
                            {/* Header */}
                            <Text style={{ color: theme.textPrimary, fontSize: 11, fontWeight: "800", letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>
                                Performance
                            </Text>

                            {/* Stats summary row */}
                            <View style={{ flexDirection: "row", gap: 16 }}>
                                <View>
                                    <Text style={{ color: theme.green, fontSize: 20, fontWeight: "900", letterSpacing: -0.5 }}>{profile.wins}</Text>
                                    <Text style={{ color: theme.textMuted, fontSize: 8, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" }}>Wins</Text>
                                </View>
                                <View style={{ width: 1, height: 32, backgroundColor: theme.divider, alignSelf: "center" }} />
                                <View>
                                    <Text style={{ color: theme.red, fontSize: 20, fontWeight: "900", letterSpacing: -0.5 }}>{profile.losses}</Text>
                                    <Text style={{ color: theme.textMuted, fontSize: 8, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" }}>Losses</Text>
                                </View>
                                <View style={{ width: 1, height: 32, backgroundColor: theme.divider, alignSelf: "center" }} />
                                <View>
                                    <Text style={{ color: theme.accentLight, fontSize: 20, fontWeight: "900", letterSpacing: -0.5 }}>
                                        {profile.wins + profile.losses > 0 ? `${Math.round((profile.wins / (profile.wins + profile.losses)) * 100)}%` : "—"}
                                    </Text>
                                    <Text style={{ color: theme.textMuted, fontSize: 8, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" }}>Win Rate</Text>
                                </View>
                            </View>
                        </View>
                    </Card>
                </View>

                {/* ═══ GAME ACCOUNTS SECTION ═══ */}
                <View style={{ paddingHorizontal: 20, marginTop: 18 }}>
                    {/* SectionHeader: bar + dot */}
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                        <View style={{ width: 12, height: 2, backgroundColor: theme.accent, borderRadius: 1, marginRight: 4 }} />
                        <View style={{ width: 4, height: 4, borderRadius: 1, backgroundColor: theme.accent, marginRight: 8 }} />
                        <Text style={{
                            color: theme.textPrimary, fontSize: 11, fontWeight: "800",
                            letterSpacing: 2, textTransform: "uppercase",
                        }}>
                            Game Accounts
                        </Text>
                    </View>

                    {gameProfilesLoading ? (
                        <Card noFill style={{
                            borderRadius: 12,
                            padding: 24,
                            alignItems: "center",
                        }}>
                            <ActivityIndicator size="small" color={theme.accent} />
                        </Card>
                    ) : (
                        <View style={{ gap: 8 }}>
                            {SUPPORTED_GAMES.map((game) => {
                                const linked = getLinkedProfile(game.name);
                                const isLive = game.status === "live";
                                const isSyncing = syncingGame === game.name;

                                return (
                                    <Card
                                        key={game.name}
                                        noFill
                                        noPadding
                                        style={{
                                            borderRadius: 12,
                                            borderColor: linked ? theme.borderNeon : theme.border,
                                            opacity: isLive ? 1 : 0.5,
                                        }}
                                    >
                                        {/* Top accent line for linked games */}
                                        {linked && (
                                            <View style={{ alignItems: "center" }}>
                                                <View style={{ width: "30%", height: 2, backgroundColor: theme.accentNeon, borderBottomLeftRadius: 1, borderBottomRightRadius: 1 }} />
                                            </View>
                                        )}
                                        <View style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            padding: 14,
                                        }}>
                                            {/* Game icon */}
                                            <View style={{
                                                width: 36, height: 36, borderRadius: 8,
                                                backgroundColor: linked ? theme.accent + "18" : theme.bgMuted,
                                                borderWidth: 1,
                                                borderColor: linked ? theme.accent + "30" : theme.border,
                                                alignItems: "center", justifyContent: "center", marginRight: 12,
                                                overflow: "hidden",
                                            }}>
                                                {GAME_ICONS[game.name] ? (
                                                    <Image
                                                        source={GAME_ICONS[game.name]}
                                                        style={{ width: 28, height: 28, borderRadius: 4 }}
                                                        resizeMode="contain"
                                                    />
                                                ) : (
                                                    <Ionicons
                                                        name={game.ionicon as keyof typeof Ionicons.glyphMap}
                                                        size={16}
                                                        color={linked ? theme.accentLight : theme.textMuted}
                                                    />
                                                )}
                                            </View>

                                            {/* Game info */}
                                            <View style={{ flex: 1 }}>
                                                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                                    <Text style={{
                                                        color: theme.textPrimary, fontSize: 13, fontWeight: "800", letterSpacing: 0.3,
                                                    }}>
                                                        {game.name}
                                                    </Text>
                                                    {!isLive && (
                                                        <View style={{
                                                            backgroundColor: theme.amber + "20",
                                                            borderRadius: 4,
                                                            paddingHorizontal: 5,
                                                            paddingVertical: 1,
                                                            borderWidth: 1,
                                                            borderColor: theme.amber + "40",
                                                        }}>
                                                            <Text style={{ color: theme.amber, fontSize: 7, fontWeight: "900", letterSpacing: 1 }}>
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
                                                    <Text style={{ color: theme.textMuted, fontSize: 10, marginTop: 2, letterSpacing: 0.3 }}>
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
                                                                width: 30, height: 30, borderRadius: 7,
                                                                backgroundColor: theme.accentBg,
                                                                borderWidth: 1,
                                                                borderColor: theme.borderNeon,
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
                                                            width: 30, height: 30, borderRadius: 7,
                                                            backgroundColor: linked ? theme.bgMuted : theme.accent + "20",
                                                            borderWidth: 1,
                                                            borderColor: linked ? theme.border : theme.accent + "40",
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
                                    </Card>
                                );
                            })}
                        </View>
                    )}
                </View>

                {/* ═══ SETTINGS SECTION ═══ */}
                <View style={{ paddingHorizontal: 20, marginTop: 22 }}>
                    {/* SectionHeader: bar + dot */}
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                        <View style={{ width: 12, height: 2, backgroundColor: theme.accent, borderRadius: 1, marginRight: 4 }} />
                        <View style={{ width: 4, height: 4, borderRadius: 1, backgroundColor: theme.accent, marginRight: 8 }} />
                        <Text style={{
                            color: theme.textPrimary, fontSize: 11, fontWeight: "800",
                            letterSpacing: 2, textTransform: "uppercase",
                        }}>
                            Settings
                        </Text>
                    </View>

                    {/* Logout — card row */}
                    <Pressable
                        onPress={handleLogout}
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: theme.btnDangerBg,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: theme.btnDangerBorder + "30",
                            paddingHorizontal: 14,
                            paddingVertical: 13,
                        }}
                    >
                        <View style={{
                            width: 30, height: 30, borderRadius: 7,
                            backgroundColor: theme.red + "18", borderWidth: 1,
                            borderColor: theme.red + "30", alignItems: "center",
                            justifyContent: "center", marginRight: 10,
                        }}>
                            <Ionicons name="log-out-outline" size={14} color={theme.btnDangerText} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: theme.btnDangerText, fontSize: 13, fontWeight: "800", letterSpacing: 0.3 }}>
                                Logout
                            </Text>
                            <Text style={{ color: theme.red + "80", fontSize: 10, marginTop: 1, letterSpacing: 0.3 }}>
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
                onClose={() => {
                    setShowLinkModal(false);
                    setLinkPlayerId("");
                    setLinkClaimedWins("");
                    setLinkClaimedChallengeMaxWins("");
                }}
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

                {/* Clash Royale — ownership verification fields */}
                {linkGameName === "Clash Royale" && (
                    <View style={{ marginTop: 4 }}>
                        {/* Amber info banner */}
                        <View style={{
                            flexDirection: "row",
                            alignItems: "flex-start",
                            backgroundColor: theme.amber + "15",
                            borderWidth: 1,
                            borderColor: theme.amber + "40",
                            borderRadius: 10,
                            padding: 10,
                            marginBottom: 14,
                            gap: 8,
                        }}>
                            <Ionicons name="information-circle-outline" size={15} color={theme.amber} style={{ marginTop: 1 }} />
                            <Text style={{ flex: 1, color: theme.amber, fontSize: 11, lineHeight: 16 }}>
                                To verify ownership, answer two quick questions from your{" "}
                                <Text style={{ fontWeight: "800" }}>in-game Stats page</Text>.
                                Only account owners can see these values.
                            </Text>
                        </View>

                        <Input
                            label="Career Wins"
                            placeholder="e.g. 3420"
                            value={linkClaimedWins}
                            onChangeText={setLinkClaimedWins}
                            keyboardType="number-pad"
                        />
                        <Text style={{ color: theme.textMuted, fontSize: 10, marginTop: -10, marginBottom: 14, marginLeft: 2 }}>
                            Found on your Profile → Stats page
                        </Text>

                        <Input
                            label="Challenge Max Wins (personal best)"
                            placeholder="e.g. 12"
                            value={linkClaimedChallengeMaxWins}
                            onChangeText={setLinkClaimedChallengeMaxWins}
                            keyboardType="number-pad"
                        />
                        <Text style={{ color: theme.textMuted, fontSize: 10, marginTop: -10, marginLeft: 2 }}>
                            Found on your Profile → Stats → Challenge
                        </Text>
                    </View>
                )}
            </Modal>

            {/* Logout Consent Modal */}
            <Modal
                visible={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                title="Logout"
                confirmText="Logout"
                confirmVariant="danger"
                onConfirm={handleConfirmLogout}
            >
                <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 8 }}>
                    Are you sure you want to log out of your account?
                </Text>
            </Modal>
        </View>
    );
}
