import React from "react";
import { Text, View } from "react-native";
import type { DuelStatus } from "../../types";

const STATUS_STYLES: Record<DuelStatus, { bg: string; text: string; border: string }> = {
    OPEN: { bg: "#1E3A5F", text: "#60A5FA", border: "#3B82F6" },
    ACTIVE: { bg: "#064E3B", text: "#34D399", border: "#10B981" },
    DISPUTED: { bg: "#7F1D1D", text: "#FCA5A5", border: "#EF4444" },
    SETTLED: { bg: "#78350F", text: "#FCD34D", border: "#F59E0B" },
    CANCELLED: { bg: "#1F2937", text: "#9CA3AF", border: "#6B7280" },
};

interface BadgeProps {
    status: DuelStatus;
}

export function Badge({ status }: BadgeProps) {
    const style = STATUS_STYLES[status];
    return (
        <View
            className="px-3 py-1 rounded-full border self-start"
            style={{ backgroundColor: style.bg, borderColor: style.border }}
        >
            <Text className="text-[10px] font-bold tracking-wider" style={{ color: style.text }}>
                {status}
            </Text>
        </View>
    );
}
