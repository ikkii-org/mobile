import React from "react";
import { Text, View } from "react-native";

interface AvatarProps {
    username: string;
    pfp?: string | null;
    size?: "sm" | "md" | "lg";
    rank?: number;
}

const SIZE_MAP = {
    sm: { container: "w-8 h-8 rounded-full", text: "text-xs" },
    md: { container: "w-11 h-11 rounded-full", text: "text-sm" },
    lg: { container: "w-20 h-20 rounded-full", text: "text-2xl" },
};

const AVATAR_COLORS = [
    "#8B5CF6", "#06B6D4", "#10B981", "#F59E0B",
    "#EF4444", "#EC4899", "#3B82F6", "#14B8A6",
];

function getColor(username: string) {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(username: string) {
    return username.slice(0, 2).toUpperCase();
}

export function Avatar({ username, size = "md", rank }: AvatarProps) {
    const s = SIZE_MAP[size];
    const bg = getColor(username);

    return (
        <View className="relative">
            <View
                className={`${s.container} items-center justify-center`}
                style={{ backgroundColor: bg }}
            >
                <Text className={`text-white font-bold ${s.text}`}>
                    {getInitials(username)}
                </Text>
            </View>
            {rank && rank <= 3 && (
                <View className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#0A0A0F] items-center justify-center">
                    <Text className="text-[10px]">
                        {rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}
                    </Text>
                </View>
            )}
        </View>
    );
}
