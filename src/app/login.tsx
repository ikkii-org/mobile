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

export default function LoginScreen() {
    const router = useRouter();
    const { showToast } = useToast();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = (): boolean => {
        const errs: Record<string, string> = {};
        if (!username.trim()) errs.username = "Username is required";
        if (!password.trim()) errs.password = "Password is required";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleLogin = async () => {
        if (!validate()) return;
        setLoading(true);

        // TODO: Replace with real API call → authAPI.login(...)
        // Simulating successful login with mock data
        setTimeout(() => {
            setLoading(false);
            showToast("Welcome back!", "success");
            router.replace("/(tabs)");
        }, 1200);
    };

    return (
        <View className="flex-1 bg-[#0A0A0F]">
            <StatusBar style="light" />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <ScrollView
                    contentContainerClassName="flex-grow justify-center px-6 pb-8"
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View className="items-center mb-10">
                        <Text className="text-4xl font-black text-white tracking-[4px] mb-2">
                            IKKII
                        </Text>
                        <Text className="text-[#64748B] text-sm">Welcome back, warrior</Text>
                    </View>

                    {/* Form */}
                    <Input
                        label="Username"
                        placeholder="Enter your username"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                        autoCorrect={false}
                        error={errors.username}
                    />

                    <Input
                        label="Password"
                        placeholder="Enter your password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        error={errors.password}
                    />

                    <Pressable className="items-end mb-6">
                        <Text className="text-[#64748B] text-xs">Forgot password?</Text>
                    </Pressable>

                    <Button
                        title="Log In"
                        onPress={handleLogin}
                        loading={loading}
                        size="lg"
                    />

                    <Pressable
                        onPress={() => router.push("/signup")}
                        className="items-center py-4 mt-2"
                    >
                        <Text className="text-[#94A3B8] text-sm">
                            Don't have an account?{" "}
                            <Text className="text-[#8B5CF6] font-semibold">Sign Up</Text>
                        </Text>
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
