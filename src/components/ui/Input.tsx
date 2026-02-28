import React, { useState } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";

interface InputProps extends Omit<TextInputProps, "className"> {
    label: string;
    error?: string;
    containerClassName?: string;
}

export function Input({
    label,
    error,
    containerClassName = "",
    ...props
}: InputProps) {
    const [focused, setFocused] = useState(false);

    return (
        <View className={`mb-4 ${containerClassName}`}>
            <Text className="text-[#94A3B8] text-xs uppercase tracking-widest mb-2 ml-1 font-semibold">
                {label}
            </Text>
            <TextInput
                className={`bg-[#0D0E1A] rounded-2xl px-4 py-3.5 text-white text-sm border ${error
                        ? "border-[#EF4444]"
                        : focused
                            ? "border-[#8B5CF6]"
                            : "border-[#1E2030]"
                    }`}
                placeholderTextColor="#4A5568"
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                {...props}
            />
            {error && (
                <Text className="text-[#EF4444] text-xs mt-1.5 ml-1">{error}</Text>
            )}
        </View>
    );
}
