import React from "react";
import { View, type ViewProps } from "react-native";

interface CardProps extends ViewProps {
    children: React.ReactNode;
    noPadding?: boolean;
}

export function Card({ children, noPadding, className = "", ...props }: CardProps) {
    return (
        <View
            className={`bg-[#1A1A2E] border border-[#2A2B45] rounded-2xl ${noPadding ? "" : "p-4"
                } ${className}`}
            {...props}
        >
            {children}
        </View>
    );
}
