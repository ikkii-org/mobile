import React from "react";
import { View, Text, Pressable, Image } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Button } from "../components/ui/Button";
import { useTheme } from "../contexts/ThemeContext";

export default function OnboardingScreen() {
    const router = useRouter();
    const theme = useTheme();

    return (
        <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: "space-between" }}>
            <StatusBar style="dark" />

            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40 }}>
                {/* Side-by-Side Logos */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 40 }}>
                    <Image
                        source={require("../../ikkii.png")}
                        style={{ width: 140, height: 140 }}
                        resizeMode="contain"
                    />
                    <Text style={{ fontSize: 24, fontWeight: "300", color: theme.textMuted }}>x</Text>
                    <Image
                        source={require("../../assets/sol.png")}
                        style={{ width: 80, height: 80 }}
                        resizeMode="contain"
                    />
                </View>

                {/* Minimalist Copy */}
                <Text style={{ color: theme.textSecondary, fontSize: 16, textAlign: "center", lineHeight: 24 }}>
                    Stake tokens. Duel opponents.{"\n"}Winner takes all on Solana.
                </Text>
            </View>

            {/* Bottom CTAs */}
            <View style={{ paddingHorizontal: 24, paddingBottom: 48, gap: 12 }}>
                <Button
                    title="Get Started"
                    onPress={() => router.push("/signup")}
                    size="lg"
                />
                <Pressable
                    onPress={() => router.push("/login")}
                    style={{ alignItems: "center", paddingVertical: 8 }}
                >
                    <Text style={{ color: theme.textSecondary, fontSize: 14 }}>
                        Already have an account?{" "}
                        <Text style={{ color: theme.accent, fontWeight: "600" }}>Log In</Text>
                    </Text>
                </Pressable>
            </View>
        </View>
    );
}
