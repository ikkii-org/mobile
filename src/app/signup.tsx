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
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { useToast } from "../contexts/ToastContext";
import { REGEX } from "../constants";

export default function SignupScreen() {
    const router = useRouter();
    const { showToast } = useToast();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [walletKey, setWalletKey] = useState("");
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
        if (!REGEX.solanaAddress.test(walletKey)) {
            errs.walletKey = "Invalid Solana address (32-44 base58 chars)";
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSignup = async () => {
        if (!validate()) return;
        setLoading(true);

        // TODO: Replace with real API call → authAPI.signup(...)
        // Simulating successful signup with mock data
        setTimeout(() => {
            setLoading(false);
            showToast("Account created successfully!", "success");
            router.replace("/(tabs)");
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
                    contentContainerClassName="flex-grow px-6 pt-16 pb-8"
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <Pressable onPress={() => router.back()} className="mb-6">
                        <Text className="text-[#8B5CF6] text-sm font-semibold">← Back</Text>
                    </Pressable>

                    <Text className="text-white text-3xl font-black mb-1">Create Account</Text>
                    <Text className="text-[#64748B] text-sm mb-8">
                        Join the arena and start dueling
                    </Text>

                    {/* Form */}
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

                    <Input
                        label="Solana Wallet Address"
                        placeholder="Your public key (base58)"
                        value={walletKey}
                        onChangeText={setWalletKey}
                        autoCapitalize="none"
                        autoCorrect={false}
                        error={errors.walletKey}
                    />

                    <Input
                        label="Profile Picture URL (Optional)"
                        placeholder="https://..."
                        value={pfp}
                        onChangeText={setPfp}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <View className="mt-4">
                        <Button
                            title="Create Account"
                            onPress={handleSignup}
                            loading={loading}
                            size="lg"
                        />
                    </View>

                    <Pressable
                        onPress={() => router.push("/login")}
                        className="items-center py-4 mt-2"
                    >
                        <Text className="text-[#94A3B8] text-sm">
                            Already have an account?{" "}
                            <Text className="text-[#8B5CF6] font-semibold">Log In</Text>
                        </Text>
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
