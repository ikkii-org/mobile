import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface EmptyStateProps {
    icon?: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
}

export function EmptyState({
    icon = "cube-outline",
    title,
    subtitle,
}: EmptyStateProps) {
    return (
        <View className="items-center justify-center py-12 px-6">
            <View className="w-16 h-16 rounded-full bg-[#1A1A2E] items-center justify-center mb-4 border border-[#2A2B45]">
                <Ionicons name={icon} size={28} color="#64748B" />
            </View>
            <Text className="text-[#94A3B8] text-base font-semibold text-center mb-1">
                {title}
            </Text>
            {subtitle && (
                <Text className="text-[#64748B] text-sm text-center leading-5">
                    {subtitle}
                </Text>
            )}
        </View>
    );
}
