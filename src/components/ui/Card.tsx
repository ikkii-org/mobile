import React, { useState } from "react";
import { View, type ViewProps, type LayoutChangeEvent } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

interface CardProps extends ViewProps {
    children: React.ReactNode;
    noPadding?: boolean;
    accent?: string; // optional color for the tab fill (defaults to theme.accent)
    variant?: "default" | "panel";  // panel = subtler bg for nested cards
    noFill?: boolean; // skip the accent tab fill
}

const FILL_RATIO = 0.10;   // 10 % of card height
const MIN_FILL_H = 18;
const MAX_FILL_H = 36;
const CHAMFER = 10;         // size of the 45° corner cuts

export function Card({ children, noPadding, accent, variant = "default", noFill, style, ...props }: CardProps) {
    const theme = useTheme();
    const [fillH, setFillH] = useState(24);

    const handleLayout = (e: LayoutChangeEvent) => {
        const h = e.nativeEvent.layout.height;
        setFillH(Math.max(MIN_FILL_H, Math.min(MAX_FILL_H, Math.round(h * FILL_RATIO))));
    };

    const fillColor = accent || theme.accent;

    return (
        <View
            onLayout={noFill ? undefined : handleLayout}
            style={[
                {
                    backgroundColor: variant === "panel" ? theme.bgPanel : theme.bgCard,
                    borderWidth: 1,
                    borderColor: theme.border,
                    borderRadius: 14,
                    padding: noPadding ? 0 : 16,
                    overflow: "hidden",
                },
                style,
            ]}
            {...props}
        >
            {/* Right-aligned accent tab — chamfered bottom-left, flush right edge */}
            {!noFill && (
                <View
                    pointerEvents="none"
                    style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        width: "40%",
                        height: fillH,
                        flexDirection: "row",
                        alignItems: "stretch",
                    }}
                >
                    {/* Left chamfer — 45° bottom-left cut */}
                    <View
                        style={{
                            width: CHAMFER,
                            height: fillH,
                            backgroundColor: "transparent",
                            overflow: "hidden",
                        }}
                    >
                        <View
                            style={{
                                width: CHAMFER,
                                height: fillH - CHAMFER,
                                backgroundColor: fillColor,
                            }}
                        />
                        <View
                            style={{
                                width: 0,
                                height: 0,
                                borderTopWidth: CHAMFER,
                                borderTopColor: fillColor,
                                borderRightWidth: CHAMFER,
                                borderRightColor: "transparent",
                            }}
                        />
                    </View>
                    {/* Main fill body — flush to right edge */}
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: fillColor,
                        }}
                    />
                </View>
            )}
            {children}
        </View>
    );
}
