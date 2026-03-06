import React from "react";
import { Text, View } from "react-native";
import type { DuelStatus } from "../../types";
import { useTheme } from "../../contexts/ThemeContext";

// Text and dot colors stay fixed across themes for status clarity
const STATUS_TEXT: Record<DuelStatus, { text: string; dot: string; label: string }> = {
    OPEN:      { text: "#60A5FA", dot: "#3B82F6", label: "OPEN" },
    ACTIVE:    { text: "#34D399", dot: "#10B981", label: "ACTIVE" },
    DISPUTED:  { text: "#FCA5A5", dot: "#EF4444", label: "DISPUTED" },
    SETTLED:   { text: "#FCD34D", dot: "#F59E0B", label: "SETTLED" },
    CANCELLED: { text: "#6B7280", dot: "#374151", label: "CANCELLED" },
};

interface BadgeProps {
    status: DuelStatus;
}

export function Badge({ status }: BadgeProps) {
    const theme = useTheme();
    const t = STATUS_TEXT[status];

    const bgMap: Record<DuelStatus, string> = {
        OPEN:      theme.badgeOpenBg,
        ACTIVE:    theme.badgeActiveBg,
        DISPUTED:  theme.badgeDisputedBg,
        SETTLED:   theme.badgeSettledBg,
        CANCELLED: theme.badgeCancelledBg,
    };
    const bg = bgMap[status];

    return (
        <View
            style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                backgroundColor: bg,
                borderWidth: 1,
                borderColor: t.dot + "55",
                borderRadius: 100,
                paddingHorizontal: 10,
                paddingVertical: 5,
                alignSelf: "flex-start",
            }}
        >
            <View
                style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: t.dot,
                }}
            />
            <Text
                style={{
                    color: t.text,
                    fontSize: 10,
                    fontWeight: "700",
                    letterSpacing: 1.2,
                }}
            >
                {t.label}
            </Text>
        </View>
    );
}
