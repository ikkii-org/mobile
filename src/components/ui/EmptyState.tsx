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
        <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 48, paddingHorizontal: 24 }}>
            <View
                style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    backgroundColor: theme.bgMuted,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: theme.border,
                    shadowColor: theme.accent,
                    shadowOpacity: 0.12,
                    shadowRadius: 16,
                    shadowOffset: { width: 0, height: 0 },
                }}
            >
                <Ionicons name={icon} size={30} color={theme.textMuted} />
            </View>
            <Text
                style={{
                    color: theme.textSecondary,
                    fontSize: 15,
                    fontWeight: "700",
                    textAlign: "center",
                    marginBottom: 6,
                    letterSpacing: 0.2,
                }}
            >
                {title}
            </Text>
            {subtitle && (
                <Text
                    style={{
                        color: theme.textMuted,
                        fontSize: 13,
                        textAlign: "center",
                        lineHeight: 19,
                    }}
                >
                    {subtitle}
                </Text>
            )}
        </View>
    );
}
