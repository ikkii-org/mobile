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

    const borderColor = error ? theme.red : focused ? theme.accent : theme.border;

    return (
        <View style={{ marginBottom: 16 }}>
            <Text
                style={{
                    color: theme.textMuted,
                    fontSize: 10,
                    fontWeight: "700",
                    letterSpacing: 1.4,
                    textTransform: "uppercase",
                    marginBottom: 8,
                    marginLeft: 2,
                }}
            >
                {label}
            </Text>
            <TextInput
                style={{
                    backgroundColor: theme.bgInput,
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    color: theme.textPrimary,
                    fontSize: 15,
                    borderWidth: 1.5,
                    borderColor,
                    shadowColor: focused && !error ? theme.accent : "transparent",
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 0 },
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
                        fontSize: 11,
                        marginTop: 6,
                        marginLeft: 2,
                        fontWeight: "600",
                    }}
                >
                    {error}
                </Text>
            )}
        </View>
    );
}
