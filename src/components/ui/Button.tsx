import React from "react";
import { ActivityIndicator, Pressable, Text } from "react-native";
import * as Haptics from "expo-haptics";

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: "primary" | "secondary" | "danger" | "ghost";
    loading?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
    size?: "sm" | "md" | "lg";
}

const VARIANT_CLASSES: Record<string, { container: string; text: string }> = {
    primary: {
        container: "bg-[#8B5CF6] active:opacity-80",
        text: "text-white",
    },
    secondary: {
        container: "bg-transparent border border-[#2A2B45] active:opacity-70",
        text: "text-[#A78BFA]",
    },
    danger: {
        container: "bg-[#7F1D1D] border border-[#EF4444] active:opacity-80",
        text: "text-[#FCA5A5]",
    },
    ghost: {
        container: "bg-transparent active:opacity-60",
        text: "text-[#94A3B8]",
    },
};

const SIZE_CLASSES: Record<string, { container: string; text: string }> = {
    sm: { container: "py-2.5 px-4 rounded-xl", text: "text-xs" },
    md: { container: "py-3.5 px-6 rounded-2xl", text: "text-sm" },
    lg: { container: "py-4 px-8 rounded-2xl", text: "text-base" },
};

export function Button({
    title,
    onPress,
    variant = "primary",
    loading = false,
    disabled = false,
    fullWidth = true,
    size = "md",
}: ButtonProps) {
    const v = VARIANT_CLASSES[variant];
    const s = SIZE_CLASSES[size];

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
    };

    return (
        <Pressable
            onPress={handlePress}
            disabled={disabled || loading}
            className={`items-center justify-center flex-row ${v.container} ${s.container} ${fullWidth ? "w-full" : ""
                } ${disabled || loading ? "opacity-50" : ""}`}
        >
            {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
                <Text className={`font-bold tracking-wide ${v.text} ${s.text}`}>
                    {title}
                </Text>
            )}
        </Pressable>
    );
}
