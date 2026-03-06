import React, { createContext, useCallback, useContext, useState } from "react";
import { AlertDialog, AlertType } from "../components/ui/AlertDialog";

interface ToastContextValue {
    showToast: (message: string, type?: AlertType) => void;
}

const ToastContext = createContext<ToastContextValue>({
    showToast: () => {},
});

interface AlertState {
    visible: boolean;
    message: string;
    type: AlertType;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [alert, setAlert] = useState<AlertState>({
        visible: false,
        message: "",
        type: "info",
    });

    const showToast = useCallback((message: string, type: AlertType = "info") => {
        setAlert({ visible: true, message, type });
    }, []);

    const handleDismiss = useCallback(() => {
        setAlert((prev) => ({ ...prev, visible: false }));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <AlertDialog
                visible={alert.visible}
                type={alert.type}
                message={alert.message}
                onDismiss={handleDismiss}
            />
        </ToastContext.Provider>
    );
}

export function useToast() {
    return useContext(ToastContext);
}
