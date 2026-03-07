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
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { useToast } from "../contexts/ToastContext";
import { REGEX } from "../constants";
import { useWallet } from "../components/WalletProvider";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

export default function SignupScreen() {
    const router = useRouter();
    const { showToast } = useToast();
    const { connected, publicKey, connect, disconnect } = useWallet();
    const { signup } = useAuth();
    const theme = useTheme();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [pfp, setPfp] = useState("");
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = (): boolean => {
        const errs: Record<string, string> = {};
        if (!REGEX.username.test(username)) {
            errs.username = "3-20 chars, letters, numbers & underscores only";
        }
        if (password.length < 8) {
            errs.password = "Must be at least 8 characters";
        }
        if (!connected || !publicKey) {
            errs.walletKey = "Please connect your Solana wallet";
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSignup = async () => {
        if (!validate() || !publicKey) return;
        setLoading(true);
        try {
            await signup({
                username,
                password,
                walletKey: publicKey.toBase58(),
                pfp: pfp || undefined,
            });
            showToast("Account created successfully!", "success");
            router.replace("/(tabs)");
        } catch (err: any) {
            showToast(err.message || "Failed to create account", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <StatusBar style="dark" />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 64, paddingBottom: 32 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Back */}
                    <Pressable
                        onPress={() => router.back()}
                        style={{ flexDirection: "row", alignItems: "center", marginBottom: 28 }}
                    >
                        <Ionicons name="chevron-back" size={18} color={theme.accentLight} />
                        <Text style={{ color: theme.accentLight, fontSize: 13, fontWeight: "700", letterSpacing: 0.5 }}>
                            BACK
                        </Text>
                    </Pressable>

                    {/* Header */}
                    <View style={{ marginBottom: 28 }}>
                        <Text style={{ color: theme.textPrimary, fontSize: 30, fontWeight: "900", letterSpacing: 0.5, marginBottom: 4 }}>
                            Create Account
                        </Text>
                        <Text style={{ color: theme.textMuted, fontSize: 13 }}>
                            Join the arena and start dueling
                        </Text>
                    </View>

                    {/* Form card */}
                    <View style={{
                        backgroundColor: theme.bgGlass,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: theme.borderStrong,
                        padding: 20,
                        marginBottom: 16,
                        overflow: "hidden",
                    }}>
                        <View style={{ height: 2, backgroundColor: theme.accent, marginHorizontal: -20, marginTop: -20, marginBottom: 20 }} />

                        <Input
                            label="Username"
                            placeholder="e.g. crypto_king"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                            autoCorrect={false}
                            error={errors.username}
                        />

                        <Input
                            label="Password"
                            placeholder="Min 8 characters"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            error={errors.password}
                        />

                        {/* Wallet connect row */}
                        <View style={{ marginBottom: 14 }}>
                            <Text style={{
                                color: theme.textSecondary,
                                fontSize: 10,
                                fontWeight: "700",
                                textTransform: "uppercase",
                                letterSpacing: 2,
                                marginBottom: 8,
                                marginLeft: 2,
                            }}>
                                Solana Wallet
                            </Text>
                            <Pressable
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    borderWidth: 1,
                                    borderRadius: 14,
                                    paddingHorizontal: 14,
                                    paddingVertical: 13,
                                    backgroundColor: theme.bgInput,
                                    borderColor: errors.walletKey
                                        ? theme.red
                                        : connected
                                        ? theme.green + "40"
                                        : theme.border,
                                }}
                                onPress={async () => {
                                    if (!connected) {
                                        await connect();
                                    } else {
                                        disconnect();
                                    }
                                }}
                            >
                                <View style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 16,
                                    backgroundColor: connected ? theme.green + "20" : theme.bgMuted,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginRight: 10,
                                }}>
                                    <Ionicons
                                        name="wallet-outline"
                                        size={16}
                                        color={connected ? theme.green : theme.textMuted}
                                    />
                                </View>
                                <Text
                                    style={{
                                        flex: 1,
                                        fontSize: 13,
                                        fontWeight: connected ? "600" : "400",
                                        color: connected ? theme.textPrimary : theme.textMuted,
                                    }}
                                    numberOfLines={1}
                                >
                                    {connected && publicKey
                                        ? publicKey.toBase58()
                                        : "Connect Solana Wallet"}
                                </Text>
                                {connected ? (
                                    <Text style={{ color: theme.red, fontSize: 10, fontWeight: "800", letterSpacing: 0.5, marginLeft: 8 }}>
                                        DISCONNECT
                                    </Text>
                                ) : (
                                    <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
                                )}
                            </Pressable>
                            {errors.walletKey && (
                                <Text style={{
                                    color: theme.red,
                                    fontSize: 10,
                                    fontWeight: "700",
                                    letterSpacing: 1,
                                    textTransform: "uppercase",
                                    marginTop: 6,
                                    marginLeft: 4,
                                }}>
                                    {errors.walletKey}
                                </Text>
                            )}
                        </View>

                        <Input
                            label="Profile Picture URL (Optional)"
                            placeholder="https://..."
                            value={pfp}
                            onChangeText={setPfp}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <View style={{ marginTop: 6 }}>
                            <Button
                                title="Create Account"
                                onPress={handleSignup}
                                loading={loading}
                                size="lg"
                                icon={<Ionicons name="flash" size={16} color={theme.textInverse} />}
                            />
                        </View>
                    </View>

                    <Pressable
                        onPress={() => router.push("/login")}
                        style={{ alignItems: "center", paddingVertical: 12 }}
                    >
                        <Text style={{ color: theme.textMuted, fontSize: 13 }}>
                            Already have an account?{" "}
                            <Text style={{ color: theme.accentLight, fontWeight: "700" }}>Log In</Text>
                        </Text>
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
