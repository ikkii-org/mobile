import React, { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, type ThemeTokens } from "../../contexts/ThemeContext";

export type AlertType = "success" | "error" | "info";

interface AlertConfig {
    border: string;
    iconBg: string;
    iconColor: string;
    iconName: React.ComponentProps<typeof Ionicons>["name"];
    title: string;
    buttonColor: string;
}

function getAlertConfig(type: AlertType, theme: ThemeTokens): AlertConfig {
    const map: Record<AlertType, AlertConfig> = {
        success: {
            border: theme.green,
            iconBg: "#D1FAE5",
            iconColor: "#059669",
            iconName: "checkmark-circle",
            title: "Success",
            buttonColor: theme.green,
        },
        error: {
            border: theme.red,
            iconBg: "#FEE2E2",
            iconColor: "#DC2626",
            iconName: "close-circle",
            title: "Error",
            buttonColor: theme.accent,
        },
        info: {
            border: theme.blue,
            iconBg: "#DBEAFE",
            iconColor: "#2563EB",
            iconName: "information-circle",
            title: "Info",
            buttonColor: theme.blue,
        },
    };
    return map[type];
}

/** Auto-dismiss delay for success and info alerts (ms) */
const AUTO_DISMISS_DELAY = 2000;

interface AlertDialogProps {
    visible: boolean;
    type: AlertType;
    message: string;
    onDismiss: () => void;
}

export function AlertDialog({ visible, type, message, onDismiss }: AlertDialogProps) {
    const theme = useTheme();
    const config = getAlertConfig(type, theme);
    const scale = useRef(new Animated.Value(0.85)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const autoTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Animate in when visible, set up auto-dismiss for non-errors
    useEffect(() => {
        if (!visible) return;

        // Animate card in
        Animated.parallel([
            Animated.spring(scale, {
                toValue: 1,
                useNativeDriver: true,
                damping: 18,
                stiffness: 260,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 180,
                useNativeDriver: true,
            }),
        ]).start();

        // Auto-dismiss for success / info
        if (type !== "error") {
            autoTimer.current = setTimeout(() => {
                handleDismiss();
            }, AUTO_DISMISS_DELAY);
        }

        return () => {
            if (autoTimer.current) clearTimeout(autoTimer.current);
        };
    }, [visible]);

    const handleDismiss = () => {
        Animated.parallel([
            Animated.spring(scale, {
                toValue: 0.85,
                useNativeDriver: true,
                damping: 18,
                stiffness: 260,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onDismiss();
            // Reset for next show
            scale.setValue(0.85);
            opacity.setValue(0);
        });
    };

    if (!visible) return null;

    return (
        <Modal
            transparent
            animationType="none"
            visible={visible}
            statusBarTranslucent
            onRequestClose={type === "error" ? handleDismiss : undefined}
        >
            {/* Backdrop — tappable to dismiss errors too */}
            <Pressable
                style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.overlay }}
                onPress={type === "error" ? handleDismiss : undefined}
            >
                {/* Card — stop propagation so tapping card doesn't close */}
                <Pressable onPress={() => {}}>
                    <Animated.View
                        style={{
                            transform: [{ scale }],
                            opacity,
                            width: 300,
                            backgroundColor: theme.bgGlass,
                            borderWidth: 1,
                            borderColor: config.border,
                            borderRadius: 24,
                            padding: 28,
                            alignItems: "center",
                            shadowColor: config.border,
                            shadowOpacity: 0.25,
                            shadowRadius: 20,
                            shadowOffset: { width: 0, height: 4 },
                            elevation: 10,
                        }}
                    >
                        {/* Icon circle */}
                        <View
                            style={{
                                width: 64,
                                height: 64,
                                borderRadius: 32,
                                backgroundColor: config.iconBg,
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: 16,
                            }}
                        >
                            <Ionicons name={config.iconName} size={36} color={config.iconColor} />
                        </View>

                        {/* Title */}
                        <Text
                            style={{
                                color: theme.textPrimary,
                                fontSize: 18,
                                fontWeight: "700",
                                marginBottom: 8,
                                letterSpacing: 0.2,
                            }}
                        >
                            {config.title}
                        </Text>

                        {/* Message */}
                        <Text
                            style={{
                                color: theme.textSecondary,
                                fontSize: 14,
                                textAlign: "center",
                                lineHeight: 20,
                                marginBottom: type === "error" ? 24 : 0,
                            }}
                        >
                            {message}
                        </Text>

                        {/* OK button — errors only */}
                        {type === "error" && (
                            <Pressable
                                onPress={handleDismiss}
                                style={({ pressed }) => ({
                                    backgroundColor: config.buttonColor,
                                    paddingVertical: 12,
                                    paddingHorizontal: 40,
                                    borderRadius: 14,
                                    opacity: pressed ? 0.75 : 1,
                                    width: "100%",
                                    alignItems: "center",
                                })}
                            >
                                <Text style={{ color: theme.textInverse, fontWeight: "700", fontSize: 15 }}>
                                    OK
                                </Text>
                            </Pressable>
                        )}
                    </Animated.View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}
