import { useState, useEffect } from "react";
import { Redirect } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { View, ActivityIndicator, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { healthAPI } from "../services/api";

/**
 * Root index — checks server connectivity, then redirects based on auth state.
 */
export default function Index() {
    const { isAuthenticated, isLoading } = useAuth();
    const theme = useTheme();

    const [serverStatus, setServerStatus] = useState<"checking" | "online" | "offline">("checking");

    useEffect(() => {
        let cancelled = false;
        const checkHealth = async () => {
            try {
                await Promise.race([
                    healthAPI.check(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000)),
                ]);
                if (!cancelled) setServerStatus("online");
            } catch {
                if (!cancelled) setServerStatus("offline");
            }
        };
        checkHealth();
        return () => { cancelled = true; };
    }, []);

    const handleRetry = () => {
        setServerStatus("checking");
        healthAPI.check()
            .then(() => setServerStatus("online"))
            .catch(() => setServerStatus("offline"));
    };

    // Show loading while auth or health check is in progress
    if (isLoading || serverStatus === "checking") {
        return (
            <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: "center", justifyContent: "center" }}>
                <ActivityIndicator size="large" color={theme.accent} />
            </View>
        );
    }

    // Server is unreachable
    if (serverStatus === "offline") {
        return (
            <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
                <View style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: theme.red + "18",
                    borderWidth: 1,
                    borderColor: theme.red + "40",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 20,
                }}>
                    <Ionicons name="cloud-offline-outline" size={30} color={theme.red} />
                </View>
                <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: "900", letterSpacing: 0.5, marginBottom: 8, textAlign: "center" }}>
                    Cannot Connect
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 13, textAlign: "center", lineHeight: 18, marginBottom: 24 }}>
                    Unable to reach Ikkii servers. Check your internet connection and try again.
                </Text>
                <Pressable
                    onPress={handleRetry}
                    style={{
                        backgroundColor: theme.accent,
                        borderRadius: 12,
                        paddingHorizontal: 28,
                        paddingVertical: 12,
                    }}
                >
                    <Text style={{ color: theme.textInverse, fontSize: 14, fontWeight: "800", letterSpacing: 0.5 }}>
                        Retry
                    </Text>
                </Pressable>
            </View>
        );
    }

    // Server is online — redirect based on auth
    if (isAuthenticated) {
        return <Redirect href="/(tabs)" />;
    }

    return <Redirect href="/onboarding" />;
}
