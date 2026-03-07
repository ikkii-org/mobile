import React, { useState } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

interface InputProps extends Omit<TextInputProps, "className"> {
    label: string;
    error?: string;
    containerClassName?: string;
}

export function Input({ label, error, containerClassName = "", ...props }: InputProps) {
    const theme = useTheme();
    const [focused, setFocused] = useState(false);

    const borderColor = error
        ? theme.red
        : focused
            ? theme.borderNeon
            : theme.border;

    return (
        <View style={{ marginBottom: 16 }}>
            {/* Label with decorative left bar */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, marginLeft: 2 }}>
                <View
                    style={{
                        width: 2,
                        height: 10,
                        backgroundColor: focused ? theme.accent : theme.textMuted,
                        borderRadius: 1,
                        marginRight: 6,
                    }}
                />
                <Text
                    style={{
                        color: focused ? theme.accent : theme.textMuted,
                        fontSize: 9,
                        fontWeight: "800",
                        letterSpacing: 2,
                        textTransform: "uppercase",
                    }}
                >
                    {label}
                </Text>
            </View>
            <TextInput
                style={{
                    backgroundColor: theme.bgInput,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 13,
                    color: theme.textPrimary,
                    fontSize: 15,
                    fontWeight: "500",
                    borderWidth: 1.5,
                    borderColor,
                }}
                placeholderTextColor={theme.textMuted}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                {...props}
            />
            {error && (
                <Text
                    style={{
                        color: theme.red,
                        fontSize: 10,
                        marginTop: 6,
                        marginLeft: 2,
                        fontWeight: "700",
                        letterSpacing: 0.3,
                    }}
                >
                    {error}
                </Text>
            )}
        </View>
    );
}
