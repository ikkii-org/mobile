import React from "react";
import { Image, Text, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

interface AvatarProps {
    username: string;
    pfp?: string | null;
    size?: "xs" | "sm" | "md" | "lg";
    rank?: number;
}

const SIZE_PX = { xs: 24, sm: 32, md: 44, lg: 80 };
const FONT_SIZE = { xs: 9, sm: 12, md: 14, lg: 24 };

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

export function Avatar({ username, pfp, size = "md", rank }: AvatarProps) {
    const theme = useTheme();
    const px = SIZE_PX[size];
    const fontSize = FONT_SIZE[size];
    const bg = getColor(username);

    return (
        <View style={{ position: "relative" }}>
            {pfp ? (
                <Image
                    source={{ uri: pfp }}
                    style={{ width: px, height: px, borderRadius: px / 2 }}
                />
            ) : (
                <View
                    style={{
                        width: px,
                        height: px,
                        borderRadius: px / 2,
                        backgroundColor: bg,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Text style={{ color: theme.textInverse, fontWeight: "700", fontSize }}>{getInitials(username)}</Text>
                </View>
            )}
            {rank && rank <= 3 ? (
                <View
                    style={{
                        position: "absolute",
                        bottom: -4,
                        right: -4,
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: theme.bg,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Text style={{ fontSize: 10 }}>{rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}</Text>
                </View>
            ) : null}
        </View>
    );
}
