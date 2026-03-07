import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../contexts/ThemeContext";

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: "primary" | "secondary" | "danger" | "ghost";
    loading?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
    size?: "sm" | "md" | "lg";
    icon?: React.ReactNode;
}

export function Button({
    title,
    onPress,
    variant = "primary",
    loading = false,
    disabled = false,
    fullWidth = true,
    size = "md",
    icon,
}: ButtonProps) {
    const theme = useTheme();

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
    };

    const sizeStyles = {
        sm: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 8, fontSize: 10 },
        md: { paddingVertical: 13, paddingHorizontal: 20, borderRadius: 10, fontSize: 12 },
        lg: { paddingVertical: 15, paddingHorizontal: 26, borderRadius: 12, fontSize: 14 },
    }[size];

    const variantStyles = {
        primary: {
            background: theme.accent,
            borderColor: theme.accentNeon,
            textColor: theme.textInverse,
        },
        secondary: {
            background: theme.accentBg,
            borderColor: theme.btnSecondaryBorder,
            textColor: theme.accentLight,
        },
        danger: {
            background: theme.btnDangerBg,
            borderColor: theme.btnDangerBorder,
            textColor: theme.btnDangerText,
        },
        ghost: {
            background: "transparent",
            borderColor: "transparent",
            textColor: theme.textMuted,
        },
    }[variant];

    return (
        <Pressable
            onPress={handlePress}
            disabled={disabled || loading}
            style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                backgroundColor: variantStyles.background,
                borderWidth: 1,
                borderColor: variantStyles.borderColor,
                borderRadius: sizeStyles.borderRadius,
                paddingVertical: sizeStyles.paddingVertical,
                paddingHorizontal: sizeStyles.paddingHorizontal,
                width: fullWidth ? "100%" : undefined,
                opacity: disabled || loading ? 0.4 : pressed ? 0.75 : 1,
            })}
        >
            {loading ? (
                <ActivityIndicator size="small" color={variantStyles.textColor} />
            ) : (
                <>
                    {icon && <View>{icon}</View>}
                    <Text
                        style={{
                            color: variantStyles.textColor,
                            fontSize: sizeStyles.fontSize,
                            fontWeight: "800",
                            letterSpacing: 1.5,
                            textTransform: "uppercase",
                        }}
                    >
                        {title}
                    </Text>
                </>
            )}
        </Pressable>
    );
}
