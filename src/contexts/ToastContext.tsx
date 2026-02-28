import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Animated, Text, View } from "react-native";

type ToastType = "success" | "error" | "info";

interface ToastState {
    message: string;
    type: ToastType;
    visible: boolean;
}

interface ToastContextValue {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({
    showToast: () => { },
});

const TOAST_COLORS: Record<ToastType, { bg: string; border: string; text: string }> = {
    success: { bg: "#064E3B", border: "#10B981", text: "#34D399" },
    error: { bg: "#7F1D1D", border: "#EF4444", text: "#FCA5A5" },
    info: { bg: "#1E3A5F", border: "#3B82F6", text: "#93C5FD" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toast, setToast] = useState<ToastState>({ message: "", type: "info", visible: false });
    const opacity = useRef(new Animated.Value(0)).current;
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const showToast = useCallback(
        (message: string, type: ToastType = "info") => {
            if (timerRef.current) clearTimeout(timerRef.current);
            setToast({ message, type, visible: true });
            Animated.timing(opacity, {
                toValue: 1,
                duration: 250,
                useNativeDriver: true,
            }).start();

            timerRef.current = setTimeout(() => {
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }).start(() => setToast((s) => ({ ...s, visible: false })));
            }, 3000);
        },
        [opacity]
    );

    const colors = TOAST_COLORS[toast.type];

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toast.visible && (
                <Animated.View
                    style={{ opacity, position: "absolute", top: 60, left: 16, right: 16, zIndex: 9999 }}
                >
                    <View
                        className="px-5 py-4 rounded-2xl border"
                        style={{ backgroundColor: colors.bg, borderColor: colors.border }}
                    >
                        <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                            {toast.message}
                        </Text>
                    </View>
                </Animated.View>
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    return useContext(ToastContext);
}
