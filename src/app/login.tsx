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
import { Card } from "../components/ui/Card";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

export default function LoginScreen() {
    const router = useRouter();
    const { showToast } = useToast();
    const { login } = useAuth();
    const theme = useTheme();

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
        try {
            await login({ username, password });
            showToast("Welcome back!", "success");
            router.replace("/(tabs)");
        } catch (err: any) {
            showToast(err.message || "Failed to log in", "error");
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
                    contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingBottom: 32 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Logo / Hero */}
                    <View style={{ alignItems: "center", marginBottom: 48 }}>
                        <View style={{
                            width: 72,
                            height: 72,
                            borderRadius: 20,
                            backgroundColor: theme.accentBg,
                            alignItems: "center",
                            justifyContent: "center",
                            borderWidth: 1,
                            borderColor: theme.accent + "60",
                            marginBottom: 20,
                        }}>
                            <Ionicons name="flash" size={34} color={theme.accentLight} />
                        </View>

                        <Text style={{
                            fontSize: 44,
                            fontWeight: "900",
                            color: theme.textPrimary,
                            letterSpacing: 8,
                            marginBottom: 6,
                        }}>
                            IKKII
                        </Text>
                        <Text style={{ color: theme.textMuted, fontSize: 13, letterSpacing: 2, textTransform: "uppercase" }}>
                            Welcome back, warrior
                        </Text>
                    </View>

                    {/* Form card */}
                    <Card noPadding style={{
                        backgroundColor: theme.bgGlass,
                        borderRadius: 20,
                        borderColor: theme.borderStrong,
                        marginBottom: 20,
                    }}>
                        <View style={{ padding: 20 }}>

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

                        <Pressable style={{ alignItems: "flex-end", marginBottom: 20, marginTop: -4 }}>
                            <Text style={{ color: theme.textMuted, fontSize: 11 }}>Forgot password?</Text>
                        </Pressable>

                        <Button
                            title="Log In"
                            onPress={handleLogin}
                            loading={loading}
                            size="lg"
                                                         icon={<Ionicons name="flash" size={16} color={theme.textInverse} />}
                        />
                        </View>
                    </Card>

                    <Pressable
                        onPress={() => router.push("/signup")}
                        style={{ alignItems: "center", paddingVertical: 12 }}
                    >
                        <Text style={{ color: theme.textMuted, fontSize: 13 }}>
                            Don't have an account?{" "}
                            <Text style={{ color: theme.accentLight, fontWeight: "700" }}>Sign Up</Text>
                        </Text>
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
