import React from "react";
import { View, Text, type ViewProps, type ViewStyle } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

interface CardProps extends ViewProps {
    children: React.ReactNode;
    noPadding?: boolean;
    accent?: string;           // color for the tab (defaults to theme.accent)
    tabLabel?: string;         // optional label rendered inside the tab
    variant?: "default" | "panel";
    noFill?: boolean;          // skip the accent tab entirely
}

const TAB_H = 22;              // height of the tab strip
const CHAMFER = TAB_H;         // full-height diagonal — no straight line

// Props that affect layout positioning — belong on the outer shadow wrapper
const LAYOUT_KEYS = new Set([
    "flex", "flexGrow", "flexShrink", "flexBasis",
    "width", "height", "minWidth", "maxWidth", "minHeight", "maxHeight",
    "margin", "marginTop", "marginBottom", "marginLeft", "marginRight",
    "marginHorizontal", "marginVertical",
    "position", "top", "bottom", "left", "right",
    "alignSelf", "zIndex",
]);

function splitStyle(style: ViewStyle | undefined): { outerStyle: ViewStyle; innerStyle: ViewStyle } {
    if (!style) return { outerStyle: {}, innerStyle: {} };
    const outer: Record<string, any> = {};
    const inner: Record<string, any> = {};
    for (const [key, value] of Object.entries(style)) {
        if (LAYOUT_KEYS.has(key)) {
            outer[key] = value;
        } else {
            inner[key] = value;
        }
    }
    return { outerStyle: outer as ViewStyle, innerStyle: inner as ViewStyle };
}

export function Card({ children, noPadding, accent, tabLabel, variant = "default", noFill, style, ...props }: CardProps) {
    const theme = useTheme();
    const fillColor = accent || theme.accent;

    // Flatten style array if needed, then split layout vs visual
    const flatStyle = Array.isArray(style)
        ? Object.assign({}, ...style.filter(Boolean)) as ViewStyle
        : (style as ViewStyle | undefined);
    const { outerStyle, innerStyle } = splitStyle(flatStyle);

    return (
        /* Outer wrapper — carries the drop shadow + layout positioning */
        <View
            style={[
                {
                    borderRadius: 14,
                    // Outer drop shadow for card depth
                    shadowColor: theme.shadow,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.18,
                    shadowRadius: 14,
                    elevation: 6,
                },
                outerStyle,
            ]}
            {...props}
        >
            {/* Inner card — clipped content + visual styles */}
            <View
                style={[
                    {
                        backgroundColor: variant === "panel" ? theme.bgPanel : theme.bgCard,
                        borderWidth: 1,
                        borderColor: theme.border,
                        borderRadius: 14,
                        paddingTop: noFill ? (noPadding ? 0 : 16) : TAB_H + (noPadding ? 6 : 16),
                        paddingBottom: noPadding ? 0 : 16,
                        paddingHorizontal: noPadding ? 0 : 16,
                        overflow: "hidden",
                    },
                    innerStyle,
                ]}
            >
                {/* ── Left-aligned accent tab with full diagonal right cut ── */}
                {!noFill && (
                    <View
                        pointerEvents="none"
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "70%",
                            height: TAB_H,
                            flexDirection: "row",
                            alignItems: "stretch",
                            // Tab shadow — accent glow beneath
                            shadowColor: fillColor,
                            shadowOffset: { width: 0, height: 5 },
                            shadowOpacity: 0.35,
                            shadowRadius: 10,
                            elevation: 5,
                        }}
                    >
                        {/* Main fill body — flush left */}
                        <View
                            style={{
                                flex: 1,
                                backgroundColor: fillColor,
                                justifyContent: "center",
                                alignItems: "flex-end",
                                paddingRight: 8,
                            }}
                        >
                            {tabLabel ? (
                                <Text
                                    style={{
                                        color: "#FFFFFF",
                                        fontSize: 8,
                                        fontWeight: "900",
                                        letterSpacing: 2.5,
                                        textTransform: "uppercase",
                                    }}
                                    numberOfLines={1}
                                >
                                    {tabLabel}
                                </Text>
                            ) : null}
                        </View>

                        {/* Right diagonal edge — starts from top, full height */}
                        <View
                            style={{
                                width: CHAMFER,
                                height: TAB_H,
                                backgroundColor: "transparent",
                                overflow: "hidden",
                            }}
                        >
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
                    </View>
                )}

                {/* ── Inset shadow overlays for depth ── */}
                {/* Top inner glow — subtle light edge */}
                <View
                    pointerEvents="none"
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 1,
                        backgroundColor: "rgba(255,255,255,0.45)",
                        borderTopLeftRadius: 13,
                        borderTopRightRadius: 13,
                    }}
                />

                {/* Bottom inner shadow — darker inner edge */}
                <View
                    pointerEvents="none"
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 20,
                        borderBottomLeftRadius: 13,
                        borderBottomRightRadius: 13,
                        backgroundColor: "transparent",
                        borderBottomWidth: 1,
                        borderLeftWidth: 0.5,
                        borderRightWidth: 0.5,
                        borderColor: "rgba(0,0,0,0.04)",
                    }}
                />

                {/* Left/right inner edges — faint vertical glow */}
                <View
                    pointerEvents="none"
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        bottom: 0,
                        width: 1,
                        backgroundColor: "rgba(255,255,255,0.25)",
                    }}
                />
                <View
                    pointerEvents="none"
                    style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        bottom: 0,
                        width: 1,
                        backgroundColor: "rgba(255,255,255,0.15)",
                    }}
                />

                {children}
            </View>
        </View>
    );
}
