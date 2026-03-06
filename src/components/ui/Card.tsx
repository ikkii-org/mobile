import React from "react";
import { View, type ViewProps } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

interface CardProps extends ViewProps {
    children: React.ReactNode;
    noPadding?: boolean;
    accent?: string; // optional top-border glow color
}

export function Card({ children, noPadding, accent, style, ...props }: CardProps) {
    const theme = useTheme();
    return (
        <View
            style={[
                {
                    backgroundColor: theme.bgCard,
                    borderWidth: 1,
                    borderColor: theme.border,
                    borderRadius: 20,
                    padding: noPadding ? 0 : 16,
                    overflow: "hidden",
                    shadowColor: theme.shadow,
                    shadowOpacity: theme.isDark ? 0.4 : 0.08,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 4,
                },
                style,
            ]}
            {...props}
        >
            {accent && (
                <View
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 2,
                        backgroundColor: accent,
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                    }}
                />
            )}
            {children}
        </View>
    );
}
