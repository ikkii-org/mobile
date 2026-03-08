import React from "react";
import { Modal as RNModal, Pressable, Text, View } from "react-native";
import { Button } from "./Button";
import { useTheme } from "../../contexts/ThemeContext";

interface ModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    confirmVariant?: "primary" | "danger";
    loading?: boolean;
}

export function Modal({
    visible,
    onClose,
    title,
    children,
    confirmText,
    cancelText = "Cancel",
    onConfirm,
    confirmVariant = "primary",
    loading = false,
}: ModalProps) {
    const theme = useTheme();
    return (
        <RNModal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <Pressable
                style={{
                    flex: 1,
                    backgroundColor: theme.overlay,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 24,
                }}
                onPress={onClose}
            >
                <Pressable
                    style={{
                        width: "100%",
                        backgroundColor: "#FFFFFF",
                        borderWidth: 1,
                        borderColor: theme.borderStrong,
                        borderRadius: 24,
                        padding: 24,
                        shadowColor: theme.shadow,
                        shadowOpacity: 0.15,
                        shadowRadius: 20,
                        shadowOffset: { width: 0, height: 8 },
                        elevation: 10,
                    }}
                    onPress={(e) => e.stopPropagation()}
                >
                    <Text style={{ color: theme.textPrimary, fontSize: 20, fontWeight: "700", marginBottom: 16 }}>
                        {title}
                    </Text>
                    {children}
                    <View style={{ flexDirection: "row", gap: 12, marginTop: 24 }}>
                        <View style={{ flex: 1 }}>
                            <Button
                                title={cancelText}
                                onPress={onClose}
                                variant="secondary"
                                disabled={loading}
                            />
                        </View>
                        {confirmText && onConfirm && (
                            <View style={{ flex: 1 }}>
                                <Button
                                    title={confirmText}
                                    onPress={onConfirm}
                                    variant={confirmVariant}
                                    loading={loading}
                                />
                            </View>
                        )}
                    </View>
                </Pressable>
            </Pressable>
        </RNModal>
    );
}
