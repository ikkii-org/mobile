import React from "react";
import { Text, View } from "react-native";
import type { DuelStatus } from "../../types";
import { useTheme } from "../../contexts/ThemeContext";

// Fixed status colors for clarity across theme
const STATUS_TEXT: Record<DuelStatus, { text: string; dot: string; label: string }> = {
    OPEN:      { text: "#60A5FA", dot: "#3B82F6", label: "OPEN" },
    ACTIVE:    { text: "#34D399", dot: "#10B981", label: "LIVE" },
    DISPUTED:  { text: "#FCA5A5", dot: "#EF4444", label: "DISPUTED" },
    SETTLED:   { text: "#FCD34D", dot: "#F59E0B", label: "SETTLED" },
    CANCELLED: { text: "#6B7280", dot: "#374151", label: "VOID" },
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
                gap: 5,
                backgroundColor: bg,
                borderWidth: 1,
                borderColor: t.dot + "40",
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 4,
                alignSelf: "flex-start",
            }}
        >
            {/* Animated dot indicator */}
            <View
                style={{
                    width: 5,
                    height: 5,
                    borderRadius: 1,
                    backgroundColor: t.dot,
                }}
            />
            <Text
                style={{
                    color: t.text,
                    fontSize: 9,
                    fontWeight: "800",
                    letterSpacing: 1.8,
                }}
            >
                {t.label}
            </Text>
        </View>
    );
}
