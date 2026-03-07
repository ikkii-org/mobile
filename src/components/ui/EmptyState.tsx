import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";

interface EmptyStateProps {
    icon?: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
}

export function EmptyState({ icon = "cube-outline", title, subtitle }: EmptyStateProps) {
    const theme = useTheme();
    return (
        <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 44, paddingHorizontal: 24 }}>
            {/* Geometric icon container */}
            <View
                style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    backgroundColor: theme.bgMuted,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 14,
                    borderWidth: 1,
                    borderColor: theme.border,
                }}
            >
                {/* Inner diamond accent */}
                <View
                    style={{
                        position: "absolute",
                        top: 3,
                        left: 3,
                        right: 3,
                        height: 1,
                        backgroundColor: theme.divider,
                    }}
                />
                <Ionicons name={icon} size={26} color={theme.textMuted} />
            </View>
            <Text
                style={{
                    color: theme.textSecondary,
                    fontSize: 13,
                    fontWeight: "800",
                    textAlign: "center",
                    marginBottom: 5,
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                }}
            >
                {title}
            </Text>
            {subtitle && (
                <Text
                    style={{
                        color: theme.textMuted,
                        fontSize: 12,
                        textAlign: "center",
                        lineHeight: 18,
                    }}
                >
                    {subtitle}
                </Text>
            )}
        </View>
    );
}
