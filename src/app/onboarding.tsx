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
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../components/ui/Button";

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
        <View className="flex-1 bg-[#0A0A0F]">
            <StatusBar style="light" />

            {/* Top branding */}
            <View className="items-center pt-20 pb-4">
                <Text className="text-5xl font-black text-white tracking-[6px]">IKKII</Text>
                <Text className="text-[#8B5CF6] text-xs font-bold tracking-[5px] uppercase mt-2">
                    Stake · Duel · Win
                </Text>
            </View>

            {/* Carousel */}
            <View className="flex-1 justify-center">
                <FlatList
                    data={SLIDES}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleScroll}
                    onMomentumScrollEnd={handleMomentumEnd}
                    keyExtractor={(_, i) => String(i)}
                    renderItem={({ item }) => (
                        <View style={{ width: SCREEN_WIDTH }} className="items-center justify-center px-10">
                            <View className="w-24 h-24 rounded-full bg-[#1A1A2E] border border-[#2A2B45] items-center justify-center mb-8">
                                <Text className="text-5xl">{item.icon}</Text>
                            </View>
                            <Text className="text-white text-2xl font-bold text-center mb-4">
                                {item.title}
                            </Text>
                            <Text className="text-[#94A3B8] text-center text-base leading-6">
                                {item.desc}
                            </Text>
                        </View>
                    )}
                />

                {/* Dots */}
                <View className="flex-row items-center justify-center gap-2 mt-6">
                    {SLIDES.map((_, i) => (
                        <View
                            key={i}
                            className={`h-2 rounded-full ${i === activeIndex
                                    ? "w-8 bg-[#8B5CF6]"
                                    : "w-2 bg-[#2A2B45]"
                                }`}
                        />
                    ))}
                </View>
            </View>

            {/* Bottom CTAs */}
            <View className="px-6 pb-12 gap-3">
                <Button
                    title="Get Started"
                    onPress={() => router.push("/signup")}
                    size="lg"
                />
                <Pressable onPress={() => router.push("/login")} className="items-center py-2">
                    <Text className="text-[#94A3B8] text-sm">
                        Already have an account?{" "}
                        <Text className="text-[#8B5CF6] font-semibold">Log In</Text>
                    </Text>
                </Pressable>
            </View>
        </View>
    );
}
