import React, { useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    FlatList,
    Pressable,
    Text,
    View,
    type NativeScrollEvent,
    type NativeSyntheticEvent,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Button } from "../components/ui/Button";
import { useTheme } from "../contexts/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SLIDES = [
    {
        icon: "💰",
        title: "Stake Your Tokens",
        desc: "Put your SKR tokens on the line. No risk, no reward. Choose your stake and challenge anyone.",
    },
    {
        icon: "⚔️",
        title: "Duel 1v1",
        desc: "Find an opponent or create a challenge. Compete head-to-head in skill-based games.",
    },
    {
        icon: "🏆",
        title: "Winner Takes All",
        desc: "Prove you're the best. The winner claims the entire staked pot. Climb the leaderboard.",
    },
];

export default function OnboardingScreen() {
    const router = useRouter();
    const theme = useTheme();
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;

    const handleScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        { useNativeDriver: false }
    );

    const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
        setActiveIndex(index);
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <StatusBar style={theme.isDark ? "light" : "dark"} />

            {/* Top branding */}
            <View style={{ alignItems: "center", paddingTop: 80, paddingBottom: 16 }}>
                <Text style={{ fontSize: 48, fontWeight: "900", color: theme.textPrimary, letterSpacing: 6 }}>
                    IKKII
                </Text>
                <Text style={{ color: theme.accent, fontSize: 12, fontWeight: "700", letterSpacing: 5, textTransform: "uppercase", marginTop: 8 }}>
                    Stake · Duel · Win
                </Text>
            </View>

            {/* Carousel */}
            <View style={{ flex: 1, justifyContent: "center" }}>
                <FlatList
                    data={SLIDES}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleScroll}
                    onMomentumScrollEnd={handleMomentumEnd}
                    keyExtractor={(_, i) => String(i)}
                    renderItem={({ item }) => (
                        <View style={{ width: SCREEN_WIDTH, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 }}>
                            <View style={{
                                width: 96,
                                height: 96,
                                borderRadius: 48,
                                backgroundColor: theme.bgCard,
                                borderWidth: 1,
                                borderColor: theme.borderStrong,
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: 32,
                            }}>
                                <Text style={{ fontSize: 48 }}>{item.icon}</Text>
                            </View>
                            <Text style={{ color: theme.textPrimary, fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 16 }}>
                                {item.title}
                            </Text>
                            <Text style={{ color: theme.textSecondary, textAlign: "center", fontSize: 16, lineHeight: 24 }}>
                                {item.desc}
                            </Text>
                        </View>
                    )}
                />

                {/* Dots */}
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 24 }}>
                    {SLIDES.map((_, i) => (
                        <View
                            key={i}
                            style={{
                                height: 8,
                                borderRadius: 4,
                                width: i === activeIndex ? 32 : 8,
                                backgroundColor: i === activeIndex ? theme.accent : theme.borderStrong,
                            }}
                        />
                    ))}
                </View>
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
