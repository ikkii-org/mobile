import React from "react";
import { Modal as RNModal, Pressable, Text, View } from "react-native";
import { Button } from "./Button";

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
    return (
        <RNModal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <Pressable
                className="flex-1 bg-black/70 items-center justify-center px-6"
                onPress={onClose}
            >
                <Pressable
                    className="w-full bg-[#1A1A2E] border border-[#2A2B45] rounded-3xl p-6"
                    onPress={(e) => e.stopPropagation()}
                >
                    <Text className="text-white text-xl font-bold mb-4">{title}</Text>
                    {children}
                    <View className="flex-row gap-3 mt-6">
                        <View className="flex-1">
                            <Button
                                title={cancelText}
                                onPress={onClose}
                                variant="secondary"
                                disabled={loading}
                            />
                        </View>
                        {confirmText && onConfirm && (
                            <View className="flex-1">
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
